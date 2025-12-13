/**
 * Team Access API Routes Tests
 *
 * Tests for team member management, roles, and invitations.
 * Follows Gherkin BDD format with @REQ tags.
 *
 * NOTE: Uses auth injection pattern - middleware sets clerkAuth context
 * that getAuth() reads, allowing full control over auth state in tests.
 */

import { getAuth } from '@hono/clerk-auth'
import { Hono } from 'hono'
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import teamRoutes from './team'

// Get the mocked getAuth from global setup
const mockedGetAuth = getAuth as Mock

interface MockAuth {
	userId?: string
	sessionId?: string
}

interface MockDb {
	prepare: ReturnType<typeof vi.fn>
}

interface TestAppOptions {
	db: MockDb
	auth?: MockAuth
	context?: Record<string, unknown>
}

/**
 * Create test app with injected auth and tenant context.
 *
 * The teamRoutes have their own middleware (requireTenant, requireAccountAccess)
 * that will run. Our test middleware just needs to inject:
 * - DB environment
 * - clerkAuth (for getAuth())
 * - accountId (for requireTenant to pass)
 * - user context (for getUser() in route handlers)
 *
 * The requireAccountAccess middleware will query the DB for access verification,
 * which our mock DB handles.
 */
function createTestApp({
	db,
	auth = { userId: 'user-123', sessionId: 'session-123' },
	context = {},
}: TestAppOptions) {
	const app = new Hono()

	// Override the globally mocked getAuth to return our test auth
	// The global mock in setup.ts returns 'user_test_default', but we need
	// to use the auth parameter for this specific test app instance
	const authData = {
		userId: auth.userId ?? 'user-123',
		sessionId: auth.sessionId ?? 'session-123',
	}
	mockedGetAuth.mockReturnValue(authData)

	app.use('*', async (c, next) => {
		// Inject DB
		c.env = { DB: db } as unknown as typeof c.env

		// Inject accountId for requireTenant (simulating subdomain resolution)
		c.set('accountId', context.accountId ?? 'account-123')
		c.set('account', context.account ?? { id: 'account-123', short_name: 'test', name: 'Test Account' })

		// Note: We intentionally do NOT set 'user' here because requireAccountAccess
		// middleware will set it based on DB query + auth.userId. The middleware
		// sets c.set('user', { id: auth.userId, ... }), so currentUser.id will
		// be whatever auth.userId is.
		c.set('role', context.role ?? 'owner')

		return next()
	})

	app.route('/', teamRoutes)
	return app
}

/**
 * Create a mock database with chainable methods.
 *
 * IMPORTANT: The requireAccountAccess middleware queries the DB to verify access.
 * This mock auto-handles that query by returning a valid access record.
 *
 * Query differentiation:
 * - requireAccountAccess: contains "JOIN users" (selects user info)
 * - getTargetAccess: contains "user_id, role FROM account_access" (simple select)
 *
 * The handler's first() callback is only called for non-middleware queries (like getTargetAccess).
 */
function createMockDb(
	handlers: {
		first?: (query: string, params: unknown[]) => Promise<unknown>
		all?: (query: string, params: unknown[]) => Promise<{ results: unknown[] }>
		run?: (query: string, params: unknown[]) => Promise<{ success: boolean }>
	},
	options: { role?: string } = {},
): MockDb {
	const userRole = options.role ?? 'owner'

	return {
		prepare: vi.fn((query: string) => ({
			bind: vi.fn((...params: unknown[]) => ({
				first: vi.fn(async () => {
					// Handle requireAccountAccess middleware query (joins with users table)
					if (query.includes('JOIN users')) {
						return {
							id: 'access-test',
							user_id: 'user-123',
							account_id: 'account-123',
							role: userRole,
							email: 'owner@test.com',
							first_name: 'Test',
							last_name: 'Owner',
						}
					}
					// Handle tenantMiddleware account lookup
					if (query.includes('FROM accounts WHERE')) {
						return { id: 'account-123', short_name: 'test', name: 'Test Account' }
					}
					// For all other queries (like target access lookup), use the handler
					return handlers.first?.(query, params) ?? null
				}),
				all: vi.fn(async () => handlers.all?.(query, params) ?? { results: [] }),
				run: vi.fn(async () => handlers.run?.(query, params) ?? { success: true }),
			})),
		})),
	}
}

describe('Team Access API Routes', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * @REQ-SET-TEAM-001
	 * Scenario: View team members
	 */
	describe('GET /api/team - View team members', () => {
		it('should return all team members with roles sorted by permission level', async () => {
			const mockMembers = [
				{
					id: 'access-1',
					user_id: 'user-1',
					email: 'owner@test.com',
					first_name: 'Alice',
					last_name: 'Owner',
					role: 'owner',
					created_at: '2025-01-01',
				},
				{
					id: 'access-2',
					user_id: 'user-2',
					email: 'admin@test.com',
					first_name: 'Bob',
					last_name: 'Admin',
					role: 'admin',
					created_at: '2025-01-02',
				},
				{
					id: 'access-3',
					user_id: 'user-3',
					email: 'member@test.com',
					first_name: 'Charlie',
					last_name: 'Member',
					role: 'member',
					created_at: '2025-01-03',
				},
			]

			const db = createMockDb({
				all: async () => ({ results: mockMembers }),
			})

			const app = createTestApp({ db })
			const res = await app.request('/')

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.members).toHaveLength(3)
			expect(data.members[0].role).toBe('owner')
		})
	})

	/**
	 * @REQ-SET-TEAM-002
	 * Scenario: Invite new member
	 */
	describe('POST /api/team/invite - Invite new member', () => {
		it('should send invitation for new user via Clerk', async () => {
			const db = createMockDb({
				first: async query => {
					// User doesn't exist, no existing access
					return null
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'newuser@company.com', role: 'member' }),
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.success).toBe(true)
			expect(data.email).toBe('newuser@company.com')
		})

		it('should grant access to existing user without sending invitation', async () => {
			let queryCount = 0
			const db = createMockDb({
				first: async () => {
					queryCount++
					if (queryCount === 1) return { id: 'existing-user-123' } // User exists
					return null // No existing access
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'existing@company.com', role: 'member' }),
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.success).toBe(true)
			expect(data.method).toBe('existing_user')
		})

		it('should reject invitation if user already has access', async () => {
			let queryCount = 0
			const db = createMockDb({
				first: async () => {
					queryCount++
					if (queryCount === 1) return { id: 'existing-user-123' } // User exists
					return { id: 'access-456' } // Already has access
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'duplicate@company.com', role: 'member' }),
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('User already has access')
		})
	})

	/**
	 * @REQ-SET-TEAM-003
	 * Scenario: Role permissions
	 */
	describe('Role permission validation', () => {
		it('should allow owner to assign any role including owner', async () => {
			const db = createMockDb({
				first: async () => null, // User doesn't exist
			})

			const app = createTestApp({ db })
			const res = await app.request('/invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'newowner@company.com', role: 'owner' }),
			})

			expect(res.status).toBe(200)
		})

		it('should prevent admin from assigning owner role', async () => {
			const db = createMockDb(
				{
					first: async () => null,
				},
				{ role: 'admin' },
			)

			const app = createTestApp({ db })
			const res = await app.request('/invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'newowner@company.com', role: 'owner' }),
			})

			expect(res.status).toBe(403)
			const data = await res.json()
			expect(data.message).toContain('cannot assign the owner role')
		})
	})

	/**
	 * @REQ-SET-TEAM-004
	 * Scenario: Change member role
	 */
	describe('PUT /api/team/:accessId/role - Change member role', () => {
		it('should update member role and record in audit log', async () => {
			const db = createMockDb({
				first: async () => ({
					user_id: 'user-456',
					role: 'member',
				}),
			})

			const app = createTestApp({ db })
			const res = await app.request('/access-123/role', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: 'admin' }),
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.success).toBe(true)
			expect(data.message).toContain('Role updated successfully')
		})

		it('should prevent user from changing their own role', async () => {
			const db = createMockDb({
				first: async () => ({
					user_id: 'user-123', // Same as current user
					role: 'owner',
				}),
			})

			const app = createTestApp({ db })
			const res = await app.request('/access-123/role', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: 'member' }),
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('Cannot change own role')
		})
	})

	/**
	 * @REQ-SET-TEAM-005
	 * Scenario: Remove member access
	 */
	describe('DELETE /api/team/:accessId - Remove member access', () => {
		it('should remove member access successfully', async () => {
			const db = createMockDb({
				first: async () => ({
					user_id: 'user-456',
					role: 'member',
				}),
			})

			const app = createTestApp({ db })
			const res = await app.request('/access-123', {
				method: 'DELETE',
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.success).toBe(true)
		})

		it('should prevent user from removing their own access', async () => {
			const db = createMockDb({
				first: async () => ({
					user_id: 'user-123', // Same as current user
					role: 'owner',
				}),
			})

			const app = createTestApp({ db })
			const res = await app.request('/access-123', {
				method: 'DELETE',
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('Cannot remove own access')
		})
	})

	/**
	 * @REQ-SET-TEAM-006
	 * Scenario: Cannot remove last owner
	 */
	describe('Protect last owner', () => {
		it('should prevent removing the last owner', async () => {
			let queryCount = 0
			const db = createMockDb({
				first: async () => {
					queryCount++
					if (queryCount === 1) return { user_id: 'user-456', role: 'owner' }
					return { count: 1 } // Only 1 owner
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/access-123', {
				method: 'DELETE',
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('Cannot remove last owner')
		})

		it('should prevent demoting the last owner', async () => {
			let queryCount = 0
			const db = createMockDb({
				first: async () => {
					queryCount++
					if (queryCount === 1) return { user_id: 'user-456', role: 'owner' }
					return { count: 1 } // Only 1 owner
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/access-123/role', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: 'admin' }),
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('Cannot remove last owner')
		})

		it('should allow removing owner if multiple owners exist', async () => {
			let queryCount = 0
			const db = createMockDb({
				first: async () => {
					queryCount++
					if (queryCount === 1) return { user_id: 'user-456', role: 'owner' }
					return { count: 2 } // 2 owners
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/access-123', {
				method: 'DELETE',
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.success).toBe(true)
		})
	})
})
