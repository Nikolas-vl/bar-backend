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

export const setDefault = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = paramSchema('id').parse(req.params);

  await service.setDefaultPaymentMethod(id, userId);
  res.json({ message: 'Default payment method updated' });
};

export const remove = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = paramSchema('id').parse(req.params);
  const result = await service.deletePaymentMethod(id, userId);
  res.json({
    success: true,
    archived: result.archived,
    message: result.archived ? 'Card archived — it will still appear in your past orders' : 'Card removed',
  });
};
