import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { message } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createThread } from '@/lib/chat/create-thread';
import { createMessage } from '@/lib/chat/create-message';
import { wipeDB } from '../helpers/wipe-db';
import { createTestUser } from '../helpers/create-test-user';
import { makeTestUser } from '../helpers/test-data';

const testUser = makeTestUser();

describe.sequential('createMessage', () => {
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

  it('creates a message for the given thread', async () => {
    const newThread = await createThread(testUser.id);

    const newMessage = await createMessage(
      newThread.id,
      1,
      'user',
      'Hello, world!',
    );

    const rows = await db
      .select()
      .from(message)
      .where(eq(message.id, newMessage.id));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: newMessage.id,
      threadId: newThread.id,
      sequence: 1,
      role: 'user',
      content: 'Hello, world!',
    });
  });
});
