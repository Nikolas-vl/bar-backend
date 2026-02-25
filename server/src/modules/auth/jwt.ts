import jwt from 'jsonwebtoken';

export const env = {
  accessSecret: process.env.JWT_ACCESS_SECRET!,
  refreshSecret: process.env.JWT_REFRESH_SECRET!,
  accessExpires: (process.env.JWT_ACCESS_EXPIRES || '15m') as jwt.SignOptions['expiresIn'],
  refreshExpires: (process.env.JWT_REFRESH_EXPIRES || '7d') as jwt.SignOptions['expiresIn'],
};

if (!env.accessSecret || !env.refreshSecret) {
  throw new Error('JWT secrets missing');
}

export const generateAccessToken = (userId: number, role: string) => {
  return jwt.sign({ userId, role }, env.accessSecret, {
    expiresIn: env.accessExpires,
  });
};

export const generateRefreshToken = (userId: number) => {
  return jwt.sign({ userId }, env.refreshSecret, {
    expiresIn: env.refreshExpires,
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.accessSecret);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, env.refreshSecret);
};
