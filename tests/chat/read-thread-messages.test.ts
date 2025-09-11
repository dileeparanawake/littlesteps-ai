import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createThread } from '@/lib/chat/create-thread';
import { addMessageToThread } from '@/lib/chat/create-message';
import { wipeDB } from '../helpers/wipe-db';
import { createTestUser } from '../helpers/create-test-user';
import { makeTestUser } from '../helpers/test-data';
import {
  getThreadMessages,
  getLastMessage,
} from '@/lib/chat/read-thread-messages';
import { SYSTEM_MESSAGE } from '@/lib/chat/system-message';
import { MessageRole } from '@/db/enums';

const testUser = makeTestUser();

let newThread: Awaited<ReturnType<typeof createThread>>;

const expectedContents = [
  SYSTEM_MESSAGE,
  'First user message',
  'First assistant response',
  'Second user message',
  'Second assistant response',
];

async function createMessages(threadId: string): Promise<void> {
  const messagesInput = [
    { role: 'user', content: 'First user message' },
    { role: 'assistant', content: 'First assistant response' },
    { role: 'user', content: 'Second user message' },
    { role: 'assistant', content: 'Second assistant response' },
  ];

  for (const message of messagesInput) {
    await addMessageToThread(
      threadId,
      message.role as Exclude<MessageRole, 'system'>,
      message.content,
    );
  }
}

// test getThreadMessages(threadId) DB action (fetch + order by sequence)

describe.sequential('getThreadMessages', () => {
  beforeAll(async () => {
    await wipeDB();
    await createTestUser(testUser);
    newThread = await createThread(testUser.id);

    await createMessages(newThread.id);
  });

  afterAll(async () => {
    await wipeDB();
  });

  it('should return the messages in the correct order', async () => {
    const messages = await getThreadMessages(newThread.id);
    console.log('messages', messages);
    expect(messages).toHaveLength(expectedContents.length);

    expectedContents.forEach((expected, i) => {
      expect(messages[i].content).toBe(expected);
    });
  });
  it('should throw an error if the thread does not exist', async () => {
    await expect(getThreadMessages('123')).rejects.toThrow();
  });
  it('should throw an error if the threadId is not provided', async () => {
    await expect(getThreadMessages('')).rejects.toThrow();
  });
});

describe.sequential('getLastMessage', () => {
  beforeAll(async () => {
    await wipeDB();
    await createTestUser(testUser);
    newThread = await createThread(testUser.id);
    await createMessages(newThread.id);
  });

  afterAll(async () => {
    await wipeDB();
  });

  it('should return the last message', async () => {
    const [lastMessage] = await getLastMessage(newThread.id);
    console.log('lastMessage', lastMessage);
    expect(lastMessage.content).toBe('Second assistant response');
  });
  it('should throw an error if the thread does not exist', async () => {
    await expect(getLastMessage('123')).rejects.toThrow();
  });
  it('should throw an error if the threadId is not provided', async () => {
    await expect(getLastMessage('')).rejects.toThrow();
  });
});
