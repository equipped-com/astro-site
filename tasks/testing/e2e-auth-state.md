# Task: E2E Authentication State Reuse

## Description

Implement Playwright's storage state reuse pattern to avoid re-authenticating for every test file. Creates a "setup" project that logs in once and saves authentication state, which other tests can reuse.

## Acceptance Criteria

- [ ] Create `e2e/auth.setup.ts` - setup test that performs authentication
- [ ] Save authentication state to `playwright/.clerk/user.json`
- [ ] Update `playwright.config.ts` to add "setup" project
- [ ] Configure test projects to reuse saved storage state
- [ ] Add `playwright/.clerk/` to .gitignore
- [ ] Document the storage state pattern
- [ ] Verify tests can run in parallel without re-authenticating

## Test Criteria

```gherkin
Feature: Authentication State Reuse
  As a developer
  I want to authenticate once and reuse the session
  So that tests run faster and don't hit Clerk rate limits

  @REQ-STATE-001 @Setup
  Scenario: Setup project authenticates and saves state
    Given I have a "setup" project configured
    When the setup project runs
    Then it should authenticate as test user
    And save cookies and localStorage to playwright/.clerk/user.json
    And the file should contain sessionToken

  @REQ-STATE-002 @Reuse
  Scenario: Test projects reuse authentication state
    Given authentication state was saved by setup project
    When I run a test in the "chromium" project
    Then the test should start already authenticated
    And should not need to call signIn()
    And should have access to /dashboard

  @REQ-STATE-003 @Parallel
  Scenario: Multiple tests run in parallel with same auth
    Given I have 10 test files
    When they run in parallel
    Then all should reuse the same authentication state
    And no test should re-authenticate
    And all should complete successfully

  @REQ-STATE-004 @Refresh
  Scenario: Re-run setup when auth expires
    Given the saved authentication state is older than 7 days
    When tests run
    Then the setup project should re-authenticate
    And save fresh authentication state

  @REQ-STATE-005 @MultiUser
  Scenario: Different storage states for different user types
    Given I need to test as "admin" and "member" roles
    When I configure multiple setup projects
    Then I should have:
      | State File               | Role   |
      | .clerk/admin.json        | admin  |
      | .clerk/member.json       | member |
    And tests can choose which state to use
```

## Dependencies

- testing/clerk-e2e-integration (must have programmatic sign-in)

## Implementation

### 1. Create e2e/auth.setup.ts

```typescript
import { test as setup, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

const authFile = 'playwright/.clerk/user.json';

// Test user credentials
const TEST_USER = {
	email: 'e2e+clerk_test@example.com',
	password: process.env.E2E_TEST_PASSWORD || 'test-password-123',
};

setup('authenticate', async ({ page }) => {
	// Sign in programmatically
	await clerk.signIn({
		page,
		signInParams: {
			strategy: 'password',
			identifier: TEST_USER.email,
			password: TEST_USER.password,
		},
	});

	// Wait for authentication to complete
	await page.waitForURL('/dashboard**');

	// Verify we're authenticated
	await expect(page.locator('[data-testid="user-button"]')).toBeVisible();

	// Save authentication state
	await page.context().storageState({ path: authFile });

	console.log(`✅ Authentication state saved to ${authFile}`);
});
```

### 2. Update playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['html', { open: 'never' }], ['list']],
	globalSetup: require.resolve('./global-setup'),

	use: {
		baseURL: 'http://localhost:4321',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},

	projects: [
		// Setup project - runs first
		{
			name: 'setup',
			testMatch: /.*\.setup\.ts/,
		},

		// Test projects - reuse authentication state
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
		{
			name: 'webkit',
			use: {
				...devices['Desktop Safari'],
				storageState: 'playwright/.clerk/user.json',
			},
			dependencies: ['setup'],
		},
	],

	webServer: {
		command: 'bun run dev',
		url: 'http://localhost:4321',
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
});
```

### 3. Update .gitignore

```gitignore
# Playwright
playwright/.clerk/
playwright-report/
test-results/
```

### 4. Update tests to assume authentication

Tests no longer need to call `signIn()` if using the default storage state:

```typescript
import { test, expect } from '@playwright/test';

// @REQ-DASHBOARD-001
test('dashboard shows devices', async ({ page }) => {
	// Already authenticated via storage state!
	await page.goto('/dashboard');

	// Just verify authenticated content
	await expect(page.locator('text=My Devices')).toBeVisible();
});
```

### 5. Tests that need unauthenticated state

For tests that need to start logged out:

```typescript
import { test, expect } from '@playwright/test';

// @REQ-AUTH-001
test.use({ storageState: { cookies: [], origins: [] } }); // Override to start logged out

test('unauthenticated user redirected to sign-in', async ({ page }) => {
	await page.goto('/dashboard');
	await expect(page).toHaveURL(/\/sign-in/);
});
```

## Multi-User Pattern (Optional)

If you need to test as different user types:

### Create role-specific setup files

```typescript
// e2e/auth.setup.admin.ts
const authFile = 'playwright/.clerk/admin.json';
const ADMIN_USER = { email: 'admin+clerk_test@example.com', ... };

// e2e/auth.setup.member.ts
const authFile = 'playwright/.clerk/member.json';
const MEMBER_USER = { email: 'member+clerk_test@example.com', ... };
```

### Configure projects for each role

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

## Files to Create

- `e2e/auth.setup.ts` - Setup test for authentication

## Files to Modify

- `playwright.config.ts` - Add setup project and storage state
- `.gitignore` - Ignore saved auth state files

## References

- documentation/e2e-testing-with-clerk.md (Section: Reusing Authentication State)
- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- tasks/testing/clerk-e2e-integration.md
