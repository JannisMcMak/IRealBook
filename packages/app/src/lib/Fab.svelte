<script lang="ts">
	type Action = {
		label: string;
		iconClass: string;
		onClick: () => void;
		disabled?: boolean;
		indicator?: number;
	};

	interface Props {
		actions: Array<Action>;
	}
	let { actions }: Props = $props();
</script>

{#snippet actionBtn(action: Action)}
	<button
		class="btn btn-circle btn-sm"
		onclick={action.disabled ? undefined : action.onClick}
		aria-label={action.label}
		aria-disabled={!!action.disabled}
		class:opacity-50={!!action.disabled}
	>
		<i class={action.iconClass}></i>
	</button>
{/snippet}

<div class="fab">
	<div tabindex="0" role="button" class="btn btn-circle btn-sm btn-primary">
		<i class="icon-[mdi--menu]"></i>
	</div>

	<div class="fab-close">
		<span class="rounded-box bg-base-200 p-1 text-xs">Close</span>
		<span class="btn btn-circle btn-sm btn-error">
			<i class="icon-[mdi--close]"></i>
		</span>
	</div>

	{#each actions as action}
		<div>
			<span class="rounded-box bg-base-200 p-1 text-xs" class:opacity-50={!!action.disabled}
				>{action.label}</span
			>
			{#if action.indicator}
				<div class="indicator indicator-start">
					<span class="indicator-item badge badge-sm badge-error">{action.indicator}</span>
					{@render actionBtn(action)}
				</div>
			{:else}
				{@render actionBtn(action)}
			{/if}
		</div>
	{/each}
</div>
