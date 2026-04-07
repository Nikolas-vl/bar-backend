import Redis from 'ioredis';
import { logger } from '../../utils/logger';

// ── Connection config ─────────────────────────────────────────────────────

const redisConfig = {
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0,

  // Don't attempt connection until the first command is issued.
  // Prevents startup crashes when Redis is temporarily unavailable.
  lazyConnect: true,

  // Retry with exponential backoff, capped at 30s.
  // Returns null after 10 failed attempts to avoid infinite loops.
  retryStrategy(times: number): number | null {
    if (times > 10) {
      logger.error('Redis: max retry attempts reached - giving up');
      return null; // stop retrying
    }
    const delay = Math.min(times * 200, 30_000);
    logger.warn({ attempt: times, delayMs: delay }, 'Redis: retrying connection...');
    return delay;
  },

  // Reconnect on specific commands (e.g. READONLY errors in cluster mode).
  reconnectOnError(err: Error): boolean | 1 | 2 {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
    if (targetErrors.some(msg => err.message.includes(msg))) {
      return 1; // reconnect and resend the failed command
    }
    return false;
  },

  // Show detailed command logs only in development
  showFriendlyErrorStack: process.env.NODE_ENV === 'development',

  // Keep idle connections alive (milliseconds between PING)
  keepAlive: 10_000,

  // Timeout for individual commands
  commandTimeout: 5_000,

  // Maximum time to wait for a connection before failing
  connectTimeout: 10_000,
};

// ── Singleton ─────────────────────────────────────────────────────────────

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis: Redis = globalForRedis.redis ?? new Redis(redisConfig);

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// ── Lifecycle events ──────────────────────────────────────────────────────

redis.on('connect', () => {
  logger.info({ host: redisConfig.host, port: redisConfig.port }, 'Redis connected');
});

redis.on('ready', () => {
  logger.info('Redis ready - accepting commands');
});

redis.on('error', (err: Error) => {
  logger.error({ err }, 'Redis error');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', (delay: number) => {
  logger.warn({ delayMs: delay }, 'Redis reconnecting...');
});

redis.on('end', () => {
  logger.warn('Redis connection ended - no more reconnects');
});

// ── Graceful shutdown ─────────────────────────────────────────────────────

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redis.quit();
    logger.info('Redis: gracefully disconnected');
  } catch {
    redis.disconnect();
  }
};

export default redis;
