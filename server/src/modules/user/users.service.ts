import prisma from '../../prisma';

export const getUserById = (id: number) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const updateUser = (id: number, data: any) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};
