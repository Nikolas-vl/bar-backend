import bcrypt from 'bcrypt';
import prisma from '../../prisma';
import { Prisma } from '../../generated/prisma/client';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { UpdateProfileInput, AdminUpdateUserInput, UserQuery } from './user.schema';

export const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  return user;
};

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

  return { users, total, page, limit };
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

  const [orderCount, paymentCount] = await Promise.all([
    prisma.order.count({ where: { userId: id } }),
    prisma.payment.count({ where: { userId: id } }),
  ]);

  if (orderCount > 0 || paymentCount > 0) {
    throw new ValidationError('Cannot delete a user with existing orders or payments');
  }

  await prisma.$transaction(async tx => {
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
