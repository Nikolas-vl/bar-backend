import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

type ValidationTarget = 'body' | 'query' | 'params';

interface ValidationSchemas {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}

async function parseTarget(schema: z.ZodSchema, value: unknown) {
  return schema.parseAsync(value);
}

function applyToRequest(req: Request, target: ValidationTarget, value: unknown) {
  if (target === 'body') {
    req.body = value;
    return;
  }

  Object.defineProperty(req, target, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export const validate =
  (schemaOrMap: z.ZodSchema | ValidationSchemas, target: ValidationTarget = 'body') =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schemas: ValidationSchemas = schemaOrMap instanceof z.ZodType ? { [target]: schemaOrMap } : schemaOrMap;

      if (schemas.params) {
        const parsed = await parseTarget(schemas.params, req.params);
        applyToRequest(req, 'params', parsed);
      }

      if (schemas.query) {
        const parsed = await parseTarget(schemas.query, req.query);
        applyToRequest(req, 'query', parsed);
      }

      if (schemas.body) {
        const parsed = await parseTarget(schemas.body, req.body);
        applyToRequest(req, 'body', parsed);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        req.log?.warn?.({ issues: error.issues, url: req.url }, 'Request validation failed');
        return res.status(400).json({
          message: 'Validation failed',
          issues: error.issues,
        });
      }

      next(error);
    }
  };
