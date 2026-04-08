import prisma from '../../prisma';
import { Prisma } from '../../generated/prisma/client';
import { CreateDish, DishQuery, UpdateDish, AddIngredientToDish, UpdateDishIngredient } from './dish.schema';
import { buildDishWhere } from './dish.utils';
import { NotFoundError } from '../../utils/errors';
import cloudinary from '../../lib/cloudinary/cloudinary';
import { logger } from '../../utils/logger';
import { optimizedUrl } from '../../lib/cloudinary/uploadToCloudinary';
import { Dish } from '../../generated/prisma/client';
import { withCache, cacheInvalidatePattern } from '../../lib/redis/cache';
import { CacheKeys, CacheTTL } from '../../lib/redis/cache.keys';

function queryHash(query?: DishQuery): string {
  if (!query || Object.keys(query).length === 0) return 'default';
  return Buffer.from(JSON.stringify(query)).toString('base64url');
}

const dishInclude = {
  ingredients: {
    include: {
      ingredient: true,
    },
  },
} satisfies Prisma.DishInclude;

export const getAllDishes = (query?: DishQuery) =>
  withCache(
    CacheKeys.dishes.list(queryHash(query)),
    () =>
      prisma.dish.findMany({
        where: buildDishWhere(query),
        orderBy: query?.sortBy ? { [query.sortBy]: query.sortOrder ?? 'asc' } : { name: 'asc' },
        include: { ingredients: { include: { ingredient: true } } },
      }),
    { ttl: CacheTTL.MEDIUM },
  );

export const getDishById = (id: number) =>
  withCache(
    CacheKeys.dishes.detail(id),
    async () => {
      const dish = await prisma.dish.findUnique({ where: { id }, include: dishInclude });
      if (!dish) throw new NotFoundError('Dish not found');
      return dish;
    },
    { ttl: CacheTTL.MEDIUM },
  );

export const createDish = async (data: CreateDish) => {
  const { ingredients, ...dishData } = data;
  const dish = await prisma.dish.create({
    data: {
      ...dishData,
      ingredients: ingredients
        ? {
            create: ingredients,
          }
        : undefined,
    },
    include: dishInclude,
  });
  await cacheInvalidatePattern(CacheKeys.dishes.all);
  return dish;
};

export const updateDish = async (id: number, data: UpdateDish) => {
  const { ingredients, ...dishData } = data;

  if (ingredients === undefined) {
    const dish = await prisma.dish.update({
      where: { id },
      data: dishData,
      include: dishInclude,
    });
    await cacheInvalidatePattern(CacheKeys.dishes.all);
    return dish;
  }
  const dish = await prisma.dish.update({
    where: { id },
    data: {
      ...dishData,
      ...(ingredients && {
        ingredients: {
          deleteMany: {},
          create: ingredients,
        },
      }),
    },
    include: dishInclude,
  });
  await cacheInvalidatePattern(CacheKeys.dishes.all);
  return dish;
};

export const deleteDish = async (id: number) => {
  const dish = await prisma.dish.delete({
    where: { id },
  });
  await cacheInvalidatePattern(CacheKeys.dishes.all);
  return dish;
};

export const addIngredientToDish = async (dishId: number, data: AddIngredientToDish) => {
  const result = await prisma.dishIngredient.create({
    data: {
      dishId,
      ingredientId: data.ingredientId,
      quantity: data.quantity,
      optional: data.optional,
    },
    include: {
      ingredient: true,
      dish: { select: { id: true, name: true } },
    },
  });
  await cacheInvalidatePattern(CacheKeys.dishes.all);
  return result;
};

export const removeIngredientFromDish = async (dishId: number, ingredientId: number) => {
  const result = await prisma.dishIngredient.delete({
    where: { dishId_ingredientId: { dishId, ingredientId } },
  });
  await cacheInvalidatePattern(CacheKeys.dishes.all);
  return result;
};

export const updateDishIngredient = async (dishId: number, ingredientId: number, data: UpdateDishIngredient) => {
  const result = await prisma.dishIngredient.update({
    where: { dishId_ingredientId: { dishId, ingredientId } },
    data,
    include: { ingredient: true },
  });
  await cacheInvalidatePattern(CacheKeys.dishes.all);
  return result;
};

export const manageDishImage = async (dishId: number, imageUrl: string, imageId: string) => {
  const dish = await prisma.dish.findUnique({ where: { id: dishId } });
  if (!dish) throw new NotFoundError('Dish not found');

  if (dish.imageId) {
    await cloudinary.uploader.destroy(dish.imageId).catch(err => logger.warn({ err }, 'Failed to delete old Cloudinary image'));
  }

  const updatedDish = await prisma.dish.update({
    where: { id: dishId },
    data: { imageUrl, imageId },
    include: dishInclude,
  });

  await cacheInvalidatePattern(CacheKeys.dishes.all);
  return formatDishImage(updatedDish);
};

export const deleteDishImage = async (dishId: number) => {
  const dish = await prisma.dish.findUnique({ where: { id: dishId } });
  if (!dish) throw new NotFoundError('Dish not found');

  if (dish.imageId) {
    await cloudinary.uploader.destroy(dish.imageId).catch(err => logger.warn({ err }, 'Failed to delete Cloudinary image'));
  }

  const updated = await prisma.dish.update({
    where: { id: dishId },
    data: { imageUrl: null, imageId: null },
    include: dishInclude,
  });

  await cacheInvalidatePattern(CacheKeys.dishes.all);
  return updated;
};

export const formatDishImage = (dish: Dish) => ({
  ...dish,
  imageUrl: dish.imageId ? optimizedUrl(dish.imageId) : null,
});
