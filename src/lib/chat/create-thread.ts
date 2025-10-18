import { db } from '@/db/index';
import { thread } from '@/db/schema';
import { throwIfUserDoesNotExist } from '@/db/guards';
import { throwIfMissingFields } from '@/lib/validation';

export async function createThread(
  userId: string,
  title: string = 'Untitled Thread',
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

  // console.log('newThread Created', newThread);

  return newThread;
}
