import { describe, it, expect, afterAll, beforeEach, beforeAll } from 'vitest';
import { addMessageToThread } from '@/lib/chat/add-message-to-thread';
import { wipeDB } from '../helpers/wipe-db';
import { createTestUser } from '../helpers/create-test-user';
import { makeTestUser } from '../helpers/test-data';
import { createThread } from '@/lib/chat/create-thread';
import { message } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { SYSTEM_MESSAGE } from '@/lib/chat/system-message';

const testUser = makeTestUser();

// TODO: add tests for:
// throw error no thread id
// throw error no role / content
// throw error if role is system
// throw error if same sequence number exists
// sequence correct for multiple messages

describe.sequential('addMessageToThread', () => {
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

  it('should add a message to a thread', async () => {
    const newThread = await createThread(testUser.id);
    const role = 'user';
    const content = 'Hello, world!';

    const newMessage = await addMessageToThread(newThread.id, role, content);

    const rows = await db
      .select()
      .from(message)
      .where(eq(message.id, newMessage.id));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: newMessage.id,
      threadId: newThread.id,
      sequence: newMessage.sequence,
      role: role,
      content: content,
    });
  });
  it('should add a system message to a thread', async () => {
    const newThread = await createThread(testUser.id);
    const role = 'user';
    const content = 'Hello, world!';

    await addMessageToThread(newThread.id, role, content);

    const rows = await db
      .select()
      .from(message)
      .where(eq(message.threadId, newThread.id));

    expect(rows).toHaveLength(2);
    expect(rows[0].role).toBe('system');
    expect(rows[0].content).toBe(SYSTEM_MESSAGE);
    expect(rows[1].role).toBe(role);
  });
});
