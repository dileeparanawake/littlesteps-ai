import { db } from '@/db';
import { message, thread } from '@/db/schema';
import { eq, and, gte, lt, sql } from 'drizzle-orm';

/**
 * Returns the start and end of the current week (or rolling 7-day window) in UTC.
 * @returns An object with `start` and `end` Date objects representing the week range
 */
export function getCurrentWeekRangeUtc(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * Returns the sum of `totalTokens` for all assistant messages owned by the user
 * within the current week range.
 * @param userId - The user ID to calculate usage for
 * @returns Promise resolving to the total token usage (number)
 */
export async function getWeeklyTokenUsageForUser(
  userId: string,
): Promise<number> {
  const range = getCurrentWeekRangeUtc();

  const result = await db
    .select({
      total: sql<number>`coalesce(sum(coalesce(${message.totalTokens}, 0)), 0)`,
    })
    .from(message)
    .innerJoin(thread, eq(message.threadId, thread.id))
    .where(
      and(
        eq(thread.userId, userId),
        eq(message.role, 'assistant'),
        gte(message.createdAt, range.start),
        lt(message.createdAt, range.end),
      ),
    );

  // Convert to number to ensure we return a number type (not string)
  // PostgreSQL SUM can return a string, so we need to convert it
  const total = result[0]?.total;
  if (total === null || total === undefined) {
    return 0;
  }
  return Number(total);
}
