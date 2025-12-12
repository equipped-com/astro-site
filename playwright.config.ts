import { defineConfig, devices } from '@playwright/test'

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
