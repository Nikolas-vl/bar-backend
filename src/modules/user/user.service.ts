import bcrypt from 'bcrypt';
import prisma from '../../prisma';
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
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
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
  const orderCount = await prisma.order.count({ where: { userId: id } });
  if (orderCount > 0) {
    throw new ValidationError('Cannot delete a user with existing orders');
  }
  await prisma.user.delete({ where: { id } });
};
