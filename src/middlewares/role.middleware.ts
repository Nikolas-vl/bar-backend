import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export const requireRole = (...roles: Array<'USER' | 'ADMIN'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role) {
      throw new UnauthorizedError();
    }

    if (!roles.includes(req.role)) {
      throw new ForbiddenError();
    }

    next();
  };
};
