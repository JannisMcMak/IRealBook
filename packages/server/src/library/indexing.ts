import fs from 'fs';
import { Source, Tune, TuneVersion } from '../model/index.js';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { booksPath, getSourceFileName, seedPath } from './utils.js';
import { parseIRealProPlaylist } from '@irealbook/irealpro';

const titleCase = (str: string): string => {
	str = str.toLowerCase();
	const seps = [' ', '-', '.', '(', ')'];

	// Upper-case every chars after a separator
	for (const sep of seps) {
		const parts = str.split(sep);
		for (let i = 1; i < parts.length; i++) {
			parts[i] = parts[i]!.charAt(0).toUpperCase() + parts[i]!.slice(1);
		}
		str = parts.join(sep);
	}

	// Upper-case first char
	return str.charAt(0).toUpperCase() + str.slice(1);
};

/** Normalizes a tune name for storing in the database. */
const normalizeName = (name: string): string => {
	// "A" should be at the start
	if (name.endsWith(', A') || name.endsWith('(A)')) {
		name = 'A ' + name.slice(0, -3);
	}
	// "The" should be at the end according to IRealPro naming conventions
	// https://www.irealpro.com/ireal-pro-custom-chord-chart-protocol
	if (name.startsWith('The ')) {
		name = name.slice(4) + ', The';
	}
	// Sometimes, there is no comma before "The"
	if (name.endsWith(' The') && !name.endsWith(', The')) {
		name = name.slice(0, -4) + ', The';
	}
	// Replace "&" with "and"
	name = name.replace(/&/g, 'and');
	// Convert to title case
	return titleCase(name);
};

type TuneIndex = {
	name: string;
	pageFrom: number;
	pageTo: number;
};
/**
 * Parses the index CSV file for a specific source and returns an array of tunes with page numbers corresponding to the given source.
 */
async function parseTunesOfSource(source: Source): Promise<TuneIndex[]> {
	// Parse index CSV file with the page numbers
	const indexFileName = getSourceFileName(source, 'csv');
	if (!fs.existsSync(path.join(booksPath, indexFileName))) {
		console.warn(`Index file not found for source ${source.name}: ${indexFileName}`);
		return [];
	}
	const rows = parse(await fs.promises.readFile(path.join(booksPath, indexFileName)), {
		delimiter: ',',
		skip_empty_lines: true
	});

	const keywordBlacklist = ['photo of', 'index', 'chord table', 'foreword', 'corrections'];

	const tunes: TuneIndex[] = [];

	for (const row of rows) {
		if (row.length < 3) continue;
		let name = (row[0] as string).trim();
		if (!name) continue;
		if (name.startsWith('#') || keywordBlacklist.some((x) => name.toLowerCase().includes(x))) {
			// Skip misc. and comment rows
			continue;
		}
		name = normalizeName(name);
		const pageFrom = parseInt(row[1] as string);
		let pageTo = parseInt(row[2] as string);
		if (isNaN(pageTo)) {
			// Sometimes, pageTo is omitted
			pageTo = pageFrom;
		}
		tunes.push({ name, pageFrom, pageTo });
	}

	return tunes;
}

type TuneMetadata = {
	Title: string;
	Composer: string;
	Key: string;
	Rhythm: string;
	TimeSignature: string;
};
async function loadMetadata(): Promise<Map<string, TuneMetadata>> {
	const metadataFile = await fs.promises.readFile(path.join(seedPath, 'standards.json'));
	const data: TuneMetadata[] = JSON.parse(metadataFile.toString());
	const metadata = new Map<string, TuneMetadata>();
	for (const tune of data) {
		metadata.set(normalizeName(tune.Title), tune);
	}
	return metadata;
}

async function loadChanges() {
	const dataFile = await fs.promises.readFile(path.join(seedPath, 'irealpro.txt'));
	const data = parseIRealProPlaylist(dataFile.toString());
	const metadata = new Map<string, string>();
	for (const tune of data) {
		metadata.set(normalizeName(tune.title), tune.rawMusic);
	}
	return metadata;
}

/**
 * This function looks at all tunes in the books and indexes them.
 * Metadata for each tune will be extracted from the standards folder.
 * If the tune already exists in the given tune list,
 * a new version corresponding to the current source will be appended.
 * @param tunes List of existing tunes that should be updated / expanded
 * @param sources List of sources from which new tunes should be indexed
 */
export default async function indexTunes(tunes: Tune[], sources: Source[]): Promise<Tune[]> {
	const startTime = Date.now();
	const tuneMap = new Map<string, Tune>();
	for (const tune of tunes) {
		tuneMap.set(tune.title, tune);
	}

	const metadataMap = await loadMetadata();
	const changesMap = await loadChanges();
	for (const source of sources) {
		let tunesOfSource: TuneIndex[];
		try {
			tunesOfSource = await parseTunesOfSource(source);
		} catch (e) {
			console.error(`Failed to parse index for source ${source.name}: ${e}`);
			continue;
		}
		for (const tuneIndex of tunesOfSource) {
			// Check if tune already exists
			if (!tuneMap.has(tuneIndex.name)) {
				// Tune doesn't exist, create it
				const newTune = new Tune();
				newTune.title = tuneIndex.name;

				// Load metadata if available
				const metadata = metadataMap.get(tuneIndex.name);
				if (metadata) {
					if (metadata.Composer) newTune.artist = metadata.Composer;
					if (metadata.Key) newTune.key = metadata.Key;
					if (metadata.TimeSignature) newTune.timeSignature = metadata.TimeSignature;
					if (metadata.Rhythm) newTune.tags = [metadata.Rhythm];
				}

				// Load changes if available
				const changes = changesMap.get(tuneIndex.name);
				if (changes) newTune.changes = changes;

				tuneMap.set(tuneIndex.name, newTune);
			}

			// Add version to the tune
			const tune = tuneMap.get(tuneIndex.name)!;
			const tuneVersion = new TuneVersion();
			tuneVersion.source = source;
			tuneVersion.pageFrom = tuneIndex.pageFrom;
			tuneVersion.pageTo = tuneIndex.pageTo;
			tune.versions = tune.versions ? [...tune.versions, tuneVersion] : [tuneVersion];
		}
	}

	console.log(`Indexed ${tuneMap.size} tunes in ${Date.now() - startTime} ms`);

	return Array.from(tuneMap.values());
}
