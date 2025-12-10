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

Configure this in your Playwright `global-setup.ts` (or equivalent):

```typescript
import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

setup('global setup', async ({}) => {
  await clerkSetup();
});
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
- Basic UI-based authentication in `e2e/fixtures/auth.ts`

### ⚠️ Needs Implementation
The following best practices from this document are **not yet implemented**:

1. **@clerk/testing package integration** - For bot protection bypass and programmatic sign-in
2. **Global setup with clerkSetup()** - Required to avoid bot detection in CI/CD
3. **Programmatic authentication** - Faster tests using `clerk.signIn()` instead of UI interaction
4. **Storage state reuse** - Avoid re-authenticating for every test file
5. **OTP handling** - Tests for email/SMS verification flows using static code `424242`

### 📋 Related Tasks

See `tasks/index.yml` for implementation tasks:
- `testing/clerk-e2e-integration` - Integrate @clerk/testing package with Playwright
- `testing/e2e-auth-state` - Implement storage state reuse for authentication
- `testing/e2e-otp-flows` - Add tests for OTP verification with static code

## References

- [Clerk Guide: Test emails and phones](https://clerk.com/docs/guides/development/testing/test-emails-and-phones)
- [Clerk Testing with Playwright](https://clerk.com/docs/testing/playwright)
- **Internal**: tasks/testing/setup-playwright.md
- **Internal**: PRD.md Section 13 (E2E Testing Requirements)
