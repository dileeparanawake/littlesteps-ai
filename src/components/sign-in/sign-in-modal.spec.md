# SignInModal Component Spec

## Purpose

A modal that appears when a user attempts to interact with the prompt UI while not logged in. It supports login via OAuth and handles basic error, dismissal, and loading states.

## Display Logic

- Show when: `displaySignInModal = true`
- Hide when: `displaySignInModal = false`
- Trigger by: unauthenticated user trying to submit a prompt
- Dismiss by: clicking outside modal
- On success: modal hidden, `isSignedIn` is set to true

## States

- `displaySignInModal: boolean` (parent root page segment)
- `error: string | null` (local)
- `isAuthenticating: boolean` (local)

## Behavior

| Event                             | Result                                            |
| --------------------------------- | ------------------------------------------------- |
| User clicks “Ask” unauthenticated | Show modal                                        |
| User clicks “Sign in”             | Trigger `useSession()`                            |
| User clicks backdrop              | Hide modal / clear authenticationError            |
| Authentication fails              | Show error message (in modal)                     |
| Authentication succeeds           | Hide modal, resume interaction, reset error state |

## Integration Points

- `useSession()` (via BetterAuth.js) to check if user is authenticated
- `displaySignInModal: boolean` (parent root page segment)
- `api/prompt/route.ts` ( Prompt is gated behind auth; login flow may resume this interaction)
- `signIn.social()` – Auth provider call (via BetterAuth.js)

## Handlers & Internal Logic

- `handleSignInClick()` – Triggers `signIn.social(...)` `setIsAuthenticating(true)`
- `handleBackdropClick()` – Hides modal and clears `error` `setIsAuthenticating(false)`

## Props

- `displaySignInModal: boolean` – Controls visibility of modal
- `onClose: () => void` – Called when user clicks backdrop or dismisses modal

## TODO

### Build Login Modal UI Skeleton

- [x] skeleton UI LoginModal Component
- [x] isLoggedIn state

### Implement SignInModal state, handlers, and props

- [x] Define global state `displaySignInModal`
- [x] Define local state (`error`, `isAuthenticating`)
- [x] Implement handlers (`handleSignInClick`, `handleBackdropClick`)
- [x] Implement handlers (`onClose`, )
- [x] Pass and consume props (`displaySignInModal`, `onClose`, )
- [x] Disable Sign In Button (while `isAuthenticating`)

### Configure Temporary Auth Database (SQLite)

- [x] Install `better-sqlite3` (or equivalent adapter)
- [x] Add temporary SQLite adapter in `lib/auth.ts`
- [x] Ensure `.db` & /better-auth_migrations files is `.gitignored` and `.dockerignored`
- [x] Generate and Migrate db
- [x] Add TODO in code: replace with PostgreSQL + Drizzle in MVS3

### Wire Up OAuth via BetterAuth

- [x] scaffold BetterAuth with Google provider and route handler (noDB)
- [x] call `signIn.social()` via BetterAuth signIn()
- [ ] update modal display state on auth success/failure
- [x] close modal on success
- [x] Gate prompt submission on client (`useSession()` in ChatThread)
- [x] Gate prompt API route on server (`getSession()` in route.ts)

### Error Handling (refactor)

- [ ] Reuse or refactor error alert UI (e.g. shared alert component)

### Conditional modal rendering

- [x] sign-in flow with session gating (client)
  - [x] hide modal default
  - [x] if user click's 'ask' display if user is unauthenticated
  - [x] hide modal if user clicks backdrop
  - [x] check session status inside chat-thread when user interacts

### UX Polish
