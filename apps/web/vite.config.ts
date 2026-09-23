import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const envDir = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, envDir, 'VITE_');
  const apiUrl = environment.VITE_API_BASE_URL;

  if (
    !apiUrl ||
    !URL.canParse(apiUrl) ||
    !['http:', 'https:'].includes(new URL(apiUrl).protocol) ||
    new URL(apiUrl).origin !== apiUrl
  ) {
    throw new Error(
      'VITE_API_BASE_URL inválida. Informe uma URL de origem HTTP(S).',
    );
  }

  return {
    plugins: [react()],
    envDir,
    server: { port: 5173 },
  };
});
