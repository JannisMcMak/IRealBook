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

<div class="sticky top-0 z-50 rounded-b-box bg-base-100/80 backdrop-blur-xl shadow-md border-b border-base-200/50">
	<div class="navbar">
		{#if start}
			<div class="flex-none">
				{@render start()}
			</div>
		{/if}
		<div class="flex-1 flex items-center gap-2 pl-2">
		<div class="size-9 bg-primary/10 rounded-box flex items-center justify-center">
			<i class="icon-[mdi--music-note] text-xl text-primary"></i>
		</div>
			<span class="text-xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">{title}</span>
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
