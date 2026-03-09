import { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/errors';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[])?.join(', ') ?? 'field';
      return res.status(409).json({ message: `A record with this ${fields} already exists` });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Record not found' });
    }
  }

  req.log.error({ err, url: req.originalUrl, method: req.method }, 'Unhandled error');

  res.status('status' in err && typeof err.status === 'number' ? err.status : 500).json({
    message: 'Internal server error',
  });
};
