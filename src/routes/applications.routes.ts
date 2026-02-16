import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { createLimiter } from '../middleware/rateLimiter.js';
import { submitApplicationSchema } from '../schemas/application.schema.js';
import * as applicationsController from '../controllers/applications.controller.js';

const router = Router();

router.post('/', createLimiter, validate(submitApplicationSchema), applicationsController.submitApplication);

export default router;
