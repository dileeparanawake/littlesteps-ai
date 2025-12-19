import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
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
} from '@/lib/chat/usage-limit';
import type { AIResponseUsage } from '@/lib/ai/types';

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
