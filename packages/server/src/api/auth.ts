import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction, Router } from 'express';
import type { ApiRoutes } from '@irealbook/shared';

const JWT_SECRET = process.env.JWT_SECRET!;
const APP_PASSWORD = process.env.AUTH_PASSWORD!;

if (!JWT_SECRET) {
	throw new Error('JWT_SECRET is not defined');
}
if (!APP_PASSWORD) {
	throw new Error('APP_PASSWORD is not defined');
}

type JwtPayload = {
	sub: 'user';
};

function signToken(): string {
	const payload: JwtPayload = { sub: 'user' };
	return jwt.sign(payload, JWT_SECRET, {
		expiresIn: '7d'
	});
}

function secureStringCompare(a: string, b: string): boolean {
	if (typeof a !== 'string' || typeof b !== 'string') return false;

	var mismatch = a.length === b.length ? 0 : 1;
	if (mismatch) {
		b = a;
	}

	for (var i = 0, il = a.length; i < il; ++i) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}

	return mismatch === 0;
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Missing token' });
	}

	const token = authHeader.slice(7);

	try {
		jwt.verify(token, JWT_SECRET);
		next();
	} catch {
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
}

const registerAuthRoutes = (router: Router) => {
	const loginPath: ApiRoutes['Login']['path'] = '/login';
	router.post(loginPath, async (req, res) => {
		const body = req.body as ApiRoutes['Login']['body'] | undefined;

		if (!body?.password) {
			return res.status(400).json({ error: 'Password required' });
		}

		if (!secureStringCompare(body.password, APP_PASSWORD)) {
			return res.status(401).json({ error: 'Wrong password' });
		}

		const token = signToken();
		res.json({ token });
	});

	const authorizePath: ApiRoutes['Authorize']['path'] = '/authorize';
	router.post(authorizePath, authenticateJWT, (_, res) => {
		const token = signToken();
		res.json({ token });
	});
};
export default registerAuthRoutes;
