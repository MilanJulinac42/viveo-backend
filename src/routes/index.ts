import { Router } from 'express';
import type { Request, Response } from 'express';
import authRoutes from './auth.routes.js';
import categoriesRoutes from './categories.routes.js';
import celebritiesRoutes from './celebrities.routes.js';
import ordersRoutes from './orders.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import applicationsRoutes from './applications.routes.js';
import reviewsRoutes from './reviews.routes.js';
import adminRoutes from './admin.routes.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});


router.use('/auth', authRoutes);
router.use('/categories', categoriesRoutes);
router.use('/celebrities', celebritiesRoutes);
router.use('/orders', requireAuth, ordersRoutes);
router.use('/dashboard', requireAuth, requireRole('star'), dashboardRoutes);
router.use('/applications', applicationsRoutes);
router.use('/reviews', requireAuth, reviewsRoutes);
router.use('/admin', requireAuth, requireRole('admin'), adminRoutes);

export default router;
