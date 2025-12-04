// tests for Slice 1, Block C — Access Enforcement Helper Function

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AccessLevel, RoutePolicy } from '@/lib/access-control/policy';
import type { Session } from '@/lib/server-session';

// Import the helpers under test (will be implemented in enforce.ts)
import {
  getAccessLevel,
  toAuthContext,
  decideAccess,
  enforceAccess,
  type AccessResult,
  type AuthContext,
} from '@/lib/access-control/enforce';

// Mock the admin module to control getAdminEmails behavior
vi.mock('@/lib/access-control/admin', () => ({
  getAdminEmails: vi.fn(() => ['admin@example.com']),
}));

// Mock the policy module to provide test routes
vi.mock('@/lib/access-control/policy', () => ({
  routePolicy: {
    '/api/public-route': 'public',
    '/api/auth-route': 'authenticated',
    '/api/admin-route': 'admin',
  } as RoutePolicy,
}));

import { getAdminEmails } from '@/lib/access-control/admin';

// --------------------------------------------------------------------------
// Test helpers for creating mock sessions
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

function createMockSessionWithoutUser(): Session {
  return {} as Session;
}

// --------------------------------------------------------------------------
// getAccessLevel tests
// --------------------------------------------------------------------------

describe('getAccessLevel', () => {
  const testPolicy: RoutePolicy = {
    '/api/public': 'public',
    '/api/authenticated': 'authenticated',
    '/api/admin': 'admin',
  };

  it('returns the access level when the route exists in the policy map', () => {
    expect(getAccessLevel('/api/public', testPolicy)).toBe('public');
    expect(getAccessLevel('/api/authenticated', testPolicy)).toBe(
      'authenticated',
    );
    expect(getAccessLevel('/api/admin', testPolicy)).toBe('admin');
  });

  it('returns null when the route does not exist in the policy map', () => {
    expect(getAccessLevel('/api/unknown', testPolicy)).toBeNull();
    expect(getAccessLevel('/api/not-registered', testPolicy)).toBeNull();
  });
});

// --------------------------------------------------------------------------
// toAuthContext tests
// --------------------------------------------------------------------------

describe('toAuthContext', () => {
  it('returns isAuthenticated false and undefined email when session is null', () => {
    const result = toAuthContext(null);
    expect(result).toEqual({
      isAuthenticated: false,
      email: undefined,
    });
  });

  it('returns isAuthenticated false and undefined email when session has no user', () => {
    const sessionWithoutUser = createMockSessionWithoutUser();
    const result = toAuthContext(sessionWithoutUser);
    expect(result).toEqual({
      isAuthenticated: false,
      email: undefined,
    });
  });

  it('returns isAuthenticated true with email when session user has an email', () => {
    const session = createMockSession('user@example.com');
    const result = toAuthContext(session);
    expect(result).toEqual({
      isAuthenticated: true,
      email: 'user@example.com',
    });
  });

  it('returns isAuthenticated true with undefined email when session user has no email', () => {
    const session = createMockSession(undefined);
    const result = toAuthContext(session);
    expect(result).toEqual({
      isAuthenticated: true,
      email: undefined,
    });
  });
});

// --------------------------------------------------------------------------
// decideAccess tests
// --------------------------------------------------------------------------

describe('decideAccess', () => {
  const unauthenticatedContext: AuthContext = {
    isAuthenticated: false,
    email: undefined,
  };

  const authenticatedContext: AuthContext = {
    isAuthenticated: true,
    email: 'user@example.com',
  };

  const adminContext: AuthContext = {
    isAuthenticated: true,
    email: 'admin@example.com',
  };

  const authenticatedNoEmailContext: AuthContext = {
    isAuthenticated: true,
    email: undefined,
  };

  const adminEmails = ['admin@example.com'];

  // Access level constants for type safety
  const publicLevel: AccessLevel = 'public';
  const authenticatedLevel: AccessLevel = 'authenticated';
  const adminLevel: AccessLevel = 'admin';

  // Public level tests
  it('grants access for public level regardless of auth context', () => {
    const resultUnauthenticated = decideAccess(
      publicLevel,
      unauthenticatedContext,
      adminEmails,
    );
    expect(resultUnauthenticated).toEqual({ accessGranted: true });

    const resultAuthenticated = decideAccess(
      publicLevel,
      authenticatedContext,
      adminEmails,
    );
    expect(resultAuthenticated).toEqual({ accessGranted: true });

    const resultAdmin = decideAccess(publicLevel, adminContext, adminEmails);
    expect(resultAdmin).toEqual({ accessGranted: true });
  });

  // Authenticated level tests
  it('denies access with 401 for authenticated level when user is not authenticated', () => {
    const result = decideAccess(
      authenticatedLevel,
      unauthenticatedContext,
      adminEmails,
    );
    expect(result).toEqual({
      accessGranted: false,
      status: 401,
      error: 'Unauthorized - please sign in',
    });
  });

  it('grants access for authenticated level when user is authenticated', () => {
    const result = decideAccess(
      authenticatedLevel,
      authenticatedContext,
      adminEmails,
    );
    expect(result).toEqual({ accessGranted: true });
  });

  // Admin level tests
  it('denies access with 401 for admin level when user is not authenticated', () => {
    const result = decideAccess(
      adminLevel,
      unauthenticatedContext,
      adminEmails,
    );
    expect(result).toEqual({
      accessGranted: false,
      status: 401,
      error: 'Unauthorized - please sign in',
    });
  });

  it('denies access with 403 for admin level when user is authenticated but not in admin list', () => {
    const result = decideAccess('admin', authenticatedContext, adminEmails);
    expect(result).toEqual({
      accessGranted: false,
      status: 403,
      error: 'Forbidden - admin access only',
    });
  });

  it('denies access with 403 for admin level when user is authenticated but email is undefined', () => {
    const result = decideAccess(
      'admin',
      authenticatedNoEmailContext,
      adminEmails,
    );
    expect(result).toEqual({
      accessGranted: false,
      status: 403,
      error: 'Forbidden - admin access only',
    });
  });

  it('grants access for admin level when user is authenticated and email is in admin list', () => {
    const result = decideAccess('admin', adminContext, adminEmails);
    expect(result).toEqual({ accessGranted: true });
  });
});

// --------------------------------------------------------------------------
// enforceAccess tests (integration-style)
// --------------------------------------------------------------------------

describe('enforceAccess', () => {
  beforeEach(() => {
    vi.mocked(getAdminEmails).mockReturnValue(['admin@example.com']);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Route not in policy
  it('denies access with 403 and route not in policy error when route is not in the policy map', () => {
    const result = enforceAccess('/api/unknown-route', null);
    expect(result).toEqual({
      accessGranted: false,
      status: 403,
      error: 'Route not in policy',
    });
  });

  // Public routes
  it('grants access for public routes regardless of session', () => {
    // No session
    const resultNoSession = enforceAccess('/api/public-route', null);
    expect(resultNoSession).toEqual({ accessGranted: true });

    // With session
    const session = createMockSession('user@example.com');
    const resultWithSession = enforceAccess('/api/public-route', session);
    expect(resultWithSession).toEqual({ accessGranted: true });
  });

  // Authenticated routes
  it('denies access with 401 for authenticated routes when session is null', () => {
    const result = enforceAccess('/api/auth-route', null);
    expect(result).toEqual({
      accessGranted: false,
      status: 401,
      error: 'Unauthorized - please sign in',
    });
  });

  it('grants access for authenticated routes when session is non-null', () => {
    const session = createMockSession('user@example.com');
    const result = enforceAccess('/api/auth-route', session);
    expect(result).toEqual({ accessGranted: true });
  });

  // Admin routes
  it('denies access with 401 for admin routes when session is null', () => {
    const result = enforceAccess('/api/admin-route', null);
    expect(result).toEqual({
      accessGranted: false,
      status: 401,
      error: 'Unauthorized - please sign in',
    });
  });

  it('denies access with 403 for admin routes when session is non-admin', () => {
    const session = createMockSession('user@example.com');
    const result = enforceAccess('/api/admin-route', session);
    expect(result).toEqual({
      accessGranted: false,
      status: 403,
      error: 'Forbidden - admin access only',
    });
  });

  it('grants access for admin routes when session is admin', () => {
    const session = createMockSession('admin@example.com');
    const result = enforceAccess('/api/admin-route', session);
    expect(result).toEqual({ accessGranted: true });
  });
});
