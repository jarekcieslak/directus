import express from 'express';
import asyncHandler from 'express-async-handler';
import { ActivityService, MetaService } from '../services';
import { Action } from '../types';
import { ForbiddenException } from '../exceptions';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.use(useCollection('directus_activity'));

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery('directus_activity', req.sanitizedQuery);

		res.locals.payload = {
			data: records || null,
			meta,
		};

		return next();
	}),
);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({ accountability: req.accountability });
		const record = await service.readByKey(req.params.pk, req.sanitizedQuery);

		res.locals.payload = {
			data: record || null,
		};

		return next();
	}),
);

router.post(
	'/comment',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({ accountability: req.accountability });

		const primaryKey = await service.create({
			...req.body,
			action: Action.COMMENT,
			action_by: req.accountability?.user,
			ip: req.ip,
			user_agent: req.get('user-agent'),
		});

		try {
			const record = await service.readByKey(primaryKey, req.sanitizedQuery);

			res.locals.payload = {
				data: record || null,
			};
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
);

router.patch(
	'/comment/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({ accountability: req.accountability });
		const primaryKey = await service.update(req.body, req.params.pk);

		try {
			const record = await service.readByKey(primaryKey, req.sanitizedQuery);

			res.locals.payload = {
				data: record || null,
			};
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
);

router.delete(
	'/comment/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({ accountability: req.accountability });
		await service.delete(req.params.pk);

		return next();
	}),
);

export default router;
