import { db } from '@/db';
import { user, verification } from '@/db/schema';

export async function wipeDB() {
  await db.delete(user); // Note: cascades to delete session, account, thread, message (via foreign key constraints on threadId).
  await db.delete(verification);
}
