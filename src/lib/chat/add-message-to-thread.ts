import { db } from '@/db';
import { throwIfThreadDoesNotExist } from '@/db/guards';
import { MessageRole } from '@/db/enums';
import { message } from '@/db/schema';
import { createMessage } from '@/lib/chat/create-message';
import { throwIfMissingFields } from '@/lib/validation';
import { eq, desc } from 'drizzle-orm';
import { SYSTEM_MESSAGE } from './system-message';

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

  const nextSequence = await generateNextSequence(threadId);

  if (nextSequence === 0) {
    const systemRole: MessageRole = 'system';
    await createMessage(threadId, 0, systemRole, SYSTEM_MESSAGE);
    return await createMessage(threadId, 1, role, content);
  }

  return await createMessage(threadId, nextSequence, role, content);
}
