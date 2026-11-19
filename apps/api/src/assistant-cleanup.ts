import { loadEnv } from './config/env.js';
import { cleanupAssistant } from './database/cleanup-assistant.js';
import { createDataSource } from './database/data-source.js';

async function run() {
  const source = createDataSource(loadEnv());
  const started = performance.now();
  try {
    await source.initialize();
    const counts = await cleanupAssistant(source);
    process.stdout.write(
      `${JSON.stringify({ event: 'assistant_cleanup', ...counts, durationMs: Math.round(performance.now() - started) })}\n`,
    );
  } finally {
    if (source.isInitialized) await source.destroy();
  }
}

run().catch(() => {
  process.stderr.write('Falha na limpeza do histórico do Assistente IA.\n');
  process.exitCode = 1;
});
