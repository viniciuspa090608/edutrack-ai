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
