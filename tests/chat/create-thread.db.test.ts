import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { thread } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createThread } from '@/lib/chat/create-thread';
import { wipeDB } from '../helpers/wipe-db';
import { createTestUser } from '../helpers/create-test-user';
import { makeTestUser } from '../helpers/test-data';

const testUser = makeTestUser();

describe.sequential('createThread', () => {
  beforeAll(async () => {
    await wipeDB();
  });

  beforeEach(async () => {
    await wipeDB();
    await createTestUser(testUser);
  });

  afterAll(async () => {
    await wipeDB();
  });

  it('creates a thread for the given user with defaults', async () => {
    const newThread = await createThread(testUser.id);

    const rows = await db
      .select()
      .from(thread)
      .where(eq(thread.id, newThread.id));

    console.log('newThread row found', rows);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: newThread.id,
      userId: testUser.id,
      title: 'Untitled Thread',
      createdAt: newThread.createdAt,
      updatedAt: newThread.updatedAt,
    });
  });

  it('creates a thread with custom title', async () => {
    const newThread = await createThread(testUser.id, 'Thread Test Title');

    const rows = await db
      .select()
      .from(thread)
      .where(eq(thread.id, newThread.id));

    console.log('newThread row found', rows);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: newThread.id,
      userId: testUser.id,
      title: 'Thread Test Title',
    });
  });

  it('creates unique thread ids for the same user', async () => {
    const newThread = await createThread(testUser.id);
    const newThread2 = await createThread(testUser.id);

    const rows = await db
      .select()
      .from(thread)
      .where(eq(thread.id, newThread.id));

    const rows2 = await db
      .select()
      .from(thread)
      .where(eq(thread.id, newThread2.id));

    expect(newThread.id).not.toBe(newThread2.id);
    expect(rows).toHaveLength(1);
    expect(rows2).toHaveLength(1);
    expect(rows[0].id).not.toBe(rows2[0].id);
  });

  it('throws if user does not exist', async () => {
    await expect(
      createThread('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow(/user/i);
  });

  it('throws if required fields are missing', async () => {
    // @ts-expect-error - we want to test the error case
    await expect(createThread()).rejects.toThrow(/missing/i);
  });
});
