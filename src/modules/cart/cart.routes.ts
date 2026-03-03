import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import {
  getCart,
  addToCart,
  updateCartItemHandler,
  removeFromCart,
  clearCart,
  addExtraToCartItem,
  updateExtraInCartItem,
  removeExtraFromCartItem,
  addIngredientToCart,
  updateIngredientItemHandler,
  removeIngredientFromCart,
} from './cart.controller';
import {
  cartItemSchema,
  updateCartItemSchema,
  cartItemExtraSchema,
  updateCartItemExtraSchema,
  cartIngredientItemSchema,
  updateCartIngredientItemSchema,
} from './cart.schema';

const router = Router();

// Cart
router.get('/', getCart);
router.delete('/', clearCart);

// Cart items
router.post('/items', validate(cartItemSchema), addToCart);
router.patch('/items/:cartItemId', validate(updateCartItemSchema), updateCartItemHandler);
router.delete('/items/:cartItemId', removeFromCart);

// Extras scoped to a specific cart item
router.post('/items/:cartItemId/extras', validate(cartItemExtraSchema), addExtraToCartItem);
router.patch('/items/:cartItemId/extras/:ingredientId', validate(updateCartItemExtraSchema), updateExtraInCartItem);
router.delete('/items/:cartItemId/extras/:ingredientId', removeExtraFromCartItem);

router.post('/ingredients', validate(cartIngredientItemSchema), addIngredientToCart);
router.patch('/ingredients/:itemId', validate(updateCartIngredientItemSchema), updateIngredientItemHandler);
router.delete('/ingredients/:itemId', removeIngredientFromCart);

export default router;
