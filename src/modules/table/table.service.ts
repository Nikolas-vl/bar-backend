import prisma from '../../prisma';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { CreateTableInput, UpdateTableInput } from './table.schema';

export const getAllTables = () => prisma.table.findMany({ orderBy: { number: 'asc' } });

export const createTable = async (input: CreateTableInput) => {
  const existing = await prisma.table.findUnique({ where: { number: input.number } });
  if (existing) throw new ValidationError(`Table #${input.number} already exists`);

  return prisma.table.create({ data: input });
};

export const updateTable = async (id: number, input: UpdateTableInput) => {
  const table = await prisma.table.findUnique({ where: { id } });
  if (!table) throw new NotFoundError('Table not found');

  return prisma.table.update({ where: { id }, data: input });
};

export const deleteTable = async (id: number) => {
  const table = await prisma.table.findUnique({ where: { id } });
  if (!table) throw new NotFoundError('Table not found');

  return prisma.table.delete({ where: { id } });
};
