/**
 * Shared API Test Mocks
 *
 * Common mocking utilities for API route tests.
 * Provides consistent patterns for mocking Clerk auth, D1 database, and middleware.
 *
 * @REQ-API-TEST-001 @Mocks @Helpers
 */

import { vi } from 'vitest'

/**
 * Create a mock Clerk client for testing sys admin middleware
 *
 * @param options Configuration for the mock
 * @returns Mock Clerk client object
 */
export function mockClerkClient(
	options: {
		email?: string
		userId?: string
		firstName?: string
		lastName?: string
	} = {},
) {
	const { email = 'admin@tryequipped.com', userId = 'user_123', firstName = 'Admin', lastName = 'User' } = options

	return {
		users: {
			getUser: vi.fn().mockResolvedValue({
				id: userId,
				emailAddresses: [{ emailAddress: email }],
				firstName,
				lastName,
			}),
		},
	}
}

/**
 * Create a mock D1 database for testing
 *
 * The mock database supports chaining: prepare().bind().first()/run()/all()
 *
 * @param handlers Custom handlers for database operations
 * @returns Mock D1 database object
 */
export function mockD1Database(
	handlers: {
		first?: (query: string, params: unknown[]) => Promise<unknown>
		all?: (query: string, params: unknown[]) => Promise<{ results: unknown[] }>
		run?: (query: string, params: unknown[]) => Promise<{ success: boolean; meta?: Record<string, unknown> }>
	} = {},
) {
	let lastQuery = ''
	let lastParams: unknown[] = []

	const mockDb = {
		prepare: vi.fn((query: string) => {
			lastQuery = query
			return {
				bind: vi.fn((...params: unknown[]) => {
					lastParams = params
					return {
						first: vi.fn(async () => {
							return handlers.first?.(lastQuery, lastParams) ?? null
						}),
						all: vi.fn(async () => {
							return handlers.all?.(lastQuery, lastParams) ?? { results: [] }
						}),
						run: vi.fn(async () => {
							return handlers.run?.(lastQuery, lastParams) ?? { success: true, meta: {} }
						}),
					}
				}),
			}
		}),
		exec: vi.fn().mockResolvedValue({ count: 0, duration: 0 }),
	}

	return mockDb
}

/**
 * Create auth context for getAuth() mock
 *
 * The auth context simulates what clerkMiddleware sets in Hono context.
 *
 * @param options Auth configuration
 * @returns Auth context object
 */
export function createAuthContext(
	options: {
		userId?: string
		sessionId?: string
		orgId?: string
	} = {},
) {
	const { userId = 'user_123', sessionId = 'session_123', orgId } = options

	// Return null for unauthenticated requests
	if (!userId) {
		return null
	}

	return {
		userId,
		sessionId,
		orgId,
	}
}

/**
 * Create user context for getUser() helper
 *
 * @param options User configuration
 * @returns User object
 */
export function createUserContext(
	options: {
		id?: string
		email?: string
		firstName?: string
		lastName?: string
	} = {},
) {
	const {
		id = 'user_123',
		email = 'test@example.com',
		firstName = 'Test',
		lastName = 'User',
	} = options

	return {
		id,
		email,
		first_name: firstName,
		last_name: lastName,
	}
}

/**
 * Mock the @hono/clerk-auth getAuth function
 *
 * This is necessary because getAuth() reads from c.get('clerkAuth')()
 * which is set by clerkMiddleware.
 *
 * Usage in tests:
 * ```typescript
 * vi.mock('@hono/clerk-auth', () => ({
 *   getAuth: vi.fn(() => ({ userId: 'user_123', sessionId: 'session_123' })),
 *   clerkMiddleware: () => async (_c: any, next: any) => next(),
 * }))
 * ```
 */
export function setupClerkAuthMock(
	getAuthReturn: { userId?: string; sessionId?: string } | null = { userId: 'user_123', sessionId: 'session_123' },
) {
	return {
		getAuth: vi.fn(() => getAuthReturn),
		clerkMiddleware: () => async (_c: unknown, next: () => Promise<void>) => next(),
	}
}

/**
 * Common test accounts with different roles
 */
export const testAccounts = {
	owner: {
		id: 'access_owner',
		userId: 'user_owner',
		accountId: 'account_123',
		role: 'owner' as const,
		email: 'owner@test.com',
	},
	admin: {
		id: 'access_admin',
		userId: 'user_admin',
		accountId: 'account_123',
		role: 'admin' as const,
		email: 'admin@test.com',
	},
	member: {
		id: 'access_member',
		userId: 'user_member',
		accountId: 'account_123',
		role: 'member' as const,
		email: 'member@test.com',
	},
	sysAdmin: {
		id: 'user_sysadmin',
		email: 'admin@tryequipped.com',
		firstName: 'System',
		lastName: 'Admin',
	},
}

/**
 * Create a mock for requireSysAdmin middleware that always passes
 *
 * This is useful when testing route handlers directly without
 * needing actual Clerk integration.
 *
 * @param options User context to inject
 * @returns Middleware handler that passes and sets context
 */
export function createMockSysAdminMiddleware(
	options: {
		userId?: string
		email?: string
		firstName?: string
		lastName?: string
	} = {},
) {
	const {
		userId = 'user_sysadmin',
		email = 'admin@tryequipped.com',
		firstName = 'System',
		lastName = 'Admin',
	} = options

	return async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
		c.set('userId', userId)
		c.set('sessionId', 'session_123')
		c.set('sysAdmin', true)
		c.set('user', {
			id: userId,
			email,
			first_name: firstName,
			last_name: lastName,
		})
		return next()
	}
}

/**
 * Create a mock for requireAuth middleware that always passes
 *
 * @param options Auth context to inject
 * @returns Middleware handler that passes and sets context
 */
export function createMockAuthMiddleware(
	options: {
		userId?: string
		sessionId?: string
	} = {},
) {
	const { userId = 'user_123', sessionId = 'session_123' } = options

	return async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
		c.set('userId', userId)
		c.set('sessionId', sessionId)
		return next()
	}
}
