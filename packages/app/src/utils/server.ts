import type { ApiRoutes } from '@irealbook/shared';
import urlJoin from 'url-join';
import auth from './auth.svelte';

const getDevURL = () => {
	const url = new URL(window.origin);
	url.port = '3000';

	return url.toString();
};

class APISerivce {
	basePath = '/api' satisfies ApiRoutes['basePath'];
	baseURL = import.meta.env.PROD ? window.origin : getDevURL();

	get authHeader() {
		return {
			Authorization: `Bearer ${auth.token}`
		};
	}

	private getURL(path: string, params?: URLSearchParams) {
		return urlJoin(this.baseURL, this.basePath, path, params ? '?' + params.toString() : '');
	}

	private async _get(path: string, params?: URLSearchParams) {
		const res = await fetch(this.getURL(path, params), {
			headers: this.authHeader
		});
		if (res.status === 401) {
			auth.clear();
			window.location.reload(); // force login
		}
		if (!res.ok) throw new Error(await res.text());
		return await res.json();
	}

	private async _post(path: string, body?: unknown) {
		const res = await fetch(this.getURL(path), {
			method: 'POST',
			body: body ? JSON.stringify(body) : undefined,
			headers: {
				'Content-Type': 'application/json',
				...this.authHeader
			}
		});
		if (!res.ok) throw new Error(await res.text());
		return await res.json();
	}

	async login(password: string): Promise<boolean> {
		const url = '/login' satisfies ApiRoutes['Login']['path'];
		const body = { password } satisfies ApiRoutes['Login']['body'];
		try {
			const res: ApiRoutes['Login']['response'] = await this._post(url, body);
			auth.setToken(res.token);
			return true;
		} catch {
			auth.clear();
			return false;
		}
	}

	async authorize(): Promise<void> {
		const url = '/authorize' satisfies ApiRoutes['Authorize']['path'];
		try {
			const res: ApiRoutes['Authorize']['response'] = await this._post(url);
			auth.setToken(res.token);
		} catch {
			auth.clear();
		}
	}

	async searchTunes(query: string): Promise<ApiRoutes['Search']['response']> {
		const url = '/search' satisfies ApiRoutes['Search']['path'];
		const params = { query } satisfies ApiRoutes['Search']['urlParams'];
		return await this._get(url, new URLSearchParams(params));
	}

	async randomTune(): Promise<ApiRoutes['Random']['response']> {
		const url = '/random' satisfies ApiRoutes['Random']['path'];
		return await this._get(url);
	}

	async getTune(tuneID: string): Promise<ApiRoutes['GetTune']['response']> {
		const url = '/tune/:id' satisfies ApiRoutes['GetTune']['path'];
		return await this._get(url.replace(':id', tuneID));
	}

	fileURL(tuneID: string, versionID: string) {
		const path = '/tune/:tuneID/:versionID/file' satisfies ApiRoutes['GetFile']['path'];
		return this.getURL(path).replace(':tuneID', tuneID).replace(':versionID', versionID);
	}
}
const server = new APISerivce();
export default server;
