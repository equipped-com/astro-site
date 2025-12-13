# Feature Shepherd Pilot: Auth

## Description

Onboard the `auth` feature as the first shepherded feature, establishing foundational flow coverage for home page rendering, account creation, login, logout, re-login, and account deletion flows. This pilot validates the Feature Shepherd architecture and provides a template for future feature onboarding.

## Dependencies

- `testing/setup-playwright` - Playwright infrastructure (DONE)
- `testing/clerk-e2e-integration` - Clerk testing helpers (DONE)
- `testing/e2e-auth-state` - Auth state reuse patterns (DONE)
- `testing/feature-shepherd-contracts` - Shepherd structure (plan.md, spec.md, shepherd.config.json) (PENDING)
- `testing/playwright-agents-bootstrap` - Agent-based test generator (PENDING)

## Acceptance Criteria

- [ ] `e2e/shepherd/auth/plan.md` created with feature description, flows, data requirements
- [ ] `e2e/shepherd/auth/spec.md` created with Gherkin acceptance criteria and UI element references
- [ ] `e2e/shepherd/auth/shepherd.config.json` created with code mappings
- [ ] `e2e/shepherd/auth/data.md` documents test user lifecycle (ephemeral, timestamp-based emails)
- [ ] Auth flows implemented: home page, account creation, login, logout, re-login, account deletion
- [ ] Per-run unique emails using timestamp/UUID to avoid collisions
- [ ] Seeded tenant with reset hook option for data isolation
- [ ] No console errors during happy path flows
- [ ] All tests pass in both PR and nightly CI environments
- [ ] Tests follow Gherkin-to-code pattern with @REQ-FSH-007 traceability

## Test Criteria

```gherkin
Feature: Auth Feature Shepherd (Pilot)

  @REQ-FSH-007
  Scenario: Home page renders without console errors
    Given I navigate to the home page
    When the page loads
    Then the page title is "Equipped"
    And the hero text "All things tech, one monthly fee" is visible
    And there are no console errors

  @REQ-FSH-007
  Scenario: User can create a new account
    Given I am on the sign-up page
    And I use a unique email with timestamp (e2e+auth_{timestamp}@example.com)
    When I enter email, password, and submit
    Then I receive an OTP code (via Clerk test mode)
    And I enter the OTP code
    And I am redirected to /dashboard
    And my session is active

  @REQ-FSH-007
  Scenario: User can log in with existing account
    Given I have a test account (e2e+auth_{timestamp}@example.com)
    And I am on the sign-in page
    When I enter my email and password
    And I submit the sign-in form
    Then I am redirected to /dashboard
    And my session is active

  @REQ-FSH-007
  Scenario: User can log out
    Given I am logged in
    And I am on the /dashboard page
    When I click the user menu
    And I click "Sign out"
    Then I am redirected to the home page
    And my session is terminated

  @REQ-FSH-007
  Scenario: User can re-login after logout
    Given I logged out in a previous step
    And I am on the sign-in page
    When I enter my email and password
    And I submit the sign-in form
    Then I am redirected to /dashboard
    And my session is active

  @REQ-FSH-007
  Scenario: User can delete their account
    Given I am logged in
    And I navigate to /settings/account
    When I click "Delete Account"
    And I confirm the deletion in the modal
    Then I am redirected to the home page
    And my session is terminated
    And the account no longer exists in Clerk

  @REQ-FSH-007
  Scenario: Navigation between authenticated and unauthenticated pages
    Given I am logged in
    When I navigate to /dashboard
    Then the dashboard is visible
    When I navigate to /sign-in
    Then I am redirected to /dashboard (already authenticated)

  @REQ-FSH-007
  Scenario: Data isolation with ephemeral test environment
    Given each test run generates a unique email (e2e+auth_{timestamp}@example.com)
    When multiple test runs execute in parallel
    Then test users do not collide
    And data isolation is maintained
```

## Implementation

### 1. Create e2e/shepherd/auth/plan.md

```markdown
# Auth Feature Plan

## Overview
Core authentication flows using Clerk for account creation, login, logout, and deletion.

## Flows
1. **Home Page Rendering** - Verify landing page loads without errors
2. **Account Creation** - Sign up, OTP verification, redirect to dashboard
3. **Login** - Email/password sign-in, redirect to dashboard
4. **Logout** - Sign out, session termination, redirect to home
5. **Re-login** - Sign in again after logout
6. **Account Deletion** - Delete account from settings, verify removal

## Data Requirements
- **Unique emails**: e2e+auth_{timestamp}@example.com
- **Test environment**: Clerk test mode
- **Data lifecycle**: Ephemeral (created/deleted per run)
- **Seeded tenant**: Optional reset hook for multi-tenant tests

## Critical UI Elements
- Sign-up form: email, password, OTP input
- Sign-in form: email, password
- User menu: sign out button
- Settings: delete account button

## Success Criteria
- All flows pass without console errors
- Session state persists across navigations
- Account deletion verified in Clerk
```

### 2. Create e2e/shepherd/auth/spec.md

```markdown
# Auth Feature Specification

## Acceptance Criteria

### Home Page
- **AC-AUTH-001**: Home page renders with title "Equipped"
- **AC-AUTH-002**: Hero text "All things tech, one monthly fee" is visible
- **AC-AUTH-003**: No console errors during page load

### Account Creation
- **AC-AUTH-004**: User can create account with unique email
- **AC-AUTH-005**: OTP verification succeeds (Clerk test mode)
- **AC-AUTH-006**: User redirected to /dashboard after sign-up
- **AC-AUTH-007**: Session is active after account creation

### Login
- **AC-AUTH-008**: User can sign in with valid credentials
- **AC-AUTH-009**: User redirected to /dashboard after login
- **AC-AUTH-010**: Session persists across page navigations

### Logout
- **AC-AUTH-011**: User can sign out from user menu
- **AC-AUTH-012**: Session terminated after logout
- **AC-AUTH-013**: User redirected to home page after logout

### Re-login
- **AC-AUTH-014**: User can re-login after logout
- **AC-AUTH-015**: Session is restored after re-login

### Account Deletion
- **AC-AUTH-016**: User can delete account from /settings/account
- **AC-AUTH-017**: Account deletion confirmed in Clerk
- **AC-AUTH-018**: Session terminated after deletion

## UI Element Locators
- Sign-up email: `input[name="emailAddress"]`
- Sign-up password: `input[name="password"]`
- Sign-up OTP: `input[name="code"]`
- Sign-in email: `input[name="identifier"]`
- Sign-in password: `input[name="password"]`
- User menu: `[data-testid="user-button"]`
- Sign out: `button:has-text("Sign out")`
- Delete account: `button:has-text("Delete Account")`
```

### 3. Create e2e/shepherd/auth/shepherd.config.json

```json
{
  "featureKey": "auth",
  "codeOwners": {
    "globs": [
      "src/components/auth/**",
      "src/lib/clerk/**",
      "src/api/routes/auth/**",
      "src/middleware/auth.ts"
    ]
  },
  "routePrefixes": ["/sign-in", "/sign-up", "/dashboard"],
  "labels": ["shepherd:auth"],
  "priority": "critical",
  "timeout": 60000
}
```

### 4. Create e2e/shepherd/auth/data.md

```markdown
# Auth Test Data & Lifecycle

## Test User Strategy

### Unique Email Generation
```typescript
const timestamp = Date.now();
const testEmail = `e2e+auth_${timestamp}@example.com`;
```

### Rationale
- **Collision avoidance**: Timestamp ensures uniqueness across parallel runs
- **Ephemeral**: Test users are created and deleted within the test run
- **No cleanup required**: Clerk test mode auto-expires test users after 7 days

## Data Isolation

### Per-Run Isolation
- Each test run uses a unique email (timestamp-based)
- No shared state between test runs
- Parallel execution safe

### Seeded Tenant (Optional)
- For multi-tenant tests, seed a test tenant in D1
- Use reset hook in global setup to clear tenant data
- Document tenant ID in data.md

## Clerk Test Mode

### Configuration
- **Mode**: Test mode (not production)
- **OTP**: Auto-generated (accessible via Clerk dashboard or API)
- **Rate limits**: Relaxed for E2E testing

### Test User Lifecycle
1. **Create**: Sign up with unique email
2. **Verify**: Enter OTP from Clerk test mode
3. **Use**: Perform test actions (login, logout, etc.)
4. **Delete**: Remove account at end of test
5. **Auto-expire**: Clerk deletes test users after 7 days

## Environment Variables
```bash
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
```
```

### 5. Create e2e/shepherd/auth/auth.spec.ts

```typescript
import { test, expect } from '@playwright/test';

const timestamp = Date.now();
const testEmail = `e2e+auth_${timestamp}@example.com`;
const testPassword = 'TestPassword123!';

test.describe('Auth Feature Shepherd', () => {
	test.describe.configure({ mode: 'serial' }); // Sequential for re-login test

	// @REQ-FSH-007 @AC-AUTH-001 @AC-AUTH-002 @AC-AUTH-003
	test('home page renders without console errors', async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				consoleErrors.push(msg.text());
			}
		});

		await page.goto('/');

		await expect(page).toHaveTitle(/Equipped/);
		await expect(
			page.locator('text=All things tech, one monthly fee'),
		).toBeVisible();

		expect(consoleErrors).toHaveLength(0);
	});

	// @REQ-FSH-007 @AC-AUTH-004 @AC-AUTH-005 @AC-AUTH-006 @AC-AUTH-007
	test('user can create a new account', async ({ page }) => {
		await page.goto('/sign-up');

		// Enter email and password
		await page.fill('input[name="emailAddress"]', testEmail);
		await page.fill('input[name="password"]', testPassword);
		await page.click('button:has-text("Continue")');

		// In Clerk test mode, OTP is auto-sent
		// For E2E, we use Clerk's testing API to retrieve OTP
		// Simplified: assume OTP input appears
		await page.waitForSelector('input[name="code"]');
		// In real implementation, fetch OTP from Clerk API
		const otp = '424242'; // Clerk test mode magic OTP
		await page.fill('input[name="code"]', otp);
		await page.click('button:has-text("Verify")');

		// Verify redirect to dashboard
		await expect(page).toHaveURL(/\/dashboard/);
		await expect(page.locator('text=Dashboard')).toBeVisible();
	});

	// @REQ-FSH-007 @AC-AUTH-008 @AC-AUTH-009 @AC-AUTH-010
	test('user can log in with existing account', async ({ page }) => {
		await page.goto('/sign-in');

		await page.fill('input[name="identifier"]', testEmail);
		await page.click('button:has-text("Continue")');
		await page.fill('input[name="password"]', testPassword);
		await page.click('button:has-text("Sign in")');

		await expect(page).toHaveURL(/\/dashboard/);
		await expect(page.locator('text=Dashboard')).toBeVisible();
	});

	// @REQ-FSH-007 @AC-AUTH-011 @AC-AUTH-012 @AC-AUTH-013
	test('user can log out', async ({ page }) => {
		// Re-login first
		await page.goto('/sign-in');
		await page.fill('input[name="identifier"]', testEmail);
		await page.click('button:has-text("Continue")');
		await page.fill('input[name="password"]', testPassword);
		await page.click('button:has-text("Sign in")');
		await page.waitForURL(/\/dashboard/);

		// Logout
		await page.click('[data-testid="user-button"]');
		await page.click('button:has-text("Sign out")');

		await expect(page).toHaveURL('/');
	});

	// @REQ-FSH-007 @AC-AUTH-014 @AC-AUTH-015
	test('user can re-login after logout', async ({ page }) => {
		await page.goto('/sign-in');

		await page.fill('input[name="identifier"]', testEmail);
		await page.click('button:has-text("Continue")');
		await page.fill('input[name="password"]', testPassword);
		await page.click('button:has-text("Sign in")');

		await expect(page).toHaveURL(/\/dashboard/);
		await expect(page.locator('text=Dashboard')).toBeVisible();
	});

	// @REQ-FSH-007 @AC-AUTH-016 @AC-AUTH-017 @AC-AUTH-018
	test('user can delete their account', async ({ page }) => {
		// Login first
		await page.goto('/sign-in');
		await page.fill('input[name="identifier"]', testEmail);
		await page.click('button:has-text("Continue")');
		await page.fill('input[name="password"]', testPassword);
		await page.click('button:has-text("Sign in")');
		await page.waitForURL(/\/dashboard/);

		// Navigate to settings
		await page.goto('/settings/account');

		// Delete account
		await page.click('button:has-text("Delete Account")');
		await page.click('button:has-text("Confirm")'); // Confirm in modal

		// Verify redirect and session termination
		await expect(page).toHaveURL('/');

		// Verify account deleted (try to login again - should fail)
		await page.goto('/sign-in');
		await page.fill('input[name="identifier"]', testEmail);
		await page.click('button:has-text("Continue")');
		await page.fill('input[name="password"]', testPassword);
		await page.click('button:has-text("Sign in")');

		// Should see error message (account not found)
		await expect(
			page.locator('text=Account not found'),
		).toBeVisible();
	});

	// @REQ-FSH-007
	test('navigation between authenticated and unauthenticated pages', async ({
		page,
	}) => {
		// Create new account for this test
		const navTestEmail = `e2e+auth_nav_${Date.now()}@example.com`;

		await page.goto('/sign-up');
		await page.fill('input[name="emailAddress"]', navTestEmail);
		await page.fill('input[name="password"]', testPassword);
		await page.click('button:has-text("Continue")');
		await page.fill('input[name="code"]', '424242');
		await page.click('button:has-text("Verify")');
		await page.waitForURL(/\/dashboard/);

		// Navigate to dashboard (already there)
		await expect(page.locator('text=Dashboard')).toBeVisible();

		// Try to navigate to sign-in (should redirect to dashboard)
		await page.goto('/sign-in');
		await expect(page).toHaveURL(/\/dashboard/);
	});
});
```

## Notes

- **Serial mode**: Re-login test depends on logout test (use test.describe.configure)
- **Clerk test mode OTP**: Magic OTP `424242` works in test mode, or fetch via Clerk API
- **Account deletion**: Verify deletion by attempting re-login (should fail)
- **Parallel safety**: Each test uses unique email to avoid collisions
- **Data lifecycle**: Document in data.md for future reference

## References

- [Clerk Testing with Playwright](https://clerk.com/docs/testing/playwright)
- [Playwright Test Modes](https://playwright.dev/docs/test-parallel)
- PRD.md - REQ-FSH-007
- `tasks/testing/clerk-e2e-integration.md`
- `tasks/testing/e2e-auth-state.md`
