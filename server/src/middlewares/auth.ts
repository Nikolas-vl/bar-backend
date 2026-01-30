import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header) {
    req.log.warn('Authorization header missing');
    return res.status(401).json({ message: 'No token' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!
    ) as { userId: string };

    (req as any).userId = payload.userId;

    req.log.info({ userId: payload.userId }, 'Access token verified');

    next();
  } catch (err) {
    req.log.warn({ err }, 'Invalid access token');
    res.status(401).json({ message: 'Invalid token' });
  }
};
