import { Router } from 'express';
import {
  getIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  getDishesWithIngredient,
} from './ingredient.controller';
import { createIngredientSchema, ingredientQuerySchema, updateIngredientSchema } from './ingredient.schema';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();

// Public routes
router.get('/', validate(ingredientQuerySchema, 'query'), getIngredients);
router.get('/:id', getIngredient);
router.get('/:id/dishes', getDishesWithIngredient);

// Admin routes
router.post('/', requireAuth, requireRole('ADMIN'), validate(createIngredientSchema), createIngredient);
router.patch('/:id', requireAuth, requireRole('ADMIN'), validate(updateIngredientSchema), updateIngredient);
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteIngredient);

export default router;
