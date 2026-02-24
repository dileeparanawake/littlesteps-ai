import { inArray } from 'drizzle-orm';

import { db } from '@/db';
import { user, verification } from '@/db/schema';
import type { InactiveUser } from './types';

export async function deleteInactiveUsers(
  users: InactiveUser[],
): Promise<void> {
  if (users.length === 0) return;

  const userIds = users.map((u) => u.id);
  const userEmails = users.map((u) => u.email);

  await db.delete(user).where(inArray(user.id, userIds));
  await db
    .delete(verification)
    .where(inArray(verification.identifier, userEmails));
}
