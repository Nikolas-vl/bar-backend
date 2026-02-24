import type { RequestHandler, Response, NextFunction } from 'express';
import type { CorsRequest } from 'cors';

export const asHandler = (handler: unknown) => handler as RequestHandler;

export const asCorsHandler =
  (handler: (req: CorsRequest, res: Response, next: NextFunction) => void): RequestHandler =>
  (req, res, next) =>
    handler(req as CorsRequest, res, next);

type ExpressAppLike = {
  use: (handler: RequestHandler) => void;
};

export const useHandlers = (app: ExpressAppLike, ...handlers: unknown[]) => {
  handlers.forEach(handler => app.use(asHandler(handler)));
};
