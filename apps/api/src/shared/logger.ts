import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'DB_PASSWORD',
    ],
    censor: '[REDACTED]',
  },
});

export type AppLogger = Pick<typeof logger, 'info' | 'error'>;
