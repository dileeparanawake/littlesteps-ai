import { describe, it, expect } from 'vitest';
import { createTestUser } from '../helpers/create-test-user';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { viewTables } from '../helpers/view-tables';

describe('Create User', () => {
  const testUser = {
    id: 'user-id-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  it('creates a user with default values', async () => {
    const createdUser = await createTestUser({});
    expect(createdUser).toMatchObject(testUser);

    const [createdUserDB] = await db
      .select()
      .from(user)
      .where(eq(user.id, testUser.id));

    expect(createdUserDB).toMatchObject(testUser);

    await viewTables();
  });
});
