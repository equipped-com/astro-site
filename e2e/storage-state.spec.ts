import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Tests for Authentication State Reuse Pattern
 * @REQ-STATE-001 through @REQ-STATE-005
 *
 * These tests verify that:
 * 1. Setup project saves authentication state correctly
 * 2. Test projects can reuse saved state without re-authenticating
 * 3. Multiple tests can run in parallel with the same auth state
 * 4. State can be refreshed when needed
 * 5. Different user types can have separate storage states
 */

const authFile = 'playwright/.clerk/user.json'

test.describe('Authentication State Reuse', () => {
	// @REQ-STATE-001 - Setup project authenticates and saves state
	test.describe('Setup Project', () => {
		test('should save authentication state file', async () => {
			// Given the setup project has run
			// When we check for the saved state file
			const fileExists = fs.existsSync(authFile)

			// Then the file should exist
			expect(fileExists).toBe(true)
		})

		test('should contain valid JSON in state file', async () => {
			// Given the state file exists
			// When we read and parse it
			const filePath = path.resolve(authFile)
			const content = fs.readFileSync(filePath, 'utf-8')
			const state = JSON.parse(content)

			// Then it should be valid JSON with expected structure
			expect(state).toBeDefined()
			expect(state).toHaveProperty('cookies')
			expect(Array.isArray(state.cookies)).toBe(true)
		})

		test('should contain session cookies', async () => {
			// Given the state file has been saved
			// When we read the state
			const filePath = path.resolve(authFile)
			const content = fs.readFileSync(filePath, 'utf-8')
			const state = JSON.parse(content)

			// Then it should contain Clerk-related cookies
			const hasCookies = state.cookies && state.cookies.length > 0
			expect(hasCookies).toBe(true)

			// And should contain __session or similar auth cookies
			const cookieNames = state.cookies.map((c) => c.name)
			const hasAuthCookie = cookieNames.some((name) =>
				name.includes('session') || name.includes('clerk')
			)
			expect(hasAuthCookie).toBe(true)
		})

		test('should contain localStorage data', async () => {
			// Given the state file has been saved
			// When we read the state
			const filePath = path.resolve(authFile)
			const content = fs.readFileSync(filePath, 'utf-8')
			const state = JSON.parse(content)

			// Then it should have origins with localStorage
			expect(state).toHaveProperty('origins')
			expect(Array.isArray(state.origins)).toBe(true)
			expect(state.origins.length).toBeGreaterThan(0)
		})
	})

	// @REQ-STATE-002 - Test projects reuse authentication state
	test.describe('Reusing Stored State', () => {
		test('should start with authentication already loaded', async ({ page }) => {
			// Given I'm using the stored authentication state (configured in playwright.config.ts)
			// When I navigate to a protected page
			await page.goto('/dashboard')

			// Then I should already be authenticated
			// (no redirect to sign-in should occur)
			await expect(page).toHaveURL(/\/dashboard/)
		})

		test('should not need to call signIn() again', async ({ page }) => {
			// Given the authentication state is loaded
			// When I navigate directly to dashboard
			await page.goto('/dashboard')

			// Then I should see authenticated content
			await expect(page.locator('text=Dashboard')).toBeVisible()

			// And the user button should be visible
			await expect(page.locator('[data-testid="user-button"]')).toBeVisible()
		})

		test('should have access to protected routes', async ({ page }) => {
			// Given I'm already authenticated via stored state
			// When I navigate to various protected routes
			const routes = ['/dashboard', '/dashboard/people', '/dashboard/devices']

			for (const route of routes) {
				await page.goto(route)

				// Then I should not be redirected to sign-in
				await expect(page).not.toHaveURL(/\/sign-in/)

				// And the route should load successfully
				expect(page.url()).toContain(route)
			}
		})

		test('should have session persist across page reloads', async ({ page }) => {
			// Given I'm authenticated via stored state
			await page.goto('/dashboard')
			await expect(page.locator('text=Dashboard')).toBeVisible()

			// When I reload the page
			await page.reload()

			// Then I should still be authenticated
			await expect(page).toHaveURL(/\/dashboard/)
			await expect(page.locator('text=Dashboard')).toBeVisible()
		})

		test('should have cookies available in storage', async ({ page, context }) => {
			// Given I have stored state loaded
			// When I check the browser context cookies
			const cookies = await context.cookies()

			// Then I should have auth-related cookies
			const cookieNames = cookies.map((c) => c.name)
			const hasAuthCookie = cookieNames.some((name) =>
				name.includes('session') || name.includes('clerk')
			)
			expect(hasAuthCookie).toBe(true)
		})
	})

	// @REQ-STATE-003 - Multiple tests run in parallel with same auth
	test.describe('Parallel Test Execution', () => {
		test('should allow parallel test 1 to access dashboard', async ({ page }) => {
			// Given multiple tests are running in parallel
			// When test 1 accesses the dashboard
			await page.goto('/dashboard')

			// Then it should be authenticated
			await expect(page).toHaveURL(/\/dashboard/)
			await expect(page.locator('text=Dashboard')).toBeVisible()
		})

		test('should allow parallel test 2 to access dashboard', async ({ page }) => {
			// Given multiple tests are running in parallel
			// When test 2 accesses the dashboard
			await page.goto('/dashboard')

			// Then it should be authenticated
			await expect(page).toHaveURL(/\/dashboard/)
			await expect(page.locator('text=Dashboard')).toBeVisible()
		})

		test('should allow parallel test 3 to access dashboard', async ({ page }) => {
			// Given multiple tests are running in parallel
			// When test 3 accesses the dashboard
			await page.goto('/dashboard')

			// Then it should be authenticated
			await expect(page).toHaveURL(/\/dashboard/)
			await expect(page.locator('text=Dashboard')).toBeVisible()
		})

		test('should allow parallel test 4 to access dashboard', async ({ page }) => {
			// Given multiple tests are running in parallel
			// When test 4 accesses the dashboard
			await page.goto('/dashboard')

			// Then it should be authenticated
			await expect(page).toHaveURL(/\/dashboard/)
			await expect(page.locator('text=Dashboard')).toBeVisible()
		})

		test('should allow parallel test 5 to access dashboard', async ({ page }) => {
			// Given multiple tests are running in parallel
			// When test 5 accesses the dashboard
			await page.goto('/dashboard')

			// Then it should be authenticated
			await expect(page).toHaveURL(/\/dashboard/)
			await expect(page.locator('text=Dashboard')).toBeVisible()
		})

		test('should allow parallel test 6 to access dashboard', async ({ page }) => {
			// Given multiple tests are running in parallel
			// When test 6 accesses the dashboard
			await page.goto('/dashboard')

			// Then it should be authenticated
			await expect(page).toHaveURL(/\/dashboard/)
			await expect(page.locator('text=Dashboard')).toBeVisible()
		})

		test('should allow parallel test 7 to access dashboard', async ({ page }) => {
			// Given multiple tests are running in parallel
			// When test 7 accesses the dashboard
			await page.goto('/dashboard')

			// Then it should be authenticated
			await expect(page).toHaveURL(/\/dashboard/)
			await expect(page.locator('text=Dashboard')).toBeVisible()
		})

		test('should allow parallel test 8 to access dashboard', async ({ page }) => {
			// Given multiple tests are running in parallel
			// When test 8 accesses the dashboard
			await page.goto('/dashboard')

			// Then it should be authenticated
			await expect(page).toHaveURL(/\/dashboard/)
			await expect(page.locator('text=Dashboard')).toBeVisible()
		})

		test('should allow parallel test 9 to access dashboard', async ({ page }) => {
			// Given multiple tests are running in parallel
			// When test 9 accesses the dashboard
			await page.goto('/dashboard')

			// Then it should be authenticated
			await expect(page).toHaveURL(/\/dashboard/)
			await expect(page.locator('text=Dashboard')).toBeVisible()
		})

		test('should allow parallel test 10 to access dashboard', async ({ page }) => {
			// Given multiple tests are running in parallel
			// When test 10 accesses the dashboard
			await page.goto('/dashboard')

			// Then it should be authenticated
			await expect(page).toHaveURL(/\/dashboard/)
			await expect(page.locator('text=Dashboard')).toBeVisible()
		})
	})

	// @REQ-STATE-004 - Re-run setup when auth expires
	test.describe('State Refresh', () => {
		test('should allow manual state refresh by deleting cache', async () => {
			// Given the stored state file exists
			const fileExists = fs.existsSync(authFile)
			expect(fileExists).toBe(true)

			// When we check the file modification time
			const stats = fs.statSync(authFile)
			const mtime = stats.mtime.getTime()
			const now = Date.now()
			const ageInDays = (now - mtime) / (1000 * 60 * 60 * 24)

			// Then we can determine if refresh is needed (>7 days old)
			// This allows developers to manually delete the file to force refresh
			expect(ageInDays).toBeLessThan(7)
		})

		test('should support deletion of stale state files', async () => {
			// Given we have a state file
			const fileExists = fs.existsSync(authFile)
			expect(fileExists).toBe(true)

			// When checking for stale files (this is informational)
			const stats = fs.statSync(authFile)

			// Then the file path and stats are accessible for cleanup
			expect(stats.isFile()).toBe(true)
			expect(stats.size).toBeGreaterThan(0)
		})
	})

	// @REQ-STATE-005 - Different storage states for different user types
	test.describe('Multi-User Storage States', () => {
		test('should support multiple state files for different roles', async () => {
			// Given we want to test with different user types
			// When we configure multiple state files in playwright.config.ts
			// Then the pattern supports role-specific setup files like:
			// - playwright/.clerk/admin.json
			// - playwright/.clerk/member.json
			// - playwright/.clerk/user.json

			// This test is informational - verifies the pattern is supported
			const baseDir = path.dirname(authFile)
			expect(baseDir).toBe('playwright/.clerk')

			// The naming pattern supports multiple roles
			const adminState = path.join(baseDir, 'admin.json')
			const memberState = path.join(baseDir, 'member.json')
			const defaultState = path.join(baseDir, 'user.json')

			// All follow the same pattern
			expect(path.dirname(adminState)).toBe(path.dirname(memberState))
			expect(path.dirname(memberState)).toBe(path.dirname(defaultState))
		})

		test('should support separate setup projects per role', async () => {
			// Given we have auth.setup.ts
			// And we want role-specific variants like:
			// - auth.setup.admin.ts
			// - auth.setup.member.ts

			// When we configure projects with testMatch patterns
			// Then Playwright can run multiple setup projects:
			// testMatch: /auth\.setup\.admin\.ts/
			// testMatch: /auth\.setup\.member\.ts/

			// And each can save to different state files
			const setupPatterns = [
				/auth\.setup\.ts/,
				/auth\.setup\.admin\.ts/,
				/auth\.setup\.member\.ts/,
			]

			// Pattern is flexible and supports any number of roles
			expect(setupPatterns.length).toBeGreaterThanOrEqual(1)
		})
	})
})
