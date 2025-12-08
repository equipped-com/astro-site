import type { Page } from '@playwright/test'

export class DashboardPage {
	constructor(private page: Page) {}

	async goto() {
		await this.page.goto('/dashboard')
	}

	async getHeader() {
		return this.page.locator('text=Dashboard')
	}

	async getUserButton() {
		return this.page.locator('[data-testid="user-button"]')
	}

	async clickSignOut() {
		await this.page.click('[data-testid="user-button"]')
		await this.page.click('text=Sign out')
	}
}
