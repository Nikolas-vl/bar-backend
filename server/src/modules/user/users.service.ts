import prisma from '../../prisma';
import { Prisma } from '@prisma/client';

export const getUserById = (id: number) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const updateUser = (id: number, data: Prisma.UserUpdateInput) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};
