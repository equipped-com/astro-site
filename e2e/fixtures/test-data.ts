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
}

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
