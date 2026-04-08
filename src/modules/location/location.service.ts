import prisma from '../../prisma';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { CreateLocationInput, UpdateLocationInput } from './location.schema';
import { withCache, cacheDelete, cacheInvalidatePattern } from '../../lib/redis/cache';
import { CacheKeys, CacheTTL } from '../../lib/redis/cache.keys';

export const getAllLocations = () =>
  withCache(
    CacheKeys.locations.list(),
    () => prisma.location.findMany({ orderBy: { id: 'asc' }, include: { _count: { select: { tables: true } } } }),
    { ttl: CacheTTL.LONG },
  );

export const getLocationById = async (id: number) =>
  withCache(
    CacheKeys.locations.detail(id),
    async () => {
      const location = await prisma.location.findUnique({
        where: { id },
        include: { tables: { orderBy: { number: 'asc' } } },
      });
      if (!location) throw new NotFoundError('Location not found');
      return location;
    },
    { ttl: CacheTTL.MEDIUM },
  );

export const createLocation = async (input: CreateLocationInput) => {
  const location = await prisma.location.create({ data: input });
  await cacheInvalidatePattern(CacheKeys.locations.all);
  return location;
};

export const updateLocation = async (id: number, input: UpdateLocationInput) => {
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) throw new NotFoundError('Location not found');

  const updated = await prisma.location.update({ where: { id }, data: input });
  await cacheDelete(CacheKeys.locations.detail(id));
  await cacheInvalidatePattern(CacheKeys.locations.all);
  return updated;
};

export const deleteLocation = async (id: number) => {
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) throw new NotFoundError('Location not found');

  const tableCount = await prisma.table.count({ where: { locationId: id } });
  if (tableCount > 0) {
    throw new ValidationError(`Cannot delete location: it has ${tableCount} table(s). Remove all tables first.`);
  }

  const deleted = await prisma.location.delete({ where: { id } });
  await cacheDelete(CacheKeys.locations.detail(id));
  await cacheInvalidatePattern(CacheKeys.locations.all);
  return deleted;
};
