import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.test' });

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    // runs tests sequentially
    pool: 'threads',
    poolOptions: {
      threads: { minThreads: 1, maxThreads: 1 },
    },
    // runs tests in files sequentially
    sequence: { concurrent: false },
  },
});
