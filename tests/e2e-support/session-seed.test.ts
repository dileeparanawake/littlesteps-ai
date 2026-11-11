import { createHmac } from 'node:crypto';
import { describe, it, expect } from 'vitest';

import {
  assertSafeSeedTarget,
  seedSignedInSession,
  signSessionToken,
  UnsafeSeedTargetError,
} from '../../e2e/support/session-seed';

const localEnv = {
  NODE_ENV: 'test',
  E2E_ALLOW_SESSION_SEED: '1',
  DATABASE_URL: 'postgres://postgres@localhost:55432/littlesteps_e2e',
  BETTER_AUTH_SECRET: 'e2e-secret',
};

describe('e2e session seed guard', () => {
  it('allows a local database with the e2e flag set', () => {
    expect(assertSafeSeedTarget(localEnv)).toEqual({
      databaseUrl: localEnv.DATABASE_URL,
      secret: localEnv.BETTER_AUTH_SECRET,
    });
  });

  it('is off in production, even with the flag and a local database', () => {
    expect(() =>
      assertSafeSeedTarget({ ...localEnv, NODE_ENV: 'production' }),
    ).toThrow(UnsafeSeedTargetError);
  });

  it('is off unless the e2e flag is set', () => {
    expect(() =>
      assertSafeSeedTarget({ ...localEnv, E2E_ALLOW_SESSION_SEED: undefined }),
    ).toThrow(/E2E_ALLOW_SESSION_SEED/);
    expect(() =>
      assertSafeSeedTarget({ ...localEnv, E2E_ALLOW_SESSION_SEED: 'true' }),
    ).toThrow(/E2E_ALLOW_SESSION_SEED/);
  });

  it.each([
    'postgres://user:pw@ep-cool-name-123.eu-west-2.aws.neon.tech/neondb',
    'postgres://postgres:postgres@db:5432/littlesteps',
    'postgres://user:pw@littlesteps-ai.internal:5432/app',
  ])('refuses a non-local database: %s', (url) => {
    expect(() =>
      assertSafeSeedTarget({ ...localEnv, DATABASE_URL: url }),
    ).toThrow(/not local/);
  });

  it('refuses a missing database url or secret', () => {
    expect(() =>
      assertSafeSeedTarget({ ...localEnv, DATABASE_URL: undefined }),
    ).toThrow(/DATABASE_URL/);
    expect(() =>
      assertSafeSeedTarget({ ...localEnv, BETTER_AUTH_SECRET: '' }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });

  it('refuses before touching the database when the guard fails', async () => {
    await expect(
      seedSignedInSession({ ...localEnv, NODE_ENV: 'production' }),
    ).rejects.toThrow(UnsafeSeedTargetError);
  });
});

describe('signSessionToken', () => {
  it('signs as token.base64(hmac-sha256), URI-encoded', () => {
    const signed = decodeURIComponent(signSessionToken('abc', 'secret'));
    const expected = createHmac('sha256', 'secret')
      .update('abc')
      .digest('base64');
    expect(signed).toBe(`abc.${expected}`);
  });
});
