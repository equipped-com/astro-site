# Create Shepherd Seed Fixtures and Golden-Path Tests

## Description

Create **shared E2E fixtures and helpers** that Playwright Agents use as patterns when generating shepherd tests. This task establishes a consistent testing foundation so agent-generated tests follow best practices and reuse common setup logic.

This includes authentication helpers, navigation utilities, assertion helpers, and at least one golden-path test that demonstrates the full pattern.

## Dependencies

- `testing/setup-playwright` - Base Playwright E2E configuration (DONE)
- `testing/clerk-e2e-integration` - Clerk testing integration (DONE)
- `testing/e2e-auth-state` - Auth state reuse (DONE)
- `testing/feature-shepherd-contracts` - Feature contract structure must exist

## Acceptance Criteria

- [ ] `e2e/fixtures/shepherd.ts` created with shared helpers:
  - [ ] `setupFeature(featureKey)` - Common bootstrap logic (reads shepherd.config.json)
  - [ ] `gotoFeature(featureKey, page)` - Navigates to feature entry URL from config
  - [ ] `assertNoConsoleErrors(page)` - Fails test on unexpected console errors
  - [ ] `loginAs(role, page)` - Logs in as user/admin based on data.md
  - [ ] `getTestData(featureKey, dataKey)` - Loads test data from features/{FEATURE_KEY}/data.md
- [ ] Shared fixtures extend Playwright's test fixture:
  - [ ] `test.extend()` used to provide shepherd helpers to all tests
  - [ ] `featureContext` fixture provides authenticated page + feature setup
- [ ] Seed test pattern documented in `e2e/README.md`:
  - [ ] Thin per-feature seed wrappers in `e2e/shepherd/{FEATURE_KEY}/seed.spec.ts`
  - [ ] Seed tests call shared `setupFeature()` instead of duplicating logic
  - [ ] Only create feature-specific seed logic when absolutely required
- [ ] At least one golden-path test created as reference:
  - [ ] `e2e/shepherd/example/seed.spec.ts` - Uses shared fixtures
  - [ ] `e2e/shepherd/example/golden-path.spec.ts` - Full happy-path journey
  - [ ] Tests include metadata headers (featureKey, scenario, requirements)
  - [ ] Tests use resilient locators (roles, text, testid)
- [ ] Fixtures handle authentication state:
  - [ ] Reuse storageState from `e2e/auth.setup.ts` (existing)
  - [ ] Support multiple roles (user, admin) via Clerk test mode
- [ ] Tests pass when run via `bun run test:e2e -- e2e/shepherd/example`

## Test Criteria

```gherkin
Feature: Seed Fixtures for Shepherds
  As a Playwright Agent
  I want shared helpers for auth and navigation
  So that generated tests follow consistent patterns

  @REQ-FSH-003
  Scenario: Shared fixtures exist and are importable
    Given e2e/fixtures/shepherd.ts exists
    When I import setupFeature, gotoFeature, assertNoConsoleErrors
    Then the imports should succeed
    And TypeScript types should be available

  @REQ-FSH-003
  Scenario: gotoFeature navigates using shepherd.config.json
    Given features/example/shepherd.config.json has entryUrl "/example"
    When I call gotoFeature("example", page)
    Then page.url() should be "http://localhost:4321/example"
    And the page should load successfully

  @REQ-FSH-003
  Scenario: assertNoConsoleErrors detects console errors
    Given I navigate to a page that logs console.error("test error")
    When I call assertNoConsoleErrors(page)
    Then the test should fail
    And the error message should include "test error"

  @REQ-FSH-003
  Scenario: loginAs authenticates as specified role
    Given features/example/data.md defines user and admin test accounts
    When I call loginAs("admin", page)
    Then the page should be authenticated
    And the session should have admin role

  @REQ-FSH-003
  Scenario: setupFeature provides ready-to-use context
    When I call setupFeature("example")
    Then it should return an authenticated page
    And the page should be navigated to the feature entry URL
    And no console errors should be present

  @REQ-FSH-003
  Scenario: Generated tests reuse shared helpers
    Given e2e/shepherd/example/seed.spec.ts uses setupFeature
    When I run "bun run test:e2e -- e2e/shepherd/example/seed.spec.ts"
    Then the test should pass
    And no duplicate auth/navigation logic should exist in the test file

  @REQ-FSH-003
  Scenario: Golden-path test demonstrates full pattern
    Given e2e/shepherd/example/golden-path.spec.ts exists
    When I run the test
    Then it should use gotoFeature, assertNoConsoleErrors, loginAs
    And it should include metadata headers
    And it should use resilient locators
```

## Implementation

### 1. Shared Fixtures: e2e/fixtures/shepherd.ts

```typescript
import { test as base, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface ShepherdConfig {
	featureKey: string;
	entryUrl: string;
	requiredRole: string;
	featureFlags?: string[];
	codeOwners: {
		globs: string[];
		routePrefixes: string[];
		labels: string[];
	};
}

interface TestData {
	users?: Record<string, { email: string; password: string; role: string }>;
	fixtures?: Record<string, unknown>;
}

/**
 * Load shepherd.config.json for a given feature
 */
export function loadShepherdConfig(featureKey: string): ShepherdConfig {
	const configPath = join(
		process.cwd(),
		'features',
		featureKey,
		'shepherd.config.json',
	);
	try {
		const content = readFileSync(configPath, 'utf-8');
		return JSON.parse(content);
	} catch (error) {
		throw new Error(
			`Failed to load shepherd config for "${featureKey}": ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Load test data from features/{FEATURE_KEY}/data.md
 * Parses Markdown tables and JSON blocks
 */
export function loadTestData(featureKey: string): TestData {
	const dataPath = join(process.cwd(), 'features', featureKey, 'data.md');
	try {
		const content = readFileSync(dataPath, 'utf-8');

		// Parse test data (simplified - in reality would parse Markdown tables)
		// For now, assume data.md has a JSON code block with test data
		const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
		if (jsonMatch?.[1]) {
			return JSON.parse(jsonMatch[1]);
		}

		return {};
	} catch (error) {
		throw new Error(
			`Failed to load test data for "${featureKey}": ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Navigate to feature entry URL using shepherd.config.json
 */
export async function gotoFeature(
	featureKey: string,
	page: Page,
): Promise<void> {
	const config = loadShepherdConfig(featureKey);
	await page.goto(config.entryUrl);
	await page.waitForLoadState('networkidle');
}

/**
 * Assert no console errors occurred during test
 * Captures console errors and fails test if any are found
 */
export async function assertNoConsoleErrors(page: Page): Promise<void> {
	const errors: string[] = [];

	page.on('console', (msg) => {
		if (msg.type() === 'error') {
			errors.push(msg.text());
		}
	});

	// Wait a bit for any async errors
	await page.waitForTimeout(500);

	if (errors.length > 0) {
		throw new Error(
			`Console errors detected:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
		);
	}
}

/**
 * Login as a specific role using test data
 * Reuses Clerk authentication from e2e/auth.setup.ts
 */
export async function loginAs(role: string, page: Page): Promise<void> {
	// For now, use storageState from auth.setup.ts
	// In the future, support multiple roles by loading different storageStates
	// or dynamically logging in based on data.md

	// Navigate to sign-in if not already authenticated
	const isAuthenticated = await page
		.locator('[data-testid="user-button"]')
		.isVisible()
		.catch(() => false);

	if (!isAuthenticated) {
		await page.goto('/sign-in');

		// Use credentials from AUTH_EMAIL/AUTH_PASSWORD env vars
		// (Set via Clerk test mode or secrets)
		const email = process.env.AUTH_EMAIL || 'test-user@example.com';
		const password = process.env.AUTH_PASSWORD || 'test-password';

		await page.fill('input[name="identifier"]', email);
		await page.click('button:has-text("Continue")');
		await page.fill('input[name="password"]', password);
		await page.click('button:has-text("Sign in")');
		await page.waitForURL('/dashboard**');
	}
}

/**
 * Setup feature context: authenticate, navigate, verify no errors
 * This is the primary bootstrap function for shepherd tests
 */
export async function setupFeature(
	featureKey: string,
	page: Page,
	options?: {
		role?: string;
		skipAuth?: boolean;
		skipNavigation?: boolean;
	},
): Promise<void> {
	const { role = 'user', skipAuth = false, skipNavigation = false } =
		options || {};

	// Authenticate if required
	if (!skipAuth) {
		await loginAs(role, page);
	}

	// Navigate to feature entry URL
	if (!skipNavigation) {
		await gotoFeature(featureKey, page);
	}

	// Verify no console errors
	await assertNoConsoleErrors(page);
}

/**
 * Extended test fixture with shepherd helpers
 */
export const test = base.extend<{
	featureContext: (featureKey: string) => Promise<void>;
}>({
	featureContext: async ({ page }, use, testInfo) => {
		// Extract feature key from test file path
		// e.g., e2e/shepherd/checkout/seed.spec.ts → "checkout"
		const pathParts = testInfo.file.split('/');
		const shepherdIndex = pathParts.indexOf('shepherd');
		const defaultFeatureKey =
			shepherdIndex >= 0 ? pathParts[shepherdIndex + 1] : 'example';

		await use(async (featureKey: string = defaultFeatureKey) => {
			await setupFeature(featureKey, page);
		});
	},
});

export { expect } from '@playwright/test';
```

### 2. Example Seed Test: e2e/shepherd/example/seed.spec.ts

```typescript
/**
 * @featureKey example
 * @scenario bootstrap
 * @requirements REQ-FSH-003
 * @planSource features/example/plan.md
 * @seedTest e2e/shepherd/example/seed.spec.ts
 * @generatedAt 2025-12-13T10:00:00Z
 * @lastHealed never
 */

import { test, expect } from '@/e2e/fixtures/shepherd';

test.describe('Example Feature - Bootstrap', () => {
	test('feature environment is ready', async ({ page, featureContext }) => {
		// Setup feature context (auth + navigation + error check)
		await featureContext('example');

		// Verify page loaded successfully
		await expect(page).toHaveURL(/\/example/);

		// Verify key elements are present
		await expect(page.locator('h1')).toBeVisible();
	});

	test('authentication works', async ({ page }) => {
		// Import helpers directly
		const { loginAs, assertNoConsoleErrors } = await import(
			'@/e2e/fixtures/shepherd'
		);

		await loginAs('user', page);
		await assertNoConsoleErrors(page);

		// Verify logged in
		await expect(page.locator('[data-testid="user-button"]')).toBeVisible();
	});

	test('navigation to feature works', async ({ page }) => {
		const { gotoFeature, assertNoConsoleErrors } = await import(
			'@/e2e/fixtures/shepherd'
		);

		await gotoFeature('example', page);
		await assertNoConsoleErrors(page);

		// Verify we're on the right page
		await expect(page).toHaveURL(/\/example/);
	});
});
```

### 3. Example Golden-Path Test: e2e/shepherd/example/golden-path.spec.ts

```typescript
/**
 * @featureKey example
 * @scenario golden-path
 * @requirements REQ-FSH-003, REQ-EXAMPLE-001
 * @planSource features/example/plan.md
 * @seedTest e2e/shepherd/example/seed.spec.ts
 * @generatedAt 2025-12-13T10:00:00Z
 * @lastHealed never
 */

import { test, expect } from '@/e2e/fixtures/shepherd';

test.describe('Example Feature - Golden Path', () => {
	test('user completes happy-path journey', async ({
		page,
		featureContext,
	}) => {
		// Setup: authenticate and navigate
		await featureContext('example');

		// Step 1: Verify feature landing page
		await expect(page.locator('h1')).toContainText('Example Feature');

		// Step 2: Interact with key UI elements (use resilient locators)
		await page.getByRole('button', { name: 'Get Started' }).click();
		await expect(page).toHaveURL(/\/example\/onboarding/);

		// Step 3: Complete a core workflow
		await page.getByLabel('Name').fill('Test User');
		await page.getByRole('button', { name: 'Continue' }).click();

		// Step 4: Verify success state
		await expect(page.getByText('Welcome, Test User!')).toBeVisible();

		// Final assertion: no console errors during journey
		const { assertNoConsoleErrors } = await import('@/e2e/fixtures/shepherd');
		await assertNoConsoleErrors(page);
	});
});
```

### 4. Documentation: e2e/README.md

Create or update `e2e/README.md` to document the seed test pattern:

```markdown
# E2E Testing with Playwright

This directory contains end-to-end tests using Playwright.

## Directory Structure

```
e2e/
├── fixtures/
│   ├── auth.ts                  # Auth helpers (existing)
│   └── shepherd.ts              # Shepherd helpers (shared)
├── shepherd/{FEATURE_KEY}/      # Shepherd test suites (agent-generated)
│   ├── seed.spec.ts             # Bootstrap test (thin wrapper)
│   └── *.spec.ts                # Scenario tests
├── auth.setup.ts                # Global auth setup (existing)
└── *.spec.ts                    # Manual E2E tests
```

## Shepherd Seed Tests

Each feature's shepherd suite has a `seed.spec.ts` that:
1. Calls shared `setupFeature()` from `e2e/fixtures/shepherd.ts`
2. Verifies the feature environment is ready
3. Provides a bootstrap example for agent-generated tests

**Prefer shared setup over per-feature duplication**:
- ✅ **Good**: `await featureContext('checkout')` (thin wrapper)
- ❌ **Bad**: Copy-pasting auth/navigation logic in every seed file

Only create feature-specific seed logic when absolutely required (unique auth flow, special feature flags, etc.).

## Shared Fixtures (e2e/fixtures/shepherd.ts)

- `setupFeature(featureKey, page)` - Authenticate, navigate, verify no errors
- `gotoFeature(featureKey, page)` - Navigate to feature entry URL from config
- `assertNoConsoleErrors(page)` - Fail test on console errors
- `loginAs(role, page)` - Authenticate as user/admin
- `loadShepherdConfig(featureKey)` - Read features/{FEATURE_KEY}/shepherd.config.json
- `loadTestData(featureKey)` - Read features/{FEATURE_KEY}/data.md

## Writing Shepherd Tests

Use resilient locators:
- ✅ `page.getByRole('button', { name: 'Submit' })`
- ✅ `page.getByLabel('Email')`
- ✅ `page.getByTestId('checkout-total')`
- ❌ `page.locator('.btn-submit')` (fragile CSS)

Include metadata headers:
```typescript
/**
 * @featureKey checkout
 * @scenario add-item
 * @requirements REQ-CHECKOUT-001
 * @planSource features/checkout/plan.md
 */
```

## Running Shepherd Tests

```bash
# All shepherd tests
bun run test:e2e -- e2e/shepherd

# Specific feature
bun run test:e2e -- e2e/shepherd/checkout

# Specific test file
bun run test:e2e -- e2e/shepherd/checkout/seed.spec.ts
```

## References

- `documentation/PRDs/feature-shepherds.md` - Feature Shepherds system
- `tasks/testing/feature-shepherd-seed-fixtures.md` - This implementation
```

### 5. Update playwright.config.ts (if needed)

Ensure `playwright.config.ts` supports import aliases for fixtures:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	// ... existing config
	use: {
		baseURL: 'http://localhost:4321',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	// Ensure test match includes shepherd directory
	testMatch: ['**/*.spec.ts'],
	testIgnore: ['**/node_modules/**', '**/dist/**'],
});
```

### 6. Create Example Feature Contract

Create a minimal `features/example/` contract for testing:

```bash
bun scripts/create-shepherd-feature.ts example
```

Then populate with minimal content to support the golden-path test.

## Files

### New Files Created

- `e2e/fixtures/shepherd.ts` - Shared shepherd helpers
- `e2e/shepherd/example/seed.spec.ts` - Example bootstrap test
- `e2e/shepherd/example/golden-path.spec.ts` - Example golden-path test
- `e2e/README.md` - Documentation for E2E testing

### Files Modified

- `playwright.config.ts` - Ensure testMatch includes shepherd directory (if needed)

### Files Created by Dependencies

- `features/example/` - Example feature contract (created via create-shepherd-feature.ts)

## Notes

- **Thin wrappers over shared setup**: Seed tests should be minimal and call `setupFeature()` instead of duplicating logic
- **Resilient locators**: Use roles, labels, testid over CSS classes
- **Metadata headers**: All tests include featureKey, scenario, requirements, planSource
- **Import aliases**: Use `@/e2e/fixtures/shepherd` for cleaner imports (configure in tsconfig.json if needed)
- **Auth state reuse**: Reuse `e2e/auth.setup.ts` storageState for faster test startup
- **Console error detection**: `assertNoConsoleErrors()` is a critical quality gate
- The golden-path test serves as a **reference implementation** for agents to learn from

## References

- `documentation/PRDs/feature-shepherds.md` - Full PRD (REQ-FSH-003)
- `tasks/testing/setup-playwright.md` - Base Playwright setup
- `tasks/testing/clerk-e2e-integration.md` - Clerk auth integration
- `tasks/testing/e2e-auth-state.md` - Auth state reuse
- `tasks/testing/feature-shepherd-contracts.md` - Feature contract structure
