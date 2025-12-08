import { expect, test } from '@playwright/test'

// @REQ-E2E-SMOKE-001
test.describe('Smoke Tests', () => {
	test('homepage loads', async ({ page }) => {
		await page.goto('/')
		await expect(page).toHaveTitle(/Equipped/)
		await expect(page.locator('text=All things tech')).toBeVisible()
	})

	test('navigation works', async ({ page }) => {
		await page.goto('/')
		await page.click('text=Sign in')
		await expect(page).toHaveURL('/sign-in')
	})

	test('sign-in page renders', async ({ page }) => {
		await page.goto('/sign-in')
		await expect(page.locator('input[name="identifier"]')).toBeVisible()
	})
})
