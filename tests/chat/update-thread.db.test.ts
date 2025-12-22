import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

import { thread } from '@/db/schema';

import { createThread } from '@/lib/chat/create-thread';
import { wipeDB } from '../helpers/wipe-db';
import { createTestUser } from '../helpers/create-test-user';
import { makeTestUser } from '../helpers/test-data';
import { renameThread } from '@/lib/chat/update-thread';

const testUser = makeTestUser();

describe.sequential('updateThread', () => {
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

  it('updates a thread title', async () => {
    const newThread = await createThread(testUser.id);

    const renamedThread = await renameThread(
      testUser.id,
      newThread.id,
      'New Title',
    );
    console.log('renamedThread:', renamedThread);
    expect(renamedThread.title).toBe('New Title');
    expect(renamedThread.userId).toBe(newThread.userId);
    expect(renamedThread.id).toBe(newThread.id);
  });
});
