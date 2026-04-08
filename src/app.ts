import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import helmet from 'helmet';
import routes from './routes';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { asCorsHandler, useHandlers } from './utils/express';
// import { authLimiter, apiLimiter } from './middlewares/rateLimiter';
import redis from './lib/redis/redis.client';
import prisma from './prisma';

const app = express();

const corsMiddleware = cors({
  origin: process.env.CORS_ORIGIN?.split(','),
  credentials: true,
});

app.use(helmet());
app.use(asCorsHandler(corsMiddleware));
// app.use('/auth', authLimiter);
// app.use(apiLimiter);

const httpLogger = pinoHttp({ logger });
useHandlers(app, httpLogger, express.json(), cookieParser());

app.get('/', (_req, res) => {
  res.redirect('/healthz');
});

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/readyz', async (_req, res) => {
  const checks = {
    redis: await redis
      .ping()
      .then(() => 'ok')
      .catch(() => 'down'),
    db: await prisma.$queryRaw`SELECT 1`.then(() => 'ok').catch(() => 'down'),
  };
  const healthy = Object.values(checks).every(v => v === 'ok');
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', checks });
});

app.use('/', routes);
app.use(errorHandler);

export default app;
