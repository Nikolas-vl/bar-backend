import prisma from '../../prisma';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { CreateLocationInput, UpdateLocationInput } from './location.schema';

export const getAllLocations = () =>
  prisma.location.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { tables: true } } },
  });

export const getLocationById = async (id: number) => {
  const location = await prisma.location.findUnique({
    where: { id },
    include: {
      tables: { orderBy: { number: 'asc' } },
    },
  });
  if (!location) throw new NotFoundError('Location not found');
  return location;
};

export const createLocation = (input: CreateLocationInput) => prisma.location.create({ data: input });

export const updateLocation = async (id: number, input: UpdateLocationInput) => {
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) throw new NotFoundError('Location not found');

  return prisma.location.update({ where: { id }, data: input });
};

export const deleteLocation = async (id: number) => {
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) throw new NotFoundError('Location not found');

  const tableCount = await prisma.table.count({ where: { locationId: id } });
  if (tableCount > 0) {
    throw new ValidationError(`Cannot delete location: it has ${tableCount} table(s). Remove all tables first.`);
  }

  return prisma.location.delete({ where: { id } });
};
