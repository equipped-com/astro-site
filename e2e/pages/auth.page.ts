import type { Page } from '@playwright/test'

export class AuthPage {
	constructor(private page: Page) {}

	async gotoSignIn() {
		await this.page.goto('/sign-in')
	}

	async gotoSignUp() {
		await this.page.goto('/sign-up')
	}

	async fillEmail(email: string) {
		await this.page.fill('input[name="identifier"]', email)
	}

	async fillPassword(password: string) {
		await this.page.fill('input[name="password"]', password)
	}

	async clickContinue() {
		await this.page.click('button:has-text("Continue")')
	}

	async clickSignIn() {
		await this.page.click('button:has-text("Sign in")')
	}

	async signIn(email: string, password: string) {
		await this.fillEmail(email)
		await this.clickContinue()
		await this.fillPassword(password)
		await this.clickSignIn()
		await this.page.waitForURL('/dashboard**')
	}
}
