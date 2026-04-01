import pino from 'pino';

const usePretty = process.env.LOG_PRETTY === 'true';
const level = process.env.LOG_LEVEL ?? 'debug';

export const logger = pino({
  level,
  transport: usePretty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
        },
      }
    : undefined,
});
