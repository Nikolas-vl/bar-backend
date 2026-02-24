import { Request, Response } from 'express';
import { createAddress, deleteAddress, getAddresses, updateAddress } from './address.service';

export const createMyAddress = async (req: Request, res: Response): Promise<void> => {
  const address = await createAddress(req.userId!, req.body);
  res.status(201).json(address);
};

export const getMyAddresses = async (req: Request, res: Response) => {
  const addresses = await getAddresses(req.userId!);
  res.json(addresses);
};

export const deleteMyAddress = async (req: Request, res: Response) => {
  const address = req.resource!;

  await deleteAddress(address.id);
  res.json({ success: true });
};

export const updateMyAddress = async (req: Request, res: Response) => {
  const address = req.resource!;

  const data = req.body;
  const updated = await updateAddress(address.id, data);

  res.json(updated);
};
