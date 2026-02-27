import { prisma } from '../../prisma';
import { CartItemInput, UpdateCartItemInput, CartItemExtraInput, UpdateCartItemExtraInput } from './cart.schema';

const cartInclude = {
  items: {
    include: {
      dish: true,
      extras: {
        include: {
          ingredient: true,
        },
      },
    },
  },
};

const cartItemInclude = {
  dish: true,
  extras: {
    include: {
      ingredient: true,
    },
  },
};

// --- Helpers ---

const getOwnedCartItem = async (userId: number, cartItemId: number) => {
  const cart = await getCartByUserId(userId);

  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cartId: cart.id },
  });

  if (!cartItem) {
    throw new Error('Item not found in cart');
  }

  return cartItem;
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
    throw new Error('Dish not found');
  }

  const cart = await getCartByUserId(userId);

  const candidates = await prisma.cartItem.findMany({
    where: { cartId: cart.id, dishId: input.dishId, note: input.note ?? null },
    include: { extras: true },
  });

  const match = candidates.find(c => extrasMatch(c.extras, input.extras));

  if (match) {
    return prisma.cartItem.update({
      where: { id: match.id },
      data: { quantity: match.quantity + input.quantity },
      include: cartItemInclude,
    });
  }

  return prisma.cartItem.create({
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
};

export const updateCartItem = async (userId: number, cartItemId: number, input: UpdateCartItemInput) => {
  const cartItem = await getOwnedCartItem(userId, cartItemId);

  if (input.quantity === 0) {
    await prisma.cartItem.delete({ where: { id: cartItem.id } });
    return null;
  }

  return prisma.cartItem.update({
    where: { id: cartItem.id },
    data: { quantity: input.quantity },
    include: cartItemInclude,
  });
};

export const removeItemFromCart = async (userId: number, cartItemId: number) => {
  const cartItem = await getOwnedCartItem(userId, cartItemId);

  return prisma.cartItem.delete({ where: { id: cartItem.id } });
};

export const clearCart = async (userId: number) => {
  const cart = await getCartByUserId(userId);

  return prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
};

// --- Extras (post-creation editing) ---

export const addCartItemExtra = async (userId: number, cartItemId: number, input: CartItemExtraInput) => {
  const ingredient = await prisma.ingredient.findUnique({ where: { id: input.ingredientId } });
  if (!ingredient) {
    throw new Error('Ingredient not found');
  }

  const cartItem = await getOwnedCartItem(userId, cartItemId);

  const existingExtra = await prisma.cartItemExtra.findFirst({
    where: { cartItemId: cartItem.id, ingredientId: input.ingredientId },
  });

  if (existingExtra) {
    return prisma.cartItemExtra.update({
      where: { id: existingExtra.id },
      data: { quantity: existingExtra.quantity + input.quantity },
      include: { ingredient: true },
    });
  }

  return prisma.cartItemExtra.create({
    data: {
      cartItemId: cartItem.id,
      ingredientId: input.ingredientId,
      quantity: input.quantity,
    },
    include: { ingredient: true },
  });
};

export const updateCartItemExtra = async (userId: number, cartItemId: number, ingredientId: number, input: UpdateCartItemExtraInput) => {
  const cartItem = await getOwnedCartItem(userId, cartItemId);

  const extra = await prisma.cartItemExtra.findFirst({
    where: { cartItemId: cartItem.id, ingredientId },
  });

  if (!extra) {
    throw new Error('Extra not found in cart item');
  }

  if (input.quantity === 0) {
    await prisma.cartItemExtra.delete({ where: { id: extra.id } });
    return null;
  }

  return prisma.cartItemExtra.update({
    where: { id: extra.id },
    data: { quantity: input.quantity },
    include: { ingredient: true },
  });
};

export const removeCartItemExtra = async (userId: number, cartItemId: number, ingredientId: number) => {
  const cartItem = await getOwnedCartItem(userId, cartItemId);

  return prisma.cartItemExtra.deleteMany({
    where: { cartItemId: cartItem.id, ingredientId },
  });
};
