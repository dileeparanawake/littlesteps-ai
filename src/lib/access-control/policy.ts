// src/lib/access-control/policy.ts

/**
 * Access levels for route protection:
 * - "public": No authentication required
 * - "authenticated": Requires valid session
 * - "admin": Requires valid session + admin email
 */
export type AccessLevel = 'public' | 'authenticated' | 'admin';

/**
 * Type for the route policy map
 */
export type RoutePolicy = Record<string, AccessLevel>;

/**
 * Centralized route policy map
 * Maps route paths to their required access levels
 */
export const routePolicy: RoutePolicy = {
  '/api/chat': 'authenticated',
};

