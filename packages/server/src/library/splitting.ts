import { PDFDocument } from 'pdf-lib';
import type { Source, Tune } from '../model/index.js';
import { booksPath, getSourceFileName, getTuneFilePath, tunesPath } from './utils.js';
import path from 'path';
import fs from 'fs';

/**
 * Loads the PDF books of all given sources into memory.
 * @returns A map of source IDs to PDFs
 */
const loadSourcePDFs = async (sources: Source[]): Promise<Map<string, PDFDocument>> => {
	const res = new Map<string, PDFDocument>();
	for (const source of sources) {
		const bookPDFName = getSourceFileName(source, 'pdf');
		try {
			const bookPDF = await PDFDocument.load(
				await fs.promises.readFile(path.join(booksPath, bookPDFName))
			);
			res.set(source.id, bookPDF);
		} catch (e) {
			console.warn('Could not load book PDF for source ' + source.name);
			console.info(e);
			continue;
		}
	}
	return res;
};

/**
 * This function explodes the PDF books into separate PDFs for each tune.
 */
export default async function explodeTunes(tunes: Tune[], sources: Source[]) {
	// Clean tunes folder of old files
	await fs.promises.rm(tunesPath, { recursive: true, force: true });

	// Load source PDFs
	let startTime = Date.now();
	console.log('Loading source PDFs...');
	const pdfs = await loadSourcePDFs(sources);
	console.log(`Loaded ${pdfs.size} source PDFs in ${Date.now() - startTime} ms`);

	// Split source PDFs
	startTime = Date.now();
	console.log('Exploding tune PDFs...');
	const brokenSourceIDs: string[] = [];
	for (const tune of tunes) {
		for (const version of tune.versions) {
			const source = version.source;
			// Keep track of broken sources
			if (brokenSourceIDs.includes(source.id)) {
				continue;
			}
			const bookPDF = pdfs.get(source.id);
			if (!bookPDF) {
				console.warn('Could not find book PDF for source ' + source.name);
				brokenSourceIDs.push(source.id);
				continue;
			}

			// Check that pages are in range
			if (
				version.pageFrom < 0 ||
				version.pageFrom > bookPDF.getPageCount() ||
				version.pageTo < version.pageFrom
			) {
				console.warn(
					`Invalid page range (${version.pageFrom}-${version.pageTo}) for tune ${tune.title} in source ${source.name}`
				);
				continue;
			}

			// Create page range
			const pageRange = [...Array(version.pageTo - version.pageFrom + 1).keys()].map(
				(x) => x + version.pageFrom - 1
			);

			// Extract relevant pages
			const tunePDF = await PDFDocument.create();
			try {
				const pages = await tunePDF.copyPages(bookPDF, pageRange);
				pages.forEach((page) => tunePDF.addPage(page));
			} catch (e) {
				console.warn(
					'Could not extract pages for tune ' + tune.title + ' in source ' + source.name
				);
				console.log(pageRange);
				console.info(e);
				continue;
			}

			// Save PDF
			const tuneFile = await tunePDF.save();
			await fs.promises.mkdir(path.dirname(getTuneFilePath(tune, version)), { recursive: true });
			await fs.promises.writeFile(getTuneFilePath(tune, version), tuneFile);
		}
	}

	console.log(`Exploded ${tunes.length} tunes in ${Date.now() - startTime} ms`);
}
