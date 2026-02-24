import { inArray } from 'drizzle-orm';

import { db } from '@/db';
import { user } from '@/db/schema';
import type { InactiveUser } from './types';

export async function deleteInactiveUsers(
  users: InactiveUser[],
): Promise<void> {
  if (users.length === 0) return;

  const userIds = users.map((u) => u.id);

  await db.delete(user).where(inArray(user.id, userIds));
}
