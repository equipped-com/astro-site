import { test as base, type Page } from '@playwright/test'
import { clerk } from '@clerk/testing/playwright'

// Test user for E2E (create in Clerk test mode)
const TEST_USER = {
	email: 'e2e+clerk_test@example.com',
	password: process.env.E2E_TEST_PASSWORD || 'test-password-123',
}

/**
 * Programmatic sign-in (FAST - recommended for most tests)
 * Bypasses Clerk UI and signs in directly using Clerk's testing API
 * Use this for: Testing features AFTER authentication, CI/CD, quick iterations
 */
export async function signInProgrammatic(page: Page) {
	await clerk.signIn({
		page,
		signInParams: {
			strategy: 'password',
			identifier: TEST_USER.email,
			password: TEST_USER.password,
		},
	})
	// Wait for redirect to dashboard
	await page.waitForURL('/dashboard**')
}

/**
 * UI-based sign-in (SLOWER - use for testing sign-in flow itself)
 * Fills actual Clerk form fields and submits
 * Use this for: Testing the sign-in flow, form validation, auth error messages
 */
export async function signInUI(page: Page) {
	await page.goto('/sign-in')
	await page.fill('input[name="identifier"]', TEST_USER.email)
	await page.click('button:has-text("Continue")')
	await page.fill('input[name="password"]', TEST_USER.password)
	await page.click('button:has-text("Sign in")')
	await page.waitForURL('/dashboard**')
}

/**
 * Default sign-in method (uses programmatic for speed)
 * Most tests should use this unless specifically testing the sign-in UI
 */
export const signIn = signInProgrammatic

export async function signOut(page: Page) {
	await page.click('[data-testid="user-button"]')
	await page.click('text=Sign out')
	await page.waitForURL('/')
}

// Extended test with auth helpers
export const test = base.extend<{
	signIn: () => Promise<void>
	signInUI: () => Promise<void>
}>({
	signIn: async ({ page }, use) => {
		await use(() => signInProgrammatic(page))
	},
	signInUI: async ({ page }, use) => {
		await use(() => signInUI(page))
	},
})

export { expect } from '@playwright/test'
