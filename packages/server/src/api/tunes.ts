import type { ApiRoutes } from '@irealbook/shared';
import { mappings, Tune } from '../model/index.js';
import { AppDataSource } from '../data-source.js';
import type { Router } from 'express';
import { In } from 'typeorm';
import { authenticateJWT } from './auth.js';
import fts from '../library/fts.js';

const registerTuneRoutes = (router: Router) => {
	const searchPath: ApiRoutes['Search']['path'] = '/search';
	router.get(searchPath, authenticateJWT, async (req, res) => {
		const urlParams = req.query as ApiRoutes['Search']['urlParams'];
		if (!urlParams.query) {
			return res.status(400).end();
		}

		// Perform FTS
		const searchResults = fts.search(urlParams.query);
		if (searchResults.length === 0) {
			return res.json([] satisfies ApiRoutes['Search']['response']);
		}

		// Fetch tunes from DB
		const tunes = await AppDataSource.manager.find(Tune, {
			where: {
				id: In(searchResults)
			},
			loadEagerRelations: false,
			loadRelationIds: true,
			relations: {
				versions: false
			}
		});
		// Order results by rank
		tunes.sort((a, b) => {
			return searchResults.indexOf(a.id) - searchResults.indexOf(b.id);
		});

		const dto = tunes.map(mappings.toTunePreviewDTO);
		return res.json(dto satisfies ApiRoutes['Search']['response']);
	});

	const randomPath: ApiRoutes['Random']['path'] = '/random';
	router.get(randomPath, authenticateJWT, async (_, res) => {
		const repo = AppDataSource.getRepository(Tune);
		let tune = await repo.createQueryBuilder('tune').select().orderBy('RANDOM()').limit(1).getOne();
		if (!tune) {
			return res.status(404).end();
		}
		tune = await repo.findOneBy({ id: tune.id });
		if (!tune) {
			return res.status(404).end();
		}
		const dto = mappings.toTuneDTO(tune);
		return res.json(dto satisfies ApiRoutes['Random']['response']);
	});

	const getTunePath: ApiRoutes['GetTune']['path'] = '/tune/:id';
	router.get(getTunePath, authenticateJWT, async (req, res) => {
		const tuneID = req.params.id;

		if (!tuneID) {
			return res.status(400).end();
		}

		const tune = await AppDataSource.manager.findOneBy(Tune, {
			id: tuneID
		});
		if (!tune) {
			return res.status(404).end();
		}

		const dto = mappings.toTuneDTO(tune);
		return res.json(dto satisfies ApiRoutes['GetTune']['response']);
	});
};
export default registerTuneRoutes;
