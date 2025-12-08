# Task: Update Navigation

## Description

Update the navigation bar to use internal auth routes instead of external tryequipped.com links.

## Acceptance Criteria

- [ ] "Sign in" link points to `/sign-in`
- [ ] "Get Started" / "Sign up" links point to `/sign-up`
- [ ] Show user button when signed in
- [ ] Show sign-in/sign-up when signed out
- [ ] Mobile navigation updated

## Test Criteria

- [ ] Clicking "Sign in" navigates to `/sign-in`
- [ ] Clicking "Get Started" navigates to `/sign-up`
- [ ] When signed in, user avatar/menu appears
- [ ] When signed out, auth links appear
- [ ] Navigation works on mobile

## Dependencies

- auth/clerk-provider
- auth/auth-pages

## Files to Modify

- `src/pages/index.astro` (navigation section)
- Or extract to `src/components/Navigation.astro`

## Current Links to Update

Find and replace:
```html
<!-- Old -->
<a href="https://tryequipped.com/sign-in">Sign in</a>
<a href="https://tryequipped.com/sign-up">Get Started</a>

<!-- New -->
<a href="/sign-in">Sign in</a>
<a href="/sign-up">Get Started</a>
```

## Conditional Auth UI

```tsx
// src/components/auth/AuthButtons.tsx
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

export function AuthButtons() {
  return (
    <>
      <SignedOut>
        <a href="/sign-in">Sign in</a>
        <a href="/sign-up">Get Started</a>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  )
}
```

## References

- [Clerk UserButton](https://clerk.com/docs/components/user/user-button)
- [Clerk SignedIn/SignedOut](https://clerk.com/docs/components/control/signed-in)
- PLAN.md Phase 2.4
