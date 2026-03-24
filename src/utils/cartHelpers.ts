import { Prisma } from '../generated/prisma/client';
import prisma from '../prisma';
import { NotFoundError, ValidationError } from './errors';

export const getOwnedCartItem = async (userId: number, cartItemId: number) => {
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cart: { userId },
    },
  });
  if (!cartItem) {
    throw new NotFoundError('Item not found in cart');
  }

  return cartItem;
};

export const getOrCreateCart = (tx: { cart: typeof prisma.cart }, userId: number) =>
  tx.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

export const getOwnedIngredientItem = async (userId: number, itemId: number) => {
  const item = await prisma.cartIngredientItem.findFirst({
    where: { id: itemId, cart: { userId } },
  });
  if (!item) throw new NotFoundError('Ingredient item not found in cart');
  return item;
};

export const extrasMatch = (existing: { ingredientId: number; quantity: number }[], incoming: { ingredientId: number; quantity: number }[]) => {
  if (existing.length !== incoming.length) return false;

  const normalize = (extras: { ingredientId: number; quantity: number }[]) => [...extras].sort((a, b) => a.ingredientId - b.ingredientId);

  const a = normalize(existing);
  const b = normalize(incoming);

  return a.every((e, i) => e.ingredientId === b[i].ingredientId && e.quantity === b[i].quantity);
};

export async function assertIngredientAllowed(db: Prisma.TransactionClient, dishId: number, ingredientId: number) {
  const relation = await db.dishIngredient.findUnique({
    where: {
      dishId_ingredientId: {
        dishId,
        ingredientId,
      },
    },
  });

  if (!relation) {
    throw new ValidationError('Ingredient not allowed for this dish');
  }
}
