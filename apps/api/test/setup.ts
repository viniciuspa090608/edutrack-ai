import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { isolatedTestEnv } from './test-env.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
  quiet: true,
});
Object.assign(process.env, isolatedTestEnv(process.env));
