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
			// Standard multi-browser projects; Clerk is configured via globalSetup
			{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
			{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
			{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
			{ name: 'mobile', use: { ...devices['iPhone 14'] } },
		],
		webServer: {
			command: 'bun run dev',
			url: 'http://localhost:4321',
			reuseExistingServer: !process.env.CI,
			timeout: 120000,
		},
	})
