import { db } from '@/db/index';
import { thread } from '@/db/schema';
import { throwIfUserDoesNotExist } from '@/db/guards';
import { throwIfMissingFields } from '@/lib/validation';
import { DEFAULT_THREAD_TITLE } from '@/lib/chat/thread-title';

export async function createThread(
  userId: string,
  title: string = DEFAULT_THREAD_TITLE,
) {
  throwIfMissingFields({ userId });
  await throwIfUserDoesNotExist(userId);

  const [newThread] = await db
    .insert(thread)
    .values({
      userId,
      title,
    })
    .returning();

  return newThread;
}
