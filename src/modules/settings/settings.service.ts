import prisma from '../../prisma';
import { UpdateSettingsInput } from './settings.schema';
import { withCache, cacheDelete } from '../../lib/redis/cache';
import { CacheKeys, CacheTTL } from '../../lib/redis/cache.keys';

export const getSettings = () =>
  withCache(CacheKeys.settings.global(), () => prisma.settings.upsert({ where: { id: 1 }, create: {}, update: {} }), {
    ttl: CacheTTL.LONG,
  });

export const updateSettings = async (input: UpdateSettingsInput) => {
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    create: { ...input },
    update: { ...input },
  });
  await cacheDelete(CacheKeys.settings.global());
  return settings;
};
