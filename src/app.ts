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

const app = express();

const corsMiddleware = cors({
  origin: 'http://localhost:3000',
  credentials: true,
});

app.use(helmet());
app.use(asCorsHandler(corsMiddleware));

// app.use('/api/auth', authLimiter);
// app.use('/api', apiLimiter);

const httpLogger = pinoHttp({ logger });
useHandlers(app, httpLogger, express.json(), cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);
app.use(errorHandler);

export default app;
