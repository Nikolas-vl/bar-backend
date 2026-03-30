import { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/errors';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/client';
import { ZodError } from 'zod';
import multer from 'multer';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof Error && err.message.includes('Multipart: Boundary not found')) {
    return res.status(400).json({ message: 'Invalid multipart request' });
  }

  if (err instanceof PrismaClientValidationError) {
    req.log.error({ err }, 'Prisma validation error');
    return res.status(400).json({ message: 'Invalid request data' });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      issues: err.issues,
    });
  }

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

    if (err.code === 'P2003') {
      return res.status(409).json({ message: 'Cannot delete: this record has associated data' });
    }
  }

  req.log.error({ err, url: req.originalUrl, method: req.method }, 'Unhandled error');

  res.status('status' in err && typeof err.status === 'number' ? err.status : 500).json({
    message: 'Internal server error',
  });
};
