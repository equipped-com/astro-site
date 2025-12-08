import type { Page } from '@playwright/test'

export class HomePage {
	constructor(private page: Page) {}

	async goto() {
		await this.page.goto('/')
	}

	async clickSignIn() {
		await this.page.click('text=Sign in')
	}

	async getTagline() {
		return this.page.locator('text=All things tech')
	}

	async getHero() {
		return this.page.locator('[data-testid="hero-section"]')
	}
}
