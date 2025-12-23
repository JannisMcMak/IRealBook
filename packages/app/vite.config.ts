import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte(), tailwindcss()],
	build: {
		outDir: 'dist',
		emptyOutDir: true
	},
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version)
	}
});
