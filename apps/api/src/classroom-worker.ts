import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { loadEnv } from './config/env.js';
import { createDataSource } from './database/data-source.js';
import { createClassroomRuntime } from './classroom-runtime.js';

const env = loadEnv(),
  source = createDataSource(env),
  worker = randomUUID();
let stopped = false;
process.once('SIGTERM', () => {
  stopped = true;
});
process.once('SIGINT', () => {
  stopped = true;
});
await source.initialize();
const runtime = createClassroomRuntime(source, env);
try {
  while (!stopped) {
    try {
      if (!(await runtime.service.runOnce(worker))) await setTimeout(1500);
    } catch {
      process.stderr.write(
        'Não foi possível processar a operação Classroom. Nova tentativa em breve.\n',
      );
      await setTimeout(3000);
    }
  }
} finally {
  await source.destroy();
}
