import { createServer } from 'node:net';
import { networkInterfaces } from 'node:os';
import { loadEnv } from '../config/env.js';
import { createDataSource } from '../database/data-source.js';
import {
  demoTarget,
  inspectDemo,
  requireConfirmation,
  requireDemoEnvironment,
  requireDemoSchema,
  truncateDemo,
  withDemoLock,
} from './database.js';
import { seedDemo, demoDate } from './seed.js';

async function requireStopped(port: number) {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', () =>
      reject(
        new Error(`Pare os processos da aplicação: porta ${port} ocupada.`),
      ),
    );
    server.listen(port, '0.0.0.0', () => server.close(() => resolve()));
  });
}

async function main() {
  const [action, ...args] = process.argv.slice(2);
  if (
    !['inspect', 'reset', 'seed'].includes(action ?? '') ||
    args.some((arg) => !/^--(confirm|date)=/.test(arg))
  )
    throw new Error(
      'Use inspect, reset --confirm=host:porta/banco ou seed --date=AAAA-MM-DD.',
    );
  const env = loadEnv();
  requireDemoEnvironment(env);
  console.log(`Alvo: ${demoTarget(env)} (${env.NODE_ENV})`);
  const source = createDataSource(env);
  try {
    await source.initialize();
    const info = await inspectDemo(source);
    if (info.database !== env.DB_NAME)
      throw new Error('Banco efetivo difere do alvo configurado.');
    if (action === 'inspect') {
      console.log(JSON.stringify(info, null, 2));
      for (const items of Object.values(networkInterfaces()))
        for (const item of items ?? [])
          if (item.family === 'IPv4' && !item.internal)
            console.log(`LAN: http://${item.address}:5173`);
      return;
    }
    if (action === 'reset')
      requireConfirmation(
        env,
        args.find((arg) => arg.startsWith('--confirm='))?.slice(10),
      );
    const date = demoDate(
      args.find((arg) => arg.startsWith('--date='))?.slice(7),
    );
    await requireDemoSchema(source);
    await requireStopped(env.API_PORT);
    await requireStopped(5173);
    // The worker cooperates via its named database lock; no outbox writer may be running.
    await withDemoLock(source, async (runner) => {
      const worker = await runner.manager.query<Array<{ idle: number }>>(
        "SELECT IS_FREE_LOCK(CONCAT(DATABASE(), ':email-worker')) AS idle",
      );
      if (Number(worker[0]!.idle) !== 1)
        throw new Error('Pare o worker de e-mail antes de reset/população.');
      if (action === 'reset') await truncateDemo(runner);
      else await seedDemo(source, date);
    });
    console.log(
      action === 'reset'
        ? 'Reset concluído; esquema e migrations preservados.'
        : `Três perfis populados; data-base ${date}. Veja credenciais no README.`,
    );
  } finally {
    if (source.isInitialized) await source.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error && !('code' in error)
      ? error.message
      : 'Falha de demo; confira configuração e conexão MySQL.',
  );
  process.exitCode = 1;
});
