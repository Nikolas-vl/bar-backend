import prisma from '../../prisma';

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

export const createDish = (data: any) => {
  return prisma.dish.create({
    data,
  });
};
