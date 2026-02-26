import { Request, Response, NextFunction } from 'express';
import { getAddressById } from '../modules/address/address.service';

type EntityWithUserId = {
  id: number;
  userId: number;
};

export const ownsResource =
  <T extends EntityWithUserId>(getResource: (req: Request) => Promise<T | null>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const resource = await getResource(req);
    if (req.role === 'ADMIN') {
      return next();
    }
    if (!resource || resource.userId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    req.resource = resource;

    next();
  };

export const ownsAddress = ownsResource(req => getAddressById(+req.params.id));

// export const ownsOrder = ownsResource((req) =>
//   getOrderById(+req.params.id)
// );

// export const ownsPayment = ownsResource((req) =>
//   getPaymentById(+req.params.id)
// );
