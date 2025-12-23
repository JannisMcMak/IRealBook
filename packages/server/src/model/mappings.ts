import type { TuneDocument } from '../library/fts.js';
import type { Source, Tune, TuneVersion } from './index.js';
import type { SourceDTO, TuneDTO, TunePreviewDTO, TuneVersionDTO } from '@irealbook/shared';

export const mappings = {
	toTuneDTO(tune: Tune): TuneDTO {
		return {
			id: tune.id,
			title: tune.title,
			artist: tune.artist ?? undefined,
			key: tune.key ?? undefined,
			timeSignature: tune.timeSignature ?? undefined,
			tags: tune.tags ?? [],
			numVersions: tune.versions.length,
			versions: tune.versions.map((version) => this.toVersionDTO(version)),
			changes: tune.changes ?? undefined
		};
	},

	toTunePreviewDTO(tune: Tune): TunePreviewDTO {
		return {
			id: tune.id,
			title: tune.title,
			artist: tune.artist ?? undefined,
			key: tune.key ?? undefined,
			timeSignature: tune.timeSignature ?? undefined,
			tags: tune.tags ?? [],
			numVersions: tune.versions.length
		};
	},

	toVersionDTO(version: TuneVersion): TuneVersionDTO {
		return {
			id: version.id,
			source: this.toSourceDTO(version.source)
		};
	},

	toSourceDTO(source: Source): SourceDTO {
		return {
			id: source.id,
			name: source.name,
			shortName: source.shortName,
			key: source.key as 'C' | 'Bb' | 'Eb' | 'Bass',
			publisher: source.publisher ?? undefined,
			publishDate: source.publishDate?.toISOString()
		};
	},

	toTuneDocument(tune: Tune): TuneDocument {
		return {
			id: tune.id,
			title: tune.title,
			artist: tune.artist ?? '',
			tags: tune.tags?.join(' ') ?? ''
		};
	}
};
