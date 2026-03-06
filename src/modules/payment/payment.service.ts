import prisma from '../../prisma';
import { NotFoundError } from '../../utils/errors';
import { CreatePaymentInput, UpdatePaymentInput } from './payment.schema';

export const createPaymentMethod = async (userId: number, data: CreatePaymentInput) => {
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
  const payment = await prisma.paymentMethod.findFirst({
    where: { id, userId },
  });
  if (!payment) throw new NotFoundError('Payment method not found');
  return payment;
};

export const updatePaymentMethod = async (id: number, userId: number, data: UpdatePaymentInput) => {
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
