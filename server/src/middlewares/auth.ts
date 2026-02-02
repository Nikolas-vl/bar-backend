import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../modules/auth/jwt';

const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    req.log.warn('Authorization header missing or malformed');
    return res.status(401).json({ message: 'No token' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyAccessToken(token) as {
      userId: number;
      role: 'USER' | 'ADMIN';
    };

    if (typeof payload !== 'object' || !payload || !('userId' in payload)) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    req.userId = payload.userId;
    req.role = payload.role;

    req.log.info({ userId: payload.userId }, 'Access token verified');

    next();
  } catch (err) {
    req.log.warn('Invalid access token');
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireAuth = authMiddleware;
