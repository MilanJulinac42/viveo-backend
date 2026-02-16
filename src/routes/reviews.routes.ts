import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { createLimiter } from '../middleware/rateLimiter.js';
import { submitReviewSchema } from '../schemas/review.schema.js';
import * as reviewsController from '../controllers/reviews.controller.js';

const router = Router();

router.post('/', createLimiter, validate(submitReviewSchema), reviewsController.submitReview);

export default router;
