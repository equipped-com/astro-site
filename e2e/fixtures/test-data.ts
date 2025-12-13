/**
 * Test data fixtures for E2E tests
 * Note: Create test users in Clerk test mode before running E2E tests
 */

export const TEST_USERS = {
	default: {
		email: 'e2e+clerk_test@example.com',
		password: process.env.E2E_TEST_PASSWORD || 'test-password-123',
	},
	admin: {
		email: 'e2e-admin@equipped.test',
		password: process.env.E2E_ADMIN_PASSWORD || 'admin-password-123',
	},
	otp: {
		email: 'user+clerk_test@example.com',
		password: 'test-password-123',
	},
	twoFactor: {
		email: 'user2fa+clerk_test@example.com',
		password: 'test-password-123',
	},
}

/**
 * Static OTP code for all Clerk test accounts
 * Works for: email verification, phone verification, SMS 2FA, passwordless sign-in
 */
export const CLERK_TEST_OTP = '424242'

/**
 * Test phone numbers (Clerk test mode)
 * Valid range: +1 (XXX) 555-0100 through +1 (XXX) 555-0199
 */
export const TEST_PHONES = [
	'+12015550100', // Test user 1
	'+12015550101', // Test user 2 (2FA)
	'+13105550100', // Test user 3 (different area code)
	'+14155550100', // Test user 4
	'+12015550150', // Test user 5
	'+12015550199', // Test user 6 (last valid in range)
]

export const MOCK_DEVICES = {
	macbookPro: {
		model: 'MacBook Pro 14"',
		condition: 'good',
		estimatedValue: 1200,
	},
	iphone15: {
		model: 'iPhone 15 Pro',
		condition: 'excellent',
		estimatedValue: 800,
	},
}

export const MOCK_ADDRESSES = {
	office: {
		street: '123 Tech Street',
		city: 'San Francisco',
		state: 'CA',
		zip: '94105',
	},
	home: {
		street: '456 Home Ave',
		city: 'Austin',
		state: 'TX',
		zip: '78701',
	},
}
