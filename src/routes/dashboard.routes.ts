import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { updateRequestStatusSchema, updateProfileSchema, updateAvailabilitySchema } from '../schemas/dashboard.schema.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { videoUpload } from '../middleware/upload.js';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/requests', dashboardController.getRequests);
router.patch('/requests/:id', validate(updateRequestStatusSchema), dashboardController.updateRequestStatus);
router.post('/requests/:id/video', uploadLimiter, videoUpload, dashboardController.uploadVideo);
router.get('/earnings', dashboardController.getEarnings);
router.get('/availability', dashboardController.getAvailability);
router.patch('/availability', validate(updateAvailabilitySchema), dashboardController.updateAvailability);
router.patch('/profile', validate(updateProfileSchema), dashboardController.updateProfile);

export default router;
