<script lang="ts">
	import type { TuneDTO, TuneVersionDTO } from '@irealbook/shared';
	import { availableKeys, groupVersions, type Key } from '../utils/common';

	const keyLabels: Record<Key, string> = {
		C: 'C',
		Bb: 'B\u266D',
		Eb: 'E\u266D',
		Bass: '\u{1D122}'
	};

	interface Props {
		selectedTune: TuneDTO | null;
		selectedVersion: TuneVersionDTO | null;
		onSelectVersion?: (newVersion: TuneVersionDTO) => void;
	}
	let { selectedTune, selectedVersion, onSelectVersion }: Props = $props();
	let groupedTuneVersions: Map<Key, TuneVersionDTO[]> = $derived(
		selectedTune ? groupVersions(selectedTune.versions) : new Map()
	);
	let selectedKey: Key = $derived(selectedVersion?.source.key || 'C');
</script>

<ul class="min-h-full w-48 bg-base-200 p-4">
	<div class="join">
		{#each availableKeys as key}
			<button
				title={key}
				class="btn join-item btn-square tracking-[-0.2em] btn-soft"
				class:btn-active={selectedKey === key}
				class:btn-primary={key === 'C'}
				class:btn-secondary={key === 'Bb'}
				class:btn-warning={key === 'Eb'}
				class:btn-accent={key === 'Bass'}
				disabled={!groupedTuneVersions.get(key)?.length}
				onclick={() => {
					// Select first version that is available for this key
					if (selectedKey !== key && groupedTuneVersions.has(key)) {
						onSelectVersion?.(groupedTuneVersions.get(key)![0]);
					}
				}}
			>
				{keyLabels[key]}
			</button>
		{/each}
	</div>

	<ul class="menu w-full">
		<li class="menu-title">Versions ({groupedTuneVersions.get(selectedKey)?.length || 0})</li>
		{#each groupedTuneVersions.get(selectedKey) as version}
			<li>
				<button
					title={version.source.name}
					disabled={version.id === selectedVersion?.id}
					class:menu-active={selectedVersion?.id === version.id}
					onclick={() => onSelectVersion?.(version)}>{version.source.shortName}</button
				>
			</li>
		{:else}
			<li class="menu-disabled">
				<a role="link" aria-disabled="true">No versions available</a>
			</li>
		{/each}
	</ul>
</ul>
