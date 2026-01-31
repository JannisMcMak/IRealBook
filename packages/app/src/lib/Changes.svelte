<script lang="ts">
	import type { TuneDTO } from '@irealbook/shared';
	import {
		generateChordChart,
		NO_ROOT,
		type Annotation,
		type BarlineTokenType,
		type Cell,
		type Chord
	} from '@irealbook/irealpro';

	const CELLS_PER_ROW = 16;

	const BarlineChars: Record<BarlineTokenType, string> = {
		BarLeft: '\u{1D100}',
		DoubleBarLeft: '\u{1D101}',
		DoubleBarRight: '\u{1D101}',
		StartRepeat: '\u{1D106}',
		EndRepeat: '\u{1D107}',
		EndBarRight: '\u{1D102}'
	};

	interface Props {
		tune: TuneDTO | null;
	}
	let { tune }: Props = $props();

	// Generate chord chart from tune
	const chart = $derived(
		tune?.changes
			? generateChordChart({
					title: tune.title,
					composer: tune.artist ?? '',
					key: tune.key ?? '',
					style: '',
					rawMusic: tune.changes
				})
			: null
	);
	// Group cells into rows
	const cells = $derived.by(() => {
		if (!chart) return [];
		const res: Cell[][] = [];
		let temp = [];
		for (let i = 0; i < chart.cells.length; i++) {
			temp.push(chart.cells[i]);
			if ((i + 1) % CELLS_PER_ROW == 0) {
				res.push(temp);
				temp = [];
			}
		}
		res.push(temp);
		return res;
	});

	// Type guards
	function isChord(content: Cell['content']): content is Chord {
		return typeof content === 'object' && 'note' in content;
	}
</script>

{#snippet note(noteStr: string)}
	{@const letter = noteStr[0]}
	{@const accidentalPart = noteStr.at(1)}
	{@const accidental =
		accidentalPart === undefined ? '' : accidentalPart === '#' ? '\u266f' : '\u266d'}
	<span>
		{letter}{#if accidental}
			<span class="music-font inline-block -translate-y-2.5 text-[80%]">
				{accidental}
			</span>
		{/if}
	</span>
{/snippet}
{#snippet chordModifiers(modifiers: string, withAccidental: boolean = false)}
	{@const formatted = modifiers
		.replace('-', 'm') // Minor
		.replace('^', '\u2206') // Major (7th)
		.replace('h', '\u2300') // Half-diminished
		.replace(/b/g, '\u266d') // Flat
		.replace(/#/g, '\u266f')}
	<span class="music-font translate-y-1 text-[55%]" class:-translate-x-1={withAccidental}>
		{formatted}
	</span>
{/snippet}
{#snippet chord(c: Chord)}
	<div class="music-font flex items-center whitespace-nowrap" class:scale-x-70={c.small}>
		{#if c.note !== NO_ROOT}
			{@render note(c.note)}
		{/if}
		{@render chordModifiers(c.modifiers, c.note.includes('#') || c.note.includes('b'))}
	</div>
{/snippet}

{#snippet annotation(annot: Annotation, isLastColumn = false)}
	{#if annot.type === 'Comment'}
		<span
			class="absolute top-7 text-xs font-bold italic"
			class:whitespace-nowrap={!isLastColumn}
			class:w-12={isLastColumn}
		>
			{annot.value}
		</span>
	{:else if annot.type === 'Section'}
		<span
			class="absolute -top-4 -left-4 rounded-md border-2 px-1 pt-2 pb-2 text-xs leading-0 font-bold"
		>
			{annot.value}
		</span>
	{:else if annot.type === 'RepeatMarker'}
		<div
			class="absolute -top-2 -left-1 h-3 w-20 rounded-tl-sm border-t border-l pl-1 text-[45%] leading-3"
		>
			{annot.value}.
		</div>
	{:else if annot.type === 'TimeSignature'}
		<span style="text-orientation: upright;" class="absolute -left-5.5 w-1 text-sm leading-2">
			{#if annot.value === '12'}
				{annot.value}&mdash;8
			{:else}
				{annot.value?.split('').join('—')}
			{/if}
		</span>
	{:else if annot.type === 'Segno' || annot.type === 'Coda' || annot.type === 'Fermata'}
		<span class="absolute -top-3 left-2">
			{#if annot.type === 'Segno'}
				&#x1D10B;
			{:else if annot.type === 'Coda'}
				&#x1D10C;
			{:else if annot.type === 'Fermata'}
				&#x1D110;
			{/if}
		</span>
	{/if}
{/snippet}

{#snippet barline(token: BarlineTokenType)}
	{@const isLeft = token === 'BarLeft' || token === 'DoubleBarLeft'}
	{@const veryLeft = token === 'StartRepeat'}
	{@const veryRight = token === 'EndRepeat'}
	<span
		class="music-font absolute top-1.5"
		class:-left-1={isLeft}
		class:-left-2.5={veryLeft}
		class:-right-2={!isLeft && !veryRight}
		class:-right-3={veryRight}
	>
		{BarlineChars[token]}
	</span>
{/snippet}

{#if chart}
	<h3 class="text-xl font-bold">Changes</h3>
	<div class="mt-4 space-y-4 text-xl leading-6! select-none">
		{#each cells as row}
			<div class="grid grid-cols-16" class:mt-8={row.some((c) => c.verticalSpacer)}>
				{#each row as cell, i}
					<div class="relative flex h-8 items-center justify-start">
						{#if isChord(cell.content)}
							<!-- Chord content -->
							{@render chord(cell.content)}
							{#if cell.content.over}
								<div class="absolute bottom-3 flex h-0 flex-col text-[70%]">
									<span class="translate-x-3 rotate-24 text-[70%]">&#x2571;</span>
									<div class="translate-x-4 -translate-y-4">
										{@render note(cell.content.over)}
									</div>
								</div>
							{/if}
							<!-- Other cell content -->
						{:else if cell.content === 'BarRepeat'}
							<span class="absolute top-2.5 -right-2 text-[120%]">&#x1D10E;</span>
						{:else if cell.content === 'DoubleBarRepeat'}
							<span class="absolute top-2.5 -right-2 text-[120%]">&#x1D10F;</span>
						{/if}

						<!-- Annotations -->
						{#each cell.annotations || [] as annot}
							{@render annotation(annot, i === cells.length - 1)}
						{/each}

						<!-- Alternate chord -->
						<!-- TODO not showing -->
						{#if cell.alternateChord}
							<div class="absolute -top-3">
								{@render chord(cell.alternateChord)}
							</div>
						{/if}

						<!-- Barline -->
						{#if cell.barline}
							{@render barline(cell.barline)}
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>
{/if}
