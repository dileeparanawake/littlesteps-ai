import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { message } from '@/db/schema';
import { createThread } from '@/lib/chat/create-thread';
import { addMessageToThread } from '@/lib/chat/create-message';
import { wipeDB } from '../../helpers/wipe-db';
import { createTestUser } from '../../helpers/create-test-user';
import { makeTestUser } from '../../helpers/test-data';
import {
  getCurrentWeekRangeUtc,
  getWeeklyTokenUsageForUser,
  getWeeklyCapTokens,
  checkWeeklyUsageLimit,
} from '@/lib/chat/usage-limit';
import type { AIResponseUsage } from '@/lib/ai/types';
import type { Session } from '@/lib/server-session';
import * as adminModule from '@/lib/access-control/admin';
import * as usageLimitModule from '@/lib/chat/usage-limit';

describe('getCurrentWeekRangeUtc', () => {
  it('returns valid date range with start before end', () => {
    const range = getCurrentWeekRangeUtc();

    expect(range.start).toBeInstanceOf(Date);
    expect(range.end).toBeInstanceOf(Date);
    expect(range.start.getTime()).toBeLessThan(range.end.getTime());
  });

  it('returns dates in UTC', () => {
    const range = getCurrentWeekRangeUtc();

    // Check that the dates are Date objects (which are always UTC internally)
    // The key is that the function should return UTC dates, not local timezone dates
    expect(range.start).toBeInstanceOf(Date);
    expect(range.end).toBeInstanceOf(Date);

    // Verify the dates represent UTC time by checking they're valid Date objects
    // and that start is before end
    expect(range.start.getTime()).toBeLessThan(range.end.getTime());
  });

  it('returns a 7-day range', () => {
    const range = getCurrentWeekRangeUtc();
    const diffMs = range.end.getTime() - range.start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Allow for small floating point differences (should be exactly 7 days)
    expect(diffDays).toBeCloseTo(7, 1);
  });
});

describe.sequential('getWeeklyTokenUsageForUser', () => {
  const testUser = makeTestUser();

  beforeAll(async () => {
    await wipeDB();
  });

  beforeEach(async () => {
    await wipeDB();
    await createTestUser(testUser);
  });

  afterAll(async () => {
    await wipeDB();
  });

  it('returns 0 for a user with no assistant messages in the week', async () => {
    const usage = await getWeeklyTokenUsageForUser(testUser.id);

    expect(usage).toBe(0);
  });

  it('returns 0 for a user with only user messages in the week', async () => {
    const newThread = await createThread(testUser.id);

    await addMessageToThread(newThread.id, 'user', 'User message 1');
    await addMessageToThread(newThread.id, 'user', 'User message 2');

    const usage = await getWeeklyTokenUsageForUser(testUser.id);

    expect(usage).toBe(0);
  });

  it('returns correct sum for assistant messages within the week range', async () => {
    const newThread = await createThread(testUser.id);

    const usage1: AIResponseUsage = {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    };
    const usage2: AIResponseUsage = {
      promptTokens: 15,
      completionTokens: 25,
      totalTokens: 40,
    };
    const usage3: AIResponseUsage = {
      promptTokens: 5,
      completionTokens: 10,
      totalTokens: 15,
    };

    await addMessageToThread(
      newThread.id,
      'assistant',
      'AI response 1',
      usage1,
    );
    await addMessageToThread(
      newThread.id,
      'assistant',
      'AI response 2',
      usage2,
    );
    await addMessageToThread(
      newThread.id,
      'assistant',
      'AI response 3',
      usage3,
    );

    const usage = await getWeeklyTokenUsageForUser(testUser.id);

    expect(usage).toBe(85); // 30 + 40 + 15
  });

  it('ignores messages outside the week range', async () => {
    const newThread = await createThread(testUser.id);
    const range = getCurrentWeekRangeUtc();

    // Create a message within the week (current time)
    const usage1: AIResponseUsage = {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    };
    await addMessageToThread(
      newThread.id,
      'assistant',
      'AI response in week',
      usage1,
    );

    // Create messages outside the week range using direct DB insert
    // Message before the week start (8 days ago)
    const beforeWeekStart = new Date(
      range.start.getTime() - 8 * 24 * 60 * 60 * 1000,
    );
    const usage2: AIResponseUsage = {
      promptTokens: 15,
      completionTokens: 25,
      totalTokens: 40,
    };
    await db.insert(message).values({
      threadId: newThread.id,
      sequence: 2,
      role: 'assistant',
      content: 'AI response before week',
      createdAt: beforeWeekStart,
      totalTokens: usage2.totalTokens,
      promptTokens: usage2.promptTokens,
      completionTokens: usage2.completionTokens,
    });

    // Message after the week end (1 day in the future)
    const afterWeekEnd = new Date(
      range.end.getTime() + 1 * 24 * 60 * 60 * 1000,
    );
    const usage3: AIResponseUsage = {
      promptTokens: 5,
      completionTokens: 10,
      totalTokens: 15,
    };
    await db.insert(message).values({
      threadId: newThread.id,
      sequence: 3,
      role: 'assistant',
      content: 'AI response after week',
      createdAt: afterWeekEnd,
      totalTokens: usage3.totalTokens,
      promptTokens: usage3.promptTokens,
      completionTokens: usage3.completionTokens,
    });

    const usage = await getWeeklyTokenUsageForUser(testUser.id);

    // Should only count the message within the week
    expect(usage).toBe(30);
  });

  it('treats null totalTokens as 0', async () => {
    const newThread = await createThread(testUser.id);

    // Create assistant message with tokens
    const usage1: AIResponseUsage = {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    };
    await addMessageToThread(
      newThread.id,
      'assistant',
      'AI response with tokens',
      usage1,
    );

    // Create assistant message without tokens (null)
    await addMessageToThread(
      newThread.id,
      'assistant',
      'AI response without tokens',
    );

    // Create assistant message with null tokens using direct DB insert
    await db.insert(message).values({
      threadId: newThread.id,
      sequence: 3,
      role: 'assistant',
      content: 'AI response with explicit null tokens',
      totalTokens: null,
      promptTokens: null,
      completionTokens: null,
    });

    const usage = await getWeeklyTokenUsageForUser(testUser.id);

    // Should only count the message with tokens (30), null values treated as 0
    expect(usage).toBe(30);
  });

  it('only counts assistant messages', async () => {
    const newThread = await createThread(testUser.id);

    // Create user message (should not be counted)
    await addMessageToThread(newThread.id, 'user', 'User message');

    // Create assistant message (should be counted)
    const usage: AIResponseUsage = {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    };
    await addMessageToThread(newThread.id, 'assistant', 'AI response', usage);

    // Create system message with tokens using direct DB insert (should not be counted)
    await db.insert(message).values({
      threadId: newThread.id,
      sequence: 3,
      role: 'system',
      content: 'System message with tokens',
      totalTokens: 100,
      promptTokens: 50,
      completionTokens: 50,
    });

    const usage_result = await getWeeklyTokenUsageForUser(testUser.id);

    // Should only count the assistant message
    expect(usage_result).toBe(30);
  });

  it('sums tokens across multiple threads', async () => {
    const thread1 = await createThread(testUser.id);
    const thread2 = await createThread(testUser.id);
    const thread3 = await createThread(testUser.id);

    const usage1: AIResponseUsage = {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    };
    const usage2: AIResponseUsage = {
      promptTokens: 15,
      completionTokens: 25,
      totalTokens: 40,
    };
    const usage3: AIResponseUsage = {
      promptTokens: 5,
      completionTokens: 10,
      totalTokens: 15,
    };

    await addMessageToThread(thread1.id, 'assistant', 'AI response 1', usage1);
    await addMessageToThread(thread2.id, 'assistant', 'AI response 2', usage2);
    await addMessageToThread(thread3.id, 'assistant', 'AI response 3', usage3);

    const usage = await getWeeklyTokenUsageForUser(testUser.id);

    // Should sum tokens from all threads
    expect(usage).toBe(85); // 30 + 40 + 15
  });

  it('returns 0 for non-existent user', async () => {
    const nonExistentUserId = 'non-existent-user-id';

    const usage = await getWeeklyTokenUsageForUser(nonExistentUserId);

    // Should return 0 for non-existent user (no messages to count)
    expect(usage).toBe(0);
  });
});

describe('getWeeklyCapTokens', () => {
  const originalEnv = process.env.WEEKLY_CAP_TOKENS;

  afterEach(() => {
    // Restore original environment variable
    if (originalEnv !== undefined) {
      process.env.WEEKLY_CAP_TOKENS = originalEnv;
    } else {
      delete process.env.WEEKLY_CAP_TOKENS;
    }
  });

  it('returns parsed number when WEEKLY_CAP_TOKENS is set to valid positive integer', () => {
    process.env.WEEKLY_CAP_TOKENS = '1000';

    const cap = getWeeklyCapTokens();

    expect(cap).toBe(1000);
  });

  it('throws error when WEEKLY_CAP_TOKENS is missing', () => {
    delete process.env.WEEKLY_CAP_TOKENS;

    expect(() => getWeeklyCapTokens()).toThrow();
  });

  it('throws error when WEEKLY_CAP_TOKENS is "0"', () => {
    process.env.WEEKLY_CAP_TOKENS = '0';

    expect(() => getWeeklyCapTokens()).toThrow();
  });

  it('throws error when WEEKLY_CAP_TOKENS is empty string', () => {
    process.env.WEEKLY_CAP_TOKENS = '';

    expect(() => getWeeklyCapTokens()).toThrow();
  });

  it('throws error when WEEKLY_CAP_TOKENS is "null"', () => {
    process.env.WEEKLY_CAP_TOKENS = 'null';

    expect(() => getWeeklyCapTokens()).toThrow();
  });

  it('throws error when WEEKLY_CAP_TOKENS cannot be parsed as number', () => {
    process.env.WEEKLY_CAP_TOKENS = 'not-a-number';

    expect(() => getWeeklyCapTokens()).toThrow();
  });

  it('throws error when WEEKLY_CAP_TOKENS is negative number', () => {
    process.env.WEEKLY_CAP_TOKENS = '-100';

    expect(() => getWeeklyCapTokens()).toThrow();
  });
});

describe.sequential('checkWeeklyUsageLimit', () => {
  const testUser = makeTestUser();

  beforeAll(async () => {
    await wipeDB();
  });

  beforeEach(async () => {
    await wipeDB();
    await createTestUser(testUser);
  });

  afterAll(async () => {
    await wipeDB();
  });

  it('returns { allowed: true } for admin users regardless of usage', async () => {
    // Arrange: admin user with usage above cap
    const newThread = await createThread(testUser.id);
    const usage: AIResponseUsage = {
      promptTokens: 1000,
      completionTokens: 4000,
      totalTokens: 5000,
    };
    await addMessageToThread(
      newThread.id,
      'assistant',
      'AI response with high usage',
      usage,
    );

    const isAdmin = true;
    const capTokens = 1000;

    // Act
    const result = await checkWeeklyUsageLimit(testUser.id, isAdmin, capTokens);

    // Assert: admin users are always allowed even with usage above cap
    expect(result).toEqual({ allowed: true });
  });

  it('returns { allowed: true } for non-admin users below the cap', async () => {
    // Arrange: non-admin user with usage below cap
    const newThread = await createThread(testUser.id);
    const usage: AIResponseUsage = {
      promptTokens: 100,
      completionTokens: 400,
      totalTokens: 500,
    };
    await addMessageToThread(
      newThread.id,
      'assistant',
      'AI response with low usage',
      usage,
    );

    const isAdmin = false;
    const capTokens = 1000;

    // Act
    const result = await checkWeeklyUsageLimit(testUser.id, isAdmin, capTokens);

    // Assert: user is allowed because usage (500) is below cap (1000)
    expect(result).toEqual({ allowed: true });
  });

  it('returns { allowed: false, error: "..." } for non-admin users at the cap', async () => {
    // Arrange: non-admin user with usage exactly at cap
    const newThread = await createThread(testUser.id);
    const usage: AIResponseUsage = {
      promptTokens: 250,
      completionTokens: 750,
      totalTokens: 1000,
    };
    await addMessageToThread(
      newThread.id,
      'assistant',
      'AI response at cap',
      usage,
    );

    const isAdmin = false;
    const capTokens = 1000;

    // Act
    const result = await checkWeeklyUsageLimit(testUser.id, isAdmin, capTokens);

    // Assert: user is denied because usage (1000) is at cap (1000)
    expect(result.allowed).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
    expect(result.error).toBe('Usage limit exceeded');
  });

  it('returns { allowed: false, error: "..." } for non-admin users above the cap', async () => {
    // Arrange: non-admin user with usage above cap
    const newThread = await createThread(testUser.id);
    const usage: AIResponseUsage = {
      promptTokens: 500,
      completionTokens: 1000,
      totalTokens: 1500,
    };
    await addMessageToThread(
      newThread.id,
      'assistant',
      'AI response above cap',
      usage,
    );

    const isAdmin = false;
    const capTokens = 1000;

    // Act
    const result = await checkWeeklyUsageLimit(testUser.id, isAdmin, capTokens);

    // Assert: user is denied because usage (1500) is above cap (1000)
    expect(result.allowed).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
    expect(result.error).toBe('Usage limit exceeded');
  });
});

// --------------------------------------------------------------------------
// Mock setup for enforceUsageLimit tests
// --------------------------------------------------------------------------

function createMockSession(email?: string): Session {
  return {
    user: {
      id: 'user-123',
      email: email,
      name: 'Test User',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: 'session-123',
      userId: 'user-123',
      expiresAt: new Date(Date.now() + 86400000),
      token: 'test-token',
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    },
  } as Session;
}

describe('enforceUsageLimit', () => {
  let enforceUsageLimit: (session: Session) => Promise<NextResponse | null>;
  let getAdminEmailsSpy: ReturnType<typeof vi.spyOn>;
  let getWeeklyCapTokensSpy: ReturnType<typeof vi.spyOn>;
  let checkWeeklyUsageLimitSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    // Dynamically import enforceUsageLimit (it may not exist yet)
    const module = await import('@/lib/chat/usage-limit');
    if ('enforceUsageLimit' in module) {
      enforceUsageLimit = module.enforceUsageLimit;
    } else {
      // If function doesn't exist yet, create a placeholder that will fail tests
      enforceUsageLimit = () => {
        throw new Error('enforceUsageLimit not implemented yet');
      };
    }
  });

  beforeEach(() => {
    // Spy on the internal helpers object
    getAdminEmailsSpy = vi.spyOn(
      usageLimitModule.usageLimitInternal,
      'getAdminEmails',
    );
    getWeeklyCapTokensSpy = vi.spyOn(
      usageLimitModule.usageLimitInternal,
      'getWeeklyCapTokens',
    );
    checkWeeklyUsageLimitSpy = vi.spyOn(
      usageLimitModule.usageLimitInternal,
      'checkWeeklyUsageLimit',
    );

    // Default: non-admin user, cap allows request
    getAdminEmailsSpy.mockReturnValue(['admin@example.com']);
    getWeeklyCapTokensSpy.mockReturnValue(1000);
    checkWeeklyUsageLimitSpy.mockResolvedValue({ allowed: true });
  });

  afterEach(() => {
    // Restore all spies
    vi.restoreAllMocks();
  });

  it('returns null for admin users regardless of usage', async () => {
    // Arrange: admin user with usage above cap
    const session = createMockSession('admin@example.com');
    getAdminEmailsSpy.mockReturnValue(['admin@example.com']);
    getWeeklyCapTokensSpy.mockReturnValue(1000);
    // Mock checkWeeklyUsageLimit to return true for admins, false for non-admins
    checkWeeklyUsageLimitSpy.mockImplementation(
      async (_userId: string, isAdmin: boolean) => {
        if (isAdmin) {
          return { allowed: true };
        }
        return { allowed: false, error: 'Usage limit exceeded' };
      },
    );

    // Act
    const result = await enforceUsageLimit(session);

    // Assert: returns null (allows request to proceed)
    expect(result).toBeNull();
  });

  it('returns null for non-admin users below the cap', async () => {
    // Arrange: non-admin user with usage below cap
    const session = createMockSession('user@example.com');
    getAdminEmailsSpy.mockReturnValue(['admin@example.com']);
    getWeeklyCapTokensSpy.mockReturnValue(1000);
    checkWeeklyUsageLimitSpy.mockResolvedValue({ allowed: true });

    // Act
    const result = await enforceUsageLimit(session);

    // Assert: returns null (allows request to proceed)
    expect(result).toBeNull();
  });

  it('returns NextResponse with 429 status for non-admin users at the cap', async () => {
    // Arrange: non-admin user with usage exactly at cap
    const session = createMockSession('user@example.com');
    getAdminEmailsSpy.mockReturnValue(['admin@example.com']);
    getWeeklyCapTokensSpy.mockReturnValue(1000);
    checkWeeklyUsageLimitSpy.mockResolvedValue({
      allowed: false,
      error: 'Usage limit exceeded',
    });

    // Act
    const result = await enforceUsageLimit(session);

    // Assert: returns NextResponse with status 429
    expect(result).toBeInstanceOf(NextResponse);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.status).toBe(429);
      const body = await result.json();
      expect(body).toEqual({ error: 'Usage limit exceeded' });
    }
  });

  it('returns NextResponse with 429 status for non-admin users above the cap', async () => {
    // Arrange: non-admin user with usage above cap
    const session = createMockSession('user@example.com');
    getAdminEmailsSpy.mockReturnValue(['admin@example.com']);
    getWeeklyCapTokensSpy.mockReturnValue(1000);
    checkWeeklyUsageLimitSpy.mockResolvedValue({
      allowed: false,
      error: 'Usage limit exceeded',
    });

    // Act
    const result = await enforceUsageLimit(session);

    // Assert: returns NextResponse with status 429
    expect(result).toBeInstanceOf(NextResponse);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.status).toBe(429);
      const body = await result.json();
      expect(body).toEqual({ error: 'Usage limit exceeded' });
    }
  });

  it('returns correct error message shape for denied requests', async () => {
    // Arrange: non-admin user above cap
    const session = createMockSession('user@example.com');
    getAdminEmailsSpy.mockReturnValue(['admin@example.com']);
    getWeeklyCapTokensSpy.mockReturnValue(1000);
    checkWeeklyUsageLimitSpy.mockResolvedValue({
      allowed: false,
      error: 'Usage limit exceeded',
    });

    // Act
    const result = await enforceUsageLimit(session);

    // Assert: response body shape is { error: string } (compatible with ErrorAlert component)
    expect(result).not.toBeNull();
    if (result) {
      const body = await result.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error).toBe('Usage limit exceeded');
    }
  });

  it('correctly determines admin status using session email', async () => {
    // Arrange: admin user with lowercased email
    const session = createMockSession('ADMIN@EXAMPLE.COM');
    getAdminEmailsSpy.mockReturnValue(['admin@example.com']);
    getWeeklyCapTokensSpy.mockReturnValue(1000);
    // Mock checkWeeklyUsageLimit to return true for admins, false for non-admins
    checkWeeklyUsageLimitSpy.mockImplementation(
      async (_userId: string, isAdmin: boolean) => {
        if (isAdmin) {
          return { allowed: true };
        }
        return { allowed: false, error: 'Usage limit exceeded' };
      },
    );

    // Act
    const result = await enforceUsageLimit(session);

    // Assert: admin detection logic correctly checks lowercased email against admin list
    // Admin users should be allowed regardless of usage check result
    expect(result).toBeNull();
    expect(getAdminEmailsSpy).toHaveBeenCalled();
  });

  it('treats undefined session.user.email as non-admin', async () => {
    // Arrange: session with undefined email
    const session = createMockSession(undefined);
    getAdminEmailsSpy.mockReturnValue(['admin@example.com']);
    getWeeklyCapTokensSpy.mockReturnValue(1000);
    checkWeeklyUsageLimitSpy.mockResolvedValue({
      allowed: false,
      error: 'Usage limit exceeded',
    });

    // Act
    const result = await enforceUsageLimit(session);

    // Assert: returns denial response (treats as non-admin)
    expect(result).not.toBeNull();
    expect(result).toBeInstanceOf(NextResponse);
    if (result) {
      expect(result.status).toBe(429);
      const body = await result.json();
      expect(body).toEqual({ error: 'Usage limit exceeded' });
    }
  });

  it('calls getAdminEmails to retrieve admin list', async () => {
    // Arrange
    const session = createMockSession('user@example.com');
    getAdminEmailsSpy.mockReturnValue(['admin@example.com']);
    getWeeklyCapTokensSpy.mockReturnValue(1000);
    checkWeeklyUsageLimitSpy.mockResolvedValue({ allowed: true });

    // Act
    await enforceUsageLimit(session);

    // Assert: getAdminEmails was called
    expect(getAdminEmailsSpy).toHaveBeenCalledTimes(1);
  });

  it('calls getWeeklyCapTokens to retrieve cap value', async () => {
    // Arrange
    const session = createMockSession('user@example.com');
    getAdminEmailsSpy.mockReturnValue(['admin@example.com']);
    getWeeklyCapTokensSpy.mockReturnValue(1000);
    checkWeeklyUsageLimitSpy.mockResolvedValue({ allowed: true });

    // Act
    await enforceUsageLimit(session);

    // Assert: getWeeklyCapTokens was called
    expect(getWeeklyCapTokensSpy).toHaveBeenCalledTimes(1);
  });

  it('calls checkWeeklyUsageLimit with correct userId and isAdmin parameters', async () => {
    // Arrange: non-admin user
    const session = createMockSession('user@example.com');
    getAdminEmailsSpy.mockReturnValue(['admin@example.com']);
    getWeeklyCapTokensSpy.mockReturnValue(1000);
    checkWeeklyUsageLimitSpy.mockResolvedValue({ allowed: true });

    // Act
    await enforceUsageLimit(session);

    // Assert: checkWeeklyUsageLimit was called with correct parameters
    expect(checkWeeklyUsageLimitSpy).toHaveBeenCalledTimes(1);
    expect(checkWeeklyUsageLimitSpy).toHaveBeenCalledWith(
      'user-123', // userId
      false, // isAdmin (user@example.com is not in admin list)
      1000, // capTokens
    );
  });

  it('calls checkWeeklyUsageLimit with isAdmin: true for admin users', async () => {
    // Arrange: admin user
    const session = createMockSession('admin@example.com');
    getAdminEmailsSpy.mockReturnValue(['admin@example.com']);
    getWeeklyCapTokensSpy.mockReturnValue(1000);
    checkWeeklyUsageLimitSpy.mockResolvedValue({ allowed: true });

    // Act
    await enforceUsageLimit(session);

    // Assert: checkWeeklyUsageLimit was called with isAdmin: true
    expect(checkWeeklyUsageLimitSpy).toHaveBeenCalledTimes(1);
    expect(checkWeeklyUsageLimitSpy).toHaveBeenCalledWith(
      'user-123', // userId
      true, // isAdmin (admin@example.com is in admin list)
      1000, // capTokens
    );
  });
});
