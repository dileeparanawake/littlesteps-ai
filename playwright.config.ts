import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

// Local runs need OPENAI_API_KEY (the dev key) from the developer's .env.
loadEnv({ path: '.env', quiet: true });

const isLive = process.env.E2E_TARGET === 'live';

const LOCAL_PORT = 3100;
const LOCAL_URL = `http://localhost:${LOCAL_PORT}`;
const LIVE_URL = 'https://littlesteps-ai.com';

// The local e2e server talks to a throwaway local Postgres and signs sessions
// with an e2e-only secret. Neither is ever used outside this run.
process.env.E2E_ALLOW_SESSION_SEED = '1';
process.env.E2E_DATABASE_URL ??=
  'postgres://postgres@localhost:55432/littlesteps_e2e';
process.env.E2E_AUTH_SECRET ??= 'e2e-only-secret-do-not-use-elsewhere-0001';

const mobile = {
  ...devices['Pixel 5'],
  viewport: { width: 375, height: 812 },
};

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results/e2e',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: isLive ? LIVE_URL : LOCAL_URL,
    video: 'on',
    trace: 'retain-on-failure',
    launchOptions: { slowMo: Number(process.env.E2E_SLOWMO ?? 0) },
  },
  projects: isLive
    ? [
        {
          name: 'live-desktop',
          testMatch: /live-signed-out\.spec\.ts/,
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'live-mobile',
          testMatch: /live-signed-out\.spec\.ts/,
          use: mobile,
        },
      ]
    : [
        {
          name: 'desktop',
          testMatch: /chat-flow\.spec\.ts/,
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'mobile',
          testMatch: /chat-flow\.spec\.ts/,
          use: mobile,
        },
      ],
  webServer: isLive
    ? undefined
    : {
        command: `pnpm build && pnpm start -p ${LOCAL_PORT}`,
        url: `${LOCAL_URL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        env: {
          DATABASE_URL: process.env.E2E_DATABASE_URL,
          BETTER_AUTH_SECRET: process.env.E2E_AUTH_SECRET,
          BETTER_AUTH_URL: LOCAL_URL,
          NEXT_PUBLIC_BETTER_AUTH_URL: LOCAL_URL,
          GOOGLE_CLIENT_ID: 'e2e-unused',
          GOOGLE_CLIENT_SECRET: 'e2e-unused',
          ADMIN_EMAILS: '',
          WEEKLY_CAP_TOKENS: '40000',
          OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
        },
      },
});
