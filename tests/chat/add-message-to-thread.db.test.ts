import { describe, it, expect, afterAll, beforeEach, beforeAll } from 'vitest';
// import { addMessageToThread } from '@/lib/chat/add-message-to-thread';
import { addMessageToThread } from '@/lib/chat/create-message';
import { wipeDB } from '../helpers/wipe-db';
import { createTestUser } from '../helpers/create-test-user';
import { makeTestUser } from '../helpers/test-data';
import { createThread } from '@/lib/chat/create-thread';
import { message } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { SYSTEM_MESSAGE } from '@/lib/chat/system-message';

const testUser = makeTestUser();

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

  it('should add new message to a thread', async () => {
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
  it('should add a system message at sequence 0', async () => {
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
  it('adds fourth message at sequence 4', async () => {
    const newThread = await createThread(testUser.id);

    const messages = [
      { threadId: newThread.id, role: 'user', content: 'First message' },
      { threadId: newThread.id, role: 'assistant', content: 'Second message' },
      { threadId: newThread.id, role: 'user', content: 'Third message' },
      { threadId: newThread.id, role: 'assistant', content: 'Fourth message' },
    ] as const;

    for (const message of messages) {
      await addMessageToThread(message.threadId, message.role, message.content);
    }

    const rows = await db
      .select()
      .from(message)
      .where(eq(message.threadId, newThread.id));

    expect(rows).toHaveLength(5);
    expect(rows[0].sequence).toBe(0);
    expect(rows[1].sequence).toBe(1);
    expect(rows[2].sequence).toBe(2);
    expect(rows[3].sequence).toBe(3);
    expect(rows[4].sequence).toBe(4);
    expect(rows[4].content).toBe('Fourth message');
  });
  it('throws error if thread does not exist', async () => {
    const threadId = '123';
    const role = 'user';
    const content = 'Hello, world!';

    await expect(addMessageToThread(threadId, role, content)).rejects.toThrow();
  });
  it('throws error for invalid role', async () => {
    const newThread = await createThread(testUser.id);

    const content = 'Hello, world!';

    await expect(
      addMessageToThread(newThread.id, 'system' as unknown as any, content),
    ).rejects.toThrow();
  });
  it('throws error if content is empty', async () => {
    const newThread = await createThread(testUser.id);

    await expect(
      addMessageToThread(newThread.id, 'user', ''),
    ).rejects.toThrow();
  });
});
