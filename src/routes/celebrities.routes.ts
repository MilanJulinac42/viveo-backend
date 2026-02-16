import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { celebrityQuerySchema } from '../schemas/query.schema.js';
import * as celebritiesController from '../controllers/celebrities.controller.js';

const router = Router();

router.get('/', validate(celebrityQuerySchema, 'query'), celebritiesController.listCelebrities);
router.get('/:slug', celebritiesController.getCelebrityBySlug);
router.get('/:slug/reviews', celebritiesController.getCelebrityReviews);

export default router;
