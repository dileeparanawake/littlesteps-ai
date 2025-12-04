// src/lib/access-control/enforce.ts

import type { AccessLevel, RoutePolicy } from './policy';
import type { Session } from '@/lib/server-session';
import { getAdminEmails } from './admin';
import { routePolicy } from './policy';

/**
 * Error messages for access control responses
 */
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized - please sign in',
  FORBIDDEN_ADMIN: 'Forbidden - admin access only',
  ROUTE_NOT_IN_POLICY: 'Route not in policy',
  UNKNOWN_ACCESS_LEVEL: (level: string) => `Unknown access level: ${level}`,
} as const;

/**
 * Simple auth state representation that decouples core logic
 * from framework-specific session types
 */
export type AuthContext = {
  isAuthenticated: boolean;
  email?: string;
};

/**
 * Discriminated union for access decisions
 */
export type AccessResult =
  | { accessGranted: true }
  | { accessGranted: false; status: 401 | 403; error: string };

/**
 * Look up access level for a route from policy map
 * @param routePath - The route path to look up
 * @param policy - The policy map to search
 * @returns The access level if found, null if not in policy
 */
export function getAccessLevel(
  routePath: string,
  policy: RoutePolicy,
): AccessLevel | null {
  return policy[routePath] ?? null;
}

/**
 * Transform framework-specific Session into simple, generic auth context
 * @param session - The session object or null
 * @returns AuthContext representing the authentication state
 */
export function toAuthContext(session: Session | null): AuthContext {
  if (!session || !session.user) {
    return {
      isAuthenticated: false,
      email: undefined,
    };
  }

  return {
    isAuthenticated: true,
    email: session.user.email?.toLowerCase(),
  };
}

/**
 * Pure access decision based on level + auth state + admin list
 * This is the heart of RBAC logic; fully testable in isolation
 * @param level - The required access level
 * @param authContext - The authentication context
 * @param adminEmails - List of admin email addresses
 * @returns AccessResult indicating whether access is granted
 */
export function decideAccess(
  level: AccessLevel,
  authContext: AuthContext,
  adminEmails: string[],
): AccessResult {
  // Public routes: always grant access
  if (level === 'public') {
    return { accessGranted: true };
  }

  // Both authenticated and admin routes require a valid session
  if (!authContext.isAuthenticated) {
    return {
      accessGranted: false,
      status: 401,
      error: ERROR_MESSAGES.UNAUTHORIZED,
    };
  }

  // Authenticated routes: session is sufficient
  if (level === 'authenticated') {
    return { accessGranted: true };
  }

  // Admin routes: require admin email
  if (level === 'admin') {
    if (!authContext.email || !adminEmails.includes(authContext.email)) {
      return {
        accessGranted: false,
        status: 403,
        error: ERROR_MESSAGES.FORBIDDEN_ADMIN,
      };
    }
    return { accessGranted: true };
  }

  // TypeScript exhaustiveness check (should never reach here)
  const _exhaustive: never = level;
  throw new Error(ERROR_MESSAGES.UNKNOWN_ACCESS_LEVEL(_exhaustive));
}

/**
 * Orchestrator function that enforces RBAC rules for API routes
 * based on the centralized policy map, session state, and admin email allowlist
 * @param routePath - The route path to check
 * @param session - The session object or null
 * @returns AccessResult indicating whether access is granted
 */
export function enforceAccess(
  routePath: string,
  session: Session | null,
): AccessResult {
  // Look up access level for the route
  const level = getAccessLevel(routePath, routePolicy);

  // Default-deny: routes not in policy are denied
  if (level === null) {
    return {
      accessGranted: false,
      status: 403,
      error: ERROR_MESSAGES.ROUTE_NOT_IN_POLICY,
    };
  }

  // Get admin emails from environment
  const adminEmails = getAdminEmails();

  // Transform session to auth context
  const authContext = toAuthContext(session);

  // Make access decision
  return decideAccess(level, authContext, adminEmails);
}
