import type { ApiRoutes } from '@irealbook/shared';
import type { Router } from 'express';
import { AppDataSource } from '../data-source.js';
import { Tune } from '../model/index.js';
import { getTuneFilePath } from '../library/utils.js';
import fs from 'fs';
import { authenticateJWT } from './auth.js';

const registerFileRoutes = (router: Router) => {
	const getFilePath: ApiRoutes['GetFile']['path'] = '/tune/:tuneID/:versionID/file';
	router.get(getFilePath, authenticateJWT, async (req, res) => {
		const { tuneID, versionID } = req.params;

		if (!tuneID || !versionID) {
			return res.status(400).end();
		}

		const repo = AppDataSource.getRepository(Tune);
		const tune = await repo.findOneBy({ id: tuneID });
		if (!tune) {
			return res.status(404).end();
		}
		const version = tune.versions.find((x) => x.id === versionID);
		if (!version) {
			return res.status(404).end();
		}
		const data = await fs.promises.readFile(getTuneFilePath(tune, version));
		res.contentType('application/pdf');
		return res.send(data);
	});
};
export default registerFileRoutes;
