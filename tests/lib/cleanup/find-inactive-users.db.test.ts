// tests for F2, Block A — find-inactive-users

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest';
import { db } from '@/db';
import { user, session } from '@/db/schema';
import { wipeDB } from '../../helpers/wipe-db';
import { findInactiveUsers } from '@/lib/cleanup/find-inactive-users';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function insertUser(id: string, email: string, createdAt?: Date) {
  const now = createdAt ?? new Date();
  const [newUser] = await db
    .insert(user)
    .values({
      id,
      name: `Test User ${id}`,
      email,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return newUser;
}

async function insertSession(userId: string, updatedAt: Date) {
  const id = `session-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.insert(session).values({
    id,
    expiresAt: new Date(Date.now() + 86400000),
    token: `token-${id}`,
    createdAt: new Date(),
    updatedAt,
    userId,
  });
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe.sequential('findInactiveUsers', () => {
  let savedInactiveDays: string | undefined;
  let savedAdminEmails: string | undefined;

  beforeAll(async () => {
    await wipeDB();
  });

  beforeEach(async () => {
    await wipeDB();
    savedInactiveDays = process.env.INACTIVE_DAYS;
    savedAdminEmails = process.env.ADMIN_EMAILS;
  });

  afterEach(() => {
    if (savedInactiveDays === undefined) {
      delete process.env.INACTIVE_DAYS;
    } else {
      process.env.INACTIVE_DAYS = savedInactiveDays;
    }
    if (savedAdminEmails === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = savedAdminEmails;
    }
  });

  afterAll(async () => {
    await wipeDB();
  });

  it('finds users whose latest session.updated_at exceeds the threshold', async () => {
    process.env.INACTIVE_DAYS = '90';
    process.env.ADMIN_EMAILS = '';

    await insertUser('inactive-user', 'inactive@example.com');
    await insertSession('inactive-user', daysAgo(100));

    const result = await findInactiveUsers();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'inactive-user',
      email: 'inactive@example.com',
    });
    expect(result[0]).toHaveProperty('lastActiveDate');
  });

  it('falls back to user.created_at for users with no sessions', async () => {
    process.env.INACTIVE_DAYS = '90';
    process.env.ADMIN_EMAILS = '';

    await insertUser(
      'no-session-user',
      'nosession@example.com',
      daysAgo(100),
    );

    const result = await findInactiveUsers();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'no-session-user',
      email: 'nosession@example.com',
    });
  });

  it('does not flag users with recent session activity', async () => {
    process.env.INACTIVE_DAYS = '90';
    process.env.ADMIN_EMAILS = '';

    await insertUser('active-user', 'active@example.com');
    await insertSession('active-user', daysAgo(10));

    const result = await findInactiveUsers();

    expect(result).toHaveLength(0);
  });

  it('does not flag admin users regardless of inactivity', async () => {
    process.env.INACTIVE_DAYS = '90';
    process.env.ADMIN_EMAILS = 'admin@example.com';

    await insertUser('admin-user', 'admin@example.com');
    await insertSession('admin-user', daysAgo(200));

    const result = await findInactiveUsers();

    expect(result).toHaveLength(0);
  });

  it('returns empty array when no users are inactive', async () => {
    process.env.INACTIVE_DAYS = '90';
    process.env.ADMIN_EMAILS = '';

    await insertUser('active-1', 'active1@example.com');
    await insertSession('active-1', daysAgo(5));
    await insertUser('active-2', 'active2@example.com');
    await insertSession('active-2', daysAgo(30));

    const result = await findInactiveUsers();

    expect(result).toHaveLength(0);
  });

  it('uses INACTIVE_DAYS env var for threshold (non-default value)', async () => {
    process.env.INACTIVE_DAYS = '30';
    process.env.ADMIN_EMAILS = '';

    // 45 days inactive — should be found with 30-day threshold
    await insertUser('threshold-over', 'over@example.com');
    await insertSession('threshold-over', daysAgo(45));

    // 20 days inactive — should NOT be found with 30-day threshold
    await insertUser('threshold-under', 'under@example.com');
    await insertSession('threshold-under', daysAgo(20));

    const result = await findInactiveUsers();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'threshold-over',
      email: 'over@example.com',
    });
  });

  it('defaults to 90 days when INACTIVE_DAYS is not set', async () => {
    delete process.env.INACTIVE_DAYS;
    process.env.ADMIN_EMAILS = '';

    // 100 days inactive — should be found with default 90-day threshold
    await insertUser('default-inactive', 'default-inactive@example.com');
    await insertSession('default-inactive', daysAgo(100));

    // 60 days inactive — should NOT be found with default 90-day threshold
    await insertUser('default-active', 'default-active@example.com');
    await insertSession('default-active', daysAgo(60));

    const result = await findInactiveUsers();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'default-inactive',
      email: 'default-inactive@example.com',
    });
  });

  it('does not flag a user whose most recent session is within the threshold despite older sessions exceeding it', async () => {
    process.env.INACTIVE_DAYS = '90';
    process.env.ADMIN_EMAILS = '';

    await insertUser('multi-session-user', 'multi@example.com');
    await insertSession('multi-session-user', daysAgo(100));
    await insertSession('multi-session-user', daysAgo(10));

    const result = await findInactiveUsers();

    expect(result).toHaveLength(0);
  });

  it('does not flag a recently created user with no sessions', async () => {
    process.env.INACTIVE_DAYS = '90';
    process.env.ADMIN_EMAILS = '';

    await insertUser('new-no-session', 'new@example.com', daysAgo(10));

    const result = await findInactiveUsers();

    expect(result).toHaveLength(0);
  });

  it('throws descriptive error when INACTIVE_DAYS is set to a non-numeric value', async () => {
    process.env.INACTIVE_DAYS = 'banana';

    await expect(findInactiveUsers()).rejects.toThrow('banana');
  });
});
