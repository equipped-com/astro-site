# E2E Testing with Clerk.com

This document outlines the strategy for handling authentication in End-to-End (E2E) tests using Clerk.com, specifically focusing on handling test accounts, bypassing 2FA/OTPs, and integrating with Playwright.

## Overview

This document builds upon the existing Playwright E2E testing infrastructure (see `tasks/testing/setup-playwright.md`) and provides Clerk-specific testing patterns. It should be used in conjunction with:

- **PRD.md Section 13**: E2E Testing and Synthetic Transactions (REQ-E2E-001 through REQ-E2E-008)
- **tasks/testing/setup-playwright.md**: Basic Playwright setup (completed)
- **e2e/fixtures/auth.ts**: Current authentication helpers (basic implementation)

## 1. Test Accounts (Emails & Phones)

Clerk provides a specific mechanism to identify test accounts. These accounts do not send real emails or SMS messages but instead allow you to use a static verification code.

### Email Addresses

Any email address with the `+clerk_test` subaddress is treated as a test account.

- **Pattern**: `username+clerk_test@example.com`
- **Verification Code**: `424242`

**Example:**

- Email: `test_user+clerk_test@example.com`
- OTP: `424242`

### Phone Numbers

Clerk recognizes specific fictional phone number ranges as test numbers.

- **Pattern**: `+1 (XXX) 555-0100` through `+1 (XXX) 555-0199`
- **Verification Code**: `424242`

**Example:**

- Phone: `+12015550100`
- OTP: `424242`

> **Note**: Test mode is enabled by default on Development instances. For Production instances, it must be explicitly enabled (strongly discouraged).

## 2. Playwright Integration

To make E2E testing robust and fast, avoid testing Clerk's internal implementation details (like the intricacies of the sign-in form validation) unless that is the specific goal. Instead, focus on signing users in effectively to test _your_ application flows.

### Setup

1.  **Install the testing package**:

    ```bash
    npm install --save-dev @clerk/testing
    ```

2.  **Environment Variables**:
    Ensure your E2E test environment has the necessary Clerk keys:
    - `CLERK_PUBLISHABLE_KEY`
    - `CLERK_SECRET_KEY`

### Global Setup (Bypassing Bot Protection)

Clerk uses bot protection that can block automated browsers. The `@clerk/testing` package helps bypass this by generating a testing token.

We use the **Project Dependencies** approach (recommended by Playwright and Clerk) which provides:
- Full trace recording support
- HTML report visibility
- Playwright fixture support

Configure this in `e2e/global.setup.ts`:

```typescript
import { clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'

// Setup must be run serially when Playwright is configured to run fully parallel
setup.describe.configure({ mode: 'serial' })

setup('global setup', async ({}) => {
  await clerkSetup()
  console.log('✅ Clerk testing token generated')
})
```

And in `playwright.config.ts`, add the setup project with dependencies:

```typescript
projects: [
  // Setup project runs first
  {
    name: 'setup',
    testMatch: /global\.setup\.ts/,
  },
  // Browser projects depend on setup
  { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] }, dependencies: ['setup'] },
  // ... other browsers
]
```

### Authenticating in Tests

There are two main approaches: **Programmatic Sign-in** (faster) and **UI Interaction** (closer to user behavior).

#### Approach A: Programmatic Sign-in (Recommended for most tests)

Use the `clerk` helper to sign in without navigating through the UI.

```typescript
import { test } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

test('logged in user can view dashboard', async ({ page }) => {
  // Sign in programmatically
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password', // or 'email_code', 'phone_code'
      identifier: 'user+clerk_test@example.com',
      password: 'test_password', // if using password strategy
    },
  });

  await page.goto('/dashboard');
  // Assertions...
});
```

#### Approach B: UI Interaction with Test Accounts

Use this when you specifically need to verify the login flow itself.

```typescript
test('user can login with email code', async ({ page }) => {
  await page.goto('/sign-in');

  // Fill email
  await page.getByLabel('Email address').fill('user+clerk_test@example.com');
  await page.getByRole('button', { name: 'Continue' }).click();

  // Enter static OTP
  await page.getByLabel('Enter verification code').fill('424242');

  // Assertions...
});
```

### Reusing Authentication State

To avoid logging in for every single test file:

1.  Create a "setup" test project that performs the login and saves the browser storage state (cookies, local storage).
2.  Save this state to a file like `playwright/.clerk/user.json`.
3.  Configure your worker projects to `use: { storageState: 'playwright/.clerk/user.json' }`.

This is standard Playwright best practice and works seamlessly with Clerk sessions.

## Current Implementation Status

As of the latest setup, our E2E testing infrastructure includes:

### ✅ Completed
- Basic Playwright configuration with multi-browser support
- Test directory structure (`e2e/` with fixtures, pages, specs)
- Test user pattern using `+clerk_test` suffix
- **@clerk/testing package integration** - Bot protection bypass implemented
- **Global setup with clerkSetup()** - Configured in `e2e/global.setup.ts` using Project Dependencies approach
- **Programmatic authentication** - Fast sign-in using `clerk.signIn()` in `e2e/fixtures/auth.ts`
- **Dual authentication methods** - Both programmatic (fast) and UI-based (thorough) approaches available
- **Comprehensive test coverage** - Tests for all Clerk integration scenarios in `e2e/clerk-integration.spec.ts`

### ⚠️ Needs Implementation
The following best practices from this document are **not yet implemented**:

1. **Storage state reuse** - Avoid re-authenticating for every test file (performance optimization)
2. **OTP handling** - Tests for email/SMS verification flows using static code `424242`

### 📋 Related Tasks

See `tasks/index.yml` for implementation tasks:
- ✅ `testing/clerk-e2e-integration` - Integrate @clerk/testing package with Playwright (COMPLETED)
- `testing/e2e-auth-state` - Implement storage state reuse for authentication
- `testing/e2e-otp-flows` - Add tests for OTP verification with static code

## When to Use Each Approach

### Decision Tree

```
Need to test authentication?
├─ YES: Testing the sign-in flow itself?
│   ├─ YES: Use signInUI()
│   │   - Form validation
│   │   - Error messages
│   │   - Sign-up flow
│   │   - Password reset
│   └─ NO: Use signInProgrammatic()
│       - Dashboard tests
│       - Settings tests
│       - Commerce flows
│       - API interactions
└─ NO: No authentication needed
    - Public pages
    - Marketing site
    - Landing pages
```

### Available Functions in `e2e/fixtures/auth.ts`

```typescript
// Programmatic sign-in (FAST - 1-2 seconds)
signInProgrammatic(page: Page): Promise<void>

// UI-based sign-in (SLOWER - 3-5 seconds)
signInUI(page: Page): Promise<void>

// Default sign-in (alias for programmatic)
signIn(page: Page): Promise<void>

// Sign out
signOut(page: Page): Promise<void>
```

### Best Practices

#### ✅ GOOD: Use programmatic for feature tests

```typescript
test('user can view orders', async ({ page }) => {
	await signInProgrammatic(page)
	await page.goto('/dashboard/orders')
	await expect(page.locator('text=Orders')).toBeVisible()
})
```

#### ❌ BAD: Using UI sign-in for non-auth tests

```typescript
test('user can view orders', async ({ page }) => {
	await signInUI(page)  // Unnecessarily slow!
	await page.goto('/dashboard/orders')
	await expect(page.locator('text=Orders')).toBeVisible()
})
```

#### ✅ GOOD: Use UI for auth flow tests

```typescript
test('sign-in shows error for invalid password', async ({ page }) => {
	await page.goto('/sign-in')
	await page.fill('input[name="identifier"]', 'test@example.com')
	await page.click('button:has-text("Continue")')
	await page.fill('input[name="password"]', 'wrong-password')
	await page.click('button:has-text("Sign in")')

	await expect(page.locator('text=Invalid password')).toBeVisible()
})
```

### Performance Impact

**Example**: A test suite with 50 tests:
- All UI-based: ~150-250 seconds
- 47 programmatic + 3 UI: ~62-110 seconds
- **Savings**: ~88-140 seconds (58% faster)

Most test suites should aim for 95% programmatic, 5% UI-based tests.

## References

- [Clerk Guide: Test emails and phones](https://clerk.com/docs/guides/development/testing/test-emails-and-phones)
- [Clerk Testing with Playwright](https://clerk.com/docs/testing/playwright)
- **Internal**: tasks/testing/setup-playwright.md
- **Internal**: tasks/testing/clerk-e2e-integration.md
- **Internal**: PRD.md Section 13 (E2E Testing Requirements)
