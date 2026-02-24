import { Router } from 'express';
import * as searchController from '../controllers/search.controller.js';

const router = Router();

// Public search endpoint
router.get('/', searchController.globalSearch);

export default router;
