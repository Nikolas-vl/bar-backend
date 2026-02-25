import prisma from '../../prisma';
import { Prisma } from '@prisma/client';

export const getAllDishes = () => {
  return prisma.dish.findMany({
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  });
};

export const createDish = (data: Prisma.DishCreateInput) => {
  return prisma.dish.create({
    data,
  });
};
