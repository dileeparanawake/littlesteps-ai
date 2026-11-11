// Test-only sign-in for the e2e flow (ls#73).
//
// Google OAuth can't be driven by a test, so the e2e run signs a user in by
// writing a BetterAuth session row straight into a LOCAL database and handing
// the browser the matching signed cookie. Nothing here is imported by the app:
// production has no code path to it. The guard below refuses to run unless the
// target is a local database and the e2e flag is set, so it can't touch Neon.

import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { Client } from 'pg';

export const SESSION_COOKIE_NAME = 'better-auth.session_token';

const LOCAL_DB_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export type SeedEnv = {
  NODE_ENV?: string;
  E2E_ALLOW_SESSION_SEED?: string;
  DATABASE_URL?: string;
  BETTER_AUTH_SECRET?: string;
};

export class UnsafeSeedTargetError extends Error {
  constructor(reason: string) {
    super(`Refusing to seed an e2e session: ${reason}`);
    this.name = 'UnsafeSeedTargetError';
  }
}

/** Throws unless every guard passes; returns the checked values. */
export function assertSafeSeedTarget(env: SeedEnv): {
  databaseUrl: string;
  secret: string;
} {
  if (env.NODE_ENV === 'production') {
    throw new UnsafeSeedTargetError('NODE_ENV is production');
  }
  if (env.E2E_ALLOW_SESSION_SEED !== '1') {
    throw new UnsafeSeedTargetError('E2E_ALLOW_SESSION_SEED is not set to 1');
  }
  if (!env.DATABASE_URL) {
    throw new UnsafeSeedTargetError('DATABASE_URL is missing');
  }
  if (!env.BETTER_AUTH_SECRET) {
    throw new UnsafeSeedTargetError('BETTER_AUTH_SECRET is missing');
  }

  let host: string;
  try {
    host = new URL(env.DATABASE_URL).hostname;
  } catch {
    throw new UnsafeSeedTargetError('DATABASE_URL is not a valid URL');
  }
  if (!LOCAL_DB_HOSTS.has(host)) {
    throw new UnsafeSeedTargetError(`database host "${host}" is not local`);
  }

  return { databaseUrl: env.DATABASE_URL, secret: env.BETTER_AUTH_SECRET };
}

/** Same format as better-call's signCookieValue: `token.base64(hmac)`, URI-encoded. */
export function signSessionToken(token: string, secret: string): string {
  const signature = createHmac('sha256', secret).update(token).digest('base64');
  return encodeURIComponent(`${token}.${signature}`);
}

/** Creates a fresh e2e user + session and returns the signed cookie value. */
export async function seedSignedInSession(env: SeedEnv): Promise<{
  cookieValue: string;
  userId: string;
}> {
  const { databaseUrl, secret } = assertSafeSeedTarget(env);

  const userId = `e2e-${randomUUID()}`;
  const token = randomBytes(24).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(
      `insert into "user" (id, name, email, email_verified, created_at, updated_at)
       values ($1, $2, $3, true, $4, $4)`,
      [userId, 'E2E Parent', `${userId}@e2e.invalid`, now],
    );
    await client.query(
      `insert into "session" (id, expires_at, token, created_at, updated_at, user_id)
       values ($1, $2, $3, $4, $4, $5)`,
      [randomUUID(), expiresAt, token, now, userId],
    );
  } finally {
    await client.end();
  }

  return { cookieValue: signSessionToken(token, secret), userId };
}
