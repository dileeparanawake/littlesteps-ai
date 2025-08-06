import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const testUserId = 'user-id-123';

export async function createTestUser() {
  try {
    await db.delete(user).where(eq(user.id, testUserId));

    const [newUser] = await db
      .insert(user)
      .values({
        id: testUserId,
        name: 'Test User',
        email: 'test@example.com',
      })
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
