import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: z.ZodType) =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error: any) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors,
        });
      }
    };
