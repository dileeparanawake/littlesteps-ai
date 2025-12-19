import { db } from '@/db';
import { message, thread } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { Session } from '@/lib/server-session';
import { getAdminEmails } from '@/lib/access-control/admin';

/**
 * Result of a usage limit check.
 */
export interface UsageCheckResult {
  allowed: boolean;
  error?: string;
}

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
        lte(message.createdAt, range.end),
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

/**
 * Reads and validates WEEKLY_CAP_TOKENS from environment.
 * Throws an error if the environment variable is missing, null, undefined,
 * empty string, "0", or cannot be parsed as a positive integer.
 * @returns The validated cap value as a number
 */
export function getWeeklyCapTokens(): number {
  const envValue = process.env.WEEKLY_CAP_TOKENS;

  // Check if missing, null, or undefined
  if (envValue === undefined || envValue === null || envValue === '') {
    throw new Error('WEEKLY_CAP_TOKENS is missing or invalid');
  }

  // Check for explicit "0" or "null" string values
  if (envValue === '0' || envValue === 'null') {
    throw new Error('WEEKLY_CAP_TOKENS is missing or invalid');
  }

  // Parse as integer
  const parsed = Number.parseInt(envValue, 10);

  // Check if parsing failed (NaN) or if it's not a positive integer
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error('WEEKLY_CAP_TOKENS is missing or invalid');
  }

  return parsed;
}

/**
 * Checks if a user is allowed to proceed based on their weekly token usage.
 * Returns { allowed: true } immediately for admin users (regardless of usage).
 * For non-admin users, compares current weekly usage to the configured cap.
 * @param userId - The user ID to check usage for
 * @param isAdmin - Whether the user is an admin
 * @param capTokens - The token cap to enforce
 * @returns Promise resolving to UsageCheckResult indicating if the user can proceed
 */
export async function checkWeeklyUsageLimit(
  userId: string,
  isAdmin: boolean,
  capTokens: number,
): Promise<UsageCheckResult> {
  // Admin users are always allowed, regardless of usage
  if (isAdmin) {
    return { allowed: true };
  }

  // For non-admin users, check their current usage against the cap
  const currentUsage = await getWeeklyTokenUsageForUser(userId);

  // If usage is at or above the cap, deny the request
  if (currentUsage >= capTokens) {
    return {
      allowed: false,
      error: 'Usage limit exceeded',
    };
  }

  // Usage is below the cap, allow the request
  return { allowed: true };
}

/**
 * Internal helpers object that can be spied on in tests.
 * This pattern allows vitest spies to intercept calls to these functions.
 */
export const usageLimitInternal = {
  getAdminEmails,
  getWeeklyCapTokens,
  checkWeeklyUsageLimit,
};

/**
 * Enforces usage limit for a session by orchestrating admin detection,
 * cap retrieval, usage checking, and response generation.
 * Returns null if the request is allowed to proceed, or a NextResponse
 * with HTTP 429 status if the usage limit is exceeded.
 * @param session - The authenticated session
 * @returns Promise resolving to NextResponse (denied) or null (allowed)
 */
export async function enforceUsageLimit(
  session: Session,
): Promise<NextResponse | null> {
  // Extract user ID from session
  const userId = session.user.id;

  // Get admin email list
  const adminEmails = usageLimitInternal.getAdminEmails();

  // Extract and lowercase user email
  const userEmail = session.user.email?.toLowerCase() ?? '';

  // Determine admin status
  const isAdmin = adminEmails.includes(userEmail);

  // Get the weekly token cap
  const capTokens = usageLimitInternal.getWeeklyCapTokens();

  // Check usage limit
  const usageCheckResult = await usageLimitInternal.checkWeeklyUsageLimit(
    userId,
    isAdmin,
    capTokens,
  );

  // If usage check denies, return 429 response
  if (!usageCheckResult.allowed) {
    return NextResponse.json(
      { error: usageCheckResult.error },
      { status: 429 },
    );
  }

  // Usage check allows, return null to allow request to proceed
  return null;
}
