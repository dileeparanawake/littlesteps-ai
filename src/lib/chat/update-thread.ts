import { db } from '@/db/index';
import { thread } from '@/db/schema';
import {
  throwIfThreadDoesNotExist,
  throwIfUserDoesNotExist,
} from '@/db/guards';
import { throwIfMissingFields } from '@/lib/validation';
import { and, eq } from 'drizzle-orm';

export async function renameThread(
  userId: string,
  threadId: string,
  title: string,
) {
  throwIfMissingFields({ userId, threadId, title });
  await throwIfUserDoesNotExist(userId);
  await throwIfThreadDoesNotExist(threadId);

  const updatedThread = await db
    .update(thread)
    .set({ title })
    .where(and(eq(thread.id, threadId), eq(thread.userId, userId)));

  return updatedThread;
}
