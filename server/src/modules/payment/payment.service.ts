import { Prisma } from '../../../generated/prisma/client';
import prisma from '../../prisma';

export const createPaymentMethod = async (
  userId: number,
  data: {
    cardType: string;
    last4: string;
    expMonth: number;
    expYear: number;
  },
) => {
  return prisma.paymentMethod.create({
    data: {
      ...data,
      userId,
    },
  });
};

export const getUserPaymentMethods = async (userId: number) => {
  return prisma.paymentMethod.findMany({
    where: { userId },
  });
};

export const getPaymentMethodById = async (id: number, userId: number) => {
  return prisma.paymentMethod.findFirst({
    where: { id, userId },
  });
};

export const updatePaymentMethod = async (id: number, userId: number, data: Prisma.PaymentMethodUpdateInput) => {
  return prisma.paymentMethod.updateMany({
    where: { id, userId },
    data,
  });
};

export const deletePaymentMethod = async (id: number, userId: number) => {
  return prisma.paymentMethod.deleteMany({
    where: { id, userId },
  });
};
