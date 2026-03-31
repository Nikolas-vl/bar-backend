import bcrypt from 'bcrypt';
import prisma from '../../prisma';
import { Prisma, OrderStatus } from '../../generated/prisma/client';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { UpdateProfileInput, AdminUpdateUserInput, UserQuery } from './user.schema';

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [OrderStatus.NEW, OrderStatus.PAID, OrderStatus.PREPARING];

const getActiveOrderCountMap = async (userIds: number[]) => {
  if (userIds.length === 0) {
    return new Map<number, number>();
  }

  const counts = await prisma.order.groupBy({
    by: ['userId'],
    where: {
      userId: { in: userIds },
      status: { in: ACTIVE_ORDER_STATUSES },
    },
    _count: { _all: true },
  });

  return new Map<number, number>(counts.map(row => [row.userId, row._count._all]));
};

export const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const getActiveOrdersCount = async (userId: number) =>
  prisma.order.count({
    where: {
      userId,
      status: { in: ACTIVE_ORDER_STATUSES },
    },
  });

export const updateUser = async (id: number, input: UpdateProfileInput) => {
  const user = await getUserById(id);

  const data: { name?: string; phone?: string; password?: string } = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.phone !== undefined) data.phone = input.phone;

  if (input.password !== undefined) {
    if (!user.password) throw new ValidationError('Cannot change password for OAuth accounts');
    const isMatch = await bcrypt.compare(input.currentPassword!, user.password);
    if (!isMatch) throw new ValidationError('Current password is incorrect');
    data.password = await bcrypt.hash(input.password, 10);
  }

  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
    },
  });
};

export const getAllUsers = async (query: UserQuery) => {
  const { page, limit, search, role } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    ...(search && {
      OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }],
    }),
    ...(role && { role }),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  const activeOrderCountMap = await getActiveOrderCountMap(users.map(user => user.id));

  const usersWithDeletionState = users.map(user => ({
    ...user,
    activeOrdersCount: activeOrderCountMap.get(user.id) ?? 0,
  }));

  return { users: usersWithDeletionState, total, page, limit };
};

export const adminUpdateUser = async (id: number, input: AdminUpdateUserInput) => {
  const data: { name?: string; phone?: string; password?: string; role?: 'USER' | 'ADMIN' } = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.password !== undefined) data.password = await bcrypt.hash(input.password, 10);
  if (input.role !== undefined) data.role = input.role;

  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
    },
  });
};

export const deleteUser = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  if (user.role === 'ADMIN') throw new ValidationError('Cannot delete an admin user');

  await prisma.$transaction(async tx => {
    const activeOrdersCount = await tx.order.count({
      where: {
        userId: id,
        status: { in: ACTIVE_ORDER_STATUSES },
      },
    });

    if (activeOrdersCount > 0) {
      throw new ValidationError('User has active orders and cannot be deleted');
    }

    await tx.payment.deleteMany({
      where: { userId: id },
    });

    await tx.orderItemExtra.deleteMany({
      where: {
        orderItem: {
          order: { userId: id },
        },
      },
    });

    await tx.orderItem.deleteMany({
      where: {
        order: { userId: id },
      },
    });

    await tx.orderIngredientItem.deleteMany({
      where: {
        order: { userId: id },
      },
    });

    await tx.order.deleteMany({
      where: { userId: id },
    });

    await tx.cartItemExtra.deleteMany({ where: { cartItem: { cart: { userId: id } } } });
    await tx.cartItem.deleteMany({ where: { cart: { userId: id } } });
    await tx.cartIngredientItem.deleteMany({ where: { cart: { userId: id } } });
    await tx.cart.deleteMany({ where: { userId: id } });
    await tx.address.deleteMany({ where: { userId: id } });
    await tx.paymentMethod.deleteMany({ where: { userId: id } });
    await tx.reservationPreOrder.deleteMany({ where: { reservation: { userId: id } } });
    await tx.reservation.deleteMany({ where: { userId: id } });
    await tx.user.delete({ where: { id } });
  });
};
