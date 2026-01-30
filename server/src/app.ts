import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http'
import routes from './routes';
import { logger } from "./utils/logger";
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:4000',
    credentials: true,
  })
);
app.use(
  pinoHttp({
    logger,
  })
)
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);
app.use(errorHandler);

export default app;
