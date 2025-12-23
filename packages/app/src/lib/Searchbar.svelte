<script lang="ts">
	interface Props {
		value?: string;
		onInput?: (value: string) => void;
		onDebouncedInput?: (value: string) => void;
		debounceTime?: number;
		placeholder?: string;
	}
	let {
		value = $bindable(''),
		onInput,
		onDebouncedInput,
		debounceTime = 250,
		placeholder = 'Search...'
	}: Props = $props();

	const getDebounced = () => {
		let timer: number;
		return () => {
			clearTimeout(timer);
			timer = setTimeout(async () => {
				onDebouncedInput?.(value);
			}, debounceTime);
		};
	};

	let debouncedOnInput = $derived(getDebounced());

	const handleInput = () => {
		onInput?.(value);
		debouncedOnInput?.();
	};
</script>

<div class="relative overflow-hidden p-2">
	<label class="input w-full transition-all">
		<i class="icon-[mdi--magnify] h-[1em] opacity-50"> </i>
		<input bind:value oninput={handleInput} type="search" required {placeholder} />
	</label>
	<button
		onclick={() => {
			value = '';
			handleInput();
		}}
		aria-label="clear"
		class="btn pointer-events-none absolute -right-12 btn-square btn-ghost transition-all"
	>
		<i class="icon-[mdi--close]"> </i>
	</button>
</div>

<style>
	label:has(> input[type='search']:not(:placeholder-shown)) {
		width: calc(100% - var(--size) - var(--spacing) * 2);
	}
	label:has(> input[type='search']:not(:placeholder-shown)) ~ button {
		right: calc(var(--spacing) * 2);
		pointer-events: auto;
	}

	input[type='search']::-webkit-search-cancel-button {
		-webkit-appearance: none;
		appearance: none;
	}
</style>
