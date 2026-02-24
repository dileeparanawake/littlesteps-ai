import { lt, sql } from 'drizzle-orm';

import { db } from '@/db';
import { verification } from '@/db/schema';

export async function purgeExpiredVerifications(): Promise<number> {
  const deleted = await db
    .delete(verification)
    .where(lt(verification.expiresAt, sql`now() - interval '1 hour'`))
    .returning();

  return deleted.length;
}
