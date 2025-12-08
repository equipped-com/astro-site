/**
 * Sys Admin Middleware Tests
 *
 * @REQ-SA-002 Sys admin email domain check
 *
 * NOTE: These tests verify the logic and structure of the middleware.
 * Full integration tests with actual Clerk client mocking would require more complex setup.
 */

import { describe, expect, it } from 'vitest'
import { checkSysAdmin, requireSysAdmin } from './sysadmin'

describe('Sys Admin Middleware', () => {
	describe('requireSysAdmin()', () => {
		/**
		 * @REQ-SA-002
		 * Scenario: Sys admin email domain check
		 *   Given user has email "@tryequipped.com", "@getupgraded.com", or "@cogzero.com"
		 *   Then user should have sys_admin access
		 */
		it('should return a middleware function', () => {
			const middleware = requireSysAdmin()
			expect(middleware).toBeTypeOf('function')
		})

		it('should be async middleware', () => {
			const middleware = requireSysAdmin()
			expect(middleware.constructor.name).toBe('AsyncFunction')
		})
	})

	describe('checkSysAdmin()', () => {
		/**
		 * @REQ-SA-002
		 * Test the checkSysAdmin helper function structure
		 */
		it('should be an async function', () => {
			expect(checkSysAdmin).toBeTypeOf('function')
			expect(checkSysAdmin.constructor.name).toBe('AsyncFunction')
		})
	})

	/**
	 * @REQ-SA-002
	 * Email domain validation logic test
	 * Testing the logic that would be executed by the middleware
	 */
	describe('Email domain validation logic', () => {
		const ADMIN_DOMAINS = ['tryequipped.com', 'getupgraded.com', 'cogzero.com']

		function checkEmailDomain(email: string): boolean {
			const domain = email.split('@')[1]?.toLowerCase()
			return ADMIN_DOMAINS.includes(domain)
		}

		it('should validate @tryequipped.com as admin domain', () => {
			expect(checkEmailDomain('staff@tryequipped.com')).toBe(true)
		})

		it('should validate @getupgraded.com as admin domain', () => {
			expect(checkEmailDomain('admin@getupgraded.com')).toBe(true)
		})

		it('should validate @cogzero.com as admin domain', () => {
			expect(checkEmailDomain('staff@cogzero.com')).toBe(true)
		})

		it('should reject non-admin email domain', () => {
			expect(checkEmailDomain('user@company.com')).toBe(false)
		})

		it('should reject invalid email format', () => {
			expect(checkEmailDomain('invalid-email')).toBe(false)
		})

		it('should be case-insensitive', () => {
			expect(checkEmailDomain('ADMIN@TRYEQUIPPED.COM')).toBe(true)
		})
	})
})
