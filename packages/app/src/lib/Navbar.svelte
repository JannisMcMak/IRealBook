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

<div class="rounded-b-box bg-base-100 shadow-sm">
	<div class="navbar">
		{#if start}
			<div class="flex-none">
				{@render start()}
			</div>
		{/if}
		<div class="flex-1">
			<span class="text-xl font-bold">{title}</span>
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
