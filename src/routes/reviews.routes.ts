import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { createLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/auth.js';
import { submitReviewSchema } from '../schemas/review.schema.js';
import * as reviewsController from '../controllers/reviews.controller.js';
import * as productReviewsController from '../controllers/product-reviews.controller.js';

const router = Router();

// Submit review (requires auth)
router.post('/', requireAuth, createLimiter, validate(submitReviewSchema), reviewsController.submitReview);

// Public product review endpoints (no auth)
router.get('/product/:productId', productReviewsController.getProductReviews);
router.get('/digital-product/:productId', productReviewsController.getDigitalProductReviews);

export default router;
