import { db } from '@/db';
import { message } from '@/db/schema';
import { throwIfThreadDoesNotExist } from '@/db/guards';
import { MessageRole } from '@/db/enums';
import { throwIfMissingFields } from '@/lib/validation';
import { eq, desc } from 'drizzle-orm';
import { SYSTEM_MESSAGE } from './system-message';

// create a new message in a thread
export async function createMessage(
  threadId: string,
  sequence: number,
  role: MessageRole,
  content: string,
) {
  throwIfMissingFields({ threadId, sequence, role, content });
  await throwIfThreadDoesNotExist(threadId);

  const [newMessage] = await db
    .insert(message)
    .values({ threadId, sequence, role, content })
    .returning();

  // console.log('newMessage Created', newMessage);

  return newMessage;
}

// add a new message to a thread

async function generateNextSequence(threadId: string) {
  const [lastMessage] = await db
    .select()
    .from(message)
    .where(eq(message.threadId, threadId))
    .orderBy(desc(message.sequence))
    .limit(1);

  // If there’s no message, start at 0, otherwise increment
  return lastMessage ? lastMessage.sequence + 1 : 0;
}

export async function addMessageToThread(
  threadId: string,
  role: Exclude<MessageRole, 'system'>,
  content: string,
) {
  throwIfMissingFields({ threadId, role, content });
  await throwIfThreadDoesNotExist(threadId);

  if ((role as MessageRole) === 'system') {
    throw new Error('System messages are not allowed');
  }

  const nextSequence = await generateNextSequence(threadId);

  if (nextSequence === 0) {
    const systemRole: MessageRole = 'system';
    await createMessage(threadId, 0, systemRole, SYSTEM_MESSAGE);
    return await createMessage(threadId, 1, role, content);
  }

  return await createMessage(threadId, nextSequence, role, content);
}
