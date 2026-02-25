import { Request, Response, NextFunction } from 'express';

export const requireRole = (...roles: Array<'USER' | 'ADMIN'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};
