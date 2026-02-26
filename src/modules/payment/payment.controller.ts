import { Request, Response } from 'express';
import * as service from './payment.service';

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
  const id = Number(req.params.id);

  const payment = await service.getPaymentMethodById(id, userId);

  if (!payment) return res.status(404).json({ message: 'Not found' });

  res.json(payment);
};

export const update = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const id = Number(req.params.id);
  await service.updatePaymentMethod(id, userId, req.body);
  res.json({ message: 'Updated' });
};

export const remove = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const id = Number(req.params.id);

  await service.deletePaymentMethod(id, userId);
  res.status(204).send();
};
