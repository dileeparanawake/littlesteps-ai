// tests for F2, Block B — POST /api/admin/cleanup route

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --------------------------------------------------------------------------
// Mocks
// --------------------------------------------------------------------------

const mockVerifyGitHubOidc = vi.fn();
vi.mock('@/lib/cleanup/verify-github-oidc', () => ({
  verifyGitHubOidc: (...args: unknown[]) => mockVerifyGitHubOidc(...args),
}));

const mockFindInactiveUsers = vi.fn();
vi.mock('@/lib/cleanup/find-inactive-users', () => ({
  findInactiveUsers: (...args: unknown[]) => mockFindInactiveUsers(...args),
}));

const mockDeleteInactiveUsers = vi.fn();
vi.mock('@/lib/cleanup/delete-inactive-users', () => ({
  deleteInactiveUsers: (...args: unknown[]) =>
    mockDeleteInactiveUsers(...args),
}));

const mockPurgeExpiredVerifications = vi.fn();
vi.mock('@/lib/cleanup/purge-expired-verifications', () => ({
  purgeExpiredVerifications: (...args: unknown[]) =>
    mockPurgeExpiredVerifications(...args),
}));

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function createPostRequest(token?: string): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return new Request('http://localhost/api/admin/cleanup', {
    method: 'POST',
    headers,
  });
}

// --------------------------------------------------------------------------
// Authentication tests
// --------------------------------------------------------------------------

describe('POST /api/admin/cleanup — authentication', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 when no Authorization header is provided', async () => {
    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest();

    const response = await POST(req);

    expect(response.status).toBe(401);
    expect(mockFindInactiveUsers).not.toHaveBeenCalled();
    expect(mockDeleteInactiveUsers).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header is not Bearer scheme', async () => {
    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = new Request('http://localhost/api/admin/cleanup', {
      method: 'POST',
      headers: { Authorization: 'Basic abc123' },
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: 'Invalid authorization header format',
    });
  });

  it('returns 401 when OIDC token verification fails (invalid/expired JWT)', async () => {
    mockVerifyGitHubOidc.mockResolvedValue({
      success: false,
      status: 401,
      error: 'Invalid token',
    });

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('invalid-token');

    const response = await POST(req);

    expect(response.status).toBe(401);
    expect(mockFindInactiveUsers).not.toHaveBeenCalled();
    expect(mockDeleteInactiveUsers).not.toHaveBeenCalled();
  });

  it('returns 403 when JWT is valid but repository claim does not match', async () => {
    mockVerifyGitHubOidc.mockResolvedValue({
      success: false,
      status: 403,
      error: 'Repository mismatch',
    });

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('wrong-repo-token');

    const response = await POST(req);

    expect(response.status).toBe(403);
    expect(mockFindInactiveUsers).not.toHaveBeenCalled();
    expect(mockDeleteInactiveUsers).not.toHaveBeenCalled();
  });
});

// --------------------------------------------------------------------------
// Response shape and safety tests
// --------------------------------------------------------------------------

describe('POST /api/admin/cleanup — response shape and safety', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockVerifyGitHubOidc.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns 200 matching CleanupResponse success variant with message "Inactive users deleted" and deletedCount when inactive users found', async () => {
    const inactiveUsers = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        lastActiveDate: new Date(),
      },
      {
        id: 'user-2',
        email: 'user2@example.com',
        lastActiveDate: new Date(),
      },
    ];
    mockFindInactiveUsers.mockResolvedValue(inactiveUsers);
    mockDeleteInactiveUsers.mockResolvedValue(undefined);

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('valid-token');

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'Inactive users deleted',
      deletedCount: 2,
    });
  });

  it('returns 200 matching CleanupResponse success variant with message "No inactive users found" and deletedCount 0 when no inactive users', async () => {
    mockFindInactiveUsers.mockResolvedValue([]);

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('valid-token');

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'No inactive users found',
      deletedCount: 0,
    });
  });

  it('returns 500 matching CleanupResponse error variant with error "Inactive user cleanup failed" when deletion logic throws', async () => {
    mockFindInactiveUsers.mockResolvedValue([
      {
        id: 'user-1',
        email: 'user1@example.com',
        lastActiveDate: new Date(),
      },
    ]);
    mockDeleteInactiveUsers.mockRejectedValue(
      new Error('DB connection failed'),
    );

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('valid-token');

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: 'Inactive user cleanup failed',
    });
  });

  it('returns 500 matching CleanupResponse error variant when findInactiveUsers throws', async () => {
    mockFindInactiveUsers.mockRejectedValue(
      new Error('DB connection failed'),
    );

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('valid-token');

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: 'Inactive user cleanup failed',
    });
    expect(body.error).not.toContain('DB connection failed');
    expect(mockDeleteInactiveUsers).not.toHaveBeenCalled();
  });

  it('success response body contains only success, message, and deletedCount keys', async () => {
    mockFindInactiveUsers.mockResolvedValue([
      {
        id: 'user-1',
        email: 'user1@example.com',
        lastActiveDate: new Date(),
      },
    ]);
    mockDeleteInactiveUsers.mockResolvedValue(undefined);

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('valid-token');

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(body).sort()).toEqual([
      'deletedCount',
      'message',
      'success',
    ]);
  });

  it('error response body contains only success and error keys', async () => {
    mockFindInactiveUsers.mockResolvedValue([
      {
        id: 'user-1',
        email: 'user1@example.com',
        lastActiveDate: new Date(),
      },
    ]);
    mockDeleteInactiveUsers.mockRejectedValue(
      new Error('DB connection failed'),
    );

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('valid-token');

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(Object.keys(body).sort()).toEqual(['error', 'success']);
    expect(body.error).not.toContain('DB connection failed');
  });
});

// --------------------------------------------------------------------------
// Server-side logging tests
// --------------------------------------------------------------------------

describe('POST /api/admin/cleanup — server-side logging', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    mockVerifyGitHubOidc.mockResolvedValue({ success: true });
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.resetAllMocks();
  });

  it('logs userCleanupSucceeded CleanupLogEntry with message, deletedUserIds, and deletedCount on successful deletion', async () => {
    const inactiveUsers = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        lastActiveDate: new Date(),
      },
      {
        id: 'user-2',
        email: 'user2@example.com',
        lastActiveDate: new Date(),
      },
    ];
    mockFindInactiveUsers.mockResolvedValue(inactiveUsers);
    mockDeleteInactiveUsers.mockResolvedValue(undefined);

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('valid-token');

    await POST(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'userCleanupSucceeded',
        success: true,
        message: expect.any(String),
        deletedUserIds: ['user-1', 'user-2'],
        deletedCount: 2,
      }),
    );
  });

  it('logs userCleanupNoop CleanupLogEntry with message and deletedCount 0 when no inactive users found', async () => {
    mockFindInactiveUsers.mockResolvedValue([]);

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('valid-token');

    await POST(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'userCleanupNoop',
        success: true,
        message: expect.any(String),
        deletedCount: 0,
      }),
    );
  });

  it('logs userCleanupFailed CleanupLogEntry via console.error with message and errorMessage when deletion throws', async () => {
    mockFindInactiveUsers.mockResolvedValue([
      {
        id: 'user-1',
        email: 'user1@example.com',
        lastActiveDate: new Date(),
      },
    ]);
    mockDeleteInactiveUsers.mockRejectedValue(
      new Error('DB connection failed'),
    );

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('valid-token');

    await POST(req);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'userCleanupFailed',
        success: false,
        message: expect.any(String),
        errorMessage: expect.any(String),
      }),
    );
    errorSpy.mockRestore();
  });
});

// --------------------------------------------------------------------------
// Verification purge logging tests
// --------------------------------------------------------------------------

describe('POST /api/admin/cleanup — verification purge logging', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    mockVerifyGitHubOidc.mockResolvedValue({ success: true });
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.resetAllMocks();
  });

  it('logs verificationPurgeSucceeded after successful user deletion', async () => {
    mockFindInactiveUsers.mockResolvedValue([
      {
        id: 'user-1',
        email: 'user1@example.com',
        lastActiveDate: new Date(),
      },
    ]);
    mockDeleteInactiveUsers.mockResolvedValue(undefined);
    mockPurgeExpiredVerifications.mockResolvedValue(3);

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('valid-token');

    await POST(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'verificationPurgeSucceeded',
        success: true,
        message: expect.any(String),
        purgedCount: 3,
      }),
    );
  });

  it('logs verificationPurgeFailed when verification purge fails but user deletion succeeded', async () => {
    mockFindInactiveUsers.mockResolvedValue([
      {
        id: 'user-1',
        email: 'user1@example.com',
        lastActiveDate: new Date(),
      },
    ]);
    mockDeleteInactiveUsers.mockResolvedValue(undefined);
    mockPurgeExpiredVerifications.mockRejectedValue(
      new Error('Verification DB error'),
    );

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('valid-token');

    await POST(req);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'verificationPurgeFailed',
        success: false,
        message: expect.any(String),
        errorMessage: expect.any(String),
      }),
    );
    // User cleanup should still be logged as succeeded
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'userCleanupSucceeded',
        success: true,
      }),
    );
    errorSpy.mockRestore();
  });

  it('still returns 200 with correct user deletion summary even when verification purge fails', async () => {
    mockFindInactiveUsers.mockResolvedValue([
      {
        id: 'user-1',
        email: 'user1@example.com',
        lastActiveDate: new Date(),
      },
    ]);
    mockDeleteInactiveUsers.mockResolvedValue(undefined);
    mockPurgeExpiredVerifications.mockRejectedValue(
      new Error('Verification DB error'),
    );

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('valid-token');

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'Inactive users deleted',
      deletedCount: 1,
    });
    errorSpy.mockRestore();
  });

  it('logs verificationPurgeSucceeded after noop when no inactive users found', async () => {
    mockFindInactiveUsers.mockResolvedValue([]);
    mockPurgeExpiredVerifications.mockResolvedValue(5);

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('valid-token');

    await POST(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'verificationPurgeSucceeded',
        success: true,
        message: expect.any(String),
        purgedCount: 5,
      }),
    );
  });

  it('does not call purgeExpiredVerifications when user deletion throws', async () => {
    mockFindInactiveUsers.mockResolvedValue([
      {
        id: 'user-1',
        email: 'user1@example.com',
        lastActiveDate: new Date(),
      },
    ]);
    mockDeleteInactiveUsers.mockRejectedValue(
      new Error('DB connection failed'),
    );

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { POST } = await import('@/app/api/admin/cleanup/route');
    const req = createPostRequest('valid-token');

    await POST(req);

    expect(mockPurgeExpiredVerifications).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
