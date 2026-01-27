import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import apiRouter from './api/index.js';
import { AppDataSource } from './data-source.js';
import type { ApiRoutes } from '@irealbook/shared';
import { mappings, Tune } from './model/index.js';
import path from 'path';
import { tuneLibraryExists } from './library/utils.js';
import fts from './library/fts.js';
import { IsNull } from 'typeorm';
import { applyManageRoutes, rebuildFTSIndex, reIndexTunes, reSplitPDFs } from './manage.js';

const runInitTasks = async () => {
	const args = process.argv.slice(2);
	const doIndex =
		args.includes('--index') || (await AppDataSource.getRepository(Tune).count()) === 0;
	const doFTS = doIndex || args.includes('--fts') || !fts.snapshotExists();
	const doExplode = doIndex || args.includes('--explode') || !(await tuneLibraryExists());

	const tuneRepo = AppDataSource.getRepository(Tune);

	// Create tune index and load metadata
	if (doIndex) await reIndexTunes();

	// Initialize FTS
	if (doFTS) {
		await rebuildFTSIndex();
	} else {
		const tunes = await tuneRepo.find();
		await fts.loadSnapshot(tunes.map(mappings.toTuneDocument));
	}

	// Explode books into indivual PDFs
	if (doExplode) await reSplitPDFs();

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
applyManageRoutes(app);

// SPA fallback
app.get('/', (_, res) => {
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
