import http from 'http';
import app from './app';
import { logger } from './utils/logger';
import { initSocket } from './lib/socket/socket';
import redis, { disconnectRedis } from './lib/redis/redis.client';

const BACKEND_PORT = process.env.BACKEND_PORT || 4000;

async function bootstrap() {
  try {
    await redis.connect();
    logger.info('Redis connected - ready');
  } catch (err) {
    logger.error({ err }, 'Redis initial connection failed - continuing without cache');
  }

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(Number(BACKEND_PORT), '0.0.0.0', () => {
    logger.info(`Server running on http://localhost:${BACKEND_PORT}`);
    logger.info(`Swagger docs available at http://localhost:${BACKEND_PORT}/api-docs`);
    logger.info(`Redis port: ${process.env.REDIS_PORT}`);
    logger.info(`PSQL url: ${process.env.DATABASE_URL}`);
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');

    httpServer.close(async () => {
      await disconnectRedis();
      logger.info('HTTP server + Redis closed. Bye');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch(err => {
  logger.error({ err }, 'Bootstrap failed');
  process.exit(1);
});
