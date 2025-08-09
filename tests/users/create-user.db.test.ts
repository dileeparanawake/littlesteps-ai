import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createTestUser } from '../helpers/create-test-user';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { viewTables } from '../helpers/view-tables';
import { makeTestUser } from '../helpers/test-data';
import { wipeDB } from '../helpers/wipe-db';

describe.sequential('Create User', () => {
  beforeEach(async () => {
    await wipeDB();
  });

  afterAll(async () => {
    await wipeDB();
  });

  it('creates a user with default values', async () => {
    const testUser = makeTestUser();
    const createdUser = await createTestUser(testUser);
    expect(createdUser).toMatchObject(testUser);

    const [createdUserDB] = await db
      .select()
      .from(user)
      .where(eq(user.id, testUser.id));

    expect(createdUserDB).toMatchObject(testUser);

    await viewTables();
  });
});
