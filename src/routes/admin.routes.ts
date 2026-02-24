import { Router } from 'express';
import {
  getStats,
  getUsers,
  getUserById,
  updateUser,
  getCelebrities,
  getCelebrityById,
  updateCelebrity,
  deleteCelebrity,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  getCategories,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
} from '../controllers/admin.controller.js';
import {
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMerchOrders,
  getMerchOrderById,
  updateMerchOrderStatus,
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '../controllers/admin-merch.controller.js';
import {
  getDigitalProducts,
  getDigitalProductById,
  updateDigitalProduct,
  deleteDigitalProduct,
  getDigitalOrders,
  getDigitalOrderById,
  updateDigitalOrderStatus,
  getDigitalProductCategories,
  createDigitalProductCategory,
  updateDigitalProductCategory,
  deleteDigitalProductCategory,
} from '../controllers/admin-digital.controller.js';
import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (req: AuthenticatedRequest, res: Response) => any;

// Helper: cast handler for Express 5 type compat
const h = (fn: AnyHandler) =>
  (req: Request, res: Response) => {
    void fn(req as AuthenticatedRequest, res);
  };

// Dashboard
router.get('/stats', h(getStats));

// Users
router.get('/users', h(getUsers));
router.get('/users/:id', h(getUserById));
router.patch('/users/:id', h(updateUser));

// Celebrities
router.get('/celebrities', h(getCelebrities));
router.get('/celebrities/:id', h(getCelebrityById));
router.patch('/celebrities/:id', h(updateCelebrity));
router.delete('/celebrities/:id', h(deleteCelebrity));

// Video Orders
router.get('/orders', h(getOrders));
router.get('/orders/:id', h(getOrderById));
router.patch('/orders/:id', h(updateOrderStatus));

// Applications
router.get('/applications', h(getApplications));
router.get('/applications/:id', h(getApplicationById));
router.patch('/applications/:id', h(updateApplicationStatus));

// Celebrity Categories
router.get('/categories', h(getCategories));
router.post('/categories', h(createCategory));
router.patch('/categories/:id', h(updateCategoryById));
router.delete('/categories/:id', h(deleteCategoryById));

// Products (merch)
router.get('/products', h(getProducts));
router.get('/products/:id', h(getProductById));
router.patch('/products/:id', h(updateProduct));
router.delete('/products/:id', h(deleteProduct));

// Merch Orders
router.get('/merch-orders', h(getMerchOrders));
router.get('/merch-orders/:id', h(getMerchOrderById));
router.patch('/merch-orders/:id', h(updateMerchOrderStatus));

// Product Categories
router.get('/product-categories', h(getProductCategories));
router.post('/product-categories', h(createProductCategory));
router.patch('/product-categories/:id', h(updateProductCategory));
router.delete('/product-categories/:id', h(deleteProductCategory));

// Digital Products
router.get('/digital-products', h(getDigitalProducts));
router.get('/digital-products/:id', h(getDigitalProductById));
router.patch('/digital-products/:id', h(updateDigitalProduct));
router.delete('/digital-products/:id', h(deleteDigitalProduct));

// Digital Orders
router.get('/digital-orders', h(getDigitalOrders));
router.get('/digital-orders/:id', h(getDigitalOrderById));
router.patch('/digital-orders/:id', h(updateDigitalOrderStatus));

// Digital Product Categories
router.get('/digital-product-categories', h(getDigitalProductCategories));
router.post('/digital-product-categories', h(createDigitalProductCategory));
router.patch('/digital-product-categories/:id', h(updateDigitalProductCategory));
router.delete('/digital-product-categories/:id', h(deleteDigitalProductCategory));

export default router;
