import { createThread } from '@/lib/chat/create-thread';
import { db } from '@/db/index';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { testUserId } from './create-test-user';

// Simulated input

const title = 'Thread Test Title';

export async function createTestThread() {
  try {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, testUserId))
      .then((rows) => rows[0]);

    if (!existingUser) {
      throw new Error(`Test user with ID ${testUserId} does not exist`);
    }
    // Create thread
    await createThread(testUserId, title);
  } catch (error) {
    console.error('Failed to create test thread:', error);
    throw new Error(
      `Failed to create test thread: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
