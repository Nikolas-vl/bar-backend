import { Request, Response } from 'express';
import { createAddress, deleteAddress, getAddresses, updateAddress, setDefaultAddress } from './address.service';
import { paramSchema } from '../../utils/common.schema';

export const createMyAddress = async (req: Request, res: Response) => {
  const address = await createAddress(req.userId!, req.body);
  res.status(201).json(address);
};

export const getMyAddresses = async (req: Request, res: Response) => {
  const addresses = await getAddresses(req.userId!);
  res.json(addresses);
};

export const setMyDefaultAddress = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  await setDefaultAddress(id, req.userId!);
  res.json({ success: true });
};

export const updateMyAddress = async (req: Request, res: Response) => {
  const address = req.resource!;
  const updated = await updateAddress(address.id, req.body);
  res.json(updated);
};

export const deleteMyAddress = async (req: Request, res: Response) => {
  const address = req.resource!;
  await deleteAddress(address.id, req.userId!);
  res.json({ success: true });
};
