import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.test' });

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node', // TODO: seperate out config to vitest.config.frontend.ts and use something like JSDOM for and install jest-dom for frontend tests
    include: ['tests/**/*.test.ts'],
  },
});
