import prisma from '../../prisma';
import { Prisma } from '../../../generated/prisma/client';
import { CreateIngredient, UpdateIngredient, IngredientQuery } from './ingredient.schema';

export const getAllIngredients = (query?: IngredientQuery) => {
  const { search, sortBy, sortOrder } = query || {};

  const where: Prisma.IngredientWhereInput = {};

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const orderBy: Prisma.IngredientOrderByWithRelationInput = sortBy ? { [sortBy]: sortOrder || 'asc' } : { name: 'asc' };

  return prisma.ingredient.findMany({
    where,
    orderBy,
    include: {
      dishes: {
        include: {
          dish: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      },
    },
  });
};

export const getIngredientById = (id: number) => {
  return prisma.ingredient.findUnique({
    where: { id },
    include: {
      dishes: {
        include: {
          dish: true,
        },
      },
    },
  });
};

export const createIngredient = (data: CreateIngredient) => {
  return prisma.ingredient.create({
    data,
  });
};

export const updateIngredient = (id: number, data: UpdateIngredient) => {
  return prisma.ingredient.update({
    where: { id },
    data,
  });
};

export const deleteIngredient = (id: number) => {
  return prisma.ingredient.delete({
    where: { id },
  });
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
