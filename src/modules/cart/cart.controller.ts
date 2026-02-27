import { Request, Response } from 'express';
import {
  getCartByUserId,
  addItemToCart,
  updateCartItem,
  removeItemFromCart,
  clearCart as clearCartService,
  addCartItemExtra,
  updateCartItemExtra,
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

  try {
    const cartItem = await addItemToCart(userId, req.body);
    res.status(201).json(cartItem);
  } catch (error) {
    if (error instanceof Error && error.message === 'Dish not found') {
      return res.status(404).json({ message: error.message });
    }
    throw error;
  }
};

export const updateCartItemHandler = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const cartItemId = Number(req.params.cartItemId);

  req.log.info({ userId, cartItemId, body: req.body }, 'Updating cart item');

  try {
    const updated = await updateCartItem(userId, cartItemId, req.body);
    res.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'Item not found in cart') {
      return res.status(404).json({ message: error.message });
    }
    throw error;
  }
};

export const removeFromCart = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const cartItemId = Number(req.params.cartItemId);

  req.log.info({ userId, cartItemId }, 'Removing item from cart');

  try {
    await removeItemFromCart(userId, cartItemId);
    res.status(204).end();
  } catch (error) {
    if (error instanceof Error && error.message === 'Item not found in cart') {
      return res.status(404).json({ message: error.message });
    }
    throw error;
  }
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

  try {
    const extra = await addCartItemExtra(userId, cartItemId, req.body);
    res.status(201).json(extra);
  } catch (error) {
    if (error instanceof Error && error.message === 'Item not found in cart') {
      return res.status(404).json({ message: error.message });
    }
    if (error instanceof Error && error.message === 'Ingredient not found') {
      return res.status(404).json({ message: error.message });
    }
    throw error;
  }
};

export const updateExtraInCartItem = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const cartItemId = Number(req.params.cartItemId);
  const ingredientId = Number(req.params.ingredientId);

  req.log.info({ userId, cartItemId, ingredientId, body: req.body }, 'Updating extra in cart item');

  try {
    const extra = await updateCartItemExtra(userId, cartItemId, ingredientId, req.body);
    res.json(extra);
  } catch (error) {
    if (error instanceof Error && error.message === 'Extra not found in cart item') {
      return res.status(404).json({ message: error.message });
    }
    if (error instanceof Error && error.message === 'Item not found in cart') {
      return res.status(404).json({ message: error.message });
    }
    throw error;
  }
};

export const removeExtraFromCartItem = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const cartItemId = Number(req.params.cartItemId);
  const ingredientId = Number(req.params.ingredientId);

  req.log.info({ userId, cartItemId, ingredientId }, 'Removing extra from cart item');

  await removeCartItemExtra(userId, cartItemId, ingredientId);
  res.status(204).end();
};
