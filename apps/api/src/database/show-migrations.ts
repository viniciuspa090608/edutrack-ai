import { loadEnv } from '../config/env.js';
import { createDataSource } from './data-source.js';

async function show(): Promise<void> {
  const source = createDataSource(loadEnv());
  try {
    await source.initialize();
    const hasPending = await source.showMigrations();
    process.stdout.write(
      `Migrations pendentes: ${hasPending ? 'sim' : 'não'}\n`,
    );
  } finally {
    if (source.isInitialized) await source.destroy();
  }
}

show().catch((error: unknown) => {
  process.stderr.write(
    `Falha ao consultar migrations: ${error instanceof Error ? error.name : 'UnknownError'}\n`,
  );
  process.exitCode = 1;
});
