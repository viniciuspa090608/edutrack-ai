import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Bound jsdom contention without extending interaction/test deadlines.
    maxWorkers: 2,
  },
});
