import { ErrorRequestHandler } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  req.log.error(
    {
      err,
      url: req.originalUrl,
      method: req.method,
    },
    'Unhandled error',
  );

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
};
