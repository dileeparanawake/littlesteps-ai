import { db } from '@/db/index';
import { thread } from '@/db/schema';
import {
  throwIfThreadDoesNotExist,
  throwIfUserDoesNotExist,
} from '@/db/guards';
import { throwIfMissingFields } from '@/lib/validation';
import { and, eq } from 'drizzle-orm';

export async function deleteThread(
  userId: string,
  threadId: string,
): Promise<{ success: boolean }> {
  throwIfMissingFields({ userId, threadId });
  await throwIfUserDoesNotExist(userId);

  const deletedThread = await db
    .delete(thread)
    .where(and(eq(thread.id, threadId), eq(thread.userId, userId)))
    .returning();

  if (deletedThread.length === 0) {
    return { success: false };
  }

  return { success: true };
}
