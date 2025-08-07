import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

type TestUser = {
  id?: string;
  name?: string;
  email?: string;
};

export async function createTestUser({
  id = 'user-id-123',
  name = 'Test User',
  email = 'test@example.com',
}: TestUser) {
  try {
    // Delete any existing user with this ID
    await db.delete(user).where(eq(user.id, id));

    // Insert new test user
    const [newUser] = await db
      .insert(user)
      .values({ id, name, email })
      .returning();

    console.log('newUser Created', newUser);
    return newUser;
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw new Error(
      `Failed to create test user: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
