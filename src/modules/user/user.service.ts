import bcrypt from 'bcrypt';
import prisma from '../../prisma';
import { NotFoundError } from '../../utils/errors';
import { UpdateProfileInput } from './user.schema';

export const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const updateUser = async (id: number, input: UpdateProfileInput) => {
  const data: { name?: string; password?: string } = {};

  if (input.name) data.name = input.name;
  if (input.password) data.password = await bcrypt.hash(input.password, 10);

  return prisma.user.update({
    where: { id },
    data,
  });
};
