import { db } from '@/db';
import { message } from '@/db/schema';
import { throwIfMissingFields, throwIfThreadDoesNotExist } from '@/lib/utils';
import { MessageRole } from '@/db/enums';

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

  console.log('newMessage Created', newMessage);

  return newMessage;
}
