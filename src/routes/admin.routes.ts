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

// Orders
router.get('/orders', h(getOrders));
router.get('/orders/:id', h(getOrderById));
router.patch('/orders/:id', h(updateOrderStatus));

// Applications
router.get('/applications', h(getApplications));
router.get('/applications/:id', h(getApplicationById));
router.patch('/applications/:id', h(updateApplicationStatus));

// Categories
router.get('/categories', h(getCategories));
router.post('/categories', h(createCategory));
router.patch('/categories/:id', h(updateCategoryById));
router.delete('/categories/:id', h(deleteCategoryById));

export default router;
