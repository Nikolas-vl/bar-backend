import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  req.log.error(
    {
      err,
      url: req.originalUrl,
      method: req.method,
    },
    'Unhandled error'
  );

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
};
