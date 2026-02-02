import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../modules/auth/jwt';

export interface AuthenticatedRequest extends Request {
  userId: number;
  role: 'USER' | 'ADMIN';
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyAccessToken(token) as {
      userId: number;
      role: 'USER' | 'ADMIN';
    };

    (req as AuthenticatedRequest).userId = payload.userId;
    (req as AuthenticatedRequest).role = payload.role;

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
