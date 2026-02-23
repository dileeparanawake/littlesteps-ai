import { eq, sql, notInArray } from 'drizzle-orm';

import { db } from '@/db';
import { user, session } from '@/db/schema';
import { getAdminEmails } from '@/lib/access-control/admin';
import type { InactiveUser } from './types';

const DEFAULT_INACTIVE_DAYS = 90;

export async function findInactiveUsers(): Promise<InactiveUser[]> {
  const rawInactiveDays =
    process.env.INACTIVE_DAYS ?? String(DEFAULT_INACTIVE_DAYS);
  const inactiveDays = parseInt(rawInactiveDays, 10);

  if (isNaN(inactiveDays)) {
    throw new Error(
      `INACTIVE_DAYS must be a valid number, got: "${rawInactiveDays}"`,
    );
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

  const adminEmails = getAdminEmails();

  const lastActive = sql<Date>`coalesce(max(${session.updatedAt}), ${user.createdAt})`;

  const results = await db
    .select({
      id: user.id,
      email: user.email,
      lastActiveDate: lastActive,
    })
    .from(user)
    .leftJoin(session, eq(user.id, session.userId))
    .where(
      adminEmails.length > 0
        ? notInArray(user.email, adminEmails)
        : undefined,
    )
    .groupBy(user.id)
    .having(sql`${lastActive} < ${cutoffDate}`);

  return results;
}
