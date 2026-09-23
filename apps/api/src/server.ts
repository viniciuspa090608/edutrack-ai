import type { Server } from 'node:http';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createDataSource } from './database/data-source.js';
import { logger } from './shared/logger.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const source = createDataSource(env);
  await source.initialize();

  const app = createApp({ logger, webOrigin: env.WEB_ORIGIN });
  let server: Server;
  try {
    server = await new Promise<Server>((resolve, reject) => {
      const listening = app.listen(env.API_PORT);
      listening.once('error', reject);
      listening.once('listening', () => {
        listening.off('error', reject);
        resolve(listening);
      });
    });
  } catch (error) {
    await source.destroy();
    throw error;
  }
  logger.info({ event: 'server.ready', port: env.API_PORT });

  const close = () => {
    server.close(() => {
      source.destroy().then(
        () => {
          process.exitCode = 0;
        },
        () => {
          process.exitCode = 1;
        },
      );
    });
  };

  process.once('SIGINT', close);
  process.once('SIGTERM', close);
}

main().catch((error: unknown) => {
  logger.error({
    event: 'server.startup_failed',
    errorType: error instanceof Error ? error.name : typeof error,
    message:
      error instanceof Error && error.name === 'EnvValidationError'
        ? error.message
        : 'Falha ao iniciar API.',
  });
  process.exitCode = 1;
});
