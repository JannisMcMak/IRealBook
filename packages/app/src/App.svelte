<script lang="ts">
	import PDFViewer from './lib/PDFViewer.svelte';
	import type { TuneDTO, TunePreviewDTO, TuneVersionDTO } from '../../shared/dist';
	import server from './utils/server';
	import { formatTuneTitle } from './utils/common';
	import Navbar from './lib/Navbar.svelte';
	import Searchbar from './lib/Searchbar.svelte';
	import Fab from './lib/Fab.svelte';
	import { onMount } from 'svelte';
	import auth from './utils/auth.svelte';
	import VersionSelect from './lib/VersionSelect.svelte';
	import Changes from './lib/Changes.svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const TUNE_ID_SEARCH_PARAM = 'tuneID';

	// Auth
	let authModal = $state<HTMLDialogElement>();
	let passwordInput = $state('');
	let authError = $state(false);

	onMount(async () => {
		auth.loadToken();
		await server.authorize();
		if (!auth.token) {
			authModal?.show();
			return;
		}
		const urlParams = new SvelteURLSearchParams(window.location.search);
		const tuneIDValue = urlParams.get(TUNE_ID_SEARCH_PARAM);
		if (tuneIDValue) {
			await handleSelectTune(tuneIDValue);
		}
	});

	// Tune search
	let searchResults = $state<TunePreviewDTO[] | null>(null);

	// Selection state
	let selectedTune = $state<TuneDTO | null>(null);
	let selectedVersion = $state<TuneVersionDTO | null>(null);

	// Version selection
	let versionSelectOpened = $state(false);

	// Util
	let documentURL = $derived(
		selectedTune && selectedVersion ? server.fileURL(selectedTune.id, selectedVersion.id) : null
	);
	let tuneModal = $state<HTMLDialogElement>();
	let tuneInfoModal = $state<HTMLDialogElement>();
	let changesModal = $state<HTMLDialogElement>();

	// PDF viewer
	let pdfViewer = $state<PDFViewer>();
	let clientWidth = $state(0);
	let clientHeight = $state(0);
	let pdfViewerHeight = $derived(clientWidth < 768 ? clientHeight : (clientHeight * 11) / 12);

	const handleSearchInput = (searchQuery: string) => {
		if (!searchQuery) {
			searchResults = null;
			return;
		}
		server.searchTunes(searchQuery).then((results) => (searchResults = results));
	};
	const handleRandomTune = async () => {
		await openTune(await server.randomTune());
	};
	const handleSelectTune = async (id: string) => {
		await openTune(await server.getTune(id));
	};
	const openTune = async (tune: TuneDTO) => {
		selectedTune = tune;
		selectedVersion = tune.versions[0];
		if (documentURL) await pdfViewer?.openPDF(documentURL);
		tuneModal?.show();

		// Set query param
		const urlParams = new SvelteURLSearchParams();
		urlParams.set(TUNE_ID_SEARCH_PARAM, tune.id);
		history.replaceState(null, '', '?' + urlParams.toString());
	};
	const handleDismissTune = () => {
		tuneModal?.close();
		setTimeout(() => {
			pdfViewer?.closePDF();
			selectedTune = null;
			selectedVersion = null;
		}, 300); // Wait for animation

		// Remove query param
		history.replaceState(null, '', '/');
	};
	const handleSelectVersion = (version: TuneVersionDTO) => {
		selectedVersion = version;
		if (documentURL) pdfViewer?.openPDF(documentURL);
		versionSelectOpened = false;
	};
</script>

<svelte:window bind:innerWidth={clientWidth} bind:innerHeight={clientHeight} />

<dialog bind:this={authModal} class="modal">
	<div class="modal-box max-w-xs">
		<h3 class="mb-4 text-lg font-bold">Enter Password</h3>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				authError = false;
				server.login(passwordInput).then((success) => {
					if (success) authModal?.close();
					else authError = true;
				});
			}}
		>
			<label class="input">
				<i class="icon-[mdi--key]"></i>
				<input type="password" required placeholder="Password" bind:value={passwordInput} />
			</label>
			{#if authError}
				<span class="text-xs text-error">Wrong password.</span>
			{/if}
			<div class="modal-action">
				<button type="submit" class="btn btn-primary">Submit</button>
			</div>
		</form>
	</div>
</dialog>

<div class="h-screen w-full bg-base-200">
	<Navbar title="IRealBook" version={__APP_VERSION__}>
		<Searchbar onDebouncedInput={handleSearchInput} placeholder="Search for tunes..." />
	</Navbar>
	<div class="mx-2 my-4 rounded-box bg-base-100 shadow-md">
		{#if searchResults === null}
			<div class="w-full py-12 text-center">
				<p>Browse through Jazz Standards.</p>
				<button class="btn mt-4 btn-primary" onclick={() => handleRandomTune()}>Random Tune</button>
			</div>
		{:else}
			<ul class="list join join-vertical w-full">
				<li class="p-4 pb-2 text-xs tracking-wide opacity-60">Tunes</li>
				{#each searchResults as result}
					<button
						class="list-row btn join-item flex h-auto justify-between text-left btn-ghost"
						onclick={() => handleSelectTune(result.id)}
					>
						<div>
							<div>{formatTuneTitle(result.title)}</div>
							<div class="text-xs font-semibold uppercase opacity-60">{result.artist}</div>
						</div>
						{#each result.tags as tag}
							<div class="badge badge-soft text-nowrap badge-primary">{tag}</div>
						{/each}
					</button>
				{:else}
					<p class="p-4">No tunes found.</p>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<dialog bind:this={tuneModal} class="modal">
	<div class="modal-box h-screen w-screen max-w-4xl overflow-hidden p-0 md:h-11/12 md:w-11/12">
		<div class="drawer h-full md:drawer-open">
			<input
				bind:checked={versionSelectOpened}
				id="version-drawer"
				type="checkbox"
				class="drawer-toggle"
			/>
			<div class="drawer-content overflow-hidden">
				<PDFViewer
					bind:this={pdfViewer}
					style="height: {pdfViewerHeight}px"
					class="w-full overflow-hidden"
				/>
			</div>

			<div class="drawer-side" class:pointer-events-none={!selectedTune}>
				<label for="version-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
				<VersionSelect {selectedTune} {selectedVersion} onSelectVersion={handleSelectVersion} />
			</div>
		</div>

		<button
			onclick={() => handleDismissTune()}
			class="btn absolute top-2 right-2 btn-circle btn-lg btn-primary"
			aria-label="Close"
		>
			<i class="icon-[mdi--close]"></i>
		</button>
		<Fab
			actions={[
				{
					label: 'Fullscreen',
					iconClass: 'icon-[mdi--fullscreen]',
					onClick: () => pdfViewer?.fullscreen()
				},
				{
					label: 'Changes',
					iconClass: 'icon-[mdi--piano]',
					onClick: () => changesModal?.show(),
					disabled: !selectedTune?.changes
				},
				{
					label: 'Info',
					iconClass: 'icon-[mdi--information-outline]',
					onClick: () => tuneInfoModal?.show(),
					disabled: !selectedTune?.artist
				},
				{
					label: 'Versions',
					iconClass: 'icon-[mdi--menu]',
					onClick: () => (versionSelectOpened = true),
					indicator:
						selectedTune && selectedTune.numVersions > 1 ? selectedTune.numVersions : undefined
				}
			]}
		/>
	</div>
</dialog>

<dialog bind:this={tuneInfoModal} class="modal">
	<div class="modal-box">
		{#if selectedTune}
			<h3 class="text-xl font-bold">{selectedTune.title}</h3>
			{#if selectedTune.artist}
				<p class="italic">by {selectedTune.artist}</p>
			{/if}
			<div
				class="my-4 flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-4"
			>
				<div class="flex flex-row items-center space-x-2">
					<span class="font-bold">Original Key:</span>
					{#if selectedTune.key}
						<div class="badge badge-outline">{selectedTune.key}</div>
					{:else}
						<span class="text-neutral-800">N/A</span>
					{/if}
				</div>
				<div class="flex flex-row items-center space-x-2">
					<span class="font-bold">Time Signature:</span>
					{#if selectedTune.timeSignature}
						<div class="badge badge-outline">
							{selectedTune.timeSignature}
						</div>
					{:else}
						<span class="font-bold text-neutral-400">N/A</span>
					{/if}
				</div>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each selectedTune.tags as tag}
					<div class="badge badge-soft badge-primary">{tag}</div>
				{/each}
			</div>
		{/if}
		<button
			onclick={() => tuneInfoModal?.close()}
			class="btn absolute top-2 right-2 btn-circle btn-ghost btn-lg"
			aria-label="Close"
		>
			<i class="icon-[mdi--close]"></i>
		</button>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<dialog bind:this={changesModal} class="modal">
	<div class="modal-box">
		<Changes tune={selectedTune} />
		<button
			onclick={() => changesModal?.close()}
			class="btn absolute top-2 right-2 btn-circle btn-ghost btn-lg"
			aria-label="Close"
		>
			<i class="icon-[mdi--close]"></i>
		</button>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
