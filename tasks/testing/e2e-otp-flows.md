# Task: E2E Tests for OTP Verification Flows

## Description

Create end-to-end tests for OTP (One-Time Password) verification flows using Clerk's test account pattern. Tests email verification, SMS verification, and 2FA using the static test code `424242`.

## Acceptance Criteria

- [ ] Test email OTP verification flow with `+clerk_test` email
- [ ] Test phone OTP verification flow with +1 (XXX) 555-01XX number
- [ ] Test sign-up with email verification
- [ ] Test sign-in with email code (passwordless)
- [ ] Test phone number addition/verification
- [ ] Test 2FA setup and verification
- [ ] All tests use static code `424242`
- [ ] Document OTP test patterns for future tests

## Test Criteria

```gherkin
Feature: OTP Verification Testing
  As a developer
  I want to test OTP verification flows
  So that I can verify authentication works without sending real messages

  @REQ-OTP-001 @Email
  Scenario: Sign-up with email verification
    Given I am on the sign-up page
    When I enter email "newuser+clerk_test@example.com"
    And I submit the form
    Then I should see "Enter verification code" prompt
    When I enter code "424242"
    Then my account should be created
    And I should be signed in
    And I should be on /dashboard

  @REQ-OTP-002 @EmailCode
  Scenario: Sign-in with email code (passwordless)
    Given I have an existing account with email "user+clerk_test@example.com"
    When I start sign-in with email code strategy
    And I enter my email
    And I submit to request code
    Then I should see "Enter verification code" prompt
    When I enter code "424242"
    Then I should be signed in

  @REQ-OTP-003 @Phone
  Scenario: Add and verify phone number
    Given I am signed in
    And I am on my profile settings
    When I click "Add phone number"
    And I enter phone "+12015550100"
    And I submit
    Then I should see "Enter verification code" prompt
    When I enter code "424242"
    Then my phone should be verified
    And I should see "+1 (201) 555-0100" in my profile

  @REQ-OTP-004 @PhoneSignIn
  Scenario: Sign-in with phone number
    Given I have verified phone "+12015550100"
    When I start sign-in with phone code strategy
    And I enter my phone number
    And I submit to request code
    Then I should see "Enter verification code" prompt
    When I enter code "424242"
    Then I should be signed in

  @REQ-OTP-005 @TwoFactor
  Scenario: Enable 2FA with SMS
    Given I am signed in
    And I am on security settings
    When I click "Enable two-factor authentication"
    And I select "SMS" as 2FA method
    And I enter phone "+12015550101"
    And I submit
    Then I should see "Enter verification code" prompt
    When I enter code "424242"
    Then 2FA should be enabled
    And I should see "Two-factor authentication: Enabled"

  @REQ-OTP-006 @TwoFactorLogin
  Scenario: Sign-in with 2FA enabled
    Given I have 2FA enabled via SMS
    When I sign in with email and password
    Then I should see "Enter 2FA code" prompt
    When I enter code "424242"
    Then I should complete sign-in
    And I should be on /dashboard

  @REQ-OTP-007 @InvalidCode
  Scenario: Invalid OTP code shows error
    Given I am verifying my email
    When I enter code "111111"
    Then I should see error "Invalid verification code"
    And I should remain on verification screen

  @REQ-OTP-008 @TestPhoneRange
  Scenario: Test phone numbers work across valid range
    Given I need to test with different phone numbers
    Then the following should work:
      | Phone Number    | Valid |
      | +12015550100    | Yes   |
      | +12015550150    | Yes   |
      | +12015550199    | Yes   |
      | +12015550200    | No    |
```

## Dependencies

- testing/clerk-e2e-integration (Clerk testing setup must be complete)

## Implementation

### 1. Create e2e/otp-flows.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test.describe('Email OTP Verification', () => {
	// @REQ-OTP-001
	test('sign-up with email verification', async ({ page }) => {
		await page.goto('/sign-up');

		// Enter test email (no real email will be sent)
		await page.fill('input[name="email"]', 'newuser+clerk_test@example.com');
		await page.fill('input[name="password"]', 'test-password-123');
		await page.click('button:has-text("Sign up")');

		// Wait for verification prompt
		await expect(page.locator('text=Enter verification code')).toBeVisible();

		// Enter static test code
		await page.fill('input[name="code"]', '424242');

		// Verify account created and signed in
		await page.waitForURL('/dashboard**');
		await expect(page.locator('[data-testid="user-button"]')).toBeVisible();
	});

	// @REQ-OTP-002
	test('sign-in with email code (passwordless)', async ({ page }) => {
		await page.goto('/sign-in');

		// Select email code strategy (if multiple options)
		await page.click('text=Use email code');

		// Enter test email
		await page.fill('input[name="identifier"]', 'user+clerk_test@example.com');
		await page.click('button:has-text("Continue")');

		// Wait for code prompt
		await expect(page.locator('text=Enter verification code')).toBeVisible();

		// Enter static test code
		await page.fill('input[name="code"]', '424242');

		// Verify signed in
		await page.waitForURL('/dashboard**');
	});
});

test.describe('Phone OTP Verification', () => {
	// @REQ-OTP-003
	test('add and verify phone number', async ({ page, signIn }) => {
		// Sign in first
		await signIn();

		// Navigate to profile settings
		await page.goto('/dashboard/settings/profile');

		// Click add phone
		await page.click('button:has-text("Add phone number")');

		// Enter test phone (no real SMS will be sent)
		await page.fill('input[name="phone"]', '+12015550100');
		await page.click('button:has-text("Send code")');

		// Wait for code prompt
		await expect(page.locator('text=Enter verification code')).toBeVisible();

		// Enter static test code
		await page.fill('input[name="code"]', '424242');
		await page.click('button:has-text("Verify")');

		// Verify phone was added
		await expect(page.locator('text=+1 (201) 555-0100')).toBeVisible();
		await expect(page.locator('text=Verified')).toBeVisible();
	});

	// @REQ-OTP-004
	test('sign-in with phone code', async ({ page }) => {
		await page.goto('/sign-in');

		// Select phone code strategy
		await page.click('text=Use phone code');

		// Enter test phone
		await page.fill('input[name="identifier"]', '+12015550100');
		await page.click('button:has-text("Continue")');

		// Wait for code prompt
		await expect(page.locator('text=Enter verification code')).toBeVisible();

		// Enter static test code
		await page.fill('input[name="code"]', '424242');

		// Verify signed in
		await page.waitForURL('/dashboard**');
	});
});

test.describe('Two-Factor Authentication', () => {
	// @REQ-OTP-005
	test('enable 2FA with SMS', async ({ page, signIn }) => {
		// Sign in first
		await signIn();

		// Navigate to security settings
		await page.goto('/dashboard/settings/security');

		// Enable 2FA
		await page.click('button:has-text("Enable two-factor authentication")');

		// Select SMS method
		await page.click('text=SMS');

		// Enter test phone
		await page.fill('input[name="phone"]', '+12015550101');
		await page.click('button:has-text("Send code")');

		// Enter static test code
		await page.fill('input[name="code"]', '424242');
		await page.click('button:has-text("Enable")');

		// Verify 2FA enabled
		await expect(page.locator('text=Two-factor authentication: Enabled')).toBeVisible();
	});

	// @REQ-OTP-006
	test.use({ storageState: { cookies: [], origins: [] } }); // Start logged out

	test('sign-in with 2FA enabled', async ({ page }) => {
		await page.goto('/sign-in');

		// Sign in with password
		await page.fill('input[name="identifier"]', 'user2fa+clerk_test@example.com');
		await page.click('button:has-text("Continue")');
		await page.fill('input[name="password"]', 'test-password-123');
		await page.click('button:has-text("Sign in")');

		// Wait for 2FA prompt
		await expect(page.locator('text=Enter 2FA code')).toBeVisible();

		// Enter static test code
		await page.fill('input[name="code"]', '424242');

		// Verify signed in
		await page.waitForURL('/dashboard**');
	});
});

test.describe('OTP Error Handling', () => {
	// @REQ-OTP-007
	test('invalid code shows error', async ({ page }) => {
		await page.goto('/sign-up');

		await page.fill('input[name="email"]', 'test+clerk_test@example.com');
		await page.fill('input[name="password"]', 'test-password-123');
		await page.click('button:has-text("Sign up")');

		// Wait for verification prompt
		await expect(page.locator('text=Enter verification code')).toBeVisible();

		// Enter invalid code
		await page.fill('input[name="code"]', '111111');

		// Verify error shown
		await expect(page.locator('text=Invalid verification code')).toBeVisible();

		// Still on verification screen
		await expect(page.locator('input[name="code"]')).toBeVisible();
	});
});
```

## Test Phone Number Ranges

Clerk test phone numbers follow this pattern:

**Valid test numbers:**
- `+1 (XXX) 555-0100` through `+1 (XXX) 555-0199`

**Examples:**
- ✅ `+12015550100` (valid)
- ✅ `+12015550150` (valid)
- ✅ `+12015550199` (valid)
- ❌ `+12015550200` (invalid - outside test range)
- ❌ `+12015550099` (invalid - outside test range)

**In tests:**
```typescript
const TEST_PHONES = [
	'+12015550100', // Test user 1
	'+12015550101', // Test user 2
	'+13105550100', // Test user 3 (different area code)
	'+14155550100', // Test user 4
];
```

## Static OTP Code

**All test accounts use the same verification code:**
```typescript
const CLERK_TEST_OTP = '424242';
```

This code works for:
- Email verification
- Phone number verification
- SMS 2FA
- Passwordless sign-in
- Account recovery

## Best Practices

### DO:
- ✅ Use `+clerk_test` suffix for email addresses
- ✅ Use phone numbers in the 555-01XX range
- ✅ Always use code `424242` in tests
- ✅ Test both valid and invalid code scenarios
- ✅ Verify error messages for invalid codes

### DON'T:
- ❌ Send real emails/SMS in tests
- ❌ Use production email addresses
- ❌ Hardcode other OTP codes
- ❌ Skip OTP testing (it's critical for auth)

## Files to Create

- `e2e/otp-flows.spec.ts` - OTP verification tests

## Files to Modify

- `e2e/fixtures/test-data.ts` - Add test phone numbers and OTP constant

## References

- documentation/e2e-testing-with-clerk.md (Section 1: Test Accounts)
- [Clerk Test Emails and Phones](https://clerk.com/docs/guides/development/testing/test-emails-and-phones)
- PRD.md Section 3: User Authentication and Onboarding
- tasks/testing/clerk-e2e-integration.md
