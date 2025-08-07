import { db } from '@/db';
import { message } from '@/db/schema';
import { validateRequiredFields } from '@/lib/utils';
import { MessageRole } from '@/db/enums';

export async function createMessage(
  threadId: string,
  sequence: number,
  role: MessageRole,
  content: string,
) {
  validateRequiredFields({ threadId, sequence, role, content });

  const [newMessage] = await db
    .insert(message)
    .values({ threadId, sequence, role, content })
    .returning();

  console.log('newMessage Created', newMessage);

  return newMessage;
}
