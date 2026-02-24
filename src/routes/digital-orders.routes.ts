import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { createDigitalOrderSchema } from '../schemas/digital-order.schema.js';
import { createLimiter } from '../middleware/rateLimiter.js';
import * as digitalOrdersController from '../controllers/digital-orders.controller.js';

const router = Router();

router.post('/', createLimiter, validate(createDigitalOrderSchema), digitalOrdersController.createDigitalOrder);
router.get('/', digitalOrdersController.listDigitalOrders);
router.get('/:id', digitalOrdersController.getDigitalOrderById);
router.get('/:id/download', digitalOrdersController.downloadDigitalProduct);

export default router;
