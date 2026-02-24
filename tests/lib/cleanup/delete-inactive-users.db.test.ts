// tests for F2, Block A — delete-inactive-users

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@/db';
import {
  user,
  session,
  account,
  verification,
  thread,
  message,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { wipeDB } from '../../helpers/wipe-db';
import { deleteInactiveUsers } from '@/lib/cleanup/delete-inactive-users';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

async function insertUser(id: string, email: string) {
  const [newUser] = await db
    .insert(user)
    .values({
      id,
      name: `Test User ${id}`,
      email,
      emailVerified: false,
    })
    .returning();
  return newUser;
}

async function insertSession(userId: string, sessionId: string) {
  await db.insert(session).values({
    id: sessionId,
    expiresAt: new Date(Date.now() + 86400000),
    token: `token-${sessionId}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId,
  });
}

async function insertAccount(userId: string, accountIdValue: string) {
  await db.insert(account).values({
    id: `account-${accountIdValue}`,
    accountId: accountIdValue,
    providerId: 'google',
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function insertThread(userId: string, title: string) {
  const [newThread] = await db
    .insert(thread)
    .values({ userId, title })
    .returning();
  return newThread;
}

async function insertMessage(threadId: string, sequence: number) {
  await db.insert(message).values({
    threadId,
    sequence,
    role: 'user',
    content: `Test message ${sequence}`,
  });
}

async function insertVerification(identifier: string) {
  await db.insert(verification).values({
    id: `verification-${identifier}-${Date.now()}`,
    identifier,
    value: 'test-value',
    expiresAt: new Date(Date.now() + 86400000),
  });
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe.sequential('deleteInactiveUsers', () => {
  beforeAll(async () => {
    await wipeDB();
  });

  beforeEach(async () => {
    await wipeDB();
  });

  afterAll(async () => {
    await wipeDB();
  });

  it('deletes user rows for the provided inactive user list', async () => {
    await insertUser('delete-me', 'delete@example.com');

    await deleteInactiveUsers([
      {
        id: 'delete-me',
        email: 'delete@example.com',
        lastActiveDate: new Date(),
      },
    ]);

    const remaining = await db
      .select()
      .from(user)
      .where(eq(user.id, 'delete-me'));
    expect(remaining).toHaveLength(0);
  });

  it('cascade-deletes sessions, accounts, threads, and messages for deleted users', async () => {
    await insertUser('cascade-user', 'cascade@example.com');
    await insertSession('cascade-user', 'session-cascade');
    await insertAccount('cascade-user', 'acct-cascade');
    const testThread = await insertThread('cascade-user', 'Cascade Thread');
    await insertMessage(testThread.id, 1);

    await deleteInactiveUsers([
      {
        id: 'cascade-user',
        email: 'cascade@example.com',
        lastActiveDate: new Date(),
      },
    ]);

    const remainingUsers = await db
      .select()
      .from(user)
      .where(eq(user.id, 'cascade-user'));
    const remainingSessions = await db
      .select()
      .from(session)
      .where(eq(session.userId, 'cascade-user'));
    const remainingAccounts = await db
      .select()
      .from(account)
      .where(eq(account.userId, 'cascade-user'));
    const remainingThreads = await db
      .select()
      .from(thread)
      .where(eq(thread.userId, 'cascade-user'));
    const remainingMessages = await db
      .select()
      .from(message)
      .where(eq(message.threadId, testThread.id));

    expect(remainingUsers).toHaveLength(0);
    expect(remainingSessions).toHaveLength(0);
    expect(remainingAccounts).toHaveLength(0);
    expect(remainingThreads).toHaveLength(0);
    expect(remainingMessages).toHaveLength(0);
  });

  it('cleans up verification table rows matching deleted user emails', async () => {
    await insertUser('verify-user', 'verify@example.com');
    await insertVerification('verify@example.com');

    await deleteInactiveUsers([
      {
        id: 'verify-user',
        email: 'verify@example.com',
        lastActiveDate: new Date(),
      },
    ]);

    const remainingVerifications = await db
      .select()
      .from(verification)
      .where(eq(verification.identifier, 'verify@example.com'));
    expect(remainingVerifications).toHaveLength(0);
  });

  it('handles empty inactive user list gracefully (no-op, no errors)', async () => {
    await insertUser('safe-user', 'safe@example.com');
    await insertSession('safe-user', 'session-safe');
    await insertVerification('safe@example.com');

    await deleteInactiveUsers([]);

    const remainingUsers = await db
      .select()
      .from(user)
      .where(eq(user.id, 'safe-user'));
    const remainingSessions = await db
      .select()
      .from(session)
      .where(eq(session.userId, 'safe-user'));
    const remainingVerifications = await db
      .select()
      .from(verification)
      .where(eq(verification.identifier, 'safe@example.com'));

    expect(remainingUsers).toHaveLength(1);
    expect(remainingSessions).toHaveLength(1);
    expect(remainingVerifications).toHaveLength(1);
  });

  it('does not delete users not in the provided list', async () => {
    await insertUser('target-user', 'target@example.com');
    await insertUser('bystander-user', 'bystander@example.com');

    await deleteInactiveUsers([
      {
        id: 'target-user',
        email: 'target@example.com',
        lastActiveDate: new Date(),
      },
    ]);

    const remainingTarget = await db
      .select()
      .from(user)
      .where(eq(user.id, 'target-user'));
    const remainingBystander = await db
      .select()
      .from(user)
      .where(eq(user.id, 'bystander-user'));

    expect(remainingTarget).toHaveLength(0);
    expect(remainingBystander).toHaveLength(1);
  });
});
