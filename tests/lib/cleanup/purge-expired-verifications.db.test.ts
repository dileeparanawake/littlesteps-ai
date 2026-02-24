// tests for F2H, Block A — purge-expired-verifications

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@/db';
import { verification } from '@/db/schema';
import { wipeDB } from '../../helpers/wipe-db';
import { purgeExpiredVerifications } from '@/lib/cleanup/purge-expired-verifications';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

const ONE_HOUR_MS = 60 * 60 * 1000;

async function insertVerification(identifier: string, expiresAt: Date) {
  await db.insert(verification).values({
    id: `verification-${identifier}-${Date.now()}`,
    identifier,
    value: 'test-value',
    expiresAt,
  });
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe.sequential('purgeExpiredVerifications', () => {
  beforeAll(async () => {
    await wipeDB();
  });

  beforeEach(async () => {
    await wipeDB();
  });

  afterAll(async () => {
    await wipeDB();
  });

  it('deletes verification rows expired more than one hour ago', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * ONE_HOUR_MS);
    await insertVerification('stale-token', twoHoursAgo);

    await purgeExpiredVerifications();

    const remaining = await db.select().from(verification);
    expect(remaining).toHaveLength(0);
  });

  it('does not delete verification rows expired less than one hour ago', async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    await insertVerification('recent-expired-token', thirtyMinutesAgo);

    await purgeExpiredVerifications();

    const remaining = await db.select().from(verification);
    expect(remaining).toHaveLength(1);
  });

  it('does not delete verification rows that have not yet expired', async () => {
    const oneHourFromNow = new Date(Date.now() + ONE_HOUR_MS);
    await insertVerification('future-token', oneHourFromNow);

    await purgeExpiredVerifications();

    const remaining = await db.select().from(verification);
    expect(remaining).toHaveLength(1);
  });

  it('returns 0 when no expired rows exist', async () => {
    const count = await purgeExpiredVerifications();

    expect(count).toBe(0);
  });

  it('returns correct count of deleted rows', async () => {
    const threeHoursAgo = new Date(Date.now() - 3 * ONE_HOUR_MS);
    const twoHoursAgo = new Date(Date.now() - 2 * ONE_HOUR_MS);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    await insertVerification('stale-1', threeHoursAgo);
    await insertVerification('stale-2', twoHoursAgo);
    await insertVerification('recent-expired', thirtyMinutesAgo);

    const count = await purgeExpiredVerifications();

    expect(count).toBe(2);
    const remaining = await db.select().from(verification);
    expect(remaining).toHaveLength(1);
  });
});
