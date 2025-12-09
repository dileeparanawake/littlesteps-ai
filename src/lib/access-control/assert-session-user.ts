import type { Session } from '@/lib/server-session';

/**
 * Narrowed session type that guarantees `user.id` exists.
 * Used as the assertion target type for `assertSessionHasUser`.
 */
export type SessionWithUser = Session & { user: { id: string } };

/**
 * Assert that session and session.user exist after access control passes.
 *
 * This helper enforces the invariant that after `enforceAccess` + `handleAccessDenial`
 * pass for authenticated/admin routes, the session and session.user are guaranteed
 * to be present.
 *
 * @param session - The session returned by `getServerSession()`
 * @throws {Error} If session or session.user is missing (security invariant violation)
 */
export function assertSessionHasUser(
  session: Session | null | undefined,
): asserts session is SessionWithUser {
  if (!session || !session.user) {
    throw new Error(
      'Security invariant violation: session.user must exist after access control passes. ' +
        'This indicates a critical bug in the access control logic.',
    );
  }
}
