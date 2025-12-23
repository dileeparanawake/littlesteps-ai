import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { testUser } from './test-data';
import { TestUser } from './test-types';

export async function createTestUser({
  id = testUser.id,
  name = testUser.name,
  email = testUser.email,
}: TestUser = testUser) {
  try {
    // Delete any existing user with this ID
    await db.delete(user).where(eq(user.id, id));

    // Insert new test user
    const [newUser] = await db
      .insert(user)
      .values({ id, name, email })
      .returning();

    return newUser;
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw new Error(
      `Failed to create test user: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
