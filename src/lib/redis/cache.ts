import redis from './redis.client';
import { logger } from '../../utils/logger';

const DEFAULT_TTL = Number(process.env.REDIS_CACHE_TTL) || 300;

export interface CacheOptions {
  ttl?: number;
}

// ── Core helpers ──────────────────────────────────────────────────────────

/**
 * Retrieve a cached value.
 * Returns null on miss or if Redis is unavailable.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.error({ err, key }, 'Cache GET failed');
    return null;
  }
}

/**
 * Store a value in cache.
 * Silently no-ops if Redis is unavailable.
 */
export async function cacheSet<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
  try {
    const ttl = options.ttl ?? DEFAULT_TTL;
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    logger.error({ err, key }, 'Cache SET failed');
  }
}

/**
 * Delete a single key.
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    logger.error({ err, key }, 'Cache DELETE failed');
  }
}

/**
 * Delete all keys matching a glob pattern.
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug({ pattern, count: keys.length }, 'Cache invalidated keys');
      }
    } while (cursor !== '0');
  } catch (err) {
    logger.error({ err, pattern }, 'Cache INVALIDATE PATTERN failed');
  }
}

/**
 * Cache-aside helper.
 * Tries cache first → on miss, calls `fetchFn` → stores result.
 *
 * example
 * const dishes = await withCache('dishes:all', () => prisma.dish.findMany(), { ttl: 60 });
 */
export async function withCache<T>(key: string, fetchFn: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    logger.debug({ key }, 'Cache HIT');
    return cached;
  }

  logger.debug({ key }, 'Cache MISS — fetching from source');
  const fresh = await fetchFn();
  await cacheSet(key, fresh, options);
  return fresh;
}
