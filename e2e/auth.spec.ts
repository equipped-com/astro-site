import { expect, signIn, test } from './fixtures/auth'

// @REQ-E2E-AUTH-001
test.describe('Authentication Flow', () => {
	test('user can sign in and access dashboard', async ({ page }) => {
		// Given I am on the sign-in page
		await page.goto('/sign-in')

		// When I enter valid credentials and submit
		await signIn(page)

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
})
