import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Bound simultaneous MySQL fixtures and seed transactions on local servers.
    maxWorkers: 2,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
