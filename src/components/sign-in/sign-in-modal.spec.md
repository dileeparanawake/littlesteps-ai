# LoginModal Component Spec

## Purpose

A modal that appears when a user attempts to interact with the prompt UI while not logged in. It supports login via OAuth and handles basic error, dismissal, and loading states.

## Display Logic

- Show when: `showSignininModal = true`
- Hidde when: `showSignininModal = false`
- Trigger by: unauthenticated user trying to submit a prompt
- Dismiss by: clicking outside modal
- On success: modal hidden, `isSignedIn` is set to true

## States

- `showSignInModal: boolean` (parent root page segment)
- `setError: string | null` (local)
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
- `showSignInModal: boolean` (parent root page segment)
- `api/prompt/route.ts` ( Prompt is gated behind auth; login flow may resume this interaction)
- `signIn.social()` – Auth provider call (via BetterAuth.js)

## Handlers & Internal Logic

User clicks button - handleSignInClick() calls signIn.social(...)
User clicks backdrop handleBackdropClick() (clears error + hides modal)
Auth error occurs handleError() (sets error message)

## Props

## TODO

- [ ] add states
- [ ] add show / hide logic
- [ ] add handlers
- [ ] pass props
- [ ] add error logic (refactor error handler chat-thread)
- [ ] add error alert (refactor chat error alert)

## Notes

Refactor alert (chat-thread) to primitive component
Update prompt/route gate flow on authentication state
