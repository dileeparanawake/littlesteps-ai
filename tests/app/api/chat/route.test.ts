// tests for Slice 1, Block D — Guarded chat route integration
// tests for Slice 1, Block F — Guarded Chat GET Handler Integration

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';
import type { Session } from '@/lib/server-session';

// --------------------------------------------------------------------------
// Mocks
// --------------------------------------------------------------------------

// Mock getServerSession
const mockGetServerSession = vi.fn();
vi.mock('@/lib/server-session', () => ({
  default: () => mockGetServerSession(),
}));

// Mock enforceAccess and handleAccessDenial
const mockEnforceAccess = vi.fn();
const mockHandleAccessDenial = vi.fn();
vi.mock('@/lib/access-control/enforce', () => ({
  enforceAccess: (...args: unknown[]) => mockEnforceAccess(...args),
  handleAccessDenial: (...args: unknown[]) => mockHandleAccessDenial(...args),
}));

// Mock business logic functions
const mockCreateThread = vi.fn();
const mockAddMessageToThread = vi.fn();
const mockGetThreadMessages = vi.fn();
const mockUserOwnsThread = vi.fn();

vi.mock('@/lib/chat/create-thread', () => ({
  createThread: (...args: unknown[]) => mockCreateThread(...args),
}));

vi.mock('@/lib/chat/create-message', () => ({
  addMessageToThread: (...args: unknown[]) => mockAddMessageToThread(...args),
}));

vi.mock('@/lib/chat/read-thread', () => ({
  getThreadMessages: (...args: unknown[]) => mockGetThreadMessages(...args),
  userOwnsThread: (...args: unknown[]) => mockUserOwnsThread(...args),
}));

const mockCreateCompletion = vi.fn().mockResolvedValue({
  choices: [{ message: { content: 'AI response' } }],
});

const mockOpenAIInstance = {
  chat: {
    completions: {
      create: mockCreateCompletion,
    },
  },
};

// Mock OpenAI client
vi.mock('openai', () => ({
  __esModule: true,
  OpenAI: vi.fn().mockImplementation(() => mockOpenAIInstance),
}));

// --------------------------------------------------------------------------
// Test helpers
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

function createPostRequest(prompt: string, threadId?: string): Request {
  const url = threadId
    ? `http://localhost:3000/api/chat?threadId=${threadId}`
    : 'http://localhost:3000/api/chat';

  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
}

function createGetRequest(threadId: string): Request {
  const url = `http://localhost:3000/api/chat?threadId=${threadId}`;
  return new Request(url, {
    method: 'GET',
  });
}

// --------------------------------------------------------------------------
// POST /api/chat access control integration tests
// --------------------------------------------------------------------------

describe('POST /api/chat access control integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Re-establish OpenAI mock after reset
    mockCreateCompletion.mockResolvedValue({
      choices: [{ message: { content: 'AI response' } }],
    });
    // Default: business logic succeeds
    mockCreateThread.mockResolvedValue({ id: 'thread-123' });
    mockAddMessageToThread.mockResolvedValue(undefined);
    mockGetThreadMessages.mockResolvedValue([
      { role: 'user', content: 'Hello' },
    ]);
    // Default: handleAccessDenial mimics real behavior using NextResponse
    mockHandleAccessDenial.mockImplementation((accessResult) => {
      if (accessResult.accessGranted === false) {
        return NextResponse.json(
          { error: accessResult.error },
          { status: accessResult.status },
        );
      }
      return null;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 with error message when enforceAccess denies for missing session; business logic not invoked', async () => {
    // Arrange: no session, enforceAccess denies with 401
    mockGetServerSession.mockResolvedValue(null);
    mockEnforceAccess.mockReturnValue({
      accessGranted: false,
      status: 401,
      error: 'Unauthorized - please sign in',
    });

    // Import the handler fresh to apply mocks
    const { POST } = await import('@/app/api/chat/route');

    const req = createPostRequest('Hello');

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert: 401 response with error
    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized - please sign in' });

    // Assert: business logic was NOT invoked
    expect(mockCreateThread).not.toHaveBeenCalled();
    expect(mockAddMessageToThread).not.toHaveBeenCalled();
    expect(mockGetThreadMessages).not.toHaveBeenCalled();
  });

  it('returns 403 with error message when enforceAccess denies for authorization; business logic not invoked', async () => {
    // Arrange: session exists but enforceAccess denies with 403
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({
      accessGranted: false,
      status: 403,
      error: 'Forbidden - admin access only',
    });

    const { POST } = await import('@/app/api/chat/route');

    const req = createPostRequest('Hello');

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert: 403 response with error
    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden - admin access only' });

    // Assert: business logic was NOT invoked
    expect(mockCreateThread).not.toHaveBeenCalled();
    expect(mockAddMessageToThread).not.toHaveBeenCalled();
    expect(mockGetThreadMessages).not.toHaveBeenCalled();
  });

  it('returns success response when accessGranted is true; business logic is executed', async () => {
    // Arrange: valid session and access granted
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });

    const { POST } = await import('@/app/api/chat/route');

    const req = createPostRequest('Hello');

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert: success response
    expect(response.status).toBe(200);
    expect(body).toHaveProperty('threadID');

    // Assert: business logic WAS invoked
    expect(mockCreateThread).toHaveBeenCalledWith('user-123');
    expect(mockAddMessageToThread).toHaveBeenCalled();
    expect(mockGetThreadMessages).toHaveBeenCalled();
  });

  it('calls enforceAccess with "/api/chat" and the session returned by getServerSession', async () => {
    // Arrange: session and access granted
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });

    const { POST } = await import('@/app/api/chat/route');

    const req = createPostRequest('Hello');

    // Act
    await POST(req);

    // Assert: enforceAccess called with correct arguments
    expect(mockEnforceAccess).toHaveBeenCalledTimes(1);
    expect(mockEnforceAccess).toHaveBeenCalledWith('/api/chat', session);
  });
});

// --------------------------------------------------------------------------
// GET /api/chat access control integration tests
// --------------------------------------------------------------------------

describe('GET /api/chat access control integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: business logic succeeds
    mockGetThreadMessages.mockResolvedValue([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ]);
    mockUserOwnsThread.mockResolvedValue(true);
    // Default: handleAccessDenial mimics real behavior using NextResponse
    mockHandleAccessDenial.mockImplementation((accessResult) => {
      if (accessResult.accessGranted === false) {
        return NextResponse.json(
          { error: accessResult.error },
          { status: accessResult.status },
        );
      }
      return null;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 with error message when enforceAccess denies for missing session; business logic not invoked', async () => {
    // Arrange: no session, enforceAccess denies with 401
    mockGetServerSession.mockResolvedValue(null);
    mockEnforceAccess.mockReturnValue({
      accessGranted: false,
      status: 401,
      error: 'Unauthorized - please sign in',
    });

    // Import the handler fresh to apply mocks
    const { GET } = await import('@/app/api/chat/route');

    const req = createGetRequest('thread-123');

    // Act
    const response = await GET(req);
    const body = await response.json();

    // Assert: 401 response with error
    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized - please sign in' });

    // Assert: business logic was NOT invoked
    expect(mockUserOwnsThread).not.toHaveBeenCalled();
    expect(mockGetThreadMessages).not.toHaveBeenCalled();
  });

  it('returns 403 with error message when enforceAccess denies for authorization; business logic not invoked', async () => {
    // Arrange: session exists but enforceAccess denies with 403
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({
      accessGranted: false,
      status: 403,
      error: 'Forbidden - admin access only',
    });

    const { GET } = await import('@/app/api/chat/route');

    const req = createGetRequest('thread-123');

    // Act
    const response = await GET(req);
    const body = await response.json();

    // Assert: 403 response with error
    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden - admin access only' });

    // Assert: business logic was NOT invoked
    expect(mockUserOwnsThread).not.toHaveBeenCalled();
    expect(mockGetThreadMessages).not.toHaveBeenCalled();
  });

  it('returns success response when accessGranted is true; business logic is executed', async () => {
    // Arrange: valid session and access granted
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });
    mockUserOwnsThread.mockResolvedValue(true);
    mockGetThreadMessages.mockResolvedValue([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ]);

    const { GET } = await import('@/app/api/chat/route');

    const req = createGetRequest('thread-123');

    // Act
    const response = await GET(req);
    const body = await response.json();

    // Assert: success response
    expect(response.status).toBe(200);
    expect(body).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ]);

    // Assert: business logic WAS invoked
    expect(mockUserOwnsThread).toHaveBeenCalledWith('thread-123', 'user-123');
    expect(mockGetThreadMessages).toHaveBeenCalledWith('thread-123');
  });

  it('calls enforceAccess with "/api/chat" and the session returned by getServerSession', async () => {
    // Arrange: session and access granted
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });
    mockUserOwnsThread.mockResolvedValue(true);

    const { GET } = await import('@/app/api/chat/route');

    const req = createGetRequest('thread-123');

    // Act
    await GET(req);

    // Assert: enforceAccess called with correct arguments
    expect(mockEnforceAccess).toHaveBeenCalledTimes(1);
    expect(mockEnforceAccess).toHaveBeenCalledWith('/api/chat', session);
  });
});
