import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { createMerchOrderSchema } from '../schemas/merch-order.schema.js';
import { createLimiter } from '../middleware/rateLimiter.js';
import * as merchOrdersController from '../controllers/merch-orders.controller.js';

const router = Router();

router.post('/', createLimiter, validate(createMerchOrderSchema), merchOrdersController.createMerchOrder);
router.get('/', merchOrdersController.listMerchOrders);
router.get('/:id', merchOrdersController.getMerchOrderById);

export default router;
