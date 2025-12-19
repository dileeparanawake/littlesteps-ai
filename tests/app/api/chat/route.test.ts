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

// Mock assertSessionHasUser
const mockAssertSessionHasUser = vi.fn();
vi.mock('@/lib/access-control/assert-session-user', () => ({
  assertSessionHasUser: (...args: unknown[]) =>
    mockAssertSessionHasUser(...args),
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

// Mock AI adapter service
const mockGenerateResponse = vi.fn().mockResolvedValue({
  content: 'AI response',
  usage: undefined,
});

vi.mock('@/lib/ai/openai-response-service', () => ({
  OpenAIResponseService: {
    generateResponse: mockGenerateResponse,
  },
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
    // Re-establish adapter mock after reset
    mockGenerateResponse.mockResolvedValue({
      content: 'AI response',
      usage: undefined,
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
    expect(mockGenerateResponse).not.toHaveBeenCalled();
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
    expect(mockGenerateResponse).not.toHaveBeenCalled();
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
    // Assert: adapter was called with correct parameters
    expect(mockGenerateResponse).toHaveBeenCalledWith(
      [{ role: 'user', content: 'Hello' }],
      { threadId: 'thread-123' },
    );
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

  // --------------------------------------------------------------------------
  // Block E: Fail-fast ordering and ownership tests
  // --------------------------------------------------------------------------

  it('does not parse request body when access is denied', async () => {
    // Arrange: no session, enforceAccess denies with 401
    mockGetServerSession.mockResolvedValue(null);
    mockEnforceAccess.mockReturnValue({
      accessGranted: false,
      status: 401,
      error: 'Unauthorized - please sign in',
    });

    const { POST } = await import('@/app/api/chat/route');

    // Create a request with a spy on json() to track if it's called
    const req = createPostRequest('Hello');
    const jsonSpy = vi.spyOn(req, 'json');

    // Act
    const response = await POST(req);
    await response.json();

    // Assert: req.json was never called (body not parsed when access denied)
    expect(jsonSpy).not.toHaveBeenCalled();

    // Assert: business logic was NOT invoked
    expect(mockCreateThread).not.toHaveBeenCalled();
    expect(mockAddMessageToThread).not.toHaveBeenCalled();
    expect(mockGetThreadMessages).not.toHaveBeenCalled();
    expect(mockGenerateResponse).not.toHaveBeenCalled();
  });

  it('returns 403 when threadId provided but user does not own thread', async () => {
    // Arrange: valid session, access granted, but user doesn't own thread
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });
    mockUserOwnsThread.mockResolvedValue(false);

    const { POST } = await import('@/app/api/chat/route');

    const req = createPostRequest('Hello', 'thread-456');

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert: 403 response with Forbidden error
    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });

    // Assert: ownership check was called with correct args
    expect(mockUserOwnsThread).toHaveBeenCalledWith('thread-456', 'user-123');

    // Assert: thread operations were NOT invoked (ownership check blocked)
    expect(mockGetThreadMessages).not.toHaveBeenCalled();
    expect(mockAddMessageToThread).not.toHaveBeenCalled();
    expect(mockGenerateResponse).not.toHaveBeenCalled();
  });

  it('proceeds with existing thread when threadId provided and user owns thread', async () => {
    // Arrange: valid session, access granted, user owns thread
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });
    mockUserOwnsThread.mockResolvedValue(true);
    mockGetThreadMessages.mockResolvedValue([
      { role: 'user', content: 'Previous message' },
    ]);

    const { POST } = await import('@/app/api/chat/route');

    const req = createPostRequest('Hello', 'thread-456');

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert: success response with existing threadID
    expect(response.status).toBe(200);
    expect(body).toEqual({ threadID: 'thread-456' });

    // Assert: ownership check was called
    expect(mockUserOwnsThread).toHaveBeenCalledWith('thread-456', 'user-123');

    // Assert: getThreadMessages was called (not createThread)
    expect(mockGetThreadMessages).toHaveBeenCalledWith('thread-456');
    expect(mockCreateThread).not.toHaveBeenCalled();

    // Assert: adapter and message operations were invoked
    expect(mockAddMessageToThread).toHaveBeenCalled();
    expect(mockGenerateResponse).toHaveBeenCalledWith(
      [{ role: 'user', content: 'Previous message' }],
      { threadId: 'thread-456' },
    );
  });

  it('creates new thread when no threadId provided', async () => {
    // Arrange: valid session, access granted, no threadId
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });

    const { POST } = await import('@/app/api/chat/route');

    const req = createPostRequest('Hello');

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert: success response with new threadID
    expect(response.status).toBe(200);
    expect(body).toEqual({ threadID: 'thread-123' });

    // Assert: createThread was called (not userOwnsThread)
    expect(mockCreateThread).toHaveBeenCalledWith('user-123');
    expect(mockUserOwnsThread).not.toHaveBeenCalled();

    // Assert: business logic proceeded normally
    expect(mockAddMessageToThread).toHaveBeenCalled();
    expect(mockGetThreadMessages).toHaveBeenCalled();
    expect(mockGenerateResponse).toHaveBeenCalledWith(
      [{ role: 'user', content: 'Hello' }],
      { threadId: 'thread-123' },
    );
  });
});

// --------------------------------------------------------------------------
// POST /api/chat AIResponse content extraction tests
// --------------------------------------------------------------------------

describe('POST /api/chat AIResponse content extraction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: valid session and access granted
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });
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

  it('extracts content from AIResponse when writing assistant message', async () => {
    // Arrange: valid session, access granted, mock generateResponse with usage
    const expectedContent = 'expected content';
    mockGenerateResponse.mockResolvedValue({
      content: expectedContent,
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
    });

    const { POST } = await import('@/app/api/chat/route');

    const req = createPostRequest('Hello');

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert: success response
    expect(response.status).toBe(200);
    expect(body).toHaveProperty('threadID');

    // Assert: addMessageToThread was called with content extracted from AIResponse
    expect(mockAddMessageToThread).toHaveBeenCalled();
    // Find the call for assistant message (second argument is 'assistant')
    const assistantCall = mockAddMessageToThread.mock.calls.find(
      (call) => call[1] === 'assistant',
    );
    expect(assistantCall).toBeDefined();
    expect(assistantCall?.[2]).toBe(expectedContent);
  });

  it('extracts content correctly when usage is undefined', async () => {
    // Arrange: mock generateResponse with undefined usage
    const expectedContent = 'response without usage';
    mockGenerateResponse.mockResolvedValue({
      content: expectedContent,
      usage: undefined,
    });

    const { POST } = await import('@/app/api/chat/route');

    const req = createPostRequest('Hello');

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert: success response
    expect(response.status).toBe(200);
    expect(body).toHaveProperty('threadID');

    // Assert: addMessageToThread called with correct content (usage being undefined doesn't affect content extraction)
    expect(mockAddMessageToThread).toHaveBeenCalled();
    const assistantCall = mockAddMessageToThread.mock.calls.find(
      (call) => call[1] === 'assistant',
    );
    expect(assistantCall).toBeDefined();
    expect(assistantCall?.[2]).toBe(expectedContent);
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
