import { Prisma } from '../../../generated/prisma/client';
import prisma from '../../prisma';
import { NotFoundError } from '../../utils/errors';

export const createAddress = async (userId: number, data: Prisma.AddressCreateInput) => {
  const existingCount = await prisma.address.count({ where: { userId } });

  return prisma.address.create({
    data: {
      ...data,
      isDefault: existingCount === 0,
      user: { connect: { id: userId } },
    },
  });
};

export const getAddresses = (userId: number) =>
  prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
  });

export const getAddressById = (id: number) => prisma.address.findUnique({ where: { id } });

export const setDefaultAddress = async (id: number, userId: number) => {
  const address = await prisma.address.findFirst({ where: { id, userId } });
  if (!address) throw new NotFoundError('Address not found');

  return prisma.$transaction([
    prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);
};

export const updateAddress = (id: number, data: Prisma.AddressUpdateInput) => prisma.address.update({ where: { id }, data });

export const deleteAddress = async (id: number, userId: number) => {
  const address = await prisma.address.findFirst({ where: { id, userId } });
  if (!address) throw new NotFoundError('Address not found');

  return prisma.$transaction(async tx => {
    await tx.address.delete({ where: { id } });

    if (address.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId },
        orderBy: { id: 'desc' },
      });
      if (next) {
        await tx.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  });
};
