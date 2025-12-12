import type { FullConfig } from '@playwright/test'
import { clerkSetup } from '@clerk/testing/playwright'

// Global setup for Clerk E2E tests.
// Runs once before all Playwright projects and configures Clerk testing token.
// This uses Playwright's globalSetup hook instead of a dedicated setup project,
// which keeps the Playwright UI project list simpler (no visible `setup` project).
export default async function globalSetup(_config: FullConfig): Promise<void> {
	await clerkSetup()
	// Helpful log so it's obvious in test output that Clerk test mode is ready.
	// Note: this runs once per `playwright test` invocation.
	console.log('✅ Clerk testing token generated (globalSetup)')
}

