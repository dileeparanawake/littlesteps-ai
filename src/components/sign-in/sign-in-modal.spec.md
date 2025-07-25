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
- `onSignIn: () => void` - called when user click sign in with Button

## TODO

### Implement SignInModal state, handlers, and props

- [x] Define global state `displaySignInModal`
- [x] Define local state (`error`, `isAuthenticating`)
- [ ] Implement handlers (`handleSignInClick`, `handleBackdropClick`)
- [ ] Pass and consume props (`displaySignInModal`, `onClose`, `onSignIn`)

### ⚠️ Error Handling (refactor)

- [ ] Reuse or refactor error alert UI (e.g. shared alert component)

### 🔐 Integration

- [ ] Hook up `signIn.social()` via BetterAuth
- [ ] Gate prompt/route behind session state (`useSession()`)

### ✨ UX Polish

- [ ] Disable Sign In Button (while `isAuthenticating`)
