import { expect, signIn, signInProgrammatic, signInUI, test } from './fixtures/auth'

// @REQ-E2E-AUTH-001
test.describe('Authentication Flow', () => {
	test('user can sign in programmatically and access dashboard', async ({ page }) => {
		// Given I need to authenticate quickly (using programmatic sign-in)
		// When I sign in programmatically
		await signInProgrammatic(page)

		// Then I should be on the dashboard
		await expect(page).toHaveURL(/\/dashboard/)
		await expect(page.locator('text=Dashboard')).toBeVisible()
	})

	test('unauthenticated user is redirected from dashboard', async ({ page }) => {
		// Given I am not signed in
		// When I try to access the dashboard directly
		await page.goto('/dashboard')

		// Then I should be redirected to sign-in
		await expect(page).toHaveURL(/\/sign-in/)
	})

	test('user can sign out', async ({ page }) => {
		// Given I am signed in
		await signIn(page)

		// When I click sign out
		await page.click('[data-testid="user-button"]')
		await page.click('text=Sign out')

		// Then I should be on the homepage
		await expect(page).toHaveURL('/')
	})

	// @REQ-CLERK-003 - Test UI-based sign-in flow
	test('user can sign in via UI and authenticate', async ({ page }) => {
		// Given I need to test the actual sign-in flow
		// When I use the UI-based sign-in
		await signInUI(page)

		// Then I should be authenticated successfully
		await expect(page).toHaveURL(/\/dashboard/)
		await expect(page.locator('text=Dashboard')).toBeVisible()
	})
})
