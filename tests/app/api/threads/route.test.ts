// tests for Slice 2, Block A — Integrate Access Control into GET Handler

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

vi.mock('@/lib/chat/read-thread', () => ({
  getThreads: (...args: unknown[]) => mockGetThreads(...args),
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
