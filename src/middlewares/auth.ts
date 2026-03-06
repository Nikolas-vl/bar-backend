import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token');
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyAccessToken(token) as {
      userId: number;
      role: 'USER' | 'ADMIN';
    };

    req.userId = payload.userId;
    req.role = payload.role;

    next();
  } catch {
    throw new UnauthorizedError('Invalid token');
  }
};
