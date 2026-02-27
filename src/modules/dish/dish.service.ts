import prisma from '../../prisma';
import { Prisma } from '../../../generated/prisma/client';
import { CreateDish, DishQuery, UpdateDish, AddIngredientToDish, UpdateDishIngredient } from './dish.schema';
import { buildDishWhere } from './dish.utils';

const dishInclude = {
  ingredients: {
    include: {
      ingredient: true,
    },
  },
} satisfies Prisma.DishInclude;

export const getAllDishes = (query?: DishQuery) => {
  return prisma.dish.findMany({
    where: buildDishWhere(query),
    orderBy: query?.sortBy ? { [query.sortBy]: query.sortOrder ?? 'asc' } : { name: 'asc' },
    include: dishInclude,
  });
};

export const getDishById = (id: number) => {
  return prisma.dish.findUnique({
    where: { id },
    include: dishInclude,
  });
};

export const createDish = (data: CreateDish) => {
  const { ingredients, ...dishData } = data;

  return prisma.dish.create({
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
};

export const updateDish = async (id: number, data: UpdateDish) => {
  const { ingredients, ...dishData } = data;

  if (ingredients === undefined) {
    return prisma.dish.update({
      where: { id },
      data: dishData,
      include: dishInclude,
    });
  }
  return prisma.dish.update({
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
};

export const deleteDish = (id: number) => {
  return prisma.dish.delete({
    where: { id },
  });
};

export const addIngredientToDish = (dishId: number, data: AddIngredientToDish) => {
  return prisma.dishIngredient.create({
    data: {
      dishId,
      ingredientId: data.ingredientId,
      quantity: data.quantity,
      optional: data.optional,
    },
    include: {
      ingredient: true,
      dish: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

export const removeIngredientFromDish = (dishId: number, ingredientId: number) => {
  return prisma.dishIngredient.delete({
    where: {
      dishId_ingredientId: {
        dishId,
        ingredientId,
      },
    },
  });
};

export const updateDishIngredient = (dishId: number, ingredientId: number, data: UpdateDishIngredient) => {
  return prisma.dishIngredient.update({
    where: {
      dishId_ingredientId: {
        dishId,
        ingredientId,
      },
    },
    data,
    include: {
      ingredient: true,
    },
  });
};
