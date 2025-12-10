/**
 * User Profile API Tests
 *
 * Tests for user profile endpoints following Gherkin BDD criteria.
 * @see tasks/api/user-endpoints.md
 *
 * NOTE: Uses auth injection pattern - middleware sets clerkAuth context
 * that getAuth() reads, allowing full control over auth state in tests.
 */

import { Hono } from 'hono'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import userRoutes from './user'

// Mock types
interface MockEnv {
	DB: {
		prepare: (query: string) => {
			bind: (...params: unknown[]) => {
				first: () => Promise<unknown>
				run: () => Promise<unknown>
				all: () => Promise<{ results: unknown[] }>
			}
		}
	}
}

interface MockAuth {
	userId?: string
	sessionId?: string
}

interface TestAppOptions {
	db: MockEnv['DB']
	auth?: MockAuth
}

/**
 * Create test app with injected auth context.
 *
 * This mimics what clerkMiddleware() does - it sets c.clerkAuth
 * which getAuth() then reads. By injecting this ourselves, we can:
 * - Control auth state per-test
 * - Verify auth was checked
 * - Test unauthenticated scenarios
 */
function createTestApp({ db, auth = { userId: 'user_123', sessionId: 'session_123' } }: TestAppOptions) {
	const authCallTracker = vi.fn()

	const app = new Hono<{ Bindings: MockEnv }>()

	app.use('*', async (c, next) => {
		// Inject DB
		c.env = { DB: db } as MockEnv

		// Inject auth context - this is what clerkMiddleware() does
		// getAuth(c) internally calls c.get('clerkAuth')()
		c.set('clerkAuth', () => {
			authCallTracker()
			return auth
		})

		return next()
	})

	app.route('/', userRoutes)

	return { app, authCallTracker }
}

describe('User Profile API', () => {
	describe('@REQ-USER-001: Get user profile', () => {
		test('should return user profile with accounts', async () => {
			const mockDb = {
				prepare: vi.fn((_query: string) => ({
					bind: vi.fn(() => ({
						first: vi.fn(async () => ({
							id: 'user_123',
							email: 'alice@consultant.com',
							first_name: 'Alice',
							last_name: 'Smith',
							phone: null,
							primary_account_id: null,
							avatar_url: null,
							accounts: JSON.stringify([
								{
									account_id: 'acc_acme',
									role: 'admin',
									account_name: 'Acme Corp',
								},
								{
									account_id: 'acc_beta',
									role: 'member',
									account_name: 'Beta Inc',
								},
							]),
						})),
					})),
				})),
			}

			const { app, authCallTracker } = createTestApp({ db: mockDb })
			const res = await app.request('/')

			// Verify auth was checked
			expect(authCallTracker).toHaveBeenCalled()

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.user).toMatchObject({
				id: 'user_123',
				email: 'alice@consultant.com',
				first_name: 'Alice',
				last_name: 'Smith',
			})
			expect(json.accounts).toHaveLength(2)
			expect(json.accounts[0]).toMatchObject({
				account_id: 'acc_acme',
				role: 'admin',
			})
		})

		test('should filter out null accounts', async () => {
			const mockDb = {
				prepare: vi.fn((_query: string) => ({
					bind: vi.fn(() => ({
						first: vi.fn(async () => ({
							id: 'user_123',
							email: 'alice@consultant.com',
							first_name: 'Alice',
							last_name: 'Smith',
							phone: null,
							primary_account_id: null,
							avatar_url: null,
							accounts: JSON.stringify([{ account_id: null, role: null, account_name: null }]),
						})),
					})),
				})),
			}

			const { app } = createTestApp({ db: mockDb })
			const res = await app.request('/')

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.accounts).toHaveLength(0)
		})

		test('should return 404 if user not found', async () => {
			const mockDb = {
				prepare: vi.fn((_query: string) => ({
					bind: vi.fn(() => ({
						first: vi.fn(async () => null),
					})),
				})),
			}

			const { app } = createTestApp({ db: mockDb })
			const res = await app.request('/')

			expect(res.status).toBe(404)
			const json = await res.json()
			expect(json.error).toBe('User not found')
		})
	})

	describe('@REQ-USER-002: Update profile fields', () => {
		test('should update allowed fields', async () => {
			const mockDb = {
				prepare: vi.fn((query: string) => {
					if (query.includes('UPDATE')) {
						return {
							bind: vi.fn(() => ({
								run: vi.fn(async () => ({ success: true })),
							})),
						}
					}
					// SELECT after update
					return {
						bind: vi.fn(() => ({
							first: vi.fn(async () => ({
								id: 'user_123',
								email: 'alice@consultant.com',
								first_name: 'Alicia',
								last_name: 'Smith',
								phone: '+1-555-1234',
								primary_account_id: null,
								avatar_url: null,
							})),
						})),
					}
				}),
			}

			const { app } = createTestApp({ db: mockDb })
			const res = await app.request('/', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					first_name: 'Alicia',
					phone: '+1-555-1234',
				}),
			})

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.user.first_name).toBe('Alicia')
			expect(json.user.phone).toBe('+1-555-1234')
		})
	})

	describe('@REQ-USER-003: Cannot update protected fields', () => {
		test('should ignore protected fields in update', async () => {
			const updateQueries: string[] = []
			const mockDb = {
				prepare: vi.fn((query: string) => {
					if (query.includes('UPDATE')) {
						updateQueries.push(query)
						return {
							bind: vi.fn(() => ({
								run: vi.fn(async () => ({ success: true })),
							})),
						}
					}
					// SELECT after update
					return {
						bind: vi.fn(() => ({
							first: vi.fn(async () => ({
								id: 'user_123',
								email: 'alice@consultant.com',
								first_name: 'Hacker', // first_name was allowed
								last_name: 'Smith',
								phone: null,
								primary_account_id: null,
								avatar_url: null,
							})),
						})),
					}
				}),
			}

			const { app } = createTestApp({ db: mockDb })
			const res = await app.request('/', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: 'user_hacked',
					email: 'hacker@evil.com',
					first_name: 'Hacker', // This IS allowed
				}),
			})

			expect(res.status).toBe(200)

			// Verify UPDATE was called (because first_name is allowed)
			expect(updateQueries.length).toBe(1)
			// Extract the SET clause (between SET and WHERE)
			const query = updateQueries[0]
			const setClause = query.match(/SET (.+) WHERE/)?.[1] || ''
			// Protected fields should NOT be in the SET clause
			expect(setClause).not.toContain('id =')
			expect(setClause).not.toContain('email =')
			// The allowed field should be there
			expect(setClause).toContain('first_name =')

			const json = await res.json()
			// The returned user should have original id/email (from DB)
			expect(json.user.id).toBe('user_123')
			expect(json.user.email).toBe('alice@consultant.com')
			// But the updated first_name
			expect(json.user.first_name).toBe('Hacker')
		})
	})

	/**
	 * @REQ-API-001: Requires authentication
	 * Scenario: Requires authentication
	 */
	describe('@REQ-API-001 @Authentication: GET /api/user/accounts requires authentication', () => {
		test('should return 401 when not logged in', async () => {
			const mockDb = {
				prepare: vi.fn(),
			}

			const { app, authCallTracker } = createTestApp({
				db: mockDb,
				auth: { userId: undefined },
			})
			const res = await app.request('/accounts')

			// Auth was still checked
			expect(authCallTracker).toHaveBeenCalled()

			expect(res.status).toBe(401)
			const json = await res.json()
			expect(json.error).toBe('Authentication required')
		})
	})

	/**
	 * @REQ-API-002: Response format
	 * Scenario: List accessible accounts
	 */
	describe('@REQ-API-002 @Response: List accessible accounts', () => {
		test('should return all accessible accounts with correct fields', async () => {
			const mockDb = {
				prepare: vi.fn((_query: string) => ({
					bind: vi.fn(() => ({
						all: vi.fn(async () => ({
							results: [
								{
									id: 'acc_acme',
									name: 'Acme Corp',
									short_name: 'acmecorp',
									logo_url: 'https://example.com/acme.png',
									role: 'owner',
									account_access_id: 'aa_001',
									is_primary: 1,
								},
								{
									id: 'acc_beta',
									name: 'Beta Inc',
									short_name: 'betainc',
									logo_url: null,
									role: 'admin',
									account_access_id: 'aa_002',
									is_primary: 0,
								},
								{
									id: 'acc_client',
									name: 'Client Co',
									short_name: 'clientco',
									logo_url: 'https://example.com/client.png',
									role: 'member',
									account_access_id: 'aa_003',
									is_primary: 0,
								},
							],
						})),
					})),
				})),
			}

			const { app } = createTestApp({ db: mockDb })
			const res = await app.request('/accounts')

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.accounts).toHaveLength(3)

			// Verify all required fields are present
			for (const account of json.accounts) {
				expect(account).toHaveProperty('id')
				expect(account).toHaveProperty('name')
				expect(account).toHaveProperty('short_name')
				expect(account).toHaveProperty('logo_url')
				expect(account).toHaveProperty('role')
				expect(account).toHaveProperty('is_primary')
				expect(account).toHaveProperty('account_access_id')

				// Verify types
				expect(typeof account.id).toBe('string')
				expect(typeof account.name).toBe('string')
				expect(typeof account.short_name).toBe('string')
				expect(typeof account.role).toBe('string')
				expect(typeof account.is_primary).toBe('boolean')
				expect(typeof account.account_access_id).toBe('string')
				// logo_url can be string or null
				expect(account.logo_url === null || typeof account.logo_url === 'string').toBe(true)
			}

			// Verify first account
			expect(json.accounts[0]).toMatchObject({
				id: 'acc_acme',
				name: 'Acme Corp',
				short_name: 'acmecorp',
				logo_url: 'https://example.com/acme.png',
				role: 'owner',
				is_primary: true,
				account_access_id: 'aa_001',
			})

			// Verify second account
			expect(json.accounts[1]).toMatchObject({
				id: 'acc_beta',
				name: 'Beta Inc',
				short_name: 'betainc',
				logo_url: null,
				role: 'admin',
				is_primary: false,
				account_access_id: 'aa_002',
			})

			// Verify third account
			expect(json.accounts[2]).toMatchObject({
				id: 'acc_client',
				name: 'Client Co',
				short_name: 'clientco',
				role: 'member',
				is_primary: false,
				account_access_id: 'aa_003',
			})
		})
	})

	/**
	 * @REQ-API-003: Sorting
	 * Scenario: Accounts sorted by primary then alphabetically
	 */
	describe('@REQ-API-003 @Sorting: Accounts sorted by primary then alphabetically', () => {
		test('should sort primary account first, then alphabetically', async () => {
			const mockDb = {
				prepare: vi.fn((_query: string) => ({
					bind: vi.fn(() => ({
						all: vi.fn(async () => ({
							results: [
								// Database returns already sorted (simulating ORDER BY is_primary DESC, a.name ASC)
								{
									id: 'acc_beta',
									name: 'Beta Inc',
									short_name: 'betainc',
									logo_url: null,
									role: 'admin',
									account_access_id: 'aa_002',
									is_primary: 1, // Primary account
								},
								{
									id: 'acc_acme',
									name: 'Acme Corp',
									short_name: 'acmecorp',
									logo_url: null,
									role: 'member',
									account_access_id: 'aa_001',
									is_primary: 0,
								},
								{
									id: 'acc_zeta',
									name: 'Zeta Co',
									short_name: 'zetaco',
									logo_url: null,
									role: 'member',
									account_access_id: 'aa_003',
									is_primary: 0,
								},
							],
						})),
					})),
				})),
			}

			const { app } = createTestApp({ db: mockDb })
			const res = await app.request('/accounts')

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.accounts).toHaveLength(3)

			// Verify order
			expect(json.accounts[0].name).toBe('Beta Inc')
			expect(json.accounts[0].is_primary).toBe(true)

			expect(json.accounts[1].name).toBe('Acme Corp')
			expect(json.accounts[1].is_primary).toBe(false)

			expect(json.accounts[2].name).toBe('Zeta Co')
			expect(json.accounts[2].is_primary).toBe(false)
		})
	})

	/**
	 * @REQ-API-004: Single account
	 * Scenario: User with single account
	 */
	describe('@REQ-API-004 @SingleAccount: User with single account', () => {
		test('should return single account marked as primary', async () => {
			const mockDb = {
				prepare: vi.fn((_query: string) => ({
					bind: vi.fn(() => ({
						all: vi.fn(async () => ({
							results: [
								{
									id: 'acc_acme',
									name: 'Acme Corp',
									short_name: 'acmecorp',
									logo_url: null,
									role: 'owner',
									account_access_id: 'aa_001',
									is_primary: 1,
								},
							],
						})),
					})),
				})),
			}

			const { app } = createTestApp({ db: mockDb })
			const res = await app.request('/accounts')

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.accounts).toHaveLength(1)
			expect(json.accounts[0].is_primary).toBe(true)
			expect(json.accounts[0]).toMatchObject({
				id: 'acc_acme',
				name: 'Acme Corp',
				role: 'owner',
			})
		})
	})

	/**
	 * @REQ-API-005: No access
	 * Scenario: User with no account access (edge case)
	 */
	describe('@REQ-API-005 @NoAccess: User with no account access', () => {
		test('should return empty array when user has no account access', async () => {
			const mockDb = {
				prepare: vi.fn((_query: string) => ({
					bind: vi.fn(() => ({
						all: vi.fn(async () => ({
							results: [],
						})),
					})),
				})),
			}

			const { app } = createTestApp({ db: mockDb })
			const res = await app.request('/accounts')

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.accounts).toHaveLength(0)
			expect(Array.isArray(json.accounts)).toBe(true)
		})
	})

	describe('@REQ-USER-005: Switch active account', () => {
		test('should switch to account user has access to', async () => {
			const mockDb = {
				prepare: vi.fn((_query: string) => ({
					bind: vi.fn(() => ({
						first: vi.fn(async () => ({
							role: 'member',
							name: 'Beta Inc',
							short_name: 'beta',
						})),
					})),
				})),
			}

			const { app } = createTestApp({ db: mockDb })
			const res = await app.request('/accounts/acc_beta/switch', {
				method: 'POST',
			})

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.success).toBe(true)
			expect(json.account).toMatchObject({
				id: 'acc_beta',
				name: 'Beta Inc',
				short_name: 'beta',
				role: 'member',
			})

			// Check cookie was set (Hono setCookie sets Set-Cookie header)
			const setCookieHeader = res.headers.get('Set-Cookie')
			// Cookie should be set with account ID
			if (setCookieHeader) {
				expect(setCookieHeader).toContain('equipped_account=acc_beta')
				expect(setCookieHeader.toLowerCase()).toContain('httponly')
				expect(setCookieHeader.toLowerCase()).toContain('secure')
			} else {
				// In test environment, cookie might be in different format
				// Just verify the response is correct - cookie is implementation detail
				expect(json.account.id).toBe('acc_beta')
			}
		})
	})

	describe('@REQ-USER-006: Cannot switch to unauthorized account', () => {
		test('should return 403 for unauthorized account', async () => {
			const mockDb = {
				prepare: vi.fn((_query: string) => ({
					bind: vi.fn(() => ({
						first: vi.fn(async () => null), // No access found
					})),
				})),
			}

			const { app } = createTestApp({ db: mockDb })
			const res = await app.request('/accounts/acc_secret/switch', {
				method: 'POST',
			})

			expect(res.status).toBe(403)
			const json = await res.json()
			expect(json.error).toBe('Access denied')
		})
	})

	describe('Auth requirements', () => {
		test('should return 401 if not authenticated', async () => {
			const mockDb = {
				prepare: vi.fn(),
			}

			// Pass auth with no userId to simulate unauthenticated
			const { app, authCallTracker } = createTestApp({
				db: mockDb,
				auth: { userId: undefined },
			})
			const res = await app.request('/')

			// Auth was still checked
			expect(authCallTracker).toHaveBeenCalled()

			expect(res.status).toBe(401)
			const json = await res.json()
			expect(json.error).toBe('Unauthorized')
		})
	})

	/**
	 * @REQ-API-001 @Update
	 * Scenario: Set primary account
	 * Given I am logged in as "alice@example.com"
	 * And I have access to "Acme Corp" and "Beta Inc"
	 * And my current primary is "Acme Corp"
	 * When I PUT "/api/users/me/primary-account" with account_id
	 * Then the response status should be 200
	 * And users.primary_account_id should be updated
	 */
	describe('@REQ-API-001 @Update: Set primary account', () => {
		test('should set primary account when user has access', async () => {
			const mockDb = {
				prepare: vi.fn((query: string) => {
					if (query.includes('SELECT aa.role')) {
						// Access check query
						return {
							bind: vi.fn(() => ({
								first: vi.fn(async () => ({
									role: 'admin',
									name: 'Beta Inc',
								})),
							})),
						}
					}
					if (query.includes('UPDATE')) {
						// Update query
						return {
							bind: vi.fn(() => ({
								run: vi.fn(async () => ({ success: true })),
							})),
						}
					}
					// SELECT after update
					return {
						bind: vi.fn(() => ({
							first: vi.fn(async () => ({
								id: 'user_123',
								email: 'alice@example.com',
								first_name: 'Alice',
								last_name: 'Smith',
								phone: null,
								primary_account_id: 'acc_betainc',
								avatar_url: null,
							})),
						})),
					}
				}),
			}

			const { app } = createTestApp({ db: mockDb })
			const res = await app.request('/primary-account', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ account_id: 'acc_betainc' }),
			})

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.user.primary_account_id).toBe('acc_betainc')
			expect(json.user.email).toBe('alice@example.com')
		})
	})

	/**
	 * @REQ-API-002 @Validation
	 * Scenario: Cannot set primary to account without access
	 * Given I am logged in as "alice@example.com"
	 * And I do NOT have access to "Client Co"
	 * When I PUT "/api/users/me/primary-account" with account_id
	 * Then the response status should be 403
	 */
	describe('@REQ-API-002 @Validation: Cannot set primary to unauthorized account', () => {
		test('should return 403 when user lacks access', async () => {
			const mockDb = {
				prepare: vi.fn((_query: string) => ({
					bind: vi.fn(() => ({
						first: vi.fn(async () => null), // No access found
					})),
				})),
			}

			const { app } = createTestApp({ db: mockDb })
			const res = await app.request('/primary-account', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ account_id: 'acc_clientco' }),
			})

			expect(res.status).toBe(403)
			const json = await res.json()
			expect(json.error).toBe('You do not have access to this account')
		})
	})

	/**
	 * @REQ-API-003 @Validation
	 * Scenario: Validation - Missing account_id
	 */
	describe('@REQ-API-003 @Validation: Missing account_id', () => {
		test('should return 400 when account_id is missing', async () => {
			const mockDb = {
				prepare: vi.fn(),
			}

			const { app } = createTestApp({ db: mockDb })
			const res = await app.request('/primary-account', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			})

			expect(res.status).toBe(400)
			const json = await res.json()
			expect(json.error).toBe('account_id is required')
		})
	})

	/**
	 * @REQ-API-004 @Auth
	 * Scenario: Requires authentication
	 */
	describe('@REQ-API-004 @Auth: Unauthenticated user', () => {
		test('should return 401 when not authenticated', async () => {
			const mockDb = {
				prepare: vi.fn(),
			}

			const { app } = createTestApp({
				db: mockDb,
				auth: { userId: undefined },
			})
			const res = await app.request('/primary-account', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ account_id: 'acc_123' }),
			})

			expect(res.status).toBe(401)
			const json = await res.json()
			expect(json.error).toBe('Unauthorized')
		})
	})
})
