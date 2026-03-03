import { prisma } from '../../prisma';

import {
  CartItemInput,
  UpdateCartItemInput,
  CartIngredientItemInput,
  UpdateCartIngredientItemInput,
  CartItemExtraInput,
  UpdateCartItemExtraInput,
} from './cart.schema';
import { NotFoundError } from '../../utils/errors';

const cartInclude = {
  items: {
    include: {
      dish: true,
      extras: { include: { ingredient: true } },
    },
  },
  ingredientItems: {
    include: { ingredient: true },
  },
};

const cartItemInclude = {
  dish: true,
  extras: { include: { ingredient: true } },
};

const ingredientItemInclude = {
  ingredient: true,
};

// --- Helpers ---

const getOwnedCartItem = async (userId: number, cartItemId: number) => {
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

const getOrCreateCart = (tx: { cart: typeof prisma.cart }, userId: number) =>
  tx.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

const getOwnedIngredientItem = async (userId: number, itemId: number) => {
  const item = await prisma.cartIngredientItem.findFirst({
    where: { id: itemId, cart: { userId } },
  });
  if (!item) throw new NotFoundError('Ingredient item not found in cart');
  return item;
};

const extrasMatch = (existing: { ingredientId: number; quantity: number }[], incoming: { ingredientId: number; quantity: number }[]) => {
  if (existing.length !== incoming.length) return false;

  const normalize = (extras: { ingredientId: number; quantity: number }[]) => [...extras].sort((a, b) => a.ingredientId - b.ingredientId);

  const a = normalize(existing);
  const b = normalize(incoming);

  return a.every((e, i) => e.ingredientId === b[i].ingredientId && e.quantity === b[i].quantity);
};

// --- Cart ---

export const getCartByUserId = (userId: number) => {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: cartInclude,
  });
};

export const addItemToCart = async (userId: number, input: CartItemInput) => {
  const dish = await prisma.dish.findUnique({ where: { id: input.dishId } });
  if (!dish) {
    throw new NotFoundError('Dish not found');
  }

  return prisma.$transaction(async tx => {
    // Ensure cart exists inside the transaction
    const cart = await getOrCreateCart(tx, userId);

    const candidates = await tx.cartItem.findMany({
      where: { cartId: cart.id, dishId: input.dishId, note: input.note ?? null },
      include: { extras: true },
    });

    const match = candidates.find(c => extrasMatch(c.extras, input.extras));

    if (match) {
      return tx.cartItem.update({
        where: { id: match.id },
        data: { quantity: match.quantity + input.quantity },
        include: cartItemInclude,
      });
    }

    return tx.cartItem.create({
      data: {
        cartId: cart.id,
        dishId: input.dishId,
        quantity: input.quantity,
        note: input.note,
        extras: {
          create: input.extras,
        },
      },
      include: cartItemInclude,
    });
  });
};

export const updateCartItem = async (userId: number, cartItemId: number, input: UpdateCartItemInput) => {
  const cartItem = await getOwnedCartItem(userId, cartItemId);

  if (input.quantity === 0) {
    await prisma.cartItem.delete({ where: { id: cartItem.id } });
    return null;
  }

  return prisma.cartItem.update({
    where: { id: cartItem.id },
    data: {
      ...(input.quantity !== undefined && { quantity: input.quantity }),
      ...(input.note !== undefined && { note: input.note }),
    },
    include: cartItemInclude,
  });
};

export const removeItemFromCart = async (userId: number, cartItemId: number) => {
  const cartItem = await getOwnedCartItem(userId, cartItemId);

  return prisma.cartItem.delete({ where: { id: cartItem.id } });
};

export const clearCart = async (userId: number) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return;

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
    prisma.cartIngredientItem.deleteMany({ where: { cartId: cart.id } }),
  ]);
};

// --- Cart Item Extras ---

export const addCartItemExtra = async (userId: number, cartItemId: number, input: CartItemExtraInput) => {
  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cart: { userId } },
  });
  if (!cartItem) throw new NotFoundError('Item not found in cart');

  return prisma.$transaction(async tx => {
    const existing = await tx.cartItemExtra.findFirst({
      where: {
        cartItemId: cartItem.id,
        ingredientId: input.ingredientId,
        note: input.note ?? null, // ← same ingredient + same note = merge
      },
    });

    if (existing) {
      return tx.cartItemExtra.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + input.quantity },
        include: { ingredient: true },
      });
    }

    return tx.cartItemExtra.create({
      data: { cartItemId: cartItem.id, ...input },
      include: { ingredient: true },
    });
  });
};

export const updateCartItemExtra = async (userId: number, cartItemId: number, ingredientId: number, input: UpdateCartItemExtraInput) => {
  const cartItem = await getOwnedCartItem(userId, cartItemId);

  const extra = await prisma.cartItemExtra.findFirst({
    where: { cartItemId: cartItem.id, ingredientId },
  });
  if (!extra) throw new NotFoundError('Extra not found in cart item');

  if (input.quantity === 0) {
    await prisma.cartItemExtra.delete({ where: { id: extra.id } });
    return null;
  }

  return prisma.cartItemExtra.update({
    where: { id: extra.id },
    data: {
      ...(input.quantity !== undefined && { quantity: input.quantity }),
      ...(input.note !== undefined && { note: input.note }), // ← add
    },
    include: { ingredient: true },
  });
};

export const removeCartItemExtra = async (userId: number, cartItemId: number, ingredientId: number) => {
  const cartItem = await getOwnedCartItem(userId, cartItemId);

  return prisma.cartItemExtra.deleteMany({
    where: { cartItemId: cartItem.id, ingredientId },
  });
};

// --- Ingredient items ---

export const addIngredientItemToCart = async (userId: number, input: CartIngredientItemInput) => {
  const ingredient = await prisma.ingredient.findUnique({ where: { id: input.ingredientId } });
  if (!ingredient) throw new NotFoundError('Ingredient not found');

  return prisma.$transaction(async tx => {
    const cart = await getOrCreateCart(tx, userId);

    // merge if same ingredient + same note already in cart
    const existing = await tx.cartIngredientItem.findFirst({
      where: { cartId: cart.id, ingredientId: input.ingredientId, note: input.note ?? null },
    });

    if (existing) {
      return tx.cartIngredientItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + input.quantity },
        include: ingredientItemInclude,
      });
    }

    return tx.cartIngredientItem.create({
      data: { cartId: cart.id, ...input },
      include: ingredientItemInclude,
    });
  });
};

export const updateIngredientItem = async (userId: number, itemId: number, input: UpdateCartIngredientItemInput) => {
  const item = await getOwnedIngredientItem(userId, itemId);

  if (input.quantity === 0) {
    await prisma.cartIngredientItem.delete({ where: { id: item.id } });
    return null;
  }

  return prisma.cartIngredientItem.update({
    where: { id: item.id },
    data: {
      ...(input.quantity !== undefined && { quantity: input.quantity }),
      ...(input.note !== undefined && { note: input.note }),
    },
    include: ingredientItemInclude,
  });
};

export const removeIngredientItem = async (userId: number, itemId: number) => {
  const item = await getOwnedIngredientItem(userId, itemId);

  return prisma.cartIngredientItem.delete({ where: { id: item.id } });
};
