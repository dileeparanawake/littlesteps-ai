import { db } from '@/db/index';
import { thread } from '@/db/schema';
import {
  throwIfThreadDoesNotExist,
  throwIfUserDoesNotExist,
} from '@/db/guards';
import { throwIfMissingFields } from '@/lib/validation';
import { and, eq } from 'drizzle-orm';

import type { ThreadRow } from '@/db/schema';

export async function renameThread(
  userId: string,
  threadId: string,
  title: string,
): Promise<ThreadRow> {
  throwIfMissingFields({ userId, threadId, title });
  await throwIfUserDoesNotExist(userId);
  await throwIfThreadDoesNotExist(threadId);

  const [renamedThread] = await db
    .update(thread)
    .set({ title })
    .where(and(eq(thread.id, threadId), eq(thread.userId, userId)))
    .returning();

  if (!renamedThread) {
    throw new Error('Failed to rename thread');
  }

  return renamedThread;
}
