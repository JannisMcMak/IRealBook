import fs from 'fs';
import path from 'path';
import { dataPath } from './utils.js';
import type { IFuseOptions } from 'fuse.js';
import Fuse from 'fuse.js';

export type TuneDocument = {
	id: string;
	title: string;
	artist: string;
	tags: string;
};

const snapshotFile = path.join(dataPath, 'fts.json');

const options: IFuseOptions<TuneDocument> = {
	keys: [{ name: 'title', weight: 2 }, 'artist', 'tags'],
	ignoreDiacritics: true
};

let fuse: Fuse<TuneDocument> = new Fuse([], options);

const fts = {
	addEntries(entries: TuneDocument[]) {
		fuse.setCollection(entries);
	},
	async saveSnapshot() {
		await fs.promises.writeFile(snapshotFile, JSON.stringify(fuse.getIndex().toJSON()));
	},
	snapshotExists() {
		return fs.existsSync(snapshotFile);
	},
	async loadSnapshot(entries: TuneDocument[]) {
		const data = (await fs.promises.readFile(snapshotFile)).toString();
		const index = Fuse.parseIndex<TuneDocument>(JSON.parse(data));
		fuse.setCollection(entries, index);
	},
	search(query: string, limit = 30): string[] {
		const results = fuse.search(query, { limit });
		return results.map((result) => result.item.id);
	},
	clear() {
		fuse = new Fuse([], options);
	},
	get size() {
		return fuse.getIndex().toJSON().records.length;
	}
};
export default fts;
