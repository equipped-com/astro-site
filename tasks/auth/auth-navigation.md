# Task: Update Navigation for Auth

## Description

Update the navigation bar to show authentication state and provide appropriate links. Show sign-in/sign-up buttons for unauthenticated users, and user menu with account switcher for authenticated users.

## Acceptance Criteria

- [ ] "Sign in" link points to `/sign-in`
- [ ] "Get Started" / "Sign up" links point to `/sign-up`
- [ ] Show UserButton when signed in
- [ ] Show account selector for multi-account users
- [ ] Show sign-in/sign-up when signed out
- [ ] Mobile navigation updated
- [ ] Dashboard link visible when signed in

## Test Criteria

```gherkin
Feature: Authentication Navigation
  As a user
  I want navigation to reflect my auth state
  So that I can easily access relevant actions

  Background:
    Given I am on the landing page

  @REQ-NAV-001
  Scenario: Signed out navigation
    Given I am not signed in
    Then I should see "Sign in" link pointing to "/sign-in"
    And I should see "Get Started" button pointing to "/sign-up"
    And I should NOT see "Dashboard" link

  @REQ-NAV-002
  Scenario: Signed in navigation
    Given I am signed in as "alice@company.com"
    Then I should see user avatar/button
    And I should see "Dashboard" link
    And I should NOT see "Sign in" link

  @REQ-NAV-003
  Scenario: User menu options
    Given I am signed in
    When I click on my user avatar
    Then I should see dropdown with:
      | Option |
      | Profile |
      | Sign out |
    And clicking "Sign out" should sign me out

  @REQ-NAV-004
  Scenario: Account switcher for multi-account users
    Given I am signed in as a consultant
    And I have access to accounts "Acme Corp" and "Beta Inc"
    When I click on my user avatar
    Then I should see account switcher
    And I should be able to switch between accounts

  @REQ-NAV-005
  Scenario: Mobile navigation signed out
    Given I am on a mobile device
    And I am not signed in
    When I open the mobile menu
    Then I should see "Sign in" and "Sign up" options

  @REQ-NAV-006
  Scenario: Mobile navigation signed in
    Given I am on a mobile device
    And I am signed in
    When I open the mobile menu
    Then I should see "Dashboard" link
    And I should see user menu options
```

## Dependencies

- auth/clerk-provider
- auth/auth-pages

## Files to Create/Modify

- `src/components/navigation/AuthButtons.tsx` (create)
- `src/components/navigation/AccountSwitcher.tsx` (create)
- `src/pages/index.astro` (modify - navigation section)

## Implementation

```tsx
// src/components/navigation/AuthButtons.tsx
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { ClerkProvider } from '@/components/auth/ClerkProvider'

export function AuthButtons() {
  return (
    <ClerkProvider>
      <AuthButtonsInner />
    </ClerkProvider>
  )
}

function AuthButtonsInner() {
  return (
    <>
      <SignedOut>
        <a
          href="/sign-in"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
        </a>
        <a
          href="/sign-up"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Get Started
        </a>
      </SignedOut>

      <SignedIn>
        <a
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Dashboard
        </a>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
            }
          }}
        />
      </SignedIn>
    </>
  )
}
```

```tsx
// src/components/navigation/AccountSwitcher.tsx
import { useUser } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'

interface Account {
  id: string
  name: string
  short_name: string
  role: string
}

export function AccountSwitcher() {
  const { user } = useUser()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null)

  useEffect(() => {
    if (user) {
      fetch('/api/user/accounts')
        .then(res => res.json())
        .then(data => setAccounts(data.accounts))
    }
  }, [user])

  async function switchAccount(accountId: string) {
    await fetch(`/api/user/accounts/${accountId}/switch`, { method: 'POST' })
    window.location.reload()
  }

  if (accounts.length <= 1) return null

  return (
    <div className="relative">
      <select
        value={currentAccount?.id ?? ''}
        onChange={(e) => switchAccount(e.target.value)}
        className="bg-background border border-border rounded-md px-3 py-1.5 text-sm"
      >
        {accounts.map(account => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
    </div>
  )
}
```

## Usage in Navigation

```astro
---
// In navigation section of index.astro or Navigation.astro
import { AuthButtons } from '@/components/navigation/AuthButtons'
---

<nav class="flex items-center gap-4">
  <a href="/#features">Features</a>
  <a href="/#pricing">Pricing</a>
  <AuthButtons client:load />
</nav>
```

## References

- PRD.md Section 5: User Authentication
- PRD.md Section 5.3: Consultant Pattern (multi-account)
- documentation/platform-authentication.md
- [Clerk UserButton](https://clerk.com/docs/components/user/user-button)
- [Clerk SignedIn/SignedOut](https://clerk.com/docs/components/control/signed-in)
