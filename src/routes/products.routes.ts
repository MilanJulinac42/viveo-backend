import { Router } from 'express';
import * as productsController from '../controllers/products.controller.js';

const router = Router();

router.get('/', productsController.listProducts);
router.get('/categories', productsController.listProductCategories);
router.get('/:slug', productsController.getProductBySlug);

export default router;
