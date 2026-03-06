import bcrypt from 'bcrypt';
import prisma from '../../prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { ConflictError, UnauthorizedError } from '../../utils/errors';
import { RegisterInput, LoginInput } from './auth.schema';

export const createUser = async (email: string, password: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: { email, password: hashedPassword },
  });
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

export const registerUser = async (input: RegisterInput) => {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ConflictError('User already exists');
  }

  const user = await createUser(input.email, input.password);

  return { id: user.id, email: user.email };
};

export const loginUser = async (input: LoginInput) => {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isValid = await bcrypt.compare(input.password, user.password);
  if (!isValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  await updateRefreshToken(user.id, refreshToken);

  return { accessToken, refreshToken };
};

export const refreshSession = async (oldRefreshToken: string) => {
  const payload = verifyRefreshToken(oldRefreshToken) as { userId: number };

  const user = await findUserByRefreshToken(oldRefreshToken);

  if (!user || user.id !== payload.userId) {
    await updateRefreshToken(payload.userId, null);
    throw new UnauthorizedError('Session compromised');
  }

  const newAccessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken(user.id);

  await updateRefreshToken(user.id, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
