import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: z.ZodType) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      req.log.warn(
        {
          body: req.body,
          issues: error.issues,
        },
        'Request validation failed',
      );

      return res.status(400).json({
        message: 'Validation failed',
        issues: error.issues,
      });
    }
    throw error;
  }
};
