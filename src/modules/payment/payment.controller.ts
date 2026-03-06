import { Request, Response } from 'express';
import * as service from './payment.service';
import { paramSchema } from '../../utils/common.schema';

export const create = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const payment = await service.createPaymentMethod(userId, req.body);
  res.status(201).json(payment);
};

export const getAll = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const payments = await service.getUserPaymentMethods(userId);
  res.json(payments);
};

export const getOne = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = paramSchema('id').parse(req.params);

  const payment = await service.getPaymentMethodById(id, userId);
  res.json(payment);
};

export const update = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = paramSchema('id').parse(req.params);
  await service.updatePaymentMethod(id, userId, req.body);
  res.json({ message: 'Updated' });
};

export const remove = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = paramSchema('id').parse(req.params);

  await service.deletePaymentMethod(id, userId);
  res.status(204).send();
};
