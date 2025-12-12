import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Load .env.test for E2E tests (Playwright doesn't auto-load .env files)
// This makes CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY available for @clerk/testing
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

export default defineConfig({
		testDir: './e2e',
		// Run Clerk test-mode setup once before all tests
		globalSetup: './e2e/clerk-global-setup',
		fullyParallel: true,
		forbidOnly: !!process.env.CI,
		retries: process.env.CI ? 2 : 0,
		workers: process.env.CI ? 1 : undefined,
		reporter: [['html', { open: 'never' }], ['list']],
		use: {
			baseURL: 'http://localhost:4321',
			trace: 'on-first-retry',
			screenshot: 'only-on-failure',
		},
		projects: [
			// Setup project - runs first and saves authentication state
			// @REQ-STATE-001 - Setup project authenticates and saves state
			{
				name: 'setup',
				testMatch: /.*\.setup\.ts/,
			},

			// Test projects - reuse authentication state from setup
			// @REQ-STATE-002 - Test projects reuse authentication state
			{
				name: 'chromium',
				use: {
					...devices['Desktop Chrome'],
					storageState: 'playwright/.clerk/user.json',
				},
				dependencies: ['setup'],
			},
			{
				name: 'firefox',
				use: {
					...devices['Desktop Firefox'],
					storageState: 'playwright/.clerk/user.json',
				},
				dependencies: ['setup'],
			},
			{
				name: 'webkit',
				use: {
					...devices['Desktop Safari'],
					storageState: 'playwright/.clerk/user.json',
				},
				dependencies: ['setup'],
			},
			{
				name: 'mobile',
				use: {
					...devices['iPhone 14'],
					storageState: 'playwright/.clerk/user.json',
				},
				dependencies: ['setup'],
			},
		],
		webServer: {
			command: 'bun run dev',
			url: 'http://localhost:4321',
			reuseExistingServer: !process.env.CI,
			timeout: 120000,
		},
	})
