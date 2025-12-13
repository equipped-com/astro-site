# Create Shepherd Prompt Template and Validate with Auth Pilot

## Description

Create the **shepherd prompt template** (`features/_templates/shepherd.prompt.md`) that defines how Playwright Agents (Planner, Generator, Healer) should approach creating and maintaining shepherd test suites.

This task also validates the template end-to-end by applying it to the **auth** feature as a pilot, demonstrating that the full workflow (Planner → Generator → Healer) produces a working shepherd suite covering foundational auth flows.

## Dependencies

- `testing/feature-shepherd-contracts` - Feature contract structure must exist
- `testing/playwright-agents-bootstrap` - Playwright Agents must be integrated
- `testing/feature-shepherd-seed-fixtures` - Shared fixtures must exist
- `auth/auth-pages` - Auth pages exist to test (DONE)
- `auth/clerk-provider` - Clerk provider configured (DONE)

## Acceptance Criteria

- [ ] `features/_templates/shepherd.prompt.md` created with:
  - [ ] Goal statement for shepherd suite creation
  - [ ] List of authoritative inputs (prd.md, acceptance.md, data.md, risks.md, shepherd.config.json)
  - [ ] Clear description of Planner responsibilities and output format
  - [ ] Clear description of Generator responsibilities (test file structure, metadata headers)
  - [ ] Clear description of Healer responsibilities (when to heal vs escalate)
  - [ ] Examples of good vs bad test code
  - [ ] Locator selection guidelines (resilient vs fragile)
  - [ ] Assertion best practices
- [ ] Auth pilot feature contract created:
  - [ ] `features/auth/prd.md` - Auth feature requirements
  - [ ] `features/auth/acceptance.md` - Auth acceptance criteria (REQ-FSH-007 scenarios)
  - [ ] `features/auth/data.md` - Test user lifecycle, unique email strategy
  - [ ] `features/auth/risks.md` - Known auth risks (rate limiting, test data collision)
  - [ ] `features/auth/shepherd.config.json` - Entry URLs, roles, code mapping
- [ ] Planner generates `features/auth/plan.md`:
  - [ ] Happy-path journey (home → sign up → logged in)
  - [ ] Login flow
  - [ ] Logout flow
  - [ ] Re-login flow
  - [ ] Account deletion flow
  - [ ] Home page render without errors
  - [ ] Minimal, non-redundant scenario set
- [ ] Generator creates `e2e/shepherd/auth/` tests:
  - [ ] `seed.spec.ts` - Bootstrap test using shared fixtures
  - [ ] Scenario tests for each plan item
  - [ ] Tests use resilient locators (roles, text, testid)
  - [ ] Tests include metadata headers (featureKey, scenario, requirements, planSource)
- [ ] Healer debugs and fixes any initially failing tests
- [ ] All auth shepherd tests pass when run via `bun run test:e2e -- e2e/shepherd/auth`
- [ ] `features/auth/report.md` generated with coverage summary

## Test Criteria

```gherkin
Feature: Shepherd Prompt Template
  As a Planner agent
  I want a standard prompt and inputs
  So that I can write consistent plans per feature

  @REQ-FSH-004
  Scenario: Prompt template exists and is complete
    Given features/_templates/shepherd.prompt.md exists
    Then it should contain a goal statement
    And it should list authoritative inputs (prd, acceptance, data, risks, config)
    And it should describe Planner responsibilities and output format
    And it should describe Generator responsibilities
    And it should describe Healer responsibilities
    And it should include examples of good vs bad test code

  @REQ-FSH-004
  Scenario: Planner generates plan for auth
    Given features/auth has prd.md, acceptance.md, data.md, shepherd.config.json
    When the Planner runs with FEATURE_KEY "auth" using the prompt template
    Then it writes a test plan to features/auth/plan.md
    And plan.md includes happy-path journey
    And plan.md includes login, logout, re-login flows
    And plan.md includes account deletion flow
    And plan.md includes home page render scenario
    And plan.md references requirements from acceptance.md

  @REQ-FSH-004
  Scenario: Generator creates tests from auth plan
    Given features/auth/plan.md exists
    When the Generator runs for "auth"
    Then e2e/shepherd/auth/ directory is created
    And e2e/shepherd/auth/seed.spec.ts exists
    And test files exist for each scenario in plan.md
    And tests use shared fixtures from e2e/fixtures/shepherd.ts
    And tests use resilient locators

  @REQ-FSH-007
  Scenario: Auth shepherd covers foundational flows
    Given e2e/shepherd/auth/ tests exist
    When I run "bun run test:e2e -- e2e/shepherd/auth"
    Then the following scenarios pass:
      | Scenario                    |
      | Home page renders no errors |
      | User account creation       |
      | Login flow                  |
      | Logout flow                 |
      | Re-login flow               |
      | Account deletion flow       |

  @REQ-FSH-007
  Scenario: Test data isolation prevents collisions
    Given features/auth/data.md documents unique email strategy
    And tests use timestamp or UUID in email addresses
    When I run auth shepherd tests in parallel
    Then no test data collisions occur
    And account deletion tests do not affect other tests
```

## Implementation

### 1. Shepherd Prompt Template: features/_templates/shepherd.prompt.md

```markdown
# Feature Shepherd Prompt Template

**Purpose**: This template guides Playwright Agents (Planner, Generator, Healer) in creating and maintaining end-to-end Feature Shepherd test suites.

---

## Goal

Create and maintain a **focused, reliable end-to-end test suite** for the feature `{FEATURE_KEY}` that:
- Covers the **golden path** and critical user journeys
- Validates **key invariants** and business rules
- Tests **permission/role checks**
- Includes **representative negative cases** (real failure modes, not contrived)
- Is **minimal and non-redundant** (avoid testing the same thing multiple ways)

---

## Authoritative Inputs

Agents MUST read and honor these inputs (in priority order):

1. **`features/{FEATURE_KEY}/prd.md`** - Feature requirements, scope, states
2. **`features/{FEATURE_KEY}/acceptance.md`** - Testable acceptance criteria
3. **`features/{FEATURE_KEY}/data.md`** - Test users, roles, fixtures, edge cases
4. **`features/{FEATURE_KEY}/risks.md`** - Known risks, flakiness sources, what to avoid
5. **`features/{FEATURE_KEY}/shepherd.config.json`** - Entry URLs, roles, feature flags, code mapping
6. **Existing Playwright fixtures** - `e2e/fixtures/shepherd.ts`, `e2e/auth.setup.ts`
7. **Existing seed tests** - `e2e/shepherd/{FEATURE_KEY}/seed.spec.ts` (if exists)

Do NOT make assumptions. If inputs are unclear or missing, FLAG IT in the report.

---

## Agent Responsibilities

### Planner Agent

**Input**: Feature contract files (prd.md, acceptance.md, data.md, risks.md, shepherd.config.json)

**Output**: `features/{FEATURE_KEY}/plan.md` (Markdown test plan)

**Responsibilities**:
1. Read all authoritative inputs
2. Identify the **golden path** (most common user journey)
3. Extract **key invariants** from acceptance.md (must-always-be-true conditions)
4. Identify **permission checks** from prd.md (role-based access)
5. Select **representative negative cases** from risks.md (real failure modes)
6. Write a **minimal, non-redundant** test plan covering:
   - Happy-path journey (end-to-end)
   - Permission/role checks (at least one per protected action)
   - Key invariants (at least one test per invariant)
   - Representative negative cases (≤3, only if critical)

**Plan Format**:
```markdown
# Test Plan: {FEATURE_KEY}

## Golden Path
[Description of happy-path journey from entry to success]

## Scenarios

### Scenario 1: [Happy Path Name]
- **Preconditions**: [What must be true before test starts]
- **Steps**: [User actions in order]
- **Assertions**: [What to verify at each step]
- **Data**: [Reference to data.md fixtures]
- **Requirements**: [@REQ-* tags from acceptance.md]

### Scenario 2: [Permission Check]
...
```

**Anti-Patterns (DO NOT DO)**:
- ❌ Testing every edge case exhaustively (use unit tests for that)
- ❌ Redundant scenarios (e.g., "add 1 item", "add 2 items", "add 3 items")
- ❌ Contrived negative cases (e.g., sending malformed JSON when the UI prevents it)

---

### Generator Agent

**Input**: `features/{FEATURE_KEY}/plan.md`, shared fixtures, seed tests

**Output**: Test files in `e2e/shepherd/{FEATURE_KEY}/*.spec.ts`

**Responsibilities**:
1. Read the plan.md and extract scenarios
2. Create one test file per scenario (or group related scenarios)
3. Generate `seed.spec.ts` if it doesn't exist (bootstrap test)
4. Use **shared fixtures** from `e2e/fixtures/shepherd.ts`:
   - `setupFeature(featureKey, page)` for auth + navigation
   - `gotoFeature(featureKey, page)` for navigation
   - `assertNoConsoleErrors(page)` for error checks
   - `loginAs(role, page)` for authentication
5. Use **resilient locators**:
   - ✅ `page.getByRole('button', { name: 'Submit' })`
   - ✅ `page.getByLabel('Email')`
   - ✅ `page.getByTestId('checkout-total')`
   - ❌ `page.locator('.btn-submit')` (fragile CSS)
6. Include **metadata headers** in every test file:
   ```typescript
   /**
    * @featureKey {FEATURE_KEY}
    * @scenario {scenario-name}
    * @requirements REQ-{FEATURE}-001, REQ-{FEATURE}-002
    * @planSource features/{FEATURE_KEY}/plan.md@{commit-hash}
    * @seedTest e2e/shepherd/{FEATURE_KEY}/seed.spec.ts
    * @generatedAt {ISO-timestamp}
    * @lastHealed never
    */
   ```
7. Write **strong assertions**:
   - ✅ Verify URL after navigation
   - ✅ Verify UI state (visible elements, text content)
   - ✅ Verify network responses (status codes, response shape) when relevant
   - ❌ Weak assertions (`toBeTruthy()`, `toExist()` without context)

**Example Good Test**:
```typescript
/**
 * @featureKey checkout
 * @scenario add-item-to-cart
 * @requirements REQ-CHECKOUT-001
 * @planSource features/checkout/plan.md@abc123
 */
import { test, expect } from '@/e2e/fixtures/shepherd';

test.describe('Checkout - Add Item to Cart', () => {
  test('user can add item to cart', async ({ page, featureContext }) => {
    // Setup: authenticate and navigate
    await featureContext('checkout');

    // Action: Add item to cart
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    // Assertions: Verify cart updated
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    await expect(page.getByTestId('cart-total')).toContainText('$99.99');
  });
});
```

**Example Bad Test**:
```typescript
// ❌ BAD: No metadata header
// ❌ BAD: Fragile CSS selectors
// ❌ BAD: Weak assertions
test('checkout works', async ({ page }) => {
  await page.goto('/checkout');
  await page.locator('.add-btn').click(); // ❌ Fragile
  expect(await page.locator('.cart').textContent()).toBeTruthy(); // ❌ Weak
});
```

---

### Healer Agent

**Input**: Failing tests in `e2e/shepherd/{FEATURE_KEY}/`

**Output**: Fixed tests OR regression issue (if unfixable)

**Responsibilities**:
1. Run failing tests and capture traces/screenshots
2. Inspect the UI to understand what changed
3. Decide: **Heal** (fix locators) OR **Escalate** (regression)

**Healer MAY Change**:
- ✅ Locators (if element still exists with equivalent semantics)
- ✅ Wait times / retries (within configured limits, e.g., ≤ 10s)
- ✅ Navigation steps that don't change test intent
- ✅ Helper function usage (e.g., switching to shared fixtures)

**Healer MUST STOP and File Regression When**:
- ❌ Acceptance assertion fails (business invariant not met)
- ❌ Required UI element is permanently missing
- ❌ API call semantics change (unexpected 4xx/5xx or response shape mismatch)
- ❌ New console errors appear that weren't previously allowed
- ❌ Test timeout exceeds threshold (> 2 retries)

**Regression Issue MUST Contain**:
- Feature key and failing scenario
- Playwright trace zip
- Screenshots at failure point
- Full error message and stack trace
- Suspected owner via CODEOWNERS lookup
- Link to `plan.md` and failing spec
- Labels: `regression`, `shepherd:{FEATURE_KEY}`

**Example Heal Decision**:
```
BEFORE: <button class="submit">Submit</button>
AFTER:  <button class="btn-submit">Submit</button>

DECISION: HEAL (locator update)
ACTION: Change `page.locator('.submit')` to `page.getByRole('button', { name: 'Submit' })`
REASON: Element still exists, semantics unchanged, resilient locator is better
```

**Example Escalate Decision**:
```
BEFORE: <button>Checkout</button> (exists)
AFTER:  <button>Checkout</button> (missing from UI)

DECISION: ESCALATE (regression)
ACTION: File GitHub issue with trace, screenshots, CODEOWNERS
REASON: Required element removed from UI - this is a breaking change
```

---

## Locator Selection Guidelines

**Prefer (in order)**:
1. **Role + Name**: `page.getByRole('button', { name: 'Submit' })`
2. **Label**: `page.getByLabel('Email')`
3. **Test ID**: `page.getByTestId('checkout-total')`
4. **Text**: `page.getByText('Welcome')`
5. **Placeholder**: `page.getByPlaceholder('Enter email')`

**Avoid**:
- ❌ CSS classes (`.btn-submit`, `.card-header`)
- ❌ Generated IDs (`#element-12345`)
- ❌ Deep CSS selectors (`div > ul > li:nth-child(3)`)

**Why**: Resilient locators survive UI refactors (class name changes, CSS restructuring) while still testing user-facing behavior.

---

## Assertion Best Practices

**Strong Assertions**:
- ✅ `expect(page).toHaveURL(/\/dashboard/)`
- ✅ `expect(element).toHaveText('Exact text')`
- ✅ `expect(element).toContainText('Partial text')`
- ✅ `expect(element).toBeVisible()`
- ✅ `expect(response.status()).toBe(200)`

**Weak Assertions (avoid)**:
- ❌ `expect(element).toBeTruthy()` (too vague)
- ❌ `expect(text).toExist()` (doesn't verify content)
- ❌ `expect(await element.isVisible()).toBe(true)` (use `.toBeVisible()`)

---

## References

- `documentation/PRDs/feature-shepherds.md` - Full Feature Shepherds PRD
- `e2e/fixtures/shepherd.ts` - Shared fixtures
- `e2e/README.md` - E2E testing patterns
- Playwright documentation - https://playwright.dev/docs/intro
```

### 2. Auth Pilot Feature Contract

Create `features/auth/` with the following files:

#### features/auth/prd.md

```markdown
# Authentication - Feature PRD

**Feature Key**: auth
**Version**: 1.0
**Status**: Active

## Summary

Foundational authentication and account management feature using Clerk. Provides user sign-up, login, logout, and account deletion flows.

## User Stories

- As a new user, I want to create an account so that I can access the platform
- As a returning user, I want to log in so that I can access my account
- As a logged-in user, I want to log out so that I can end my session
- As a user, I want to delete my account so that I can remove my data

## Requirements

### Functional Requirements

- **REQ-AUTH-001**: Home page must render without console errors
- **REQ-AUTH-002**: User can create account via sign-up flow
- **REQ-AUTH-003**: User can log in with valid credentials
- **REQ-AUTH-004**: User can log out
- **REQ-AUTH-005**: User can re-login after logout
- **REQ-AUTH-006**: User can delete account
- **REQ-AUTH-007**: Navigation between home and authenticated pages works

### Non-Functional Requirements

- No console errors on any page
- Session persists across page navigations
- Account deletion is immediate and irreversible

## References

- Clerk documentation - https://clerk.com/docs
- `tasks/auth/auth-pages.md` - Auth pages implementation
```

#### features/auth/acceptance.md

```markdown
# Authentication - Acceptance Criteria

## Feature Key: auth

## Acceptance Scenarios (REQ-FSH-007)

### Scenario 1: Home page renders without errors

**Given** I navigate to the home page
**When** the page loads
**Then** there should be no console errors
**And** all hero images should render

### Scenario 2: User account creation

**Given** I am on the home page
**When** I click "Sign Up" or navigate to account creation
**And** I complete the account creation form with valid credentials
**Then** I should be logged in successfully
**And** I should see the authenticated dashboard or home view

### Scenario 3: Login flow

**Given** I have an existing account
**When** I navigate to the sign-in page
**And** I enter valid credentials
**Then** I should be logged in
**And** I should be redirected to the dashboard

### Scenario 4: Logout flow

**Given** I am logged in
**When** I click logout
**Then** I should return to the unauthenticated home page
**And** my session should be cleared

### Scenario 5: Re-login flow

**Given** I previously logged out
**When** I log back in with the same credentials
**Then** I should be authenticated
**And** I should see my previous account data

### Scenario 6: Account deletion

**Given** I am logged in
**When** I navigate to account settings
**And** I initiate account deletion
**And** I confirm deletion
**Then** my account should be deleted
**And** I should be logged out
**And** I should be redirected to the home page

## Invariants

- No console errors on any page
- Session persists across navigation
- Clerk session is valid after login
```

#### features/auth/data.md

```markdown
# Authentication - Test Data

## Feature Key: auth

## Test User Lifecycle (REQ-FSH-007)

**Isolation Strategy**: Unique per-run emails using timestamp

Each test run creates test accounts with unique email addresses to prevent collisions:

```typescript
const timestamp = Date.now();
const testEmail = `test-${timestamp}@example.com`;
```

**Account Creation**: Tests create accounts dynamically via Clerk sign-up flow

**Account Cleanup**: Account deletion tests remove their own test accounts

**Collision Avoidance**: Timestamp-based emails ensure no two test runs share accounts

## Test Users

| Role  | Email Pattern                       | Password        | Notes                        |
|-------|-------------------------------------|-----------------|------------------------------|
| user  | `test-{timestamp}@example.com`      | `TestPass123!`  | Created dynamically per test |
| admin | `admin-{timestamp}@example.com`     | `AdminPass123!` | Admin role (future)          |

## Environment Variables

- `AUTH_EMAIL` - Fallback email for storageState (optional)
- `AUTH_PASSWORD` - Fallback password for storageState (optional)
- `CLERK_PUBLISHABLE_KEY` - Clerk publishable key (test mode)
- `CLERK_SECRET_KEY` - Clerk secret key (test mode)

## Edge Cases

- Invalid email format (rejected by Clerk)
- Weak password (rejected by Clerk)
- Duplicate email (prevented by unique timestamp)
- Account deletion of already-deleted account (handled gracefully)
```

#### features/auth/risks.md

```markdown
# Authentication - Test Risks

## Feature Key: auth

## Known Risks

### Flakiness Sources

- **Rate limiting**: Clerk may rate-limit account creation in test mode
  - **Mitigation**: Use unique emails, add delays between tests if needed
- **Network latency**: Clerk API calls may be slow
  - **Mitigation**: Use generous timeouts (10s for auth calls)
- **Test data collision**: Shared test accounts cause flaky failures
  - **Mitigation**: Use unique per-run emails (timestamp-based)

### Brittle Locators

- **Clerk UI changes**: Clerk updates their UI components
  - **Mitigation**: Use role-based locators, not CSS classes
- **Dynamic form fields**: Email/password inputs may have generated IDs
  - **Mitigation**: Use `input[name="identifier"]` or `getByLabel('Email')`

### External Dependencies

- **Clerk API**: Tests depend on Clerk test mode availability
  - **Mitigation**: Document Clerk outage handling, use local mocks if possible (future)
- **Session persistence**: Clerk session must persist across page navigations
  - **Mitigation**: Use `storageState` from `e2e/auth.setup.ts`

## Mitigation Strategies

- Use explicit waits for Clerk API responses
- Prefer role/label locators over CSS
- Isolate test data per run (unique emails)
- Document timeouts and retry policies in shepherd.config.json
```

#### features/auth/shepherd.config.json

```json
{
  "featureKey": "auth",
  "entryUrl": "/",
  "requiredRole": "none",
  "featureFlags": [],
  "codeOwners": {
    "globs": [
      "src/pages/sign-in.astro",
      "src/pages/sign-up.astro",
      "src/components/clerk/**",
      "src/lib/clerk/**"
    ],
    "routePrefixes": ["/sign-in", "/sign-up", "/dashboard"],
    "labels": ["feature:auth", "shepherd:auth"]
  },
  "goldenPath": "Home → Sign Up → Logged In → Dashboard → Logout",
  "invariants": [
    "No console errors on page load",
    "Clerk session is valid after login",
    "Session persists across navigation",
    "Account deletion removes all user data"
  ]
}
```

### 3. Validation Steps

After creating the auth pilot contract and prompt template:

1. **Validate contract**:
   ```bash
   bun scripts/validate-shepherd-contract.ts auth
   ```

2. **Run Planner** (generates `features/auth/plan.md`):
   ```bash
   bun run shepherd:plan -- auth
   ```

3. **Run Generator** (generates `e2e/shepherd/auth/*.spec.ts`):
   ```bash
   bun run shepherd:generate -- auth
   ```

4. **Run Healer** (debugs/fixes failing tests):
   ```bash
   bun run shepherd:heal -- auth
   ```

5. **Run tests**:
   ```bash
   bun run test:e2e -- e2e/shepherd/auth
   ```

6. **Verify coverage** (check `features/auth/report.md`):
   - All REQ-FSH-007 scenarios covered
   - Tests pass
   - No test data collisions

## Files

### New Files Created

- `features/_templates/shepherd.prompt.md` - Shepherd prompt template
- `features/auth/prd.md` - Auth feature PRD
- `features/auth/acceptance.md` - Auth acceptance criteria (REQ-FSH-007)
- `features/auth/data.md` - Test data and isolation strategy
- `features/auth/risks.md` - Known auth risks
- `features/auth/shepherd.config.json` - Auth config

### Files Generated by Agents

- `features/auth/plan.md` - Generated by Planner
- `features/auth/report.md` - Generated by Agents
- `e2e/shepherd/auth/seed.spec.ts` - Generated by Generator
- `e2e/shepherd/auth/*.spec.ts` - Generated by Generator

## Notes

- The auth pilot validates the **entire Feature Shepherds system** end-to-end
- Auth is the **foundational feature** - all other features depend on it (REQ-FSH-007)
- Test data isolation (unique emails) is **critical** to prevent flaky failures
- The prompt template is **version controlled** and reviewed like code
- Changes to the prompt require regeneration of all shepherd suites (or at minimum, the affected ones)
- The Planner/Generator/Healer agents use this prompt as their **primary instruction set**

## References

- `documentation/PRDs/feature-shepherds.md` - Full PRD (REQ-FSH-004, REQ-FSH-007)
- `tasks/testing/feature-shepherd-contracts.md` - Feature contract structure
- `tasks/testing/playwright-agents-bootstrap.md` - Playwright Agents integration
- `tasks/testing/feature-shepherd-seed-fixtures.md` - Shared fixtures
- Playwright Agents documentation - https://playwright.dev/docs/test-agents
