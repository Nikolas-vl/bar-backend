import prisma from '../../prisma';
import { Prisma } from '../../generated/prisma/client';
import { CreateDish, DishQuery, UpdateDish, AddIngredientToDish, UpdateDishIngredient } from './dish.schema';
import { buildDishWhere } from './dish.utils';
import { NotFoundError } from '../../utils/errors';
import cloudinary from '../../lib/cloudinary/cloudinary';
import { logger } from '../../utils/logger';
import { optimizedUrl } from '../../lib/cloudinary/uploadToCloudinary';
import { Dish } from '../../generated/prisma/client';

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

export const getDishById = async (id: number) => {
  const dish = await prisma.dish.findUnique({
    where: { id },
    include: dishInclude,
  });
  if (!dish) throw new NotFoundError('Dish not found');
  return dish;
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

  return formatDishImage(updatedDish);
};

export const deleteDishImage = async (dishId: number) => {
  const dish = await prisma.dish.findUnique({ where: { id: dishId } });
  if (!dish) throw new NotFoundError('Dish not found');

  if (dish.imageId) {
    await cloudinary.uploader.destroy(dish.imageId).catch(err => logger.warn({ err }, 'Failed to delete Cloudinary image'));
  }

  return prisma.dish.update({
    where: { id: dishId },
    data: { imageUrl: null, imageId: null },
    include: dishInclude,
  });
};

export const formatDishImage = (dish: Dish) => ({
  ...dish,
  imageUrl: dish.imageId ? optimizedUrl(dish.imageId) : null,
});
