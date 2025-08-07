import { db } from '@/db';
import { user, thread, message } from '@/db/schema';

export async function viewTables() {
  const users = await db.select().from(user);
  const threads = await db.select().from(thread);
  const messages = await db.select().from(message);
  console.log('\n View Tables snapshot \n');
  console.log('Users:');
  console.table(users);
  console.log('\nThreads:');
  console.table(threads);
  console.log('\nMessages:');
  console.table(messages);
}
