import { Prisma } from '../../../generated/prisma/client';
import { DishQuery } from './dish.schema';

export const buildDishWhere = (query?: DishQuery): Prisma.DishWhereInput => {
  if (!query) return {};

  const { search, category, minPrice, maxPrice, minCalories, maxCalories, isAvailable } = query;

  return {
    ...(search && {
      OR: [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }],
    }),

    ...(category && { category }),

    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        }
      : {}),

    ...(minCalories !== undefined || maxCalories !== undefined
      ? {
          calories: {
            ...(minCalories !== undefined && { gte: minCalories }),
            ...(maxCalories !== undefined && { lte: maxCalories }),
          },
        }
      : {}),

    ...(isAvailable !== undefined && { isAvailable }),
  };
};
