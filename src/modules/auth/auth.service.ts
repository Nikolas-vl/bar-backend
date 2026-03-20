import bcrypt from 'bcrypt';
import prisma from '../../prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { ConflictError, UnauthorizedError } from '../../utils/errors';
import { RegisterInput, LoginInput } from './auth.schema';

export const createUser = async (email: string, password: string, phone: string, name?: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: { email, password: hashedPassword, phone, name },
  });
};

export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      phone: true,
      role: true,
      refreshToken: true,
    },
  });
};

export const updateRefreshToken = (userId: number, token: string | null) => {
  return prisma.user.update({
    where: { id: userId },
    data: { refreshToken: token },
  });
};

export const registerUser = async (input: RegisterInput) => {
  const existing = await findUserByEmail(input.email);
  if (existing) throw new ConflictError('User already exists');

  const user = await createUser(input.email, input.password, input.phone, input.name);

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  const hashedToken = await bcrypt.hash(refreshToken, 10);

  await updateRefreshToken(user.id, hashedToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (input: LoginInput) => {
  const user = await findUserByEmail(input.email);
  if (!user) throw new UnauthorizedError('Invalid credentials');

  const isValid = await bcrypt.compare(input.password, user.password);
  if (!isValid) throw new UnauthorizedError('Invalid credentials');

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  const hashedToken = await bcrypt.hash(refreshToken, 10);

  await updateRefreshToken(user.id, hashedToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshSession = async (oldRefreshToken: string) => {
  const payload = verifyRefreshToken(oldRefreshToken) as { userId: number };

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user || !user.refreshToken) throw new UnauthorizedError('Session not found');

  const isValid = await bcrypt.compare(oldRefreshToken, user.refreshToken);
  if (!isValid) {
    await updateRefreshToken(payload.userId, null);
    throw new UnauthorizedError('Session compromised');
  }

  const newAccessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken(user.id);
  const hashedToken = await bcrypt.hash(newRefreshToken, 10);

  await updateRefreshToken(user.id, hashedToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
