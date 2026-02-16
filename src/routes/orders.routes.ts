import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { createLimiter } from '../middleware/rateLimiter.js';
import { createOrderSchema } from '../schemas/order.schema.js';
import * as ordersController from '../controllers/orders.controller.js';

const router = Router();

router.post('/', createLimiter, validate(createOrderSchema), ordersController.createOrder);
router.get('/', ordersController.listOrders);
router.get('/:id', ordersController.getOrderById);

export default router;
