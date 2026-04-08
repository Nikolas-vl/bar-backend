import prisma from '../../prisma';
import { Prisma } from '../../generated/prisma/client';
import { CreateIngredient, UpdateIngredient, IngredientQuery } from './ingredient.schema';
import { NotFoundError } from '../../utils/errors';
import { withCache, cacheInvalidatePattern, cacheDelete } from '../../lib/redis/cache';
import { CacheKeys, CacheTTL } from '../../lib/redis/cache.keys';

export const getAllIngredients = (query?: IngredientQuery) => {
  const { search, sortBy, sortOrder } = query || {};

  const where: Prisma.IngredientWhereInput = {};
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const orderBy: Prisma.IngredientOrderByWithRelationInput = sortBy ? { [sortBy]: sortOrder || 'asc' } : { name: 'asc' };

  // Only cache the default (no search/sort) list — filtered queries bypass cache to avoid stale results
  if (!search && !sortBy) {
    return withCache(
      CacheKeys.ingredients.list(),
      () =>
        prisma.ingredient.findMany({
          where,
          orderBy,
          include: { dishes: { include: { dish: { select: { id: true, name: true, price: true } } } } },
        }),
      { ttl: CacheTTL.LONG },
    );
  }

  return prisma.ingredient.findMany({
    where,
    orderBy,
    include: { dishes: { include: { dish: { select: { id: true, name: true, price: true } } } } },
  });
};

export const getIngredientById = async (id: number) => {
  return withCache(
    CacheKeys.ingredients.detail(id),
    async () => {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id },
        include: { dishes: { include: { dish: true } } },
      });
      if (!ingredient) throw new NotFoundError('Ingredient not found');
      return ingredient;
    },
    { ttl: CacheTTL.LONG },
  );
};

export const createIngredient = async (data: CreateIngredient) => {
  const ingredient = await prisma.ingredient.create({ data });
  await cacheInvalidatePattern(CacheKeys.ingredients.all);
  return ingredient;
};

export const updateIngredient = async (id: number, data: UpdateIngredient) => {
  const ingredient = await prisma.ingredient.update({ where: { id }, data });
  await cacheDelete(CacheKeys.ingredients.detail(id));
  await cacheInvalidatePattern(CacheKeys.ingredients.all);
  return ingredient;
};

export const deleteIngredient = async (id: number) => {
  const result = await prisma.ingredient.delete({ where: { id } });
  await cacheDelete(CacheKeys.ingredients.detail(id));
  await cacheInvalidatePattern(CacheKeys.ingredients.all);
  return result;
};

export const getDishesByIngredient = async (ingredientId: number) => {
  const dishIngredients = await prisma.dishIngredient.findMany({
    where: { ingredientId },
    include: {
      dish: {
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      },
    },
  });

  return dishIngredients.map(di => di.dish);
};
