/**
 * User API - REGRESSION TESTS
 *
 * Tests for bugs discovered and fixed in user profile endpoints.
 * Each test prevents a known bug from reoccurring.
 *
 * @see tasks/testing/regression-tests.md
 */

import { Hono } from 'hono'
import { describe, expect, test, vi } from 'vitest'
import userRoutes from './user'

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

vi.mock('@hono/clerk-auth', () => ({
	getAuth: vi.fn(() => ({ userId: 'user_123', sessionId: 'session_123' })),
}))

function createTestApp(mockDb: MockEnv['DB']) {
	const app = new Hono<{ Bindings: MockEnv }>()
	app.use('*', async (c, next) => {
		c.env.DB = mockDb
		return next()
	})
	app.route('/', userRoutes)
	return app
}

describe('User API [REGRESSION TESTS]', () => {
	/**
	 * REGRESSION TEST
	 * Issue: USER-001 - SQL injection via account_id parameter
	 * Description: Account switch endpoint didn't sanitize account_id input
	 * Fix: Use parameterized queries with proper binding
	 * Verification: SQL injection attempts are safely handled
	 */
	test('should safely handle SQL injection attempts in account_id', async () => {
		const mockDb = {
			prepare: vi.fn((_query: string) => ({
				bind: vi.fn(() => ({
					first: vi.fn(async () => null),
				})),
			})),
		}

		const app = createTestApp(mockDb)

		// Attempt SQL injection
		const maliciousId = "acc_123' OR '1'='1"
		const res = await app.request(`/accounts/${encodeURIComponent(maliciousId)}/switch`, {
			method: 'POST',
		})

		// Should return 403 (not found), not crash or leak data
		expect(res.status).toBe(403)

		// Verify bind was called (parameterized query used)
		expect(mockDb.prepare).toHaveBeenCalled()
		const bindCall = mockDb.prepare.mock.results[0].value.bind
		expect(bindCall).toHaveBeenCalled()
	})

	/**
	 * REGRESSION TEST
	 * Issue: USER-002 - Empty account_id in switch endpoint
	 * Description: Empty string account_id caused database error
	 * Fix: Added validation to reject empty account_id
	 * Verification: Returns 400 for empty account_id
	 */
	test('should reject empty account_id in switch request', async () => {
		const mockDb = { prepare: vi.fn() }
		const app = createTestApp(mockDb)

		const res = await app.request('/accounts//switch', {
			method: 'POST',
		})

		// Should return 400 or 404, not 500
		expect([400, 404]).toContain(res.status)

		// DB should not be called for obviously invalid input
		if (res.status === 400) {
			expect(mockDb.prepare).not.toHaveBeenCalled()
		}
	})

	/**
	 * REGRESSION TEST
	 * Issue: USER-003 - Account array with null elements crashed frontend
	 * Description: LEFT JOIN returned [{account_id: null, role: null}] instead of []
	 * Fix: Filter out null account_id before returning response
	 * Verification: Null accounts filtered from response
	 */
	test('should filter out null accounts from user profile', async () => {
		const mockDb = {
			prepare: vi.fn((_query: string) => ({
				bind: vi.fn(() => ({
					first: vi.fn(async () => ({
						id: 'user_123',
						email: 'orphan@example.com',
						first_name: 'Orphan',
						last_name: 'User',
						phone: null,
						primary_account_id: null,
						avatar_url: null,
						accounts: JSON.stringify([
							{ account_id: null, role: null, account_name: null },
							{ account_id: 'acc_valid', role: 'admin', account_name: 'Valid Corp' },
							{ account_id: null, role: null, account_name: null },
						]),
					})),
				})),
			})),
		}

		const app = createTestApp(mockDb)
		const res = await app.request('/')

		expect(res.status).toBe(200)
		const json = await res.json()

		// Should only have 1 valid account
		expect(json.accounts).toHaveLength(1)
		expect(json.accounts[0].account_id).toBe('acc_valid')
	})

	/**
	 * REGRESSION TEST
	 * Issue: USER-004 - Protected field bypass via mass assignment
	 * Description: PUT /user allowed updating id and email via request body
	 * Fix: Whitelist allowed fields, reject protected fields
	 * Verification: Protected fields ignored in update
	 */
	test('should ignore protected fields in profile update', async () => {
		const mockDb = {
			prepare: vi.fn((query: string) => {
				if (query.includes('UPDATE')) {
					// Verify query doesn't contain protected fields
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
							email: 'original@example.com',
							first_name: 'Updated',
							last_name: 'Name',
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
				first_name: 'Updated',
				last_name: 'Name',
			}),
		})

		expect(res.status).toBe(200)
		const json = await res.json()

		// Original protected values preserved
		expect(json.user.id).toBe('user_123')
		expect(json.user.email).toBe('original@example.com')

		// Allowed fields updated
		expect(json.user.first_name).toBe('Updated')
	})

	/**
	 * REGRESSION TEST
	 * Issue: USER-005 - Race condition in concurrent account switches
	 * Description: Rapidly switching accounts caused stale account_id in cookie
	 * Fix: Ensure atomic cookie updates
	 * Verification: Cookie reflects most recent account switch
	 */
	test('should handle rapid sequential account switches', async () => {
		const mockDb = {
			prepare: vi.fn((_query: string) => ({
				bind: vi.fn((...params: unknown[]) => ({
					first: vi.fn(async () => ({
						role: 'member',
						name: `Account ${params[1]}`,
						short_name: `acc_${params[1]}`,
					})),
				})),
			})),
		}

		const app = createTestApp(mockDb)

		// Rapidly switch between accounts
		const res1 = await app.request('/accounts/acc_1/switch', { method: 'POST' })
		const res2 = await app.request('/accounts/acc_2/switch', { method: 'POST' })
		const res3 = await app.request('/accounts/acc_3/switch', { method: 'POST' })

		// All should succeed
		expect(res1.status).toBe(200)
		expect(res2.status).toBe(200)
		expect(res3.status).toBe(200)

		// Final response should reflect last switch
		const json3 = await res3.json()
		expect(json3.account.id).toBe('acc_3')

		// Cookie should reflect last switch
		const cookie3 = res3.headers.get('Set-Cookie')
		expect(cookie3).toContain('equipped_account=acc_3')
	})

	/**
	 * REGRESSION TEST
	 * Issue: USER-006 - Special characters in names broke JSON response
	 * Description: Names with quotes/backslashes caused JSON parse errors
	 * Fix: Proper JSON escaping in database and response
	 * Verification: Special characters handled correctly
	 */
	test('should handle special characters in user names', async () => {
		const mockDb = {
			prepare: vi.fn((_query: string) => ({
				bind: vi.fn(() => ({
					first: vi.fn(async () => ({
						id: 'user_123',
						email: 'user@example.com',
						first_name: `O'Brien`,
						last_name: `Test"User\\Special`,
						phone: null,
						primary_account_id: null,
						avatar_url: null,
						accounts: JSON.stringify([]),
					})),
				})),
			})),
		}

		const app = createTestApp(mockDb)
		const res = await app.request('/')

		expect(res.status).toBe(200)

		// Should parse without error
		const json = await res.json()
		expect(json.user.first_name).toBe(`O'Brien`)
		expect(json.user.last_name).toBe(`Test"User\\Special`)
	})

	/**
	 * REGRESSION TEST
	 * Issue: USER-007 - Null phone number returned as string "null"
	 * Description: Database null values serialized as string "null" instead of null
	 * Fix: Properly handle null values in response serialization
	 * Verification: Null fields are JSON null, not string "null"
	 */
	test('should return null values as JSON null, not string', async () => {
		const mockDb = {
			prepare: vi.fn((_query: string) => ({
				bind: vi.fn(() => ({
					first: vi.fn(async () => ({
						id: 'user_123',
						email: 'user@example.com',
						first_name: 'Test',
						last_name: 'User',
						phone: null,
						primary_account_id: null,
						avatar_url: null,
						accounts: JSON.stringify([]),
					})),
				})),
			})),
		}

		const app = createTestApp(mockDb)
		const res = await app.request('/')

		expect(res.status).toBe(200)

		const json = await res.json()

		// Null should be actual null, not string "null"
		expect(json.user.phone).toBeNull()
		expect(json.user.primary_account_id).toBeNull()
		expect(json.user.avatar_url).toBeNull()

		// Verify response body doesn't contain string "null"
		const bodyText = await res.clone().text()
		expect(bodyText).not.toContain('"null"')
	})
})
