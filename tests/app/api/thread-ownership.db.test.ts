// Thread ownership, end to end through the real routes (ls#78).
//
// One parent must never see, post to, rename or delete another parent's chat.
// These tests run the real route handlers against a real Postgres: real
// BetterAuth session lookup (signed cookie -> session row), real access policy,
// real `userOwnsThread`. Only two things are stubbed:
//   - `next/headers`, because there is no HTTP request in a unit test; it hands
//     BetterAuth the cookie a signed-in browser would send.
//   - the OpenAI call, so no network or spend.

import { randomBytes, randomUUID } from 'node:crypto';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { message, session, thread } from '@/db/schema';
import { createThread } from '@/lib/chat/create-thread';
import { addMessageToThread } from '@/lib/chat/create-message';
import { wipeDB } from '../../helpers/wipe-db';
import { createTestUser } from '../../helpers/create-test-user';
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
} from '../../../e2e/support/session-seed';

// The cookie the "browser" sends on the next request. null = signed out.
let requestCookie: string | null = null;

vi.mock('next/headers', () => ({
  headers: async () =>
    new Headers(requestCookie ? { cookie: requestCookie } : {}),
}));

const mockGenerateResponse = vi.fn();
vi.mock('@/lib/ai/openai-response-service', () => ({
  OpenAIResponseService: {
    generateResponse: (...args: unknown[]) => mockGenerateResponse(...args),
  },
}));

// Import the routes after the mocks are registered.
const chatRoute = await import('@/app/api/chat/route');
const threadsRoute = await import('@/app/api/threads/route');

const parentA = { id: 'parent-a', name: 'Parent A', email: 'a@test.invalid' };
const parentB = { id: 'parent-b', name: 'Parent B', email: 'b@test.invalid' };
const B_SECRET = 'B private: night feeds and teething worries';

let cookieA: string;
let cookieB: string;
let threadB: { id: string };

async function signIn(userId: string): Promise<string> {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('BETTER_AUTH_SECRET must be set for this test');
  const token = randomBytes(24).toString('base64url');
  const now = new Date();
  await db.insert(session).values({
    id: randomUUID(),
    token,
    userId,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
  });
  return `${SESSION_COOKIE_NAME}=${signSessionToken(token, secret)}`;
}

function as(cookie: string | null) {
  requestCookie = cookie;
}

const chatUrl = (threadId?: string) =>
  `http://localhost/api/chat${threadId ? `?threadId=${threadId}` : ''}`;

function postChat(prompt: string, threadId?: string) {
  return chatRoute.POST(
    new Request(chatUrl(threadId), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }),
  );
}

function getChat(threadId: string) {
  return chatRoute.GET(new Request(chatUrl(threadId)));
}

function threadsRequest(method: 'PATCH' | 'DELETE', body: unknown) {
  return new Request('http://localhost/api/threads', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function messagesIn(threadId: string) {
  return db.select().from(message).where(eq(message.threadId, threadId));
}

describe.sequential('thread ownership through the real routes', () => {
  beforeAll(async () => {
    vi.stubEnv('WEEKLY_CAP_TOKENS', '1000000');
    await wipeDB();
    await createTestUser(parentA);
    await createTestUser(parentB);
    cookieA = await signIn(parentA.id);
    cookieB = await signIn(parentB.id);
  });

  beforeEach(async () => {
    as(null);
    mockGenerateResponse.mockReset();
    mockGenerateResponse.mockResolvedValue({ content: 'AI reply' });
    // A fresh thread for B each test, so a leak in one test can't hide another.
    await db.delete(thread).where(eq(thread.userId, parentB.id));
    threadB = await createThread(parentB.id, 'B thread');
    await addMessageToThread(threadB.id, 'user', B_SECRET);
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await wipeDB();
  });

  describe('parent A against parent B thread', () => {
    it('cannot read it', async () => {
      as(cookieA);
      const res = await getChat(threadB.id);
      expect(res.status).toBe(403);
      expect(JSON.stringify(await res.json())).not.toContain(B_SECRET);
    });

    it('cannot post to it, and nothing is written or sent to the AI', async () => {
      const before = await messagesIn(threadB.id);
      as(cookieA);
      const res = await postChat('hello from A', threadB.id);
      expect(res.status).toBe(403);
      expect(await messagesIn(threadB.id)).toHaveLength(before.length);
      expect(mockGenerateResponse).not.toHaveBeenCalled();
    });

    it('does not see it in their thread list', async () => {
      as(cookieA);
      await postChat('A own thread'); // A has a thread of their own
      const res = await threadsRoute.GET();
      expect(res.status).toBe(200);
      const list: { id: string; userId: string }[] = await res.json();
      expect(list.length).toBeGreaterThan(0);
      expect(list.map((t) => t.id)).not.toContain(threadB.id);
      expect(list.every((t) => t.userId === parentA.id)).toBe(true);
    });

    it('cannot rename it', async () => {
      as(cookieA);
      const res = await threadsRoute.PATCH(
        threadsRequest('PATCH', { threadId: threadB.id, title: 'hijacked' }),
      );
      expect(res.status).toBe(403);
      const [row] = await db
        .select()
        .from(thread)
        .where(eq(thread.id, threadB.id));
      expect(row.title).toBe('B thread');
    });

    it('cannot delete it', async () => {
      as(cookieA);
      const res = await threadsRoute.DELETE(
        threadsRequest('DELETE', { threadId: threadB.id }),
      );
      expect(res.status).toBe(403);
      const rows = await db
        .select()
        .from(thread)
        .where(eq(thread.id, threadB.id));
      expect(rows).toHaveLength(1);
    });
  });

  describe('signed out', () => {
    it('is refused on every chat and threads route', async () => {
      as(null);
      const responses = await Promise.all([
        getChat(threadB.id),
        postChat('hi', threadB.id),
        postChat('hi'),
        threadsRoute.GET(),
        threadsRoute.PATCH(
          threadsRequest('PATCH', { threadId: threadB.id, title: 'x' }),
        ),
        threadsRoute.DELETE(threadsRequest('DELETE', { threadId: threadB.id })),
      ]);
      expect(responses.map((r) => r.status)).toEqual([
        401, 401, 401, 401, 401, 401,
      ]);
      expect(mockGenerateResponse).not.toHaveBeenCalled();
    });

    it('is refused with a forged or unknown session cookie', async () => {
      as(
        `${SESSION_COOKIE_NAME}=${signSessionToken('no-such-token', 'wrong-secret')}`,
      );
      expect((await getChat(threadB.id)).status).toBe(401);
      expect((await threadsRoute.GET()).status).toBe(401);
    });
  });

  describe('the owner (parent B)', () => {
    it('can read their thread', async () => {
      as(cookieB);
      const res = await getChat(threadB.id);
      expect(res.status).toBe(200);
      expect(JSON.stringify(await res.json())).toContain(B_SECRET);
    });

    it('can post to their thread', async () => {
      as(cookieB);
      const res = await postChat('next question', threadB.id);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ threadID: threadB.id });
      const contents = (await messagesIn(threadB.id)).map((m) => m.content);
      expect(contents).toEqual(
        expect.arrayContaining(['next question', 'AI reply']),
      );
    });

    it('sees it in their thread list', async () => {
      as(cookieB);
      const res = await threadsRoute.GET();
      expect(res.status).toBe(200);
      const list: { id: string }[] = await res.json();
      expect(list.map((t) => t.id)).toContain(threadB.id);
    });

    it('can rename and delete it', async () => {
      as(cookieB);
      const renamed = await threadsRoute.PATCH(
        threadsRequest('PATCH', { threadId: threadB.id, title: 'Sleep' }),
      );
      expect(renamed.status).toBe(200);
      const deleted = await threadsRoute.DELETE(
        threadsRequest('DELETE', { threadId: threadB.id }),
      );
      expect(deleted.status).toBe(200);
    });
  });
});
