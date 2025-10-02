import { db } from '@/db';
import { message } from '@/db/schema';
import { throwIfThreadDoesNotExist } from '@/db/guards';
import { throwIfMissingFields } from '@/lib/validation';
import { eq, asc, desc } from 'drizzle-orm';
import type { MessageRow } from '@/db/schema';

export async function getThreadMessages(
  threadId: string,
): Promise<MessageRow[]> {
  throwIfMissingFields({ threadId });
  await throwIfThreadDoesNotExist(threadId);

  const messages = await db
    .select()
    .from(message)
    .where(eq(message.threadId, threadId))
    .orderBy(asc(message.sequence));
  return messages;
}

export async function getLastMessage(
  threadId: string,
): Promise<MessageRow | null> {
  throwIfMissingFields({ threadId });
  await throwIfThreadDoesNotExist(threadId);

  const lastMessage = await db
    .select()
    .from(message)
    .where(eq(message.threadId, threadId))
    .orderBy(desc(message.sequence))
    .limit(1);
  return lastMessage[0];
}
