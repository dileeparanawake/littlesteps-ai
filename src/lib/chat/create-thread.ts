import { db } from '@/db/index';
import { thread } from '@/db/schema';
import { validateRequiredFields } from '@/lib/utils';

export async function createThread(userId: string, title?: string) {
  validateRequiredFields({ userId, title });

  const [newThread] = await db
    .insert(thread)
    .values({
      userId,
      title,
    })
    .returning();

  console.log('newThread Created', newThread);

  return newThread;
}
