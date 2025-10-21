import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

import { thread } from '@/db/schema';

import { createThread } from '@/lib/chat/create-thread';
import { wipeDB } from '../helpers/wipe-db';
import { createTestUser } from '../helpers/create-test-user';
import { makeTestUser } from '../helpers/test-data';

import { deleteThread } from '@/lib/chat/delete-thread';

const testUser = makeTestUser();

describe.sequential('deleteThread', () => {
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

  it('deletes a thread', async () => {
    const newThread = await createThread(testUser.id);

    const deletedThread = await deleteThread(testUser.id, newThread.id);

    expect(deletedThread.success).toBe(true);
  });
  it('returns false if the thread is not found', async () => {
    const newThread = await createThread(testUser.id);
    await deleteThread(testUser.id, newThread.id);
    const deletedThread = await deleteThread(testUser.id, newThread.id);
    expect(deletedThread.success).toBe(false);
  });
});
