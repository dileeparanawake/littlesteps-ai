import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createThread } from '@/lib/chat/create-thread';
import { addMessageToThread } from '@/lib/chat/create-message';
import { wipeDB } from '../helpers/wipe-db';
import { createTestUser } from '../helpers/create-test-user';
import { makeTestUser } from '../helpers/test-data';
import { getThreadMessages } from '@/lib/chat/read-thread-messages';
import { SYSTEM_MESSAGE } from '@/lib/chat/system-message';

const testUser = makeTestUser();
let newThread: Awaited<ReturnType<typeof createThread>>;

// test getThreadMessages(threadId) DB action (fetch + order by sequence)

describe.sequential('getThreadMessages', () => {
  beforeAll(async () => {
    await wipeDB();
    await createTestUser(testUser);
    newThread = await createThread(testUser.id);
    await addMessageToThread(newThread.id, 'user', 'First user message');
    await addMessageToThread(
      newThread.id,
      'assistant',
      'First assistant response',
    );
    await addMessageToThread(newThread.id, 'user', 'Second user message');
    await addMessageToThread(
      newThread.id,
      'assistant',
      'Second assistant response',
    );
  });

  afterAll(async () => {
    await wipeDB();
  });

  it('should return the messages in the correct order', async () => {
    const messages = await getThreadMessages(newThread.id);
    console.log('messages', messages);
    expect(messages).toHaveLength(5);
    expect(messages[0].content).toBe(SYSTEM_MESSAGE);
    expect(messages[1].content).toBe('First user message');
    expect(messages[2].content).toBe('First assistant response');
    expect(messages[3].content).toBe('Second user message');
    expect(messages[4].content).toBe('Second assistant response');
  });
  it('should throw an error if the thread does not exist', async () => {
    await expect(getThreadMessages('123')).rejects.toThrow();
  });
  it('should throw an error if the threadId is not provided', async () => {
    await expect(getThreadMessages('')).rejects.toThrow();
  });
});
