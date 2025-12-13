# Task: Integrate Clerk Testing with Playwright

## Description

Upgrade the existing Playwright E2E testing infrastructure to use Clerk's `@clerk/testing` package for robust authentication testing. This includes bypassing bot protection, implementing programmatic sign-in, and following Clerk best practices.

## Acceptance Criteria

- [ ] Install `@clerk/testing` package
- [ ] Create `global-setup.ts` with `clerkSetup()` to bypass bot protection
- [ ] Update `playwright.config.ts` to reference global setup
- [ ] Create programmatic sign-in helper using `clerk.signIn()`
- [ ] Update existing `e2e/fixtures/auth.ts` with both approaches (UI + programmatic)
- [ ] Add CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to test environment
- [ ] Document when to use programmatic vs UI-based authentication
- [ ] Update existing auth tests to use programmatic sign-in

## Test Criteria

```gherkin
Feature: Clerk Testing Integration
  As a developer
  I want Clerk-specific testing utilities
  So that E2E tests are fast, reliable, and bypass bot protection

  @REQ-CLERK-001 @GlobalSetup
  Scenario: Global setup bypasses bot protection
    Given I have configured global-setup.ts with clerkSetup()
    When Playwright runs tests
    Then the testing token should be generated
    And bot protection should not block automated browsers

  @REQ-CLERK-002 @Programmatic
  Scenario: Programmatic sign-in is faster than UI
    Given I need to authenticate a test user
    When I use clerk.signIn() programmatically
    Then authentication should complete in under 2 seconds
    And I should be redirected to /dashboard
    And my session should persist

  @REQ-CLERK-003 @UIFallback
  Scenario: UI-based authentication still works
    Given I need to test the actual sign-in flow
    When I use the UI-based signIn() helper
    Then I should fill the Clerk form fields
    And submit credentials
    And be authenticated successfully

  @REQ-CLERK-004 @TestUser
  Scenario: Test user with +clerk_test works
    Given I sign in with "test+clerk_test@example.com"
    When authentication completes
    Then no actual email should be sent
    And I should be logged in

  @REQ-CLERK-005 @EnvironmentVars
  Scenario: Clerk environment variables are available
    Given I am running E2E tests
    Then CLERK_PUBLISHABLE_KEY should be set
    And CLERK_SECRET_KEY should be set
    And both should match the Development instance
```

## Dependencies

- testing/setup-playwright (must be completed)
- auth/clerk-provider (Clerk must be configured)

## Implementation

### 1. Install @clerk/testing

```bash
bun add -d @clerk/testing
```

### 2. Create e2e/global.setup.ts (Project Dependencies approach)

> **Note**: We use Project Dependencies instead of `globalSetup` config option. This provides
> better features: HTML report visibility, trace recording, and fixture support.

```typescript
// e2e/global.setup.ts
import { clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'

// Setup must be run serially when Playwright is configured to run fully parallel
setup.describe.configure({ mode: 'serial' })

setup('global setup', async ({}) => {
	await clerkSetup()
	console.log('✅ Clerk testing token generated')
})
```

### 3. Update playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './e2e',
	// ... other config
	projects: [
		// Setup project runs first
		{
			name: 'setup',
			testMatch: /global\.setup\.ts/,
		},
		// Browser projects depend on setup
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] }, dependencies: ['setup'] },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] }, dependencies: ['setup'] },
		{ name: 'mobile', use: { ...devices['iPhone 14'] }, dependencies: ['setup'] },
	],
})
```

### 4. Update e2e/fixtures/auth.ts

```typescript
import { test as base, type Page } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

// Test user for E2E (create in Clerk test mode)
const TEST_USER = {
	email: 'e2e+clerk_test@example.com',
	password: process.env.E2E_TEST_PASSWORD || 'test-password-123',
};

/**
 * Programmatic sign-in (FAST - recommended for most tests)
 * Bypasses Clerk UI and signs in directly
 */
export async function signInProgrammatic(page: Page) {
	await clerk.signIn({
		page,
		signInParams: {
			strategy: 'password',
			identifier: TEST_USER.email,
			password: TEST_USER.password,
		},
	});
	// Wait for redirect to dashboard
	await page.waitForURL('/dashboard**');
}

/**
 * UI-based sign-in (SLOWER - use for testing sign-in flow itself)
 * Fills actual Clerk form fields
 */
export async function signInUI(page: Page) {
	await page.goto('/sign-in');
	await page.fill('input[name="identifier"]', TEST_USER.email);
	await page.click('button:has-text("Continue")');
	await page.fill('input[name="password"]', TEST_USER.password);
	await page.click('button:has-text("Sign in")');
	await page.waitForURL('/dashboard**');
}

// Default to programmatic (faster)
export const signIn = signInProgrammatic;

export async function signOut(page: Page) {
	await page.click('[data-testid="user-button"]');
	await page.click('text=Sign out');
	await page.waitForURL('/');
}

// Extended test with auth helpers
export const test = base.extend<{
	signIn: () => Promise<void>;
	signInUI: () => Promise<void>;
}>({
	signIn: async ({ page }, use) => {
		await use(() => signInProgrammatic(page));
	},
	signInUI: async ({ page }, use) => {
		await use(() => signInUI(page));
	},
});

export { expect } from '@playwright/test';
```

### 5. Update existing tests

Update `e2e/auth.spec.ts` to use programmatic sign-in by default:

```typescript
import { test, expect, signIn } from './fixtures/auth';

// @REQ-E2E-AUTH-001
test('user can sign in and access dashboard', async ({ page }) => {
	// Use programmatic sign-in (much faster)
	await signIn(page);
	await expect(page).toHaveURL(/\/dashboard/);
	await expect(page.locator('text=Dashboard')).toBeVisible();
});
```

### 6. Environment Variables

Add to `.env.example`:

```bash
# Clerk E2E Testing
CLERK_PUBLISHABLE_KEY=pk_test_xxx  # From Clerk Dashboard (Development instance)
CLERK_SECRET_KEY=sk_test_xxx       # From Clerk Dashboard (Development instance)
E2E_TEST_PASSWORD=your-test-password  # Password for e2e+clerk_test@example.com
```

## When to Use Each Approach

### Use Programmatic Sign-in (`clerk.signIn()`) when:
- Testing features **after** authentication
- Need to test as different users quickly
- Running tests in CI/CD (faster, more reliable)
- Testing dashboard, settings, checkout flows, etc.

### Use UI-based Sign-in when:
- Testing the **sign-in flow itself**
- Verifying Clerk form validation
- Testing auth error messages
- Testing sign-up flow, forgot password, etc.

## Files to Create

- `e2e/global.setup.ts` - Clerk bot protection bypass (using Project Dependencies approach)

## Files to Modify

- `playwright.config.ts` - Add setup project and dependencies
- `e2e/fixtures/auth.ts` - Add programmatic sign-in
- `e2e/auth.spec.ts` - Update to use programmatic sign-in
- `package.json` - Add @clerk/testing
- `.env.example` - Document required env vars

## References

- documentation/e2e-testing-with-clerk.md
- [Clerk Testing with Playwright](https://clerk.com/docs/testing/playwright)
- [Clerk Test Accounts](https://clerk.com/docs/guides/development/testing/test-emails-and-phones)
- tasks/testing/setup-playwright.md
