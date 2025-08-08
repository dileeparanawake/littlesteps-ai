import { describe, it, expect } from 'vitest';
import { createTestUser } from '../helpers/create-test-user';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { viewTables } from '../helpers/view-tables';
import { testUser } from '../helpers/test-data';

describe('Create User', () => {
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
