import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './e2e',
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
		// Setup project runs first to configure Clerk testing token
		{
			name: 'setup',
			testMatch: /global\.setup\.ts/,
		},
		// Browser projects depend on setup
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] }, dependencies: ['setup'] },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] }, dependencies: ['setup'] },
		{ name: 'mobile', use: { ...devices['iPhone 14'] }, dependencies: ['setup'] },
	],
	webServer: {
		command: 'bun run dev',
		url: 'http://localhost:4321',
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
})
