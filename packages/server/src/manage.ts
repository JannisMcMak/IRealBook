import multer from 'multer';
import type { Express } from 'express';
import { AppDataSource } from './data-source.js';
import { mappings, Source, Tune, TuneVersion } from './model/index.js';
import indexTunes from './library/indexing.js';
import fts from './library/fts.js';
import fs from 'fs';
import { booksPath, getSourceFileName, tunesPath } from './library/utils.js';
import path from 'path';
import explodeTunes from './library/splitting.js';

type ManagePageData = {
	sources: Source[];
	versionsPerSource: Record<string, number>;
	sourcesValidity: Record<string, boolean>;
	tuneCount: number;
	tuneVersionCount: number;
	ftsSize: number;
};

export function applyManageRoutes(app: Express) {
	const upload = multer({ dest: 'uploads/' });
	app.set('view engine', 'pug');

	const sourceRepo = AppDataSource.getRepository(Source);
	const tuneRepo = AppDataSource.getRepository(Tune);
	const tuneVersionRepo = AppDataSource.getRepository(TuneVersion);
	app
		.route('/manage')
		.post(
			upload.fields([
				{ name: 'book', maxCount: 1 },
				{ name: 'index', maxCount: 1 }
			]),
			async (req, res) => {
				const action = req.url.split('?').at(1) || '';
				if (action === 'addSource') {
					// User submitted a new source
					const data = req.body as {
						name: string;
						shortName: string;
						publisher: string;
						key: string;
					};
					let book: Express.Multer.File | undefined;
					let indexTable: Express.Multer.File | undefined;
					if (req.files && !Array.isArray(req.files)) {
						book = req.files['book']?.at(0);
						indexTable = req.files['index']?.at(0);
					} else {
						return res.sendStatus(400);
					}
					if (
						!book ||
						!indexTable ||
						!data.name ||
						!data.shortName ||
						!data.publisher ||
						!data.key
					) {
						return res.sendStatus(400);
					}
					const newSource = new Source();
					newSource.name = data.name;
					newSource.shortName = data.shortName;
					newSource.publisher = data.publisher;
					newSource.key = data.key;
					await sourceRepo.save(newSource);
					await fs.promises.mkdir(
						path.dirname(path.join(booksPath, getSourceFileName(newSource, 'pdf'))),
						{ recursive: true }
					);
					await fs.promises.copyFile(
						book.path,
						path.join(booksPath, getSourceFileName(newSource, 'pdf'))
					);
					await fs.promises.copyFile(
						indexTable.path,
						path.join(booksPath, getSourceFileName(newSource, 'csv'))
					);
				} else if (action === 'deleteSource') {
					// Delete action on single source
					const id: string | undefined = req.body?.id;
					if (!id) return res.sendStatus(400);
					const source = await sourceRepo.findOneBy({ id });
					if (!source) return res.sendStatus(404);
					try {
						await fs.promises.rm(path.join(booksPath, getSourceFileName(source, 'pdf')));
						await fs.promises.rm(path.join(booksPath, getSourceFileName(source, 'csv')));
					} catch {
						// Ignore this error, because the source might be broken, hence no CSV or PDF
						console.warn(
							`Could not delete ${getSourceFileName(source, 'csv')} or ${getSourceFileName(source, 'pdf')}`
						);
					}
					await sourceRepo.remove(source);
				} else if (action === 'indexTunes') {
					const id: string | undefined = req.body?.id;
					if (!id) {
						// Re-index all sources
						await reIndexTunes();
					} else {
						// Re-index single source
						const source = await sourceRepo.findOneBy({ id });
						if (!source) return res.sendStatus(404);
						await reIndexTunes(source);
					}
				} else if (action === 'explodePDFs') {
					const id: string | undefined = req.body?.id;
					if (!id) {
						// Re-split all PDFs
						await reSplitPDFs();
					} else {
						// Re-split single source
						const source = await sourceRepo.findOneBy({ id });
						if (!source) return res.sendStatus(404);
						await reSplitPDFs(source);
					}
				} else if (action === 'buildFTS') {
					await rebuildFTSIndex();
				}
				return res.redirect('/manage');
			}
		)
		.get(async (_, res) => {
			const sources = await sourceRepo.find({ order: { name: 'ASC' } });
			const data: ManagePageData = {
				sources: sources,
				versionsPerSource: {},
				sourcesValidity: {},
				tuneCount: await tuneRepo.count(),
				tuneVersionCount: await tuneVersionRepo.count(),
				ftsSize: fts.size
			};
			for (const source of sources) {
				data.versionsPerSource[source.id] = await tuneVersionRepo.count({
					where: { source: source }
				});
				data.sourcesValidity[source.id] =
					fs.existsSync(path.join(booksPath, getSourceFileName(source, 'pdf'))) &&
					fs.existsSync(path.join(booksPath, getSourceFileName(source, 'csv')));
			}
			res.render('manage', data);
		});
}

export async function reIndexTunes(source?: Source) {
	const tuneRepo = AppDataSource.getRepository(Tune);
	const tuneVersionRepo = AppDataSource.getRepository(TuneVersion);
	let sources: Source[] = [];
	if (source) {
		// Only re-index a single source (delete only tune versions from that source)
		await tuneVersionRepo.delete({ source });
		sources = [source];
	} else {
		// Re-index everything (clean slate)
		await tuneVersionRepo.clear();
		await tuneRepo.clear();
		sources = await AppDataSource.getRepository(Source).find();
	}

	const tunes = await indexTunes(await tuneRepo.find(), sources);
	const startTime = Date.now();
	await AppDataSource.transaction(async (manager) => {
		for (const tune of tunes) {
			await manager.save(tune);
		}
	});

	// After indexing, the previously exploded PDFs become outdated
	if (source) {
		await AppDataSource.manager.update(
			Source,
			{ id: source.id },
			{ lastIndexedAt: new Date(), lastExplodedAt: null }
		);
	} else {
		await AppDataSource.manager.updateAll(Source, {
			lastIndexedAt: new Date(),
			lastExplodedAt: null
		});
		// Clear everything
		fts.clear();
		await fs.promises.rm(tunesPath, { recursive: true, force: true });
	}
	console.log(
		`Saved ${tunes.length} tunes from ${sources.length} source(s) to DB in ${Date.now() - startTime} ms`
	);
}

export async function reSplitPDFs(source?: Source) {
	let tuneVersions: TuneVersion[] = [];
	if (source) {
		// Extract only tune versions from single source
		tuneVersions = await AppDataSource.manager.find(TuneVersion, { where: { source } });
	} else {
		// Re-do PDF extraction for everything
		await fs.promises.rm(tunesPath, { recursive: true, force: true });
		tuneVersions = await AppDataSource.manager.find(TuneVersion);
	}
	await explodeTunes(tuneVersions);
	if (source) {
		await AppDataSource.manager.update(Source, { id: source.id }, { lastExplodedAt: new Date() });
	} else {
		await AppDataSource.manager.updateAll(Source, { lastExplodedAt: new Date() });
	}
}

export async function rebuildFTSIndex() {
	const startTime = Date.now();
	const tunes = await AppDataSource.getRepository(Tune).find();
	fts.addEntries(tunes.map(mappings.toTuneDocument));
	await fts.saveSnapshot();
	console.log(`Created FTS index in ${Date.now() - startTime} ms`);
}
