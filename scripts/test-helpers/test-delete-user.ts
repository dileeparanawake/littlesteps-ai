import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { testUserId } from './create-test-user';

export async function deleteTestUser() {
  try {
    await db.delete(user).where(eq(user.id, testUserId));

    console.log('Test user deleted');
  } catch (error) {
    console.error('Error deleting test user:', error);
    throw new Error(
      `Failed to delete test user: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
