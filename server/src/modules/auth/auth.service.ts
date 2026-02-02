import bcrypt from 'bcrypt';
import prisma from '../../prisma';
import { logger } from '../../utils/logger';

export const createUser = async (email: string, password: string) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    return await prisma.user.create({
      data: { email, password: hashedPassword },
    });
  } catch (err) {
    logger.error({ email, err }, 'Create user failed');
    throw err;
  }
};

export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const updateRefreshToken = (userId: number, token: string | null) => {
  return prisma.user.update({
    where: { id: userId },
    data: { refreshToken: token },
  });
};

export const findUserByRefreshToken = (token: string) => {
  return prisma.user.findFirst({
    where: { refreshToken: token },
  });
};
