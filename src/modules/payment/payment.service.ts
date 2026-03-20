import prisma from '../../prisma';
import { NotFoundError } from '../../utils/errors';
import { CreatePaymentInput, UpdatePaymentInput } from './payment.schema';

export const createPaymentMethod = async (userId: number, data: CreatePaymentInput) => {
  // First card a user adds becomes their default automatically
  const existingCount = await prisma.paymentMethod.count({
    where: { userId, isArchived: false },
  });

  return prisma.paymentMethod.create({
    data: {
      ...data,
      userId,
      isDefault: existingCount === 0,
    },
  });
};

export const getUserPaymentMethods = async (userId: number) => {
  return prisma.paymentMethod.findMany({
    where: { userId, isArchived: false },
    // Default card always appears first, then newest first
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
};

export const getPaymentMethodById = async (id: number, userId: number) => {
  const method = await prisma.paymentMethod.findFirst({
    where: { id, userId },
  });
  if (!method) throw new NotFoundError('Payment method not found');
  return method;
};

export const updatePaymentMethod = async (id: number, userId: number, data: UpdatePaymentInput) => {
  return prisma.paymentMethod.updateMany({
    where: { id, userId },
    data,
  });
};

/**
 * Set one card as the default for a user.
 * Uses a transaction to atomically:
 *   1. Unset isDefault on all other cards
 *   2. Set isDefault on the target card
 */
export const setDefaultPaymentMethod = async (id: number, userId: number) => {
  const method = await prisma.paymentMethod.findFirst({
    where: { id, userId, isArchived: false },
  });
  if (!method) throw new NotFoundError('Payment method not found');

  return prisma.$transaction([
    // Clear existing default
    prisma.paymentMethod.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    }),
    // Set new default
    prisma.paymentMethod.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);
};

/**
 * Smart delete:
 * - No payments linked → hard delete
 * - Has payments → soft delete (isArchived = true)
 *
 * If the deleted/archived card was the default, promote the next
 * non-archived card to default automatically.
 */
export const deletePaymentMethod = async (id: number, userId: number) => {
  const method = await prisma.paymentMethod.findFirst({
    where: { id, userId },
    include: { _count: { select: { payments: true } } },
  });

  if (!method) throw new NotFoundError('Payment method not found');

  const hasLinkedPayments = method._count.payments > 0;

  return prisma.$transaction(async tx => {
    if (hasLinkedPayments) {
      await tx.paymentMethod.update({
        where: { id },
        data: { isArchived: true, isDefault: false },
      });
    } else {
      await tx.paymentMethod.delete({ where: { id } });
    }

    // If this was the default card, promote the next available card
    if (method.isDefault) {
      const next = await tx.paymentMethod.findFirst({
        where: { userId, isArchived: false },
        orderBy: { createdAt: 'desc' },
      });

      if (next) {
        await tx.paymentMethod.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return { archived: hasLinkedPayments };
  });
};
