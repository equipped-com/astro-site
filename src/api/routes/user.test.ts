/**
 * User Profile API Tests
 *
 * Tests for user profile endpoints following Gherkin BDD criteria.
 * @see tasks/api/user-endpoints.md
 *
 * NOTE: This test file requires Vitest setup (tasks/testing/setup-vitest.md)
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

// Mock Clerk auth
vi.mock('@hono/clerk-auth', () => ({
	getAuth: vi.fn(() => ({ userId: 'user_123', sessionId: 'session_123' })),
}))

// Helper to create test app with mocked DB
function createTestApp(mockDb: MockEnv['DB']) {
	const app = new Hono<{ Bindings: MockEnv }>()
	app.use('*', async (c, next) => {
		c.env.DB = mockDb
		return next()
	})
	app.route('/', userRoutes)
	return app
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

			const app = createTestApp(mockDb)
			const res = await app.request('/')

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

			const app = createTestApp(mockDb)
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

			const app = createTestApp(mockDb)
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

			const app = createTestApp(mockDb)
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
			const mockDb = {
				prepare: vi.fn((query: string) => {
					if (query.includes('UPDATE')) {
						// Verify protected fields are NOT in the query
						expect(query).not.toContain('id =')
						expect(query).not.toContain('email =')
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
								first_name: 'Alice',
								last_name: 'Smith',
								phone: null,
								primary_account_id: null,
								avatar_url: null,
							})),
						})),
					}
				}),
			}

			const app = createTestApp(mockDb)
			const res = await app.request('/', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: 'user_hacked',
					email: 'hacker@evil.com',
					first_name: 'Hacker',
				}),
			})

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.user.id).toBe('user_123')
			expect(json.user.email).toBe('alice@consultant.com')
		})
	})

	describe('@REQ-USER-004: List account memberships', () => {
		test('should return all accounts user has access to', async () => {
			const mockDb = {
				prepare: vi.fn((_query: string) => ({
					bind: vi.fn(() => ({
						all: vi.fn(async () => ({
							results: [
								{
									id: 'acc_acme',
									name: 'Acme Corp',
									short_name: 'acme',
									role: 'admin',
								},
								{
									id: 'acc_beta',
									name: 'Beta Inc',
									short_name: 'beta',
									role: 'member',
								},
							],
						})),
					})),
				})),
			}

			const app = createTestApp(mockDb)
			const res = await app.request('/accounts')

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.accounts).toHaveLength(2)
			expect(json.accounts[0]).toMatchObject({
				name: 'Acme Corp',
				role: 'admin',
			})
			expect(json.accounts[1]).toMatchObject({
				name: 'Beta Inc',
				role: 'member',
			})
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

			const app = createTestApp(mockDb)
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

			// Check cookie was set
			const setCookie = res.headers.get('Set-Cookie')
			expect(setCookie).toContain('equipped_account=acc_beta')
			expect(setCookie).toContain('HttpOnly')
			expect(setCookie).toContain('Secure')
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

			const app = createTestApp(mockDb)
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
			const { getAuth } = await import('@hono/clerk-auth')
			vi.mocked(getAuth).mockReturnValueOnce({ userId: undefined } as MockAuth)

			const mockDb = {
				prepare: vi.fn(),
			}

			const app = createTestApp(mockDb)
			const res = await app.request('/')

			expect(res.status).toBe(401)
			const json = await res.json()
			expect(json.error).toBe('Unauthorized')
		})
	})
})
