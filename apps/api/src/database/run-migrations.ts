import { loadEnv } from '../config/env.js';
import { createDataSource } from './data-source.js';

async function run(): Promise<void> {
  const source = createDataSource(loadEnv());
  try {
    await source.initialize();
    const applied = await source.runMigrations();
    process.stdout.write(`Migrations aplicadas: ${applied.length}\n`);
  } finally {
    if (source.isInitialized) await source.destroy();
  }
}

run().catch((error: unknown) => {
  process.stderr.write(
    `Falha ao executar migrations: ${error instanceof Error ? error.name : 'UnknownError'}\n`,
  );
  process.exitCode = 1;
});
