import { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/errors';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  req.log.error(
    {
      err,
      url: req.originalUrl,
      method: req.method,
    },
    'Unhandled error',
  );

  res.status('status' in err && typeof err.status === 'number' ? err.status : 500).json({
    message: 'Internal server error',
  });
};
