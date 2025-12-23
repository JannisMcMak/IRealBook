<script lang="ts">
	import { usePdfiumEngine } from '@embedpdf/engines/svelte';
	import { EmbedPDF } from '@embedpdf/core/svelte';
	import { createPluginRegistration } from '@embedpdf/core';
	import { ViewportPluginPackage, Viewport } from '@embedpdf/plugin-viewport/svelte';
	import {
		Scroller,
		ScrollPluginPackage,
		type RenderPageProps
	} from '@embedpdf/plugin-scroll/svelte';
	import {
		DocumentManagerPluginPackage,
		DocumentContent,
		useDocumentManagerCapability
	} from '@embedpdf/plugin-document-manager/svelte';
	import { InteractionManagerPluginPackage } from '@embedpdf/plugin-interaction-manager/svelte';
	import { ZoomMode, ZoomPluginPackage, ZoomGestureWrapper } from '@embedpdf/plugin-zoom/svelte';
	import { PanPluginPackage } from '@embedpdf/plugin-pan/svelte';
	import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/svelte';
	import server from '../utils/server';

	interface Props {
		[key: string]: unknown;
	}
	let { ...rest }: Props = $props();

	export async function openPDF(pdfURL: string) {
		await closePDF();
		const doc = await docManager?.provides
			?.openDocumentUrl({ url: pdfURL, requestOptions: { headers: server.authHeader } })
			.toPromise();
		doc && docManager?.provides?.setActiveDocument(doc.documentId);
	}

	export async function closePDF() {
		await docManager?.provides?.closeAllDocuments().toPromise();
	}

	// PDF engine
	const pdfEngine = usePdfiumEngine();
	let docManager: ReturnType<typeof useDocumentManagerCapability> | undefined = $state();
	$effect(() => {
		// Wait for engine to load, then create document manager
		if (!pdfEngine.isLoading) {
			docManager = useDocumentManagerCapability();
		}
	});

	const plugins = [
		createPluginRegistration(DocumentManagerPluginPackage),
		createPluginRegistration(ViewportPluginPackage),
		createPluginRegistration(ScrollPluginPackage),
		createPluginRegistration(RenderPluginPackage),
		createPluginRegistration(InteractionManagerPluginPackage),
		createPluginRegistration(ZoomPluginPackage, {
			defaultZoomLevel: ZoomMode.FitWidth
		}),
		createPluginRegistration(PanPluginPackage, { defaultMode: 'mobile' })
	];
</script>

{#if pdfEngine.isLoading || !pdfEngine.engine}
	<div class="text-center">
		<span class="loading loading-lg loading-spinner"></span>
	</div>
{:else}
	<div {...rest}>
		<EmbedPDF engine={pdfEngine.engine} {plugins}>
			{#snippet children({ pluginsReady, activeDocumentId: documentId })}
				{#if !pluginsReady}
					<p>Loading plugins...</p>
				{:else if documentId}
					<DocumentContent {documentId}>
						{#snippet children(documentContent)}
							{#if documentContent.isLoading}
								<div class="flex h-full w-full items-center justify-center">
									<span class="loading loading-lg loading-spinner"></span>
								</div>
							{:else if documentContent.isError}
								<p>error {documentContent.documentState.error}</p>
								{JSON.stringify(documentContent.documentState.errorDetails)}
							{:else if documentContent.isLoaded}
								{#snippet renderPage(page: RenderPageProps)}
									<div
										style:width="{page.width}px"
										style:height="{page.height}px"
										style:position="relative"
									>
										<RenderLayer {documentId} pageIndex={page.pageIndex} />
									</div>
								{/snippet}
								<Viewport {documentId}>
									<ZoomGestureWrapper {documentId}>
										<Scroller {documentId} {renderPage} />
									</ZoomGestureWrapper>
								</Viewport>
							{/if}
						{/snippet}
					</DocumentContent>
				{:else}
					<p>No active doc</p>
				{/if}
			{/snippet}
		</EmbedPDF>
	</div>
{/if}
