// tests for Slice 2, Block D — Implement Session Assertion Helper for RBAC Handlers

import { describe, it, expect } from 'vitest';
import type { Session } from '@/lib/server-session';
import { assertSessionHasUser } from '@/lib/access-control/assert-session-user';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function createValidMockSession(): Session {
  return {
    user: {
      id: 'user-123',
      email: 'user@example.com',
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

function createSessionWithoutUser(): Session {
  return {
    user: null,
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
  } as unknown as Session;
}

function createSessionWithUndefinedUser(): Session {
  return {
    user: undefined,
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
  } as unknown as Session;
}

// --------------------------------------------------------------------------
// assertSessionHasUser helper tests
// --------------------------------------------------------------------------

describe('assertSessionHasUser', () => {
  it('throws error when session is null', () => {
    // Arrange
    const session = null;

    // Act & Assert
    expect(() => assertSessionHasUser(session)).toThrow();
  });

  it('throws error when session is undefined', () => {
    // Arrange
    const session = undefined;

    // Act & Assert
    expect(() => assertSessionHasUser(session)).toThrow();
  });

  it('throws error when session exists but session.user is null', () => {
    // Arrange
    const session = createSessionWithoutUser();

    // Act & Assert
    expect(() => assertSessionHasUser(session)).toThrow();
  });

  it('throws error when session exists but session.user is undefined', () => {
    // Arrange
    const session = createSessionWithUndefinedUser();

    // Act & Assert
    expect(() => assertSessionHasUser(session)).toThrow();
  });

  it('returns normally (does not throw) when session.user exists with id property', () => {
    // Arrange
    const session = createValidMockSession();

    // Act & Assert: should not throw
    expect(() => assertSessionHasUser(session)).not.toThrow();

    // After assertion, session.user.id should be accessible
    assertSessionHasUser(session);
    expect(session.user.id).toBe('user-123');
  });

  it('error message clearly indicates invariant violation', () => {
    // Arrange
    const session = null;

    // Act & Assert: verify error message mentions invariant violation
    expect(() => assertSessionHasUser(session)).toThrow(
      /invariant|security|violation/i,
    );
  });
});
