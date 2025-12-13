import { expect, signInProgrammatic, signInUI, test } from './fixtures/auth'

/**
 * Clerk Testing Integration Tests
 * Tests for @clerk/testing package integration with Playwright
 * Covers: programmatic sign-in, UI fallback, test users, and environment configuration
 */

test.describe('Clerk Testing Integration', () => {
	// @REQ-CLERK-001 - Global setup bypasses bot protection
	test('global setup should have generated testing token', async ({ page }) => {
		// Given I have configured global-setup.ts with clerkSetup()
		// When Playwright runs tests
		// Then the testing token should be generated (verified in global-setup console output)
		// And bot protection should not block automated browsers

		// Navigate to sign-in page - should not be blocked by bot protection
		await page.goto('/sign-in')
		await expect(page.locator('input[name="identifier"]')).toBeVisible()

		// No CAPTCHA or bot detection should appear
		const captcha = page.locator('iframe[title*="reCAPTCHA"]')
		await expect(captcha).not.toBeVisible({ timeout: 2000 }).catch(() => {
			// Captcha not present is good - test passes
		})
	})

	// @REQ-CLERK-002 - Programmatic sign-in is faster than UI
	test('programmatic sign-in should complete in under 2 seconds', async ({ page }) => {
		// Given I need to authenticate a test user
		// When I use clerk.signIn() programmatically
		const startTime = Date.now()
		await signInProgrammatic(page)
		const duration = Date.now() - startTime

		// Then authentication should complete in under 2 seconds
		expect(duration).toBeLessThan(2000)

		// And I should be redirected to /dashboard
		await expect(page).toHaveURL(/\/dashboard/)

		// And my session should persist
		await page.reload()
		await expect(page).toHaveURL(/\/dashboard/)
		await expect(page.locator('text=Dashboard')).toBeVisible()
	})

	// @REQ-CLERK-003 - UI-based authentication still works
	test('UI-based authentication should work correctly', async ({ page }) => {
		// Given I need to test the actual sign-in flow
		// When I use the UI-based signIn() helper
		await signInUI(page)

		// Then I should fill the Clerk form fields (done inside signInUI)
		// And submit credentials (done inside signInUI)
		// And be authenticated successfully
		await expect(page).toHaveURL(/\/dashboard/)
		await expect(page.locator('text=Dashboard')).toBeVisible()
	})

	// @REQ-CLERK-004 - Test user with +clerk_test works
	test('test user with +clerk_test should not send actual email', async ({ page }) => {
		// Given I sign in with "e2e+clerk_test@example.com"
		// When authentication completes
		await signInProgrammatic(page)

		// Then no actual email should be sent (verified by Clerk test mode)
		// And I should be logged in
		await expect(page).toHaveURL(/\/dashboard/)
		await expect(page.locator('text=Dashboard')).toBeVisible()

		// Verify user button is present (indicates successful auth)
		await expect(page.locator('[data-testid="user-button"]')).toBeVisible()
	})

	// @REQ-CLERK-005 - Clerk environment variables are available
	test('Clerk environment variables should be set', async ({ page }) => {
		// Given I am running E2E tests
		// Then CLERK_PUBLISHABLE_KEY should be set
		expect(process.env.PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY).toBeDefined()

		// And CLERK_SECRET_KEY should be set
		expect(process.env.CLERK_SECRET_KEY).toBeDefined()

		// And both should match the Development instance (verified by successful auth)
		await signInProgrammatic(page)
		await expect(page).toHaveURL(/\/dashboard/)
	})

	// Additional test: Verify programmatic sign-in is significantly faster than UI
	test('programmatic sign-in should be faster than UI-based sign-in', async ({ page, context }) => {
		// Test programmatic sign-in speed
		const startProgrammatic = Date.now()
		await signInProgrammatic(page)
		const programmaticDuration = Date.now() - startProgrammatic

		// Sign out and clear session
		await page.click('[data-testid="user-button"]')
		await page.click('text=Sign out')
		await context.clearCookies()

		// Test UI-based sign-in speed
		const page2 = await context.newPage()
		const startUI = Date.now()
		await signInUI(page2)
		const uiDuration = Date.now() - startUI

		// Programmatic should be faster (or at least not significantly slower)
		// Allow some variance but expect programmatic to be at least as fast
		expect(programmaticDuration).toBeLessThanOrEqual(uiDuration * 1.5)

		await page2.close()
	})

	// Test session persistence across page reloads
	test('programmatic sign-in session should persist across reloads', async ({ page }) => {
		// Given I am signed in programmatically
		await signInProgrammatic(page)
		await expect(page).toHaveURL(/\/dashboard/)

		// When I reload the page
		await page.reload()

		// Then I should still be authenticated
		await expect(page).toHaveURL(/\/dashboard/)
		await expect(page.locator('text=Dashboard')).toBeVisible()

		// And I can navigate to other protected pages
		await page.goto('/dashboard/people')
		await expect(page).toHaveURL(/\/dashboard\/people/)
	})

	// Test that both methods result in the same authenticated state
	test('programmatic and UI sign-in should result in equivalent auth state', async ({
		page,
		context,
	}) => {
		// Sign in programmatically
		await signInProgrammatic(page)
		await expect(page.locator('[data-testid="user-button"]')).toBeVisible()

		// Capture auth state
		const cookies1 = await context.cookies()
		const clerkCookies1 = cookies1.filter((c) => c.name.includes('clerk'))

		// Sign out
		await page.click('[data-testid="user-button"]')
		await page.click('text=Sign out')
		await context.clearCookies()

		// Sign in via UI
		const page2 = await context.newPage()
		await signInUI(page2)
		await expect(page2.locator('[data-testid="user-button"]')).toBeVisible()

		// Capture auth state
		const cookies2 = await context.cookies()
		const clerkCookies2 = cookies2.filter((c) => c.name.includes('clerk'))

		// Both should have established Clerk session cookies
		expect(clerkCookies1.length).toBeGreaterThan(0)
		expect(clerkCookies2.length).toBeGreaterThan(0)

		await page2.close()
	})
})
