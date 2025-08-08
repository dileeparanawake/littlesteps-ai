import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db } from '@/db';
import { user, thread } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  UserNotFoundError,
  ValidationError,
  ThreadNotFoundError,
} from './errors/errors';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Throws an error if any of the required fields, specified in the fields object, are missing.
export function throwIfMissingFields(fields: Record<string, any>) {
  const missingFields = Object.entries(fields)
    .filter(
      ([_, value]) => value === undefined || value === null || value === '',
    )
    .map(([key]) => key);

  if (missingFields.length > 0) {
    const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
    const error = new ValidationError(errorMessage);
    console.error(error.message);
    throw error;
  }
}

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
