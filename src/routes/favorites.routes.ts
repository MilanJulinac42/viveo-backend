import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { addFavoriteSchema, removeFavoriteSchema } from '../schemas/favorite.schema.js';
import * as favoritesController from '../controllers/favorites.controller.js';

const router = Router();

// All routes require auth (applied at mount point in index.ts)
router.post('/', validate(addFavoriteSchema), favoritesController.addFavorite);
router.delete('/', validate(removeFavoriteSchema), favoritesController.removeFavorite);
router.get('/', favoritesController.listFavorites);
router.get('/check', favoritesController.checkFavorite);

export default router;
