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

We use Playwright's **`globalSetup` hook** to configure Clerk test mode once before all tests. This keeps the Playwright UI simpler (no dedicated `setup` project filter) while still ensuring Clerk is ready for every test run.

Configure this in `e2e/clerk-global-setup.ts`:

```typescript
import type { FullConfig } from '@playwright/test'
import { clerkSetup } from '@clerk/testing/playwright'

// Global setup for Clerk E2E tests.
// Runs once before all Playwright projects and configures Clerk testing token.
export default async function globalSetup(_config: FullConfig): Promise<void> {
	await clerkSetup()
	console.log('✅ Clerk testing token generated (globalSetup)')
}
```

And in `playwright.config.ts`, wire it up via `globalSetup` and define the browser projects:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './e2e',
	globalSetup: './e2e/clerk-global-setup',
	// ... other config
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
		{ name: 'mobile', use: { ...devices['iPhone 14'] } },
	],
})
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

#### Implementation: Storage State Setup Project

**Step 1: Create `e2e/auth.setup.ts`**

```typescript
import { test as setup, expect } from '@playwright/test'
import { clerk } from '@clerk/testing/playwright'

const authFile = 'playwright/.clerk/user.json'

const TEST_USER = {
	email: 'e2e+clerk_test@example.com',
	password: process.env.E2E_TEST_PASSWORD || 'test-password-123',
}

setup('authenticate and save state', async ({ page }) => {
	await clerk.signIn({
		page,
		signInParams: {
			strategy: 'password',
			identifier: TEST_USER.email,
			password: TEST_USER.password,
		},
	})

	await page.waitForURL('/dashboard**')
	await expect(page.locator('[data-testid="user-button"]')).toBeVisible()
	await page.context().storageState({ path: authFile })

	console.log(`✅ Authentication state saved to ${authFile}`)
})
```

**Step 2: Update `playwright.config.ts`**

```typescript
export default defineConfig({
	// ... other config
	projects: [
		// Setup project - runs first and saves authentication state
		{
			name: 'setup',
			testMatch: /.*\.setup\.ts/,
		},

		// Test projects - reuse authentication state from setup
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				storageState: 'playwright/.clerk/user.json',
			},
			dependencies: ['setup'],
		},
		{
			name: 'firefox',
			use: {
				...devices['Desktop Firefox'],
				storageState: 'playwright/.clerk/user.json',
			},
			dependencies: ['setup'],
		},
		// ... other projects
	],
})
```

**Step 3: Update `.gitignore`**

```gitignore
# Playwright
playwright/.clerk/
playwright-report/
test-results/
```

**Step 4: Update tests to assume authentication**

Tests can now assume they're already authenticated:

```typescript
import { test, expect } from '@playwright/test'

test('dashboard shows devices', async ({ page }) => {
	// Already authenticated via storage state!
	await page.goto('/dashboard')

	await expect(page.locator('text=My Devices')).toBeVisible()
})
```

**Step 5: Override for unauthenticated tests**

For tests that need to start logged out:

```typescript
import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test('unauthenticated user redirected to sign-in', async ({ page }) => {
	await page.goto('/dashboard')
	await expect(page).toHaveURL(/\/sign-in/)
})
```

#### Benefits

- **Speed**: 10-50x faster - Skip authentication for 95% of tests
- **Reduced API Calls**: Avoid Clerk rate limits (important for CI/CD)
- **Parallel Execution**: All tests share same state, no locking needed
- **Reliability**: Single point of auth verification, consistent state
- **CI/CD Friendly**: Minimal network traffic, deterministic test runs

#### Multi-User Pattern (Optional)

For testing different user roles:

**Create role-specific setup files:**

```typescript
// e2e/auth.setup.admin.ts
const authFile = 'playwright/.clerk/admin.json'
const ADMIN_USER = { email: 'admin+clerk_test@example.com', ... }

// e2e/auth.setup.member.ts
const authFile = 'playwright/.clerk/member.json'
const MEMBER_USER = { email: 'member+clerk_test@example.com', ... }
```

**Configure projects in `playwright.config.ts`:**

```typescript
projects: [
	{ name: 'setup-admin', testMatch: /auth\.setup\.admin\.ts/ },
	{ name: 'setup-member', testMatch: /auth\.setup\.member\.ts/ },
	{
		name: 'admin-tests',
		testMatch: /admin\.spec\.ts/,
		use: { storageState: 'playwright/.clerk/admin.json' },
		dependencies: ['setup-admin'],
	},
	{
		name: 'member-tests',
		testMatch: /member\.spec\.ts/,
		use: { storageState: 'playwright/.clerk/member.json' },
		dependencies: ['setup-member'],
	},
]
```

## Current Implementation Status

As of the latest setup, our E2E testing infrastructure includes:

### ✅ Completed
- Basic Playwright configuration with multi-browser support
- Test directory structure (`e2e/` with fixtures, pages, specs)
- Test user pattern using `+clerk_test` suffix
- **@clerk/testing package integration** - Bot protection bypass implemented
- **Global setup with clerkSetup()** - Configured in `e2e/clerk-global-setup.ts` using Playwright's `globalSetup` hook
- **Programmatic authentication** - Fast sign-in using `clerk.signIn()` in `e2e/fixtures/auth.ts`
- **Dual authentication methods** - Both programmatic (fast) and UI-based (thorough) approaches available
- **Comprehensive test coverage** - Tests for all Clerk integration scenarios in `e2e/clerk-integration.spec.ts`
- **Storage state reuse** - Setup project saves auth state, other tests reuse it for 10-50x speedup (Implemented in `e2e/auth.setup.ts` and `playwright.config.ts`)

### ⚠️ Needs Implementation
The following best practices from this document are **not yet implemented**:

1. **OTP handling** - Tests for email/SMS verification flows using static code `424242`

### 📋 Related Tasks

See `tasks/index.yml` for implementation tasks:
- ✅ `testing/clerk-e2e-integration` - Integrate @clerk/testing package with Playwright (COMPLETED)
- ✅ `testing/e2e-auth-state` - Implement storage state reuse for authentication (COMPLETED)
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

## Synthetic Data Isolation

All E2E test accounts MUST use synthetic data conventions to prevent test data from polluting production analytics:

- **Email domain**: `@test.tryequipped.com`
- **Subdomain prefix**: `test-*` (e.g., `test-e2e.tryequipped.com`)
- **Database flag**: `is_synthetic = 1`

When creating test accounts in E2E tests, ensure they follow these conventions:

```typescript
const TEST_ACCOUNTS = {
	default: {
		email: 'test+e2e-default@test.tryequipped.com',
		password: process.env.E2E_TEST_PASSWORD,
		subdomain: 'test-e2e',
		is_synthetic: true,
	},
};
```

**Note**: Clerk's `+clerk_test` suffix works for Clerk's test mode, but for production-like testing where we want to isolate from analytics, use `@test.tryequipped.com` domain instead.

See `documentation/synthetic-data-guidelines.md` for complete isolation patterns and best practices.

## References

- [Clerk Guide: Test emails and phones](https://clerk.com/docs/guides/development/testing/test-emails-and-phones)
- [Clerk Testing with Playwright](https://clerk.com/docs/testing/playwright)
- **Internal**: tasks/testing/setup-playwright.md
- **Internal**: tasks/testing/clerk-e2e-integration.md
- **Internal**: PRD.md Section 13 (E2E Testing Requirements)
- **Internal**: documentation/synthetic-data-guidelines.md (Synthetic Data Isolation)
