import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import routes from './routes';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { asCorsHandler, useHandlers } from './utils/express';

const app = express();

const corsMiddleware = cors({
  origin: 'http://localhost:4000',
  credentials: true,
});

app.use(asCorsHandler(corsMiddleware));
const httpLogger = pinoHttp({ logger });
useHandlers(app, httpLogger, express.json(), cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);
app.use(errorHandler);

export default app;
