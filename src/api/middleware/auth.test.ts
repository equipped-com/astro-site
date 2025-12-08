/**
 * Auth Middleware Tests
 *
 * Tests for JWT verification, user context population, account access validation,
 * and sys_admin detection.
 *
 * @REQ-AUTH-001 - Valid JWT accepted
 * @REQ-AUTH-002 - Invalid/expired JWT rejected
 * @REQ-AUTH-003 - User context populated correctly
 * @REQ-AUTH-004 - Account access validation
 * @REQ-AUTH-005 - noaccess role denied
 * @REQ-AUTH-006 - Sys admin bypass with @tryequipped.com email
 */
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import type { Role, User } from './auth'
import { getAccountId, getRole, getUser, isSysAdmin, requireAccountAccess, requireAuth } from './auth'

// Mock @hono/clerk-auth module
vi.mock('@hono/clerk-auth', () => ({
	clerkMiddleware: () => vi.fn(),
	getAuth: vi.fn(),
}))

import { getAuth } from '@hono/clerk-auth'

// Mock D1 database types
interface MockD1PreparedStatement {
	bind: (...values: unknown[]) => MockD1PreparedStatement
	run: () => Promise<{ results: unknown[]; success: boolean; meta: { changes?: number } }>
	first: <T>() => Promise<T | null>
}

interface MockD1Database {
	prepare: (query: string) => MockD1PreparedStatement
}

// Helper to create mock Hono context
function createMockContext(overrides?: {
	auth?: { userId?: string; sessionId?: string } | null
	accountId?: string
	db?: MockD1Database | null
	dbResult?: unknown
	clerk?: unknown
}) {
	const values = new Map<string, unknown>()

	// Default mock database
	const mockStatement: MockD1PreparedStatement = {
		bind: vi.fn().mockReturnThis(),
		run: vi.fn().mockResolvedValue({ results: [], success: true, meta: { changes: 1 } }),
		first: vi.fn().mockResolvedValue(overrides?.dbResult ?? null),
	}

	const mockDb: MockD1Database = {
		prepare: vi.fn().mockReturnValue(mockStatement),
	}

	const env = {
		DB: overrides?.db === null ? undefined : (overrides?.db ?? mockDb),
	}

	return {
		get: vi.fn((key: string) => values.get(key)),
		set: vi.fn((key: string, value: unknown) => values.set(key, value)),
		json: vi.fn((body: unknown, status?: number) => ({ body, status: status ?? 200 })),
		env,
		_values: values,
		_setupAuth: (auth: { userId?: string; sessionId?: string } | null) => {
			;(getAuth as Mock).mockReturnValue(auth)
		},
		_setupAccountId: (accountId: string | undefined) => {
			values.set('accountId', accountId)
		},
		_setupClerk: (clerk: unknown) => {
			values.set('clerk', clerk)
		},
	}
}

// Mock next function
function createMockNext() {
	return vi.fn().mockResolvedValue(undefined)
}

describe('Auth Middleware', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * Feature: Authentication Middleware
	 *
	 * @REQ-AUTH-001 - Valid JWT accepted
	 * Scenario: Valid JWT token is accepted
	 *   Given a valid JWT token
	 *   When middleware verifies it
	 *   Then request proceeds with user context
	 *   And userId is extracted correctly
	 */
	describe('requireAuth()', () => {
		it('should proceed with valid JWT token', async () => {
			// Given a valid JWT token
			const c = createMockContext()
			c._setupAuth({ userId: 'user_abc123', sessionId: 'sess_xyz789' })

			const next = createMockNext()
			const middleware = requireAuth()

			// When middleware processes it
			await middleware(c as any, next)

			// Then request proceeds with user context
			expect(next).toHaveBeenCalledTimes(1)

			// And userId/sessionId are stored in context
			expect(c.set).toHaveBeenCalledWith('userId', 'user_abc123')
			expect(c.set).toHaveBeenCalledWith('sessionId', 'sess_xyz789')
		})

		/**
		 * @REQ-AUTH-002 - Invalid/expired JWT rejected
		 * Scenario: Invalid token is rejected
		 *   Given an invalid/expired token
		 *   When middleware processes it
		 *   Then 401 Unauthorized is returned
		 *   And user context is not set
		 */
		it('should return 401 when no auth session exists', async () => {
			// Given no auth session (invalid/missing token)
			const c = createMockContext()
			c._setupAuth(null)

			const next = createMockNext()
			const middleware = requireAuth()

			// When middleware processes it
			const result = await middleware(c as any, next)

			// Then 401 Unauthorized is returned
			expect(result.status).toBe(401)
			expect(result.body).toEqual({
				error: 'Unauthorized',
				message: 'Authentication required',
			})

			// And next is NOT called
			expect(next).not.toHaveBeenCalled()
		})

		it('should return 401 when userId is missing from auth', async () => {
			// Given auth exists but userId is undefined
			const c = createMockContext()
			c._setupAuth({ sessionId: 'sess_xyz789' }) // No userId

			const next = createMockNext()
			const middleware = requireAuth()

			// When middleware processes it
			const result = await middleware(c as any, next)

			// Then 401 Unauthorized is returned
			expect(result.status).toBe(401)
			expect(next).not.toHaveBeenCalled()
		})
	})

	/**
	 * Feature: Account Access Validation
	 *
	 * @REQ-AUTH-004 - Account access validation
	 * Scenario: User with account access is allowed
	 *   Given authenticated user
	 *   And user has access to account
	 *   When requesting account resource
	 *   Then access is granted
	 */
	describe('requireAccountAccess()', () => {
		it('should allow user with valid account access', async () => {
			// Given authenticated user with account access
			const c = createMockContext({
				dbResult: {
					id: 'access_123',
					user_id: 'user_abc123',
					account_id: 'acct_456',
					role: 'member',
					email: 'alice@company.com',
					first_name: 'Alice',
					last_name: 'Smith',
					created_at: '2024-01-01T00:00:00Z',
				},
			})
			c._setupAuth({ userId: 'user_abc123', sessionId: 'sess_xyz789' })
			c._setupAccountId('acct_456')

			const next = createMockNext()
			const middleware = requireAccountAccess()

			// When middleware processes it
			await middleware(c as any, next)

			// Then access is granted (next called)
			expect(next).toHaveBeenCalledTimes(1)

			// And context is populated correctly
			expect(c.set).toHaveBeenCalledWith('userId', 'user_abc123')
			expect(c.set).toHaveBeenCalledWith('sessionId', 'sess_xyz789')
			expect(c.set).toHaveBeenCalledWith('role', 'member')
			expect(c.set).toHaveBeenCalledWith('accessId', 'access_123')
			expect(c.set).toHaveBeenCalledWith('user', {
				id: 'user_abc123',
				email: 'alice@company.com',
				first_name: 'Alice',
				last_name: 'Smith',
			})
		})

		it('should return 401 when not authenticated', async () => {
			// Given no authentication
			const c = createMockContext()
			c._setupAuth(null)
			c._setupAccountId('acct_456')

			const next = createMockNext()
			const middleware = requireAccountAccess()

			// When middleware processes it
			const result = await middleware(c as any, next)

			// Then 401 is returned
			expect(result.status).toBe(401)
			expect(result.body.error).toBe('Unauthorized')
			expect(next).not.toHaveBeenCalled()
		})

		it('should return 400 when account context is missing', async () => {
			// Given authenticated but no account context
			const c = createMockContext()
			c._setupAuth({ userId: 'user_abc123', sessionId: 'sess_xyz789' })
			// No accountId set

			const next = createMockNext()
			const middleware = requireAccountAccess()

			// When middleware processes it
			const result = await middleware(c as any, next)

			// Then 400 is returned
			expect(result.status).toBe(400)
			expect(result.body.error).toBe('Account context required')
			expect(next).not.toHaveBeenCalled()
		})

		it('should return 503 when database is not configured', async () => {
			// Given DB is not configured
			const c = createMockContext({ db: null })
			c._setupAuth({ userId: 'user_abc123', sessionId: 'sess_xyz789' })
			c._setupAccountId('acct_456')

			const next = createMockNext()
			const middleware = requireAccountAccess()

			// When middleware processes it
			const result = await middleware(c as any, next)

			// Then 503 is returned
			expect(result.status).toBe(503)
			expect(result.body.error).toBe('Service unavailable')
			expect(next).not.toHaveBeenCalled()
		})

		it('should return 403 when user has no access to account', async () => {
			// Given authenticated user without access to this account
			const c = createMockContext({
				dbResult: null, // No access record found
			})
			c._setupAuth({ userId: 'user_abc123', sessionId: 'sess_xyz789' })
			c._setupAccountId('acct_456')

			const next = createMockNext()
			const middleware = requireAccountAccess()

			// When middleware processes it
			const result = await middleware(c as any, next)

			// Then 403 is returned
			expect(result.status).toBe(403)
			expect(result.body.error).toBe('No access to this account')
			expect(result.body.message).toBe('You do not have permission to access this account')
			expect(next).not.toHaveBeenCalled()
		})

		/**
		 * @REQ-AUTH-005 - noaccess role denied
		 * Scenario: User with noaccess role is denied
		 *   Given user has role 'noaccess' for account
		 *   When requesting account resource
		 *   Then 403 Forbidden is returned
		 */
		it('should return 403 when user has noaccess role', async () => {
			// Given user has explicit 'noaccess' role
			const c = createMockContext({
				dbResult: {
					id: 'access_123',
					user_id: 'user_abc123',
					account_id: 'acct_456',
					role: 'noaccess',
					email: 'alice@company.com',
					first_name: 'Alice',
					last_name: 'Smith',
					created_at: '2024-01-01T00:00:00Z',
				},
			})
			c._setupAuth({ userId: 'user_abc123', sessionId: 'sess_xyz789' })
			c._setupAccountId('acct_456')

			const next = createMockNext()
			const middleware = requireAccountAccess()

			// When middleware processes it
			const result = await middleware(c as any, next)

			// Then 403 is returned with specific message
			expect(result.status).toBe(403)
			expect(result.body.error).toBe('No access to this account')
			expect(result.body.message).toBe('Your access to this account has been revoked')
			expect(next).not.toHaveBeenCalled()
		})

		it('should verify database query uses correct user and account IDs', async () => {
			// Given authenticated user
			const mockStatement: MockD1PreparedStatement = {
				bind: vi.fn().mockReturnThis(),
				run: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
				first: vi.fn().mockResolvedValue({
					id: 'access_123',
					user_id: 'user_abc123',
					account_id: 'acct_456',
					role: 'member',
					email: 'test@test.com',
				}),
			}
			const mockDb: MockD1Database = {
				prepare: vi.fn().mockReturnValue(mockStatement),
			}

			const c = createMockContext({ db: mockDb })
			c._setupAuth({ userId: 'user_abc123', sessionId: 'sess_xyz789' })
			c._setupAccountId('acct_456')

			const next = createMockNext()
			const middleware = requireAccountAccess()

			// When middleware processes it
			await middleware(c as any, next)

			// Then database is queried with correct IDs
			expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('account_access'))
			expect(mockStatement.bind).toHaveBeenCalledWith('user_abc123', 'acct_456')
		})
	})

	/**
	 * Feature: Context Helper Functions
	 *
	 * @REQ-AUTH-003 - User context populated correctly
	 */
	describe('Context Helpers', () => {
		describe('getUser()', () => {
			it('should return user from context when set', () => {
				const mockUser: User = {
					id: 'user_abc123',
					email: 'alice@company.com',
					first_name: 'Alice',
					last_name: 'Smith',
				}

				const c = {
					get: vi.fn().mockReturnValue(mockUser),
				}

				const result = getUser(c as any)

				expect(c.get).toHaveBeenCalledWith('user')
				expect(result).toEqual(mockUser)
			})

			it('should return undefined when user not set', () => {
				const c = {
					get: vi.fn().mockReturnValue(undefined),
				}

				const result = getUser(c as any)

				expect(result).toBeUndefined()
			})
		})

		describe('getRole()', () => {
			it('should return role from context when set', () => {
				const c = {
					get: vi.fn().mockReturnValue('admin'),
				}

				const result = getRole(c as any)

				expect(c.get).toHaveBeenCalledWith('role')
				expect(result).toBe('admin')
			})

			it('should return undefined when role not set', () => {
				const c = {
					get: vi.fn().mockReturnValue(undefined),
				}

				const result = getRole(c as any)

				expect(result).toBeUndefined()
			})
		})

		describe('getAccountId()', () => {
			it('should return accountId from context when set', () => {
				const c = {
					get: vi.fn().mockReturnValue('acct_456'),
				}

				const result = getAccountId(c as any)

				expect(c.get).toHaveBeenCalledWith('accountId')
				expect(result).toBe('acct_456')
			})

			it('should return undefined when accountId not set', () => {
				const c = {
					get: vi.fn().mockReturnValue(undefined),
				}

				const result = getAccountId(c as any)

				expect(result).toBeUndefined()
			})
		})
	})

	/**
	 * Feature: Sys Admin Detection
	 *
	 * @REQ-AUTH-006 - Sys admin bypass with @tryequipped.com email
	 * Scenario: Sys admin bypass works
	 *   Given a Clerk user with @tryequipped.com email
	 *   When accessing any account
	 *   Then access is granted (sys_admin role)
	 */
	describe('isSysAdmin()', () => {
		it('should return true for @tryequipped.com email', async () => {
			// Given user with @tryequipped.com email
			const mockClerkClient = {
				users: {
					getUser: vi.fn().mockResolvedValue({
						emailAddresses: [{ emailAddress: 'admin@tryequipped.com' }],
					}),
				},
			}

			const c = createMockContext()
			c._setupAuth({ userId: 'user_abc123' })
			c._setupClerk(mockClerkClient)

			// When checking sys admin
			const result = await isSysAdmin(c as any)

			// Then true is returned
			expect(result).toBe(true)
		})

		it('should return true for @getupgraded.com email', async () => {
			// Given user with @getupgraded.com email
			const mockClerkClient = {
				users: {
					getUser: vi.fn().mockResolvedValue({
						emailAddresses: [{ emailAddress: 'admin@getupgraded.com' }],
					}),
				},
			}

			const c = createMockContext()
			c._setupAuth({ userId: 'user_abc123' })
			c._setupClerk(mockClerkClient)

			// When checking sys admin
			const result = await isSysAdmin(c as any)

			// Then true is returned
			expect(result).toBe(true)
		})

		it('should return true for @cogzero.com email', async () => {
			// Given user with @cogzero.com email
			const mockClerkClient = {
				users: {
					getUser: vi.fn().mockResolvedValue({
						emailAddresses: [{ emailAddress: 'admin@cogzero.com' }],
					}),
				},
			}

			const c = createMockContext()
			c._setupAuth({ userId: 'user_abc123' })
			c._setupClerk(mockClerkClient)

			// When checking sys admin
			const result = await isSysAdmin(c as any)

			// Then true is returned
			expect(result).toBe(true)
		})

		it('should return false for non-staff email', async () => {
			// Given user with regular company email
			const mockClerkClient = {
				users: {
					getUser: vi.fn().mockResolvedValue({
						emailAddresses: [{ emailAddress: 'alice@company.com' }],
					}),
				},
			}

			const c = createMockContext()
			c._setupAuth({ userId: 'user_abc123' })
			c._setupClerk(mockClerkClient)

			// When checking sys admin
			const result = await isSysAdmin(c as any)

			// Then false is returned
			expect(result).toBe(false)
		})

		it('should return false when no auth session exists', async () => {
			// Given no authentication
			const c = createMockContext()
			c._setupAuth(null)

			// When checking sys admin
			const result = await isSysAdmin(c as any)

			// Then false is returned
			expect(result).toBe(false)
		})

		it('should return false when clerk client is not available', async () => {
			// Given authenticated but no clerk client
			const c = createMockContext()
			c._setupAuth({ userId: 'user_abc123' })
			// No clerk client set

			// When checking sys admin
			const result = await isSysAdmin(c as any)

			// Then false is returned
			expect(result).toBe(false)
		})

		it('should return false when getUser throws error', async () => {
			// Given clerk client throws error
			const mockClerkClient = {
				users: {
					getUser: vi.fn().mockRejectedValue(new Error('User not found')),
				},
			}

			const c = createMockContext()
			c._setupAuth({ userId: 'user_abc123' })
			c._setupClerk(mockClerkClient)

			// When checking sys admin
			const result = await isSysAdmin(c as any)

			// Then false is returned (graceful failure)
			expect(result).toBe(false)
		})

		it('should return false when user has no email addresses', async () => {
			// Given user with no email addresses
			const mockClerkClient = {
				users: {
					getUser: vi.fn().mockResolvedValue({
						emailAddresses: [],
					}),
				},
			}

			const c = createMockContext()
			c._setupAuth({ userId: 'user_abc123' })
			c._setupClerk(mockClerkClient)

			// When checking sys admin
			const result = await isSysAdmin(c as any)

			// Then false is returned
			expect(result).toBe(false)
		})

		it('should handle case-insensitive domain check', async () => {
			// Given user with mixed case domain
			const mockClerkClient = {
				users: {
					getUser: vi.fn().mockResolvedValue({
						emailAddresses: [{ emailAddress: 'Admin@TRYEQUIPPED.COM' }],
					}),
				},
			}

			const c = createMockContext()
			c._setupAuth({ userId: 'user_abc123' })
			c._setupClerk(mockClerkClient)

			// When checking sys admin
			const result = await isSysAdmin(c as any)

			// Then true is returned (case insensitive)
			expect(result).toBe(true)
		})
	})
})
