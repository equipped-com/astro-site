# Feature Shepherd Data Isolation

## Description

Implement data isolation strategies for Feature Shepherd tests to prevent test collisions and flaky failures from shared test user contention. This task focuses on authentication tests that create, use, and delete test accounts, ensuring each test run uses unique, isolated test data.

## Dependencies

- `testing/playwright-agents-bootstrap` - Playwright Agents must be initialized (PENDING)
- `testing/feature-shepherd-pilot-auth` - Auth shepherd suite must be created (PENDING)
- `testing/clerk-e2e-integration` - Clerk E2E integration must be working (DONE)

## Acceptance Criteria

- [ ] Unique per-run email strategy implemented (timestamp or UUID-based)
- [ ] Test data generator utility created for creating unique test users
- [ ] Seed.spec.ts uses isolated test data (no shared test accounts)
- [ ] Account lifecycle documented in features/auth/data.md
- [ ] Cleanup strategy implemented (account deletion or database reset)
- [ ] Collision avoidance strategy documented
- [ ] Tests run successfully in parallel without data conflicts
- [ ] CI environment uses ephemeral test data (no persistent shared accounts)

## Test Criteria

```gherkin
Feature: Data Isolation for Auth Tests
  As a test engineer
  I want isolated test data for each shepherd run
  So that tests don't collide and fail flakily

  @REQ-FSH-007
  Scenario: Unique email generation for each test run
    Given I start a new shepherd test run
    When the test creates a new user account
    Then the email should include a unique identifier (timestamp or UUID)
    And the email should be valid for Clerk test mode
    And multiple concurrent runs should not conflict

  @REQ-FSH-007
  Scenario: Test user lifecycle is documented
    Given features/auth/data.md exists
    Then it should document how test accounts are created
    And how test accounts are cleaned up
    And the collision avoidance strategy
    And the isolation approach (unique emails vs tenant reset)

  @REQ-FSH-007
  Scenario: Parallel test runs don't collide
    Given two shepherd runs start simultaneously
    When both create user accounts
    Then each should use different email addresses
    And both should complete successfully
    And neither should see the other's data

  @REQ-FSH-007
  Scenario: Account cleanup after test completion
    Given a test run creates test accounts
    When the test run completes (pass or fail)
    Then test accounts should be cleaned up
    Or marked for later cleanup via cron job

  @REQ-FSH-007
  Scenario: Seed test uses isolated data
    Given e2e/shepherd/auth/seed.spec.ts runs
    When it creates a test user
    Then it should use the unique email generator
    And not rely on a pre-existing shared test account
```

## Implementation

### 1. Unique Email Generator Utility

**Create `e2e/fixtures/test-data-generator.ts`:**

```typescript
/**
 * Test data generator for Feature Shepherd tests.
 * Generates unique, isolated test data for each test run.
 */

import { randomUUID } from 'node:crypto';

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Generate a unique email address for test runs.
 *
 * Strategies:
 * 1. Timestamp-based (default): test-{timestamp}@equipped.test
 * 2. UUID-based: test-{uuid}@equipped.test
 * 3. Feature-scoped: test-{featureKey}-{timestamp}@equipped.test
 */
export function generateUniqueEmail(featureKey?: string): string {
  const timestamp = Date.now();
  const prefix = featureKey ? `test-${featureKey}` : 'test';

  // Use timestamp for readability in logs
  return `${prefix}-${timestamp}@equipped.test`;
}

/**
 * Generate a unique email using UUID (more collision-resistant).
 */
export function generateUniqueEmailUUID(featureKey?: string): string {
  const uuid = randomUUID();
  const prefix = featureKey ? `test-${featureKey}` : 'test';

  return `${prefix}-${uuid}@equipped.test`;
}

/**
 * Generate a complete test user with unique credentials.
 */
export function generateTestUser(featureKey?: string): TestUser {
  const email = generateUniqueEmail(featureKey);

  return {
    email,
    password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  };
}

/**
 * Generate multiple unique test users for a feature.
 */
export function generateTestUsers(count: number, featureKey?: string): TestUser[] {
  return Array.from({ length: count }, () => generateTestUser(featureKey));
}
```

### 2. Update Shared Fixtures for Isolated Auth

**Update `e2e/fixtures/shepherd.ts`:**

```typescript
import { test as base, Page } from '@playwright/test';
import { generateTestUser, type TestUser } from './test-data-generator';

export interface ShepherdFixtures {
  testUser: TestUser;
  authenticatedPage: Page;
}

/**
 * Shepherd test fixtures with isolated test data.
 */
export const test = base.extend<ShepherdFixtures>({
  /**
   * Provides a unique test user for each test.
   */
  testUser: async ({}, use) => {
    const user = generateTestUser();
    await use(user);

    // TODO: Optional cleanup - delete test account after test
    // This depends on whether we want per-test cleanup or batch cleanup
  },

  /**
   * Provides an authenticated page with a unique test user.
   */
  authenticatedPage: async ({ page, testUser }, use) => {
    // Sign up new user
    await page.goto('/sign-up');
    await page.fill('input[name="emailAddress"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="firstName"]', testUser.firstName);
    await page.fill('input[name="lastName"]', testUser.lastName);
    await page.click('button:has-text("Continue")');

    // Wait for redirect to dashboard (or verification step)
    await page.waitForURL(/\/(dashboard|verify)/);

    // If verification required, handle OTP
    if (page.url().includes('/verify')) {
      // Use Clerk's test mode OTP: 424242
      await page.fill('input[name="code"]', '424242');
      await page.click('button:has-text("Verify")');
      await page.waitForURL('/dashboard');
    }

    await use(page);

    // Optional: Delete account after test
    // await deleteTestAccount(page, testUser);
  },
});

export { expect } from '@playwright/test';
```

### 3. Update Auth Seed Test for Isolation

**Update `e2e/shepherd/auth/seed.spec.ts`:**

```typescript
/**
 * @featureKey auth
 * @scenario seed-authentication
 * @requirements REQ-FSH-007
 * @planSource features/auth/plan.md@{HASH}
 * @seedTest e2e/shepherd/auth/seed.spec.ts
 * @generatedAt 2025-12-13T10:00:00Z
 * @lastHealed never
 */

import { test, expect } from '../../fixtures/shepherd';

test.describe('Auth - Seed Test (Isolated Data)', () => {
  test('should create unique test user and authenticate', async ({ authenticatedPage, testUser }) => {
    // authenticatedPage fixture already created and authenticated user
    await expect(authenticatedPage).toHaveURL(/\/dashboard/);

    // Verify user is logged in
    await expect(authenticatedPage.locator('[data-testid="user-button"]')).toBeVisible();

    console.log(`✅ Test user created: ${testUser.email}`);
  });
});
```

### 4. Document Test Data Lifecycle

**Create `features/auth/data.md`:**

```markdown
# Auth Feature - Test Data

## Test User Strategy

Feature Shepherd auth tests use **unique per-run emails** to prevent test collisions and flaky failures.

### Email Generation

**Format:**
test-{timestamp}@equipped.test
test-auth-{timestamp}@equipped.test

**Example:**
test-1734091234567@equipped.test

**Why Unique Emails:**
- Prevents parallel test runs from conflicting
- Allows safe account deletion tests
- No shared state between test runs
- Compatible with Clerk test mode

### Test User Creation

**Approach:** Dynamic creation during test execution

1. Test starts
2. Generate unique email using `generateTestUser('auth')`
3. Sign up new user via UI (`/sign-up`)
4. Verify with Clerk test mode OTP: `424242`
5. Use authenticated session for test scenarios

**Credentials:**
- Email: Generated (unique per run)
- Password: `TestPassword123!` (from `E2E_TEST_PASSWORD` env var)
- First Name: `Test`
- Last Name: `User`

### Test User Cleanup

**Strategies:**

#### 1. Per-Test Cleanup (Preferred for Auth Tests)

Each test deletes its own account after completion:

async function deleteTestAccount(page: Page, user: TestUser) {
  await page.goto('/settings/account');
  await page.click('button:has-text("Delete Account")');
  await page.fill('input[name="confirmEmail"]', user.email);
  await page.click('button:has-text("Confirm Deletion")');
  await page.waitForURL('/');
}

**Pros:**
- Immediate cleanup
- Tests leave no trace
- Verifies deletion flow works

**Cons:**
- Adds time to each test
- Requires deletion flow to work

#### 2. Batch Cleanup (Fallback)

Cron job or manual script deletes old test accounts:

# Delete test accounts older than 24 hours
npm run cleanup:test-accounts -- --older-than 24h

**Pros:**
- Faster tests (no per-test cleanup overhead)
- Resilient to deletion flow failures

**Cons:**
- Test accounts persist temporarily
- Requires separate cleanup infrastructure

#### 3. Ephemeral Test Environment (Ideal for CI)

CI uses a dedicated test environment with database reset:

- Staging environment with isolated database
- Reset database before each nightly run
- No cleanup needed (full reset)

### Collision Avoidance

**Strategy:** Timestamp-based unique emails

**Collision Risk:** Negligible

- Timestamp precision: milliseconds (1000 unique emails per second)
- Test execution rate: < 10 tests/second
- Probability of collision: < 0.001%

**Fallback:** UUID-based emails (if needed)

Use `generateUniqueEmailUUID()` for guaranteed uniqueness:

test-auth-550e8400-e29b-41d4-a716-446655440000@equipped.test

### Environment-Specific Configuration

#### Local Development

- Use timestamp-based emails
- Optional: Manual cleanup of test accounts
- Test mode: Clerk development instance

#### CI (GitHub Actions)

- Use timestamp-based emails
- Automatic cleanup after test run (if deletion flow works)
- Test mode: Clerk test mode with ephemeral sessions

#### Staging

- Use UUID-based emails (more collision-resistant)
- Cron job cleanup every 24 hours
- Test mode: Clerk production-like test environment

## Test Scenarios

### Account Creation Flow

**Precondition:** None (uses unique email)

**Steps:**
1. Navigate to `/sign-up`
2. Fill email: `generateTestUser('auth').email`
3. Fill password: `TestPassword123!`
4. Fill first name: `Test`
5. Fill last name: `User`
6. Click "Continue"
7. Verify with OTP: `424242` (Clerk test mode)
8. Assert redirect to `/dashboard`

**Expected Result:**
- User created successfully
- Session established
- Redirected to dashboard

### Login Flow

**Precondition:** Test user already created in setup

**Steps:**
1. Navigate to `/sign-in`
2. Fill email: `testUser.email`
3. Fill password: `testUser.password`
4. Click "Sign in"
5. Assert redirect to `/dashboard`

**Expected Result:**
- User logged in
- Session established

### Logout Flow

**Precondition:** User authenticated

**Steps:**
1. Click user button
2. Click "Sign out"
3. Assert redirect to `/`
4. Assert session cleared

**Expected Result:**
- User logged out
- Redirected to home page

### Account Deletion Flow

**Precondition:** User authenticated

**Steps:**
1. Navigate to `/settings/account`
2. Click "Delete Account"
3. Confirm email matches
4. Click "Confirm Deletion"
5. Assert redirect to `/`
6. Assert account deleted

**Expected Result:**
- Account deleted
- User logged out
- Cannot log in again with same credentials

## Known Risks

1. **Clerk API Rate Limits** - Too many account creations may hit rate limits
   - Mitigation: Use rate limiting in tests, or batch account creation
2. **Email Domain Validation** - `@equipped.test` may not be accepted in production
   - Mitigation: Use Clerk test mode, which accepts any email
3. **Test Account Pollution** - If cleanup fails, test accounts accumulate
   - Mitigation: Cron job cleanup, ephemeral environments
```

### 5. Cleanup Script (Optional)

**Create `scripts/cleanup-test-accounts.js`:**

```typescript
#!/usr/bin/env node

/**
 * Cleanup old test accounts created by Feature Shepherd tests.
 *
 * Usage:
 *   npm run cleanup:test-accounts -- --older-than 24h
 */

import { execSync } from 'node:child_process';

const olderThan = process.argv.find(arg => arg.startsWith('--older-than'))?.split('=')[1] || '24h';

console.log(`Cleaning up test accounts older than ${olderThan}...`);

// TODO: Implement Clerk API call to list and delete test accounts
// - Filter by email pattern: test-*@equipped.test
// - Filter by creation date (older than threshold)
// - Delete matching accounts

console.log('Cleanup complete.');
```

**Add to package.json:**

```json
{
  "scripts": {
    "cleanup:test-accounts": "node scripts/cleanup-test-accounts.js"
  }
}
```

### 6. CI Environment Configuration

**Add to `.github/workflows/shepherd-tests.yml`:**

```yaml
env:
  # Use ephemeral test data in CI
  E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
  CLERK_TEST_MODE: true

steps:
  - name: Run Auth Shepherd Tests
    run: npx playwright test e2e/shepherd/auth

  # Optional: Cleanup test accounts after run
  - name: Cleanup Test Accounts
    if: always()
    run: npm run cleanup:test-accounts -- --older-than 1h
```

## Files

**Created:**
- `e2e/fixtures/test-data-generator.ts` - Unique email and test user generator
- `features/auth/data.md` - Test data lifecycle documentation
- `scripts/cleanup-test-accounts.js` - Batch cleanup script for old test accounts

**Modified:**
- `e2e/fixtures/shepherd.ts` - Add `testUser` and `authenticatedPage` fixtures
- `e2e/shepherd/auth/seed.spec.ts` - Use isolated test data via fixtures
- `.github/workflows/shepherd-tests.yml` - Add cleanup step and test mode env vars

## Notes

- **Timestamp vs UUID**: Timestamp is more readable in logs; UUID is more collision-resistant
- **Per-Test Cleanup**: Recommended for auth tests to verify deletion flow works
- **Batch Cleanup**: Fallback for CI if deletion flow is slow or flaky
- **Ephemeral Environments**: Ideal for CI - full database reset between runs
- **Clerk Test Mode**: Uses OTP `424242` for verification, accepts any email domain

## References

- PRD: `documentation/PRDs/feature-shepherds.md` - REQ-FSH-007
- `testing/clerk-e2e-integration` - Clerk E2E setup with test mode
- `testing/feature-shepherd-pilot-auth` - Auth shepherd suite implementation
- `e2e/fixtures/auth.ts` - Existing auth helpers (may be refactored for isolation)
