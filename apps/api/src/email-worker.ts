import { loadEnv } from './config/env.js';
import { createDataSource } from './database/data-source.js';
import { EmailCrypto } from './modules/auth/email-crypto.js';
import { createSmtpSender } from './modules/auth/email-delivery.js';
import { EmailRepository } from './modules/auth/email.repository.js';
import { logger } from './shared/logger.js';

async function main(): Promise<void> {
  const env = loadEnv();
  if (!env.EMAIL_HMAC_KEY || !env.EMAIL_ENCRYPTION_KEY)
    throw new Error('Email keys are not configured');
  const send = createSmtpSender(env);
  const source = createDataSource(env);
  await source.initialize();
  const workerLock =
    env.NODE_ENV === 'development' ? source.createQueryRunner() : undefined;
  if (workerLock) {
    await workerLock.connect();
    const lock = await workerLock.manager.query<Array<{ acquired: number }>>(
      "SELECT GET_LOCK(CONCAT(DATABASE(), ':demo'),0) AS acquired",
    );
    if (Number(lock[0]!.acquired) !== 1) {
      await workerLock.release();
      await source.destroy();
      throw new Error('Demo operation is running');
    }
    const worker = await workerLock.manager.query<Array<{ acquired: number }>>(
      "SELECT GET_LOCK(CONCAT(DATABASE(), ':email-worker'),0) AS acquired",
    );
    await workerLock.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':demo'))");
    if (Number(worker[0]!.acquired) !== 1) {
      await workerLock.release();
      await source.destroy();
      throw new Error('Email worker is already running');
    }
  }
  const email = new EmailRepository(
    source,
    new EmailCrypto(env.EMAIL_HMAC_KEY, env.EMAIL_ENCRYPTION_KEY),
  );
  let stopping = false;
  process.once('SIGTERM', () => {
    stopping = true;
  });
  process.once('SIGINT', () => {
    stopping = true;
  });
  logger.info({ event: 'email.worker_ready' });
  try {
    while (!stopping) {
      const worked = await email.deliverOne(send, (event) => {
        if (event === 'email.delivery_failed') logger.error({ event });
        else logger.info({ event });
      });
      if (!worked) await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  } finally {
    if (workerLock) {
      await workerLock.query(
        "SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':email-worker'))",
      );
      await workerLock.release();
    }
    await source.destroy();
  }
}

main().catch((error: unknown) => {
  logger.error({
    event: 'email.worker_failed',
    errorType: error instanceof Error ? error.name : typeof error,
    message:
      error instanceof Error && error.name === 'EnvValidationError'
        ? error.message
        : 'Falha no worker de e-mail.',
  });
  process.exitCode = 1;
});
