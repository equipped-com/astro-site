# Setup Playwright E2E Testing

## Description

Install and configure Playwright for end-to-end testing of critical user journeys. Playwright runs real browser tests against the full application stack, catching integration issues that unit tests miss.

## Dependencies

- `testing/setup-vitest` - Unit test infrastructure (DONE)
- `auth/auth-pages` - Auth pages exist to test (DONE)
- `commerce/checkout-assignment` - Checkout flow exists (DONE)

## Acceptance Criteria

- [ ] Playwright installed with Chromium, Firefox, WebKit browsers
- [ ] Test scripts added to package.json (test:e2e, test:e2e:ui, test:e2e:headed)
- [ ] playwright.config.ts configured for Astro dev server
- [ ] Base test utilities created (auth helpers, page objects)
- [ ] Example E2E test for critical path (sign-in → dashboard)
- [ ] CI-ready configuration (headless, retries, screenshots on failure)
- [ ] Tests follow Gherkin-to-code pattern with @REQ traceability

## Test Criteria

```gherkin
Feature: E2E Test Infrastructure

  @REQ-E2E-001
  Scenario: Run E2E tests against dev server
    Given the dev server is running
    When I execute "bun run test:e2e"
    Then Playwright launches browsers
    And tests run against localhost:4321
    And results are reported with pass/fail status

  @REQ-E2E-002
  Scenario: Authentication helper works
    Given I have test user credentials
    When I use the auth helper to sign in
    Then I am redirected to dashboard
    And my session persists across page navigations

  @REQ-E2E-003
  Scenario: Screenshot on failure
    Given a test is running
    When an assertion fails
    Then a screenshot is captured
    And saved to test-results/ directory

  @REQ-E2E-004
  Scenario: Visual test runner
    Given I want to debug tests
    When I run "bun run test:e2e:ui"
    Then Playwright UI opens
    And I can step through tests visually
```

## Implementation

### 1. Install Playwright

```bash
bun add -d @playwright/test
bunx playwright install chromium firefox webkit
```

### 2. Create playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 3. Add package.json scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:chromium": "playwright test --project=chromium"
  }
}
```

### 4. Create e2e/ directory structure

```
e2e/
├── fixtures/
│   ├── auth.ts          # Authentication helpers
│   └── test-data.ts     # Test users, mock data
├── pages/
│   ├── home.page.ts     # Page object for home
│   ├── auth.page.ts     # Page object for sign-in/up
│   └── dashboard.page.ts # Page object for dashboard
├── auth.spec.ts         # Auth flow tests
├── checkout.spec.ts     # Checkout flow tests
└── smoke.spec.ts        # Quick smoke tests
```

### 5. Create auth fixture (e2e/fixtures/auth.ts)

```typescript
import { test as base, Page } from '@playwright/test';

// Test user for E2E (create in Clerk test mode)
const TEST_USER = {
  email: 'e2e+clerk_test@example.com',
  password: process.env.E2E_TEST_PASSWORD || 'test-password-123',
};

export async function signIn(page: Page) {
  await page.goto('/sign-in');
  await page.fill('input[name="identifier"]', TEST_USER.email);
  await page.click('button:has-text("Continue")');
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('/dashboard**');
}

export async function signOut(page: Page) {
  await page.click('[data-testid="user-button"]');
  await page.click('text=Sign out');
  await page.waitForURL('/');
}

// Extended test with auth helpers
export const test = base.extend<{ signIn: () => Promise<void> }>({
  signIn: async ({ page }, use) => {
    await use(() => signIn(page));
  },
});

export { expect } from '@playwright/test';
```

### 6. Example smoke test (e2e/smoke.spec.ts)

```typescript
import { test, expect } from '@playwright/test';

// @REQ-E2E-SMOKE-001
test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Equipped/);
    await expect(page.locator('text=All things tech')).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign in');
    await expect(page).toHaveURL('/sign-in');
  });

  test('sign-in page renders', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.locator('input[name="identifier"]')).toBeVisible();
  });
});
```

### 7. Example auth flow test (e2e/auth.spec.ts)

```typescript
import { test, expect, signIn } from './fixtures/auth';

// @REQ-E2E-AUTH-001
test.describe('Authentication Flow', () => {
  test('user can sign in and access dashboard', async ({ page }) => {
    // Given I am on the sign-in page
    await page.goto('/sign-in');

    // When I enter valid credentials and submit
    await signIn(page);

    // Then I should be on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('unauthenticated user is redirected from dashboard', async ({
    page,
  }) => {
    // Given I am not signed in
    // When I try to access the dashboard directly
    await page.goto('/dashboard');

    // Then I should be redirected to sign-in
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('user can sign out', async ({ page }) => {
    // Given I am signed in
    await signIn(page);

    // When I click sign out
    await page.click('[data-testid="user-button"]');
    await page.click('text=Sign out');

    // Then I should be on the homepage
    await expect(page).toHaveURL('/');
  });
});
```

## Notes

- **Test user setup**: Create a dedicated test user in Clerk's test mode
- **Environment variables**: Store E2E_TEST_PASSWORD in .env.local (gitignored)
- **CI setup**: GitHub Actions will need Playwright browsers installed
- **Page objects**: Use them to keep tests maintainable as UI changes
- **Gherkin comments**: Every test references requirements with @REQ tags

## References

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright with Astro](https://docs.astro.build/en/guides/testing/#playwright)
- PRD.md - Critical user journeys to test
