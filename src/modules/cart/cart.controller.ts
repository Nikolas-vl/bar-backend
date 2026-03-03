import { Request, Response } from 'express';
import {
  getCartByUserId,
  addItemToCart,
  updateCartItem,
  removeItemFromCart,
  clearCart as clearCartService,
  addIngredientItemToCart,
  updateIngredientItem,
  removeIngredientItem,
  updateCartItemExtra,
  addCartItemExtra,
  removeCartItemExtra,
} from './cart.service';

export const getCart = async (req: Request, res: Response) => {
  const userId = req.userId!;
  req.log.info({ userId }, 'Fetching cart');

  const cart = await getCartByUserId(userId);
  res.json(cart);
};

export const addToCart = async (req: Request, res: Response) => {
  const userId = req.userId!;
  req.log.info({ userId, body: req.body }, 'Adding item to cart');

  const cartItem = await addItemToCart(userId, req.body);
  res.status(201).json(cartItem);
};

export const updateCartItemHandler = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const cartItemId = Number(req.params.cartItemId);

  req.log.info({ userId, cartItemId, body: req.body }, 'Updating cart item');

  const updated = await updateCartItem(userId, cartItemId, req.body);
  if (!updated) {
    return res.status(204).end();
  }
  res.json(updated);
};

export const removeFromCart = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const cartItemId = Number(req.params.cartItemId);

  req.log.info({ userId, cartItemId }, 'Removing item from cart');

  await removeItemFromCart(userId, cartItemId);
  res.status(204).end();
};

export const clearCart = async (req: Request, res: Response) => {
  const userId = req.userId!;
  req.log.info({ userId }, 'Clearing cart');

  await clearCartService(userId);
  res.status(204).end();
};

// --- Extras ---

export const addExtraToCartItem = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const cartItemId = Number(req.params.cartItemId);

  req.log.info({ userId, cartItemId, body: req.body }, 'Adding extra to cart item');

  const extra = await addCartItemExtra(userId, cartItemId, req.body);
  res.status(201).json(extra);
};

export const updateExtraInCartItem = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const cartItemId = Number(req.params.cartItemId);
  const ingredientId = Number(req.params.ingredientId);

  req.log.info({ userId, cartItemId, ingredientId, body: req.body }, 'Updating extra in cart item');

  const extra = await updateCartItemExtra(userId, cartItemId, ingredientId, req.body);
  if (!extra) {
    return res.status(204).end();
  }
  res.json(extra);
};

export const removeExtraFromCartItem = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const cartItemId = Number(req.params.cartItemId);
  const ingredientId = Number(req.params.ingredientId);

  req.log.info({ userId, cartItemId, ingredientId }, 'Removing extra from cart item');

  await removeCartItemExtra(userId, cartItemId, ingredientId);
  res.status(204).end();
};

export const addIngredientToCart = async (req: Request, res: Response) => {
  const userId = req.userId!;
  req.log.info({ userId, body: req.body }, 'Adding ingredient item to cart');

  const item = await addIngredientItemToCart(userId, req.body);
  res.status(201).json(item);
};

export const updateIngredientItemHandler = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const itemId = Number(req.params.itemId);
  req.log.info({ userId, itemId, body: req.body }, 'Updating ingredient item');

  const item = await updateIngredientItem(userId, itemId, req.body);
  if (!item) return res.status(204).end();
  res.json(item);
};

export const removeIngredientFromCart = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const itemId = Number(req.params.itemId);
  req.log.info({ userId, itemId }, 'Removing ingredient item from cart');

  await removeIngredientItem(userId, itemId);
  res.status(204).end();
};
