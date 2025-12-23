const TOKEN_KEY = 'irealbook_jwt';

let token = $state<string | null>(null);

const auth = {
	get token() {
		return token;
	},
	loadToken() {
		const t = localStorage.getItem(TOKEN_KEY);
		if (!t || t === null) token = null;
		else token = t;
	},
	setToken(newToken: string) {
		token = newToken;
		localStorage.setItem(TOKEN_KEY, newToken);
	},
	clear() {
		token = null;
		localStorage.removeItem(TOKEN_KEY);
	}
};
export default auth;
