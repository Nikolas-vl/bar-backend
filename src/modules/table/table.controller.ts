import { Request, Response } from 'express';
import * as service from './table.service';
import { CreateTableInput, UpdateTableInput } from './table.schema';
import { paramSchema } from '../../utils/common.schema';

export const getAllTables = async (req: Request, res: Response) => {
  const tables = await service.getAllTables();
  res.json(tables);
};

export const createTable = async (req: Request, res: Response) => {
  const table = await service.createTable(req.body as CreateTableInput);
  res.status(201).json(table);
};

export const updateTable = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  const table = await service.updateTable(id, req.body as UpdateTableInput);
  res.json(table);
};

export const deleteTable = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  await service.deleteTable(id);
  res.status(204).end();
};
