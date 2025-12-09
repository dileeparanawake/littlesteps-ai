// tests for Slice 2, Block A — Integrate Access Control into GET Handler
// tests for Slice 2, Block B — Integrate Access Control into PATCH Handler
// tests for Slice 2, Block C — Integrate Access Control into DELETE Handler

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
const mockGetThreads = vi.fn();
const mockUserOwnsThread = vi.fn();
const mockRenameThread = vi.fn();
const mockDeleteThread = vi.fn();

vi.mock('@/lib/chat/read-thread', () => ({
  getThreads: (...args: unknown[]) => mockGetThreads(...args),
  userOwnsThread: (...args: unknown[]) => mockUserOwnsThread(...args),
}));

vi.mock('@/lib/chat/update-thread', () => ({
  renameThread: (...args: unknown[]) => mockRenameThread(...args),
}));

vi.mock('@/lib/chat/delete-thread', () => ({
  deleteThread: (...args: unknown[]) => mockDeleteThread(...args),
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

function createMockRequest(
  body: object,
  method: 'PATCH' | 'DELETE' = 'PATCH',
): Request {
  return new Request('http://localhost/api/threads', {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// --------------------------------------------------------------------------
// GET /api/threads access control integration tests
// --------------------------------------------------------------------------

describe('GET /api/threads access control integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: business logic succeeds
    mockGetThreads.mockResolvedValue([
      { id: 'thread-1', title: 'Thread 1', userId: 'user-123' },
      { id: 'thread-2', title: 'Thread 2', userId: 'user-123' },
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
    const { GET } = await import('@/app/api/threads/route');

    // Act
    const response = await GET();
    const body = await response.json();

    // Assert: 401 response with error
    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized - please sign in' });

    // Assert: business logic was NOT invoked
    expect(mockGetThreads).not.toHaveBeenCalled();
  });

  it('returns 403 with error message when enforceAccess denies for non-admin access; business logic not invoked', async () => {
    // Arrange: session exists but enforceAccess denies with 403
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({
      accessGranted: false,
      status: 403,
      error: 'Forbidden - admin access only',
    });

    const { GET } = await import('@/app/api/threads/route');

    // Act
    const response = await GET();
    const body = await response.json();

    // Assert: 403 response with error
    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden - admin access only' });

    // Assert: business logic was NOT invoked
    expect(mockGetThreads).not.toHaveBeenCalled();
  });

  it('returns success response when accessGranted is true; business logic is executed', async () => {
    // Arrange: valid session and access granted
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });
    mockGetThreads.mockResolvedValue([
      { id: 'thread-1', title: 'Thread 1', userId: 'user-123' },
      { id: 'thread-2', title: 'Thread 2', userId: 'user-123' },
    ]);

    const { GET } = await import('@/app/api/threads/route');

    // Act
    const response = await GET();
    const body = await response.json();

    // Assert: success response
    expect(response.status).toBe(200);
    expect(body).toEqual([
      { id: 'thread-1', title: 'Thread 1', userId: 'user-123' },
      { id: 'thread-2', title: 'Thread 2', userId: 'user-123' },
    ]);

    // Assert: business logic WAS invoked
    expect(mockGetThreads).toHaveBeenCalledWith('user-123');
  });

  it('calls enforceAccess with "/api/threads" and the session returned by getServerSession', async () => {
    // Arrange: session and access granted
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });

    const { GET } = await import('@/app/api/threads/route');

    // Act
    await GET();

    // Assert: enforceAccess called with correct arguments
    expect(mockEnforceAccess).toHaveBeenCalledTimes(1);
    expect(mockEnforceAccess).toHaveBeenCalledWith('/api/threads', session);
  });
});

// --------------------------------------------------------------------------
// PATCH /api/threads access control integration tests
// --------------------------------------------------------------------------

describe('PATCH /api/threads access control integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: business logic succeeds
    mockUserOwnsThread.mockResolvedValue(true);
    mockRenameThread.mockResolvedValue({
      id: 'thread-123',
      title: 'Updated Title',
      userId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
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

  it('returns 401 with error message when enforceAccess denies for missing session; business logic, request body parsing, and resource-level authorization not invoked', async () => {
    // Arrange: no session, enforceAccess denies with 401
    mockGetServerSession.mockResolvedValue(null);
    mockEnforceAccess.mockReturnValue({
      accessGranted: false,
      status: 401,
      error: 'Unauthorized - please sign in',
    });

    // Import the handler fresh to apply mocks
    const { PATCH } = await import('@/app/api/threads/route');

    const threadId = '123e4567-e89b-12d3-a456-426614174000';
    const req = createMockRequest({
      threadId: threadId,
      title: 'New Title',
    });

    // Act
    const response = await PATCH(req);
    const body = await response.json();

    // Assert: 401 response with error
    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized - please sign in' });

    // Assert: business logic was NOT invoked
    expect(mockUserOwnsThread).not.toHaveBeenCalled();
    expect(mockRenameThread).not.toHaveBeenCalled();
  });

  it('returns 403 with error message when enforceAccess denies for non-admin access; business logic, request body parsing, and resource-level authorization not invoked', async () => {
    // Arrange: session exists but enforceAccess denies with 403
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({
      accessGranted: false,
      status: 403,
      error: 'Forbidden - admin access only',
    });

    const { PATCH } = await import('@/app/api/threads/route');

    const threadId = '123e4567-e89b-12d3-a456-426614174000';
    const req = createMockRequest({
      threadId: threadId,
      title: 'New Title',
    });

    // Act
    const response = await PATCH(req);
    const body = await response.json();

    // Assert: 403 response with error
    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden - admin access only' });

    // Assert: business logic was NOT invoked
    expect(mockUserOwnsThread).not.toHaveBeenCalled();
    expect(mockRenameThread).not.toHaveBeenCalled();
  });

  it('returns success response when accessGranted is true; business logic is executed, including request body parsing and resource-level authorization', async () => {
    // Arrange: valid session and access granted
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });
    mockUserOwnsThread.mockResolvedValue(true);
    const threadId = '123e4567-e89b-12d3-a456-426614174000';
    const renamedThread = {
      id: threadId,
      title: 'Updated Title',
      userId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockRenameThread.mockResolvedValue(renamedThread);

    const { PATCH } = await import('@/app/api/threads/route');

    const req = createMockRequest({
      threadId: threadId,
      title: 'Updated Title',
    });

    // Act
    const response = await PATCH(req);
    const body = await response.json();

    // Assert: success response
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: threadId,
      title: 'Updated Title',
      userId: 'user-123',
    });

    // Assert: business logic WAS invoked with correct arguments
    expect(mockUserOwnsThread).toHaveBeenCalledWith(threadId, 'user-123');
    expect(mockRenameThread).toHaveBeenCalledWith(
      'user-123',
      threadId,
      'Updated Title',
    );
  });

  it('calls enforceAccess with "/api/threads" and the session returned by getServerSession', async () => {
    // Arrange: session and access granted
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });
    mockUserOwnsThread.mockResolvedValue(true);

    const { PATCH } = await import('@/app/api/threads/route');

    const threadId = '123e4567-e89b-12d3-a456-426614174000';
    const req = createMockRequest({
      threadId: threadId,
      title: 'Updated Title',
    });

    // Act
    await PATCH(req);

    // Assert: enforceAccess called with correct arguments
    expect(mockEnforceAccess).toHaveBeenCalledTimes(1);
    expect(mockEnforceAccess).toHaveBeenCalledWith('/api/threads', session);
  });

  it('resource-level authorization check (userOwnsThread) remains functional after access control passes and correctly returns 403 when user does not own the thread', async () => {
    // Arrange: valid session, access granted, but user does not own thread
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });
    mockUserOwnsThread.mockResolvedValue(false);

    const { PATCH } = await import('@/app/api/threads/route');

    const threadId = '123e4567-e89b-12d3-a456-426614174000';
    const req = createMockRequest({
      threadId: threadId,
      title: 'Updated Title',
    });

    // Act
    const response = await PATCH(req);
    const body = await response.json();

    // Assert: 403 response from resource-level check
    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });

    // Assert: userOwnsThread WAS called
    expect(mockUserOwnsThread).toHaveBeenCalledWith(threadId, 'user-123');

    // Assert: renameThread was NOT called (resource-level check prevented it)
    expect(mockRenameThread).not.toHaveBeenCalled();
  });
});

// --------------------------------------------------------------------------
// DELETE /api/threads access control integration tests
// --------------------------------------------------------------------------

describe('DELETE /api/threads access control integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: business logic succeeds
    mockUserOwnsThread.mockResolvedValue(true);
    mockDeleteThread.mockResolvedValue({ success: true });
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

  it('returns 401 with error message when enforceAccess denies for missing session; business logic, request body parsing, and resource-level authorization not invoked', async () => {
    // Arrange: no session, enforceAccess denies with 401
    mockGetServerSession.mockResolvedValue(null);
    mockEnforceAccess.mockReturnValue({
      accessGranted: false,
      status: 401,
      error: 'Unauthorized - please sign in',
    });

    // Import the handler fresh to apply mocks
    const { DELETE } = await import('@/app/api/threads/route');

    const threadId = '123e4567-e89b-12d3-a456-426614174000';
    const req = createMockRequest(
      {
        threadId: threadId,
      },
      'DELETE',
    );

    // Act
    const response = await DELETE(req);
    const body = await response.json();

    // Assert: 401 response with error
    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized - please sign in' });

    // Assert: business logic was NOT invoked
    expect(mockUserOwnsThread).not.toHaveBeenCalled();
    expect(mockDeleteThread).not.toHaveBeenCalled();
  });

  it('returns 403 with error message when enforceAccess denies for non-admin access; business logic, request body parsing, and resource-level authorization not invoked', async () => {
    // Arrange: session exists but enforceAccess denies with 403
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({
      accessGranted: false,
      status: 403,
      error: 'Forbidden - admin access only',
    });

    const { DELETE } = await import('@/app/api/threads/route');

    const threadId = '123e4567-e89b-12d3-a456-426614174000';
    const req = createMockRequest(
      {
        threadId: threadId,
      },
      'DELETE',
    );

    // Act
    const response = await DELETE(req);
    const body = await response.json();

    // Assert: 403 response with error
    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden - admin access only' });

    // Assert: business logic was NOT invoked
    expect(mockUserOwnsThread).not.toHaveBeenCalled();
    expect(mockDeleteThread).not.toHaveBeenCalled();
  });

  it('returns success response when accessGranted is true and thread is successfully deleted; business logic is executed, including request body parsing and resource-level authorization', async () => {
    // Arrange: valid session and access granted
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });
    mockUserOwnsThread.mockResolvedValue(true);
    mockDeleteThread.mockResolvedValue({ success: true });

    const { DELETE } = await import('@/app/api/threads/route');

    const threadId = '123e4567-e89b-12d3-a456-426614174000';
    const req = createMockRequest(
      {
        threadId: threadId,
      },
      'DELETE',
    );

    // Act
    const response = await DELETE(req);
    const body = await response.json();

    // Assert: success response
    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });

    // Assert: business logic WAS invoked with correct arguments
    expect(mockUserOwnsThread).toHaveBeenCalledWith(threadId, 'user-123');
    expect(mockDeleteThread).toHaveBeenCalledWith('user-123', threadId);
  });

  it('returns 404 with error message when accessGranted is true but thread does not exist; business logic is executed and 404 response is preserved', async () => {
    // Arrange: valid session, access granted, but thread does not exist
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });
    mockUserOwnsThread.mockResolvedValue(true);
    mockDeleteThread.mockResolvedValue({ success: false });

    const { DELETE } = await import('@/app/api/threads/route');

    const threadId = '123e4567-e89b-12d3-a456-426614174000';
    const req = createMockRequest(
      {
        threadId: threadId,
      },
      'DELETE',
    );

    // Act
    const response = await DELETE(req);
    const body = await response.json();

    // Assert: 404 response with error
    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'Thread not found' });

    // Assert: business logic WAS invoked (deleteThread was called)
    expect(mockDeleteThread).toHaveBeenCalledWith('user-123', threadId);
  });

  it('calls enforceAccess with "/api/threads" and the session returned by getServerSession', async () => {
    // Arrange: session and access granted
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });
    mockUserOwnsThread.mockResolvedValue(true);
    mockDeleteThread.mockResolvedValue({ success: true });

    const { DELETE } = await import('@/app/api/threads/route');

    const threadId = '123e4567-e89b-12d3-a456-426614174000';
    const req = createMockRequest(
      {
        threadId: threadId,
      },
      'DELETE',
    );

    // Act
    await DELETE(req);

    // Assert: enforceAccess called with correct arguments
    expect(mockEnforceAccess).toHaveBeenCalledTimes(1);
    expect(mockEnforceAccess).toHaveBeenCalledWith('/api/threads', session);
  });

  it('resource-level authorization check (userOwnsThread) remains functional after access control passes and correctly returns 403 when user does not own the thread', async () => {
    // Arrange: valid session, access granted, but user does not own thread
    const session = createMockSession('user@example.com');
    mockGetServerSession.mockResolvedValue(session);
    mockEnforceAccess.mockReturnValue({ accessGranted: true });
    mockUserOwnsThread.mockResolvedValue(false);

    const { DELETE } = await import('@/app/api/threads/route');

    const threadId = '123e4567-e89b-12d3-a456-426614174000';
    const req = createMockRequest(
      {
        threadId: threadId,
      },
      'DELETE',
    );

    // Act
    const response = await DELETE(req);
    const body = await response.json();

    // Assert: 403 response from resource-level check
    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });

    // Assert: userOwnsThread WAS called
    expect(mockUserOwnsThread).toHaveBeenCalledWith(threadId, 'user-123');

    // Assert: deleteThread was NOT called (resource-level check prevented it)
    expect(mockDeleteThread).not.toHaveBeenCalled();
  });
});
