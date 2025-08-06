import { db } from '@/db/index';
import { thread } from '@/db/schema';

export async function createThread(userId: string, title?: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!title) {
    throw new Error('Title is required');
  }

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
