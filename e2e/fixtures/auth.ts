import { test as base, type Page } from '@playwright/test'

// Test user for E2E (create in Clerk test mode)
const TEST_USER = {
	email: 'e2e-test@equipped.test',
	password: process.env.E2E_TEST_PASSWORD || 'test-password-123',
}

export async function signIn(page: Page) {
	await page.goto('/sign-in')
	await page.fill('input[name="identifier"]', TEST_USER.email)
	await page.click('button:has-text("Continue")')
	await page.fill('input[name="password"]', TEST_USER.password)
	await page.click('button:has-text("Sign in")')
	await page.waitForURL('/dashboard**')
}

export async function signOut(page: Page) {
	await page.click('[data-testid="user-button"]')
	await page.click('text=Sign out')
	await page.waitForURL('/')
}

// Extended test with auth helpers
export const test = base.extend<{ signIn: () => Promise<void> }>({
	signIn: async ({ page }, use) => {
		await use(() => signIn(page))
	},
})

export { expect } from '@playwright/test'
