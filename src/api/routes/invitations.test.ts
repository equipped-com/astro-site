/**
 * Invitation API Routes Tests
 *
 * Tests for the complete invitation lifecycle: create, list, accept, decline, revoke.
 * Follows Gherkin BDD format with @REQ tags from tasks/invitations/invitation-api.md
 *
 * NOTE: Uses auth injection pattern - middleware sets clerkAuth context
 * that getAuth() reads, allowing full control over auth state in tests.
 */

import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import invitationsRoutes from './invitations'

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
 * The invitationsRoutes have their own middleware per route.
 * Our test middleware needs to inject:
 * - DB environment
 * - clerkAuth (for getAuth())
 * - accountId and account (for requireTenant to pass)
 */
function createTestApp({
	db,
	auth = { userId: 'user-123', sessionId: 'session-123' },
	context = {},
}: TestAppOptions) {
	const app = new Hono()

	app.use('*', async (c, next) => {
		// Inject DB
		c.env = { DB: db } as unknown as typeof c.env

		// Inject auth context (what clerkMiddleware does)
		c.set('clerkAuth', () => auth)

		// Inject tenant context for routes that need it
		c.set('accountId', context.accountId ?? 'account-123')
		c.set('account', context.account ?? { id: 'account-123', short_name: 'acme', name: 'Acme Corp' })

		return next()
	})

	app.route('/', invitationsRoutes)
	return app
}

/**
 * Create a mock database with chainable methods.
 *
 * IMPORTANT: The requireAccountAccess middleware queries the DB to verify access.
 * This mock auto-handles that query by returning a valid access record.
 */
function createMockDb(
	handlers: {
		first?: (query: string, params: unknown[]) => Promise<unknown>
		all?: (query: string, params: unknown[]) => Promise<{ results: unknown[] }>
		run?: (query: string, params: unknown[]) => Promise<{ success: boolean }>
	},
	options: { role?: string } = {},
): MockDb {
	let lastParams: unknown[] = []
	const userRole = options.role ?? 'owner'

	return {
		prepare: vi.fn((query: string) => ({
			bind: vi.fn((...params: unknown[]) => {
				lastParams = params
				return {
					first: vi.fn(async () => {
						// Handle requireAccountAccess middleware query
						if (query.includes('account_access aa') && query.includes('JOIN users u ON u.id = aa.user_id')) {
							return {
								id: 'access-test',
								user_id: 'user-123',
								account_id: 'account-123',
								role: userRole,
								email: 'owner@acme.com',
								first_name: 'Test',
								last_name: 'Owner',
							}
						}
						// Handle tenantMiddleware account lookup
						if (query.includes('FROM accounts WHERE short_name')) {
							return { id: 'account-123', short_name: 'acme', name: 'Acme Corp' }
						}
						return handlers.first?.(query, lastParams) ?? null
					}),
					all: vi.fn(() => handlers.all?.(query, lastParams) ?? { results: [] }),
					run: vi.fn(() => handlers.run?.(query, lastParams) ?? { success: true }),
				}
			}),
		})),
	}
}

describe('Feature: Invitation API Endpoints', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * @REQ-API-001 @RBAC
	 * Scenario: Create invitation (owner/admin only)
	 *   Given I am logged in as "Owner" of "Acme Corp"
	 *   When I POST to "/api/invitations" with:
	 *     | email | role   |
	 *     | alice@example.com | admin |
	 *   Then the response status should be 201
	 *   And an invitation record should be created
	 *   And expires_at should be 14 days from now
	 *   And an invitation email should be queued
	 */
	describe('@REQ-API-001 - Create invitation (owner/admin only)', () => {
		it('should create invitation and return 201 when owner invites user', async () => {
			let insertedInvitation: Record<string, unknown> | null = null

			const db = createMockDb({
				first: async (query, params) => {
					// Check for existing access - none
					if (query.includes('account_access aa') && query.includes('WHERE u.email')) {
						return null
					}
					// Check for existing pending invitation - none
					if (query.includes('account_invitations') && query.includes('accepted_at IS NULL')) {
						return null
					}
					// Return created invitation
					if (query.includes('SELECT * FROM account_invitations WHERE id')) {
						return insertedInvitation
					}
					return null
				},
				run: async (query, params) => {
					// Capture invitation insert
					if (query.includes('INSERT INTO account_invitations')) {
						insertedInvitation = {
							id: params[0],
							account_id: params[1],
							email: params[2],
							role: params[3],
							invited_by_user_id: params[4],
							expires_at: params[5],
							sent_at: new Date().toISOString(),
						}
					}
					return { success: true }
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'alice@example.com', role: 'admin' }),
			})

			expect(res.status).toBe(201)
			const data = await res.json()
			expect(data.id).toBeDefined()
			expect(data.email).toBe('alice@example.com')
			expect(data.role).toBe('admin')
			expect(data.expires_at).toBeDefined()

			// Verify expiry is approximately 14 days from now
			const expiryDate = new Date(data.expires_at)
			const now = new Date()
			const daysDiff = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
			expect(daysDiff).toBe(14)
		})

		it('should allow admin to create invitations', async () => {
			let insertedInvitation: Record<string, unknown> | null = null

			const db = createMockDb(
				{
					first: async (query, params) => {
						if (query.includes('account_access aa') && query.includes('WHERE u.email')) {
							return null
						}
						if (query.includes('account_invitations') && query.includes('accepted_at IS NULL')) {
							return null
						}
						if (query.includes('SELECT * FROM account_invitations WHERE id')) {
							return insertedInvitation
						}
						return null
					},
					run: async (query, params) => {
						if (query.includes('INSERT INTO account_invitations')) {
							insertedInvitation = {
								id: params[0],
								account_id: params[1],
								email: params[2],
								role: params[3],
								invited_by_user_id: params[4],
								expires_at: params[5],
								sent_at: new Date().toISOString(),
							}
						}
						return { success: true }
					},
				},
				{ role: 'admin' },
			)

			const app = createTestApp({ db })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'bob@example.com', role: 'member' }),
			})

			expect(res.status).toBe(201)
		})
	})

	/**
	 * @REQ-API-002 @RBAC
	 * Scenario: Member cannot create invitations
	 *   Given I am logged in as "Member" of "Acme Corp"
	 *   When I POST to "/api/invitations" with email "bob@example.com"
	 *   Then the response status should be 403
	 *   And the error should be "Insufficient permissions"
	 */
	describe('@REQ-API-002 - Member cannot create invitations', () => {
		it('should return 403 when member tries to create invitation', async () => {
			const db = createMockDb({}, { role: 'member' })

			const app = createTestApp({ db })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'bob@example.com', role: 'member' }),
			})

			expect(res.status).toBe(403)
			const data = await res.json()
			expect(data.error).toBe('Insufficient permissions')
		})

		it('should return 403 when buyer tries to create invitation', async () => {
			const db = createMockDb({}, { role: 'buyer' })

			const app = createTestApp({ db })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'bob@example.com', role: 'member' }),
			})

			expect(res.status).toBe(403)
			const data = await res.json()
			expect(data.error).toBe('Insufficient permissions')
		})
	})

	/**
	 * @REQ-API-003 @Validation
	 * Scenario: Cannot invite existing team member
	 *   Given "alice@example.com" already has access to "Acme Corp"
	 *   When I POST to "/api/invitations" with email "alice@example.com"
	 *   Then the response status should be 400
	 *   And the error should be "User already has access to this account"
	 */
	describe('@REQ-API-003 - Cannot invite existing team member', () => {
		it('should return 400 when inviting existing team member', async () => {
			const db = createMockDb({
				first: async (query) => {
					// User already has access
					if (query.includes('account_access aa') && query.includes('WHERE u.email')) {
						return { id: 'existing-access' }
					}
					return null
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'alice@example.com', role: 'admin' }),
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('User already has access to this account')
		})
	})

	/**
	 * @REQ-API-004 @Accept
	 * Scenario: Accept invitation
	 *   Given an invitation exists for "alice@example.com" to "Acme Corp"
	 *   And the invitation is not expired
	 *   When I POST to "/api/invitations/:id/accept"
	 *   Then the response status should be 200
	 *   And accepted_at should be set to current timestamp
	 *   And an Account::Access record should be created with role "admin"
	 *   And I should be redirected to "Acme Corp" dashboard
	 */
	describe('@REQ-API-004 - Accept invitation', () => {
		it('should accept invitation and create Account::Access', async () => {
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 7)

			let accessCreated = false
			let invitationAccepted = false

			const db = createMockDb({
				first: async (query) => {
					// Get invitation
					if (query.includes('SELECT * FROM account_invitations WHERE id')) {
						return {
							id: 'inv-123',
							account_id: 'account-123',
							email: 'alice@example.com',
							role: 'admin',
							invited_by_user_id: 'user-456',
							sent_at: '2025-01-01T00:00:00Z',
							expires_at: futureDate.toISOString(),
						}
					}
					// Get account
					if (query.includes('SELECT id, name, short_name FROM accounts')) {
						return { id: 'account-123', name: 'Acme Corp', short_name: 'acme' }
					}
					// Check existing access - none
					if (query.includes('SELECT id FROM account_access WHERE user_id')) {
						return null
					}
					return null
				},
				run: async (query) => {
					if (query.includes('INSERT INTO account_access')) {
						accessCreated = true
					}
					if (query.includes('UPDATE account_invitations SET accepted_at')) {
						invitationAccepted = true
					}
					return { success: true }
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/inv-123/accept', {
				method: 'POST',
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.account.id).toBe('account-123')
			expect(data.account.name).toBe('Acme Corp')
			expect(data.role).toBe('admin')
			expect(accessCreated).toBe(true)
			expect(invitationAccepted).toBe(true)
		})
	})

	/**
	 * @REQ-API-005 @Decline
	 * Scenario: Decline invitation
	 *   Given an invitation exists for "bob@example.com" to "Acme Corp"
	 *   When I POST to "/api/invitations/:id/decline"
	 *   Then the response status should be 200
	 *   And declined_at should be set to current timestamp
	 *   And no Account::Access should be created
	 */
	describe('@REQ-API-005 - Decline invitation', () => {
		it('should decline invitation without creating access', async () => {
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 7)

			let accessCreated = false
			let invitationDeclined = false

			const db = createMockDb({
				first: async (query) => {
					if (query.includes('SELECT * FROM account_invitations WHERE id')) {
						return {
							id: 'inv-456',
							account_id: 'account-123',
							email: 'bob@example.com',
							role: 'member',
							invited_by_user_id: 'user-789',
							sent_at: '2025-01-01T00:00:00Z',
							expires_at: futureDate.toISOString(),
						}
					}
					return null
				},
				run: async (query) => {
					if (query.includes('INSERT INTO account_access')) {
						accessCreated = true
					}
					if (query.includes('UPDATE account_invitations SET declined_at')) {
						invitationDeclined = true
					}
					return { success: true }
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/inv-456/decline', {
				method: 'POST',
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.message).toBe('Invitation declined')
			expect(accessCreated).toBe(false)
			expect(invitationDeclined).toBe(true)
		})
	})

	/**
	 * @REQ-API-006 @Revoke
	 * Scenario: Revoke pending invitation
	 *   Given I am an admin of "Acme Corp"
	 *   And an invitation was sent to "pending@example.com"
	 *   When I POST to "/api/invitations/:id/revoke"
	 *   Then the response status should be 200
	 *   And revoked_at should be set to current timestamp
	 *   And the invitation link should no longer be valid
	 */
	describe('@REQ-API-006 - Revoke pending invitation', () => {
		it('should revoke pending invitation', async () => {
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 7)

			let invitationRevoked = false

			const db = createMockDb({
				first: async (query) => {
					if (query.includes('SELECT * FROM account_invitations WHERE id')) {
						return {
							id: 'inv-789',
							account_id: 'account-123',
							email: 'pending@example.com',
							role: 'member',
							invited_by_user_id: 'user-123',
							sent_at: '2025-01-01T00:00:00Z',
							expires_at: futureDate.toISOString(),
						}
					}
					return null
				},
				run: async (query) => {
					if (query.includes('UPDATE account_invitations SET revoked_at')) {
						invitationRevoked = true
					}
					return { success: true }
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/inv-789/revoke', {
				method: 'POST',
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.message).toBe('Invitation revoked')
			expect(invitationRevoked).toBe(true)
		})

		it('should return 403 when member tries to revoke invitation', async () => {
			const db = createMockDb({}, { role: 'member' })

			const app = createTestApp({ db })
			const res = await app.request('/inv-789/revoke', {
				method: 'POST',
			})

			expect(res.status).toBe(403)
			const data = await res.json()
			expect(data.error).toBe('Insufficient permissions')
		})
	})

	/**
	 * @REQ-API-007 @Expiry
	 * Scenario: Cannot accept expired invitation
	 *   Given an invitation was sent 15 days ago
	 *   When I try to accept the invitation
	 *   Then the response status should be 400
	 *   And the error should be "This invitation has expired"
	 */
	describe('@REQ-API-007 - Cannot accept expired invitation', () => {
		it('should return 400 when accepting expired invitation', async () => {
			const pastDate = new Date()
			pastDate.setDate(pastDate.getDate() - 1) // Expired yesterday

			const db = createMockDb({
				first: async (query) => {
					if (query.includes('SELECT * FROM account_invitations WHERE id')) {
						return {
							id: 'inv-expired',
							account_id: 'account-123',
							email: 'expired@example.com',
							role: 'member',
							invited_by_user_id: 'user-123',
							sent_at: '2025-01-01T00:00:00Z',
							expires_at: pastDate.toISOString(),
						}
					}
					return null
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/inv-expired/accept', {
				method: 'POST',
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('This invitation has expired')
		})
	})

	/**
	 * @REQ-API-008 @List
	 * Scenario: List all invitations for account
	 *   Given I am an owner of "Acme Corp"
	 *   And there are 3 pending invitations
	 *   When I GET "/api/invitations"
	 *   Then the response status should be 200
	 *   And I should see all 3 invitations with their status
	 */
	describe('@REQ-API-008 - List all invitations for account', () => {
		it('should list all invitations with their status', async () => {
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 7)

			const mockInvitations = [
				{
					id: 'inv-1',
					account_id: 'account-123',
					email: 'pending1@example.com',
					role: 'admin',
					invited_by_user_id: 'user-123',
					sent_at: '2025-01-01T00:00:00Z',
					expires_at: futureDate.toISOString(),
				},
				{
					id: 'inv-2',
					account_id: 'account-123',
					email: 'pending2@example.com',
					role: 'member',
					invited_by_user_id: 'user-123',
					sent_at: '2025-01-02T00:00:00Z',
					expires_at: futureDate.toISOString(),
				},
				{
					id: 'inv-3',
					account_id: 'account-123',
					email: 'pending3@example.com',
					role: 'buyer',
					invited_by_user_id: 'user-123',
					sent_at: '2025-01-03T00:00:00Z',
					expires_at: futureDate.toISOString(),
				},
			]

			const db = createMockDb({
				all: async (query) => {
					if (query.includes('SELECT * FROM account_invitations')) {
						return { results: mockInvitations }
					}
					return { results: [] }
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/', {
				method: 'GET',
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.invitations).toHaveLength(3)
			expect(data.invitations[0].status).toBe('pending')
			expect(data.invitations[1].status).toBe('pending')
			expect(data.invitations[2].status).toBe('pending')
		})

		it('should return 403 when member tries to list invitations', async () => {
			const db = createMockDb({}, { role: 'member' })

			const app = createTestApp({ db })
			const res = await app.request('/', {
				method: 'GET',
			})

			expect(res.status).toBe(403)
			const data = await res.json()
			expect(data.error).toBe('Insufficient permissions')
		})
	})

	/**
	 * Additional validation tests
	 */
	describe('Validation', () => {
		it('should return 400 when email is missing', async () => {
			const db = createMockDb({})

			const app = createTestApp({ db })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: 'admin' }),
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('Email is required')
		})

		it('should return 400 when role is missing', async () => {
			const db = createMockDb({})

			const app = createTestApp({ db })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'test@example.com' }),
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('Role is required')
		})

		it('should return 400 when role is invalid', async () => {
			const db = createMockDb({})

			const app = createTestApp({ db })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'test@example.com', role: 'superadmin' }),
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('Invalid role')
		})

		it('should return 403 when admin tries to assign owner role', async () => {
			const db = createMockDb({}, { role: 'admin' })

			const app = createTestApp({ db })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'newowner@example.com', role: 'owner' }),
			})

			expect(res.status).toBe(403)
			const data = await res.json()
			expect(data.message).toContain('cannot assign the owner role')
		})
	})

	/**
	 * Edge cases
	 */
	describe('Edge cases', () => {
		it('should return existing pending invitation instead of creating duplicate', async () => {
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 7)

			const existingInvitation = {
				id: 'inv-existing',
				account_id: 'account-123',
				email: 'existing@example.com',
				role: 'admin',
				invited_by_user_id: 'user-123',
				sent_at: '2025-01-01T00:00:00Z',
				expires_at: futureDate.toISOString(),
			}

			const db = createMockDb({
				first: async (query) => {
					// No existing access
					if (query.includes('account_access aa') && query.includes('WHERE u.email')) {
						return null
					}
					// Existing pending invitation
					if (query.includes('account_invitations') && query.includes('accepted_at IS NULL')) {
						return existingInvitation
					}
					return null
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'existing@example.com', role: 'admin' }),
			})

			expect(res.status).toBe(201)
			const data = await res.json()
			expect(data.id).toBe('inv-existing')
		})

		it('should return 400 when trying to decline already declined invitation', async () => {
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 7)

			const db = createMockDb({
				first: async (query) => {
					if (query.includes('SELECT * FROM account_invitations WHERE id')) {
						return {
							id: 'inv-declined',
							account_id: 'account-123',
							email: 'declined@example.com',
							role: 'member',
							invited_by_user_id: 'user-123',
							sent_at: '2025-01-01T00:00:00Z',
							declined_at: '2025-01-02T00:00:00Z',
							expires_at: futureDate.toISOString(),
						}
					}
					return null
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/inv-declined/decline', {
				method: 'POST',
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toContain('declined')
		})

		it('should return 400 when trying to accept already accepted invitation', async () => {
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 7)

			const db = createMockDb({
				first: async (query) => {
					if (query.includes('SELECT * FROM account_invitations WHERE id')) {
						return {
							id: 'inv-accepted',
							account_id: 'account-123',
							email: 'accepted@example.com',
							role: 'member',
							invited_by_user_id: 'user-123',
							sent_at: '2025-01-01T00:00:00Z',
							accepted_at: '2025-01-02T00:00:00Z',
							expires_at: futureDate.toISOString(),
						}
					}
					return null
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/inv-accepted/accept', {
				method: 'POST',
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toContain('already been accepted')
		})

		it('should return 404 when invitation does not exist', async () => {
			const db = createMockDb({
				first: async () => null,
			})

			const app = createTestApp({ db })
			const res = await app.request('/inv-nonexistent/accept', {
				method: 'POST',
			})

			expect(res.status).toBe(404)
			const data = await res.json()
			expect(data.error).toContain('not found')
		})

		it('should return 400 when trying to revoke invitation from different account', async () => {
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 7)

			const db = createMockDb({
				first: async (query) => {
					if (query.includes('SELECT * FROM account_invitations WHERE id')) {
						return {
							id: 'inv-other',
							account_id: 'other-account', // Different account
							email: 'other@example.com',
							role: 'member',
							invited_by_user_id: 'user-123',
							sent_at: '2025-01-01T00:00:00Z',
							expires_at: futureDate.toISOString(),
						}
					}
					return null
				},
			})

			const app = createTestApp({ db })
			const res = await app.request('/inv-other/revoke', {
				method: 'POST',
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toContain('not found')
		})
	})
})
