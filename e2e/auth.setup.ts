import { test as setup, expect } from '@playwright/test'
import { clerk } from '@clerk/testing/playwright'

const authFile = 'playwright/.clerk/user.json'

// Test user credentials
const TEST_USER = {
	email: 'e2e+clerk_test@example.com',
	password: process.env.E2E_TEST_PASSWORD || 'test-password-123',
}

/**
 * Setup test that authenticates and saves storage state
 * @REQ-STATE-001 - Setup project authenticates and saves state
 *
 * This test runs once before all other tests and saves the authentication
 * state (cookies, localStorage, sessionStorage) to a file. Other tests can
 * then reuse this state, avoiding redundant authentication calls.
 */
setup('authenticate and save state', async ({ page }) => {
	// Given I need to authenticate a test user
	// When I sign in programmatically using Clerk's testing API
	await clerk.signIn({
		page,
		signInParams: {
			strategy: 'password',
			identifier: TEST_USER.email,
			password: TEST_USER.password,
		},
	})

	// Wait for authentication to complete and redirect to dashboard
	await page.waitForURL('/dashboard**')

	// Then verify we're authenticated
	await expect(page.locator('[data-testid="user-button"]')).toBeVisible()

	// And save authentication state to file
	await page.context().storageState({ path: authFile })

	console.log(`✅ Authentication state saved to ${authFile}`)
})
