# Task: Create Auth Pages

## Description

Create sign-in and sign-up pages using Clerk's React components.

## Acceptance Criteria

- [ ] `src/pages/sign-in.astro` created with Clerk `<SignIn />` component
- [ ] `src/pages/sign-up.astro` created with Clerk `<SignUp />` component
- [ ] Pages use BaseLayout
- [ ] Styling matches site design (dark theme)
- [ ] Redirect to `/dashboard` after successful auth

## Test Criteria

- [ ] `/sign-in` renders Clerk sign-in form
- [ ] `/sign-up` renders Clerk sign-up form
- [ ] Sign-in redirects to `/dashboard` on success
- [ ] Sign-up redirects to `/dashboard` on success
- [ ] Error states display correctly

## Dependencies

- auth/install-clerk
- auth/create-clerk-app
- auth/clerk-provider

## Files to Create

- `src/pages/sign-in.astro`
- `src/pages/sign-up.astro`

## Component Examples

```astro
---
// src/pages/sign-in.astro
import BaseLayout from '@/layouts/BaseLayout.astro'
import SignInComponent from '@/components/auth/SignInComponent'
---
<BaseLayout title="Sign In - Equipped">
  <div class="min-h-screen flex items-center justify-center">
    <SignInComponent client:load />
  </div>
</BaseLayout>
```

```tsx
// src/components/auth/SignInComponent.tsx
import { SignIn } from '@clerk/clerk-react'

export default function SignInComponent() {
  return (
    <SignIn
      routing="path"
      path="/sign-in"
      afterSignInUrl="/dashboard"
    />
  )
}
```

## References

- [Clerk SignIn Component](https://clerk.com/docs/components/authentication/sign-in)
- [Clerk SignUp Component](https://clerk.com/docs/components/authentication/sign-up)
- PLAN.md Phase 2.3
