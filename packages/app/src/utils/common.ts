import type { SourceDTO, TuneVersionDTO } from '@irealbook/shared';

export type Key = SourceDTO['key'];
export const availableKeys: Key[] = ['C', 'Bb', 'Eb', 'Bass'];
export function groupVersions(versions: TuneVersionDTO[]): Map<Key, TuneVersionDTO[]> {
	const grouped = new Map<Key, TuneVersionDTO[]>();
	for (const version of versions) {
		grouped.set(version.source.key, [...(grouped.get(version.source.key) ?? []), version]);
	}
	return grouped;
}

export function formatTuneTitle(title: string): string {
	return title.endsWith(', The') ? 'The ' + title.slice(0, -5) : title;
}
