<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		version?: string;
		start?: Snippet;
		end?: Snippet;
		children?: Snippet;
	}
	const { title, version, start, end, children }: Props = $props();
</script>

<div
	class="sticky top-0 z-50 rounded-b-box border-b border-base-200/50 bg-base-100/80 shadow-md backdrop-blur-xl"
>
	<div class="navbar">
		{#if start}
			<div class="flex-none">
				{@render start()}
			</div>
		{/if}
		<div class="flex flex-1 items-center gap-2 pl-2">
			<div class="flex size-9 items-center justify-center rounded-box bg-primary/10">
				<i class="text-background icon-[mdi--music-note] text-primary"></i>
			</div>
			<span
				class="bg-linear-to-r from-primary to-info bg-clip-text text-xl font-bold text-transparent"
				>{title}</span
			>
			{#if version}
				<span class="text-sm font-light brightness-80">v{version}</span>
			{/if}
		</div>
		{#if end}
			<div class="flex-none">
				{@render end()}
			</div>
		{/if}
	</div>
	{#if children}
		<div>
			{@render children?.()}
		</div>
	{/if}
</div>
