import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import apiRouter from './api/index.js';
import { AppDataSource } from './data-source.js';
import type { ApiRoutes } from '@irealbook/shared';
import indexTunes from './library/indexing.js';
import explodeTunes from './library/splitting.js';
import { mappings, Source, Tune, TuneVersion } from './model/index.js';
import path from 'path';
import { tuneLibraryExists } from './library/utils.js';
import fts from './library/fts.js';
import { IsNull } from 'typeorm';

const runInitTasks = async () => {
	const args = process.argv.slice(2);
	const doIndex =
		args.includes('--index') || (await AppDataSource.getRepository(Tune).count()) === 0;
	const doFTS = doIndex || args.includes('--fts') || !fts.snapshotExists();
	const doExplode = doIndex || args.includes('--explode') || !(await tuneLibraryExists());

	const tuneRepo = AppDataSource.getRepository(Tune);
	const sourceRepo = AppDataSource.getRepository(Source);
	const tuneVersionRepo = AppDataSource.getRepository(TuneVersion);

	// Create tune index and load metadata
	if (doIndex) {
		await tuneVersionRepo.clear();
		await tuneRepo.clear();
		await sourceRepo.clear();

		const tunes = await indexTunes();
		const startTime = Date.now();
		await AppDataSource.transaction(async (manager) => {
			for (const tune of tunes) {
				await manager.save(tune);
			}
		});
		console.log(`Saved tunes to DB in ${Date.now() - startTime} ms`);
	}

	// Initialize FTS
	const tunes = await tuneRepo.find();
	if (doFTS) {
		const startTime = Date.now();
		fts.addEntries(tunes.map(mappings.toTuneDocument));
		await fts.saveSnapshot();
		console.log(`Created FTS index in ${Date.now() - startTime} ms`);
	} else {
		await fts.loadSnapshot(tunes.map(mappings.toTuneDocument));
	}

	// Explode books into indivual PDFs
	if (doExplode) {
		await explodeTunes(await tuneRepo.find(), await sourceRepo.find());
	}

	console.log('====');
	const totalTunes = await tuneRepo.count();
	const tunesWithoutMetadata = await tuneRepo.countBy({ artist: IsNull() });
	const tunesWithoutChanges = await tuneRepo.countBy({ changes: IsNull() });
	console.log(
		`Total tunes: ${totalTunes} (${totalTunes - tunesWithoutMetadata} with metadata, ${totalTunes - tunesWithoutChanges} with changes)`
	);
};

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

app.use('/api' satisfies ApiRoutes['basePath'], apiRouter);

// SPA fallback
app.get('/{*splat}', (_, res) => {
	res.sendFile(path.resolve(process.cwd(), 'public', 'index.html'));
});

AppDataSource.initialize()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Server running on ${PORT}`);
			runInitTasks();
		});
	})
	.catch((error) => console.log(error));
