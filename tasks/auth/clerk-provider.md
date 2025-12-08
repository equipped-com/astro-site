# Task: Setup ClerkProvider

## Description

Create a ClerkProvider wrapper component to provide Clerk context to React components.

## Acceptance Criteria

- [ ] `ClerkProvider` component created
- [ ] Publishable key loaded from environment
- [ ] Provider wraps all React auth components
- [ ] Works in Astro island architecture

## Test Criteria

- [ ] `useAuth()` hook works inside provider
- [ ] `useUser()` hook returns user data when signed in
- [ ] No console errors about missing provider
- [ ] Auth state persists across page navigation

## Dependencies

- auth/install-clerk
- auth/create-clerk-app

## Files to Create

- `src/components/auth/ClerkProvider.tsx`

## Component Example

```tsx
// src/components/auth/ClerkProvider.tsx
import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react'

interface Props {
  children: React.ReactNode
}

export function ClerkProvider({ children }: Props) {
  const publishableKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error('Missing CLERK_PUBLISHABLE_KEY')
  }

  return (
    <BaseClerkProvider publishableKey={publishableKey}>
      {children}
    </BaseClerkProvider>
  )
}
```

## Environment Setup

Add to `.env`:
```
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

Note: Use `PUBLIC_` prefix for client-side env vars in Astro.

## References

- [Clerk React Setup](https://clerk.com/docs/quickstarts/react)
- [Astro Environment Variables](https://docs.astro.build/en/guides/environment-variables/)
- PLAN.md Phase 2.2
