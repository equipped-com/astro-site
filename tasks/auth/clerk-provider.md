# Task: Setup ClerkProvider

## Description

Create a ClerkProvider wrapper component to provide Clerk context to React components. This component handles session management and makes authentication state available throughout the React component tree within Astro islands.

## Acceptance Criteria

- [ ] ClerkProvider component created
- [ ] Publishable key loaded from environment
- [ ] Provider wraps all React auth components
- [ ] Works with Astro island architecture
- [ ] Session state persists across navigation
- [ ] Loading states handled gracefully

## Test Criteria

```gherkin
Feature: Clerk Provider Setup
  As a developer
  I want ClerkProvider properly configured
  So that authentication works throughout the app

  @REQ-PROVIDER-001
  Scenario: Provider initialization
    Given ClerkProvider is rendered
    And PUBLIC_CLERK_PUBLISHABLE_KEY is set
    Then Clerk should initialize without errors
    And children components should render

  @REQ-PROVIDER-002
  Scenario: Missing publishable key
    Given PUBLIC_CLERK_PUBLISHABLE_KEY is not set
    When ClerkProvider attempts to render
    Then an error should be thrown
    And error message should indicate missing key

  @REQ-PROVIDER-003
  Scenario: useAuth hook works
    Given I am inside ClerkProvider
    When I call useAuth()
    Then I should get auth state
    And isLoaded should eventually be true

  @REQ-PROVIDER-004
  Scenario: useUser hook returns user data
    Given I am signed in
    And I am inside ClerkProvider
    When I call useUser()
    Then user.id should be present
    And user.emailAddresses should contain my email

  @REQ-PROVIDER-005
  Scenario: Auth state persists across navigation
    Given I am signed in
    When I navigate between pages
    Then I should remain signed in
    And no re-authentication should be required

  @REQ-PROVIDER-006
  Scenario: Loading state handling
    Given ClerkProvider is initializing
    When isLoaded is false
    Then loading indicator should be shown
    And children should not render prematurely
```

## Dependencies

- auth/install-clerk
- auth/create-clerk-app

## Files to Create

- `src/components/auth/ClerkProvider.tsx`
- `src/components/auth/AuthLoader.tsx`

## Implementation

```tsx
// src/components/auth/ClerkProvider.tsx
import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function ClerkProvider({ children }: Props) {
  const publishableKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error(
      'Missing PUBLIC_CLERK_PUBLISHABLE_KEY environment variable. ' +
      'Please add it to your .env file.'
    )
  }

  return (
    <BaseClerkProvider
      publishableKey={publishableKey}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      {children}
    </BaseClerkProvider>
  )
}
```

```tsx
// src/components/auth/AuthLoader.tsx
import { useAuth } from '@clerk/clerk-react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthLoader({ children, fallback }: Props) {
  const { isLoaded } = useAuth()

  if (!isLoaded) {
    return fallback ?? (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return <>{children}</>
}
```

## Usage in Astro

```astro
---
// src/layouts/DashboardLayout.astro
import BaseLayout from './BaseLayout.astro'
import DashboardShell from '@/components/dashboard/DashboardShell'
---
<BaseLayout title="Dashboard - Equipped">
  <DashboardShell client:load>
    <slot />
  </DashboardShell>
</BaseLayout>
```

```tsx
// src/components/dashboard/DashboardShell.tsx
import { ClerkProvider } from '@/components/auth/ClerkProvider'
import { AuthLoader } from '@/components/auth/AuthLoader'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function DashboardShell({ children }: Props) {
  return (
    <ClerkProvider>
      <AuthLoader>
        {children}
      </AuthLoader>
    </ClerkProvider>
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

- PRD.md Section 5: User Authentication
- documentation/platform-authentication.md
- [Clerk React Setup](https://clerk.com/docs/quickstarts/react)
- [Astro Environment Variables](https://docs.astro.build/en/guides/environment-variables/)
