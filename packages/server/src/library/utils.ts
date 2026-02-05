import path from 'path';
import fs from 'fs';
import type { Source, Tune, TuneVersion } from '../model/index.js';

export const seedPath = path.join('seed');
export const dataPath = path.join('data');
export const booksPath = path.join(dataPath, 'books');
export const tunesPath = path.join(dataPath, 'tunes');

export const tuneLibraryExists = async (): Promise<boolean> => {
	if (!fs.existsSync(tunesPath)) return false;
	const dirIter = await fs.promises.opendir(tunesPath);
	const { done } = await dirIter[Symbol.asyncIterator]().next();
	if (!done) await dirIter.close();
	return !done;
};

export const getSourceFileName = (source: Source, ending: 'csv' | 'pdf'): string => {
	return source.shortName + (source.key === 'C' ? '' : source.key) + '.' + ending;
};

export const getTuneFilePath = (tune: Tune, tuneVersion: TuneVersion): string => {
	return path.join(tunesPath, tune.id, tuneVersion.id + '.pdf');
};
