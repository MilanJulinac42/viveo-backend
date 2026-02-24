import { Router } from 'express';
import * as digitalProductsController from '../controllers/digital-products.controller.js';

const router = Router();

router.get('/', digitalProductsController.listDigitalProducts);
router.get('/categories', digitalProductsController.listDigitalProductCategories);
router.get('/:slug', digitalProductsController.getDigitalProductBySlug);

export default router;
