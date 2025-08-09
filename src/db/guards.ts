import 'server-only';

import { db } from '@/db';
import { user, thread } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { UserNotFoundError, ThreadNotFoundError } from '../lib/errors/errors';

// DB Guard Functions - throws errors for invalid DB queries

export async function throwIfUserDoesNotExist(userId: string) {
  const userMatches = await db.select().from(user).where(eq(user.id, userId));
  if (userMatches.length === 0) {
    const error = new UserNotFoundError(userId);
    console.error(error.message);
    throw error;
  }
}

export async function throwIfThreadDoesNotExist(threadId: string) {
  const threadMatches = await db
    .select()
    .from(thread)
    .where(eq(thread.id, threadId));
  if (threadMatches.length === 0) {
    const error = new ThreadNotFoundError(threadId);
    console.error(error.message);
    throw error;
  }
}
