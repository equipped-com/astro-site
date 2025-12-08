/**
 * Clerk Webhook Handler Tests
 *
 * Tests webhook signature verification, user events (create/update/delete),
 * organization membership events, and idempotency guarantees.
 *
 * @REQ-HOOK-001 - Signature verification
 * @REQ-HOOK-002 - User creation
 * @REQ-HOOK-003 - Idempotent user creation
 * @REQ-HOOK-004 - User updates
 * @REQ-HOOK-005 - Soft user deletion
 * @REQ-HOOK-006 - Organization membership
 */
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { createClerkWebhook, type WebhookDependencies } from './clerk'

// Mock D1Database interface
interface MockD1Result {
	results: unknown[]
	success: boolean
	meta: { changes?: number }
}

interface MockD1PreparedStatement {
	bind: (...values: unknown[]) => MockD1PreparedStatement
	run: () => Promise<MockD1Result>
	first: <T>() => Promise<T | null>
}

interface MockD1Database {
	prepare: (query: string) => MockD1PreparedStatement
}

// Helper to create mock D1 database
function createMockDb(): MockD1Database {
	const mockStatement: MockD1PreparedStatement = {
		bind: vi.fn().mockReturnThis(),
		run: vi.fn().mockResolvedValue({ results: [], success: true, meta: { changes: 1 } }),
		first: vi.fn().mockResolvedValue(null),
	}
	return {
		prepare: vi.fn().mockReturnValue(mockStatement),
	}
}

// Helper to create valid Svix headers
function createSvixHeaders() {
	return {
		'svix-id': 'msg_123',
		'svix-timestamp': String(Math.floor(Date.now() / 1000)),
		'svix-signature': 'v1,signature123',
	}
}

// Helper to create webhook event payloads
function createUserCreatedEvent(
	overrides: Partial<{
		id: string
		email: string
		firstName: string | null
		lastName: string | null
		imageUrl: string | null
	}> = {},
) {
	return {
		type: 'user.created',
		data: {
			id: overrides.id ?? 'user_abc123',
			email_addresses: [
				{
					email_address: overrides.email ?? 'alice@company.com',
					id: 'email_123',
					verification: { status: 'verified' },
				},
			],
			first_name: overrides.firstName ?? 'Alice',
			last_name: overrides.lastName ?? 'Smith',
			image_url: overrides.imageUrl ?? 'https://example.com/avatar.png',
		},
	}
}

function createUserUpdatedEvent(
	overrides: Partial<{
		id: string
		email: string
		firstName: string | null
		lastName: string | null
	}> = {},
) {
	return {
		type: 'user.updated',
		data: {
			id: overrides.id ?? 'user_abc123',
			email_addresses: [
				{
					email_address: overrides.email ?? 'alice@company.com',
					id: 'email_123',
				},
			],
			first_name: overrides.firstName ?? 'Alicia',
			last_name: overrides.lastName ?? 'Smith',
			image_url: null,
		},
	}
}

function createUserDeletedEvent(userId: string = 'user_abc123') {
	return {
		type: 'user.deleted',
		data: {
			id: userId,
		},
	}
}

function createOrgMembershipCreatedEvent(
	overrides: Partial<{
		orgId: string
		userId: string
		role: string
	}> = {},
) {
	return {
		type: 'organization.membership.created',
		data: {
			organization: { id: overrides.orgId ?? 'acc_456', name: 'Test Org' },
			public_user_data: { user_id: overrides.userId ?? 'user_abc123' },
			role: overrides.role ?? 'admin',
		},
	}
}

// Test suite
describe('Clerk Webhook Handler', () => {
	let mockDb: MockD1Database
	let mockDeps: WebhookDependencies

	beforeEach(() => {
		mockDb = createMockDb()
		mockDeps = {
			verifySignature: vi.fn(),
		}
	})

	/**
	 * @REQ-HOOK-001
	 * Scenario: Verify webhook signature
	 * Given a webhook payload with invalid signature
	 * When POST to "/api/webhooks/clerk"
	 * Then response status should be 400
	 * And response body should contain "Invalid signature"
	 */
	describe('Signature Verification', () => {
		it('should return 400 for invalid signature', async () => {
			// Setup: Make signature verification throw
			;(mockDeps.verifySignature as Mock).mockImplementation(() => {
				throw new Error('Invalid signature')
			})

			const webhook = createClerkWebhook(mockDeps)
			const response = await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify({ type: 'user.created', data: {} }),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			expect(response.status).toBe(400)
			const body = (await response.json()) as { error: string }
			expect(body.error).toBe('Invalid signature')
		})

		it('should return 500 when CLERK_WEBHOOK_SECRET is not configured', async () => {
			const webhook = createClerkWebhook(mockDeps)
			const response = await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify({ type: 'user.created', data: {} }),
				},
				{
					// No CLERK_WEBHOOK_SECRET
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			expect(response.status).toBe(500)
			const body = (await response.json()) as { error: string }
			expect(body.error).toBe('Webhook not configured')
		})

		it('should process valid signature successfully', async () => {
			const event = createUserCreatedEvent()
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			const webhook = createClerkWebhook(mockDeps)
			const response = await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify(event),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			expect(response.status).toBe(200)
			expect(mockDeps.verifySignature).toHaveBeenCalledTimes(1)
		})
	})

	/**
	 * @REQ-HOOK-002
	 * Scenario: Create user on signup
	 * Given a valid "user.created" webhook event
	 * When POST to "/api/webhooks/clerk"
	 * Then response status should be 200
	 * And users table should contain the new user
	 */
	describe('User Created Event', () => {
		it('should create user in database with correct fields', async () => {
			const event = createUserCreatedEvent({
				id: 'user_abc123',
				email: 'alice@company.com',
				firstName: 'Alice',
				lastName: 'Smith',
			})
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			const webhook = createClerkWebhook(mockDeps)
			const response = await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify(event),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			expect(response.status).toBe(200)

			// Verify database call
			const prepare = mockDb.prepare as Mock
			expect(prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'))
			expect(prepare).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT(id) DO UPDATE'))

			// Verify bound parameters
			const statement = prepare.mock.results[0].value
			expect(statement.bind).toHaveBeenCalledWith(
				'user_abc123',
				'alice@company.com',
				'Alice',
				'Smith',
				expect.any(String), // avatar_url
			)
		})

		it('should handle user without email gracefully', async () => {
			const event = {
				type: 'user.created',
				data: {
					id: 'user_noemail',
					email_addresses: [],
					first_name: 'NoEmail',
					last_name: 'User',
				},
			}
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			const webhook = createClerkWebhook(mockDeps)
			const response = await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify(event),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			// Should still return 200 (event acknowledged) but not insert
			expect(response.status).toBe(200)

			// Verify no INSERT was called (user without email is skipped)
			const prepare = mockDb.prepare as Mock
			expect(prepare).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'))
		})
	})

	/**
	 * @REQ-HOOK-003
	 * Scenario: Handle duplicate user creation (idempotent)
	 * Given user already exists
	 * And a valid "user.created" webhook event for same user
	 * When POST to "/api/webhooks/clerk"
	 * Then response status should be 200
	 * And no duplicate user should be created (UPSERT behavior)
	 */
	describe('Idempotent User Creation', () => {
		it('should use UPSERT to handle duplicate events', async () => {
			const event = createUserCreatedEvent({ id: 'user_abc123' })
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			const webhook = createClerkWebhook(mockDeps)

			// Simulate calling the webhook twice
			for (let i = 0; i < 2; i++) {
				const response = await webhook.request(
					'/',
					{
						method: 'POST',
						headers: createSvixHeaders(),
						body: JSON.stringify(event),
					},
					{
						CLERK_WEBHOOK_SECRET: 'whsec_test123',
						DB: mockDb as unknown as D1Database,
					} as Env,
				)

				expect(response.status).toBe(200)
			}

			// Verify the SQL uses ON CONFLICT clause for idempotency
			const prepare = mockDb.prepare as Mock
			const calls = prepare.mock.calls.filter((call: string[]) => call[0].includes('INSERT INTO users'))
			expect(calls.length).toBe(2)
			calls.forEach((call: string[]) => {
				expect(call[0]).toContain('ON CONFLICT(id) DO UPDATE')
			})
		})
	})

	/**
	 * @REQ-HOOK-004
	 * Scenario: Update user on profile change
	 * Given user exists with name "Alice Smith"
	 * And a valid "user.updated" webhook event
	 * When POST to "/api/webhooks/clerk"
	 * Then response status should be 200
	 * And user first_name should be updated
	 */
	describe('User Updated Event', () => {
		it('should update user in database', async () => {
			const event = createUserUpdatedEvent({
				id: 'user_abc123',
				firstName: 'Alicia',
			})
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			const webhook = createClerkWebhook(mockDeps)
			const response = await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify(event),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			expect(response.status).toBe(200)

			// Verify UPDATE query
			const prepare = mockDb.prepare as Mock
			expect(prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET'))

			// Verify the new name is bound
			const statement = prepare.mock.results[0].value
			expect(statement.bind).toHaveBeenCalledWith(
				expect.any(String), // email
				'Alicia', // updated first_name
				'Smith', // last_name
				null, // avatar_url
				'user_abc123', // id
			)
		})
	})

	/**
	 * @REQ-HOOK-005
	 * Scenario: Soft delete user on account deletion
	 * Given user exists
	 * And a valid "user.deleted" webhook event
	 * When POST to "/api/webhooks/clerk"
	 * Then response status should be 200
	 * And user should have deleted_at timestamp
	 */
	describe('User Deleted Event', () => {
		it('should soft delete user by setting deleted_at', async () => {
			const event = createUserDeletedEvent('user_abc123')
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			const webhook = createClerkWebhook(mockDeps)
			const response = await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify(event),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			expect(response.status).toBe(200)

			// Verify soft delete query
			const prepare = mockDb.prepare as Mock
			expect(prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET deleted_at = CURRENT_TIMESTAMP'))

			// Verify user id is bound
			const statement = prepare.mock.results[0].value
			expect(statement.bind).toHaveBeenCalledWith('user_abc123')
		})

		it('should fall back to hard delete if soft delete fails', async () => {
			const event = createUserDeletedEvent('user_abc123')
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			// Make the first UPDATE fail (soft delete column doesn't exist)
			const mockStatement: MockD1PreparedStatement = {
				bind: vi.fn().mockReturnThis(),
				run: vi
					.fn()
					.mockRejectedValueOnce(new Error('no such column: deleted_at'))
					.mockResolvedValue({ results: [], success: true, meta: { changes: 1 } }),
				first: vi.fn().mockResolvedValue(null),
			}
			mockDb.prepare = vi.fn().mockReturnValue(mockStatement)

			const webhook = createClerkWebhook(mockDeps)
			const response = await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify(event),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			expect(response.status).toBe(200)

			// Verify both soft and hard delete were attempted
			const prepare = mockDb.prepare as Mock
			expect(prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET deleted_at'))
			expect(prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM users'))
		})
	})

	/**
	 * @REQ-HOOK-006
	 * Scenario: Create account access on org membership
	 * Given user exists
	 * And account exists
	 * And a valid "organization.membership.created" webhook event
	 * When POST to "/api/webhooks/clerk"
	 * Then response status should be 200
	 * And account_access should exist with correct role
	 */
	describe('Organization Membership Created Event', () => {
		it('should create account_access record', async () => {
			const event = createOrgMembershipCreatedEvent({
				orgId: 'acc_456',
				userId: 'user_abc123',
				role: 'admin',
			})
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			const webhook = createClerkWebhook(mockDeps)
			const response = await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify(event),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			expect(response.status).toBe(200)

			// Verify INSERT query
			const prepare = mockDb.prepare as Mock
			expect(prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO account_access'))
			expect(prepare).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT(user_id, account_id)'))

			// Verify bound parameters
			const statement = prepare.mock.results[0].value
			expect(statement.bind).toHaveBeenCalledWith(
				expect.any(String), // generated UUID
				'user_abc123',
				'acc_456',
				'admin',
			)
		})

		it('should map Clerk org:admin role to internal admin', async () => {
			const event = createOrgMembershipCreatedEvent({ role: 'org:admin' })
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			const webhook = createClerkWebhook(mockDeps)
			await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify(event),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			const prepare = mockDb.prepare as Mock
			const statement = prepare.mock.results[0].value
			// Fourth parameter should be the mapped role
			expect(statement.bind).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
				expect.any(String),
				'admin', // org:admin -> admin
			)
		})

		it('should map Clerk org:member role to internal member', async () => {
			const event = createOrgMembershipCreatedEvent({ role: 'org:member' })
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			const webhook = createClerkWebhook(mockDeps)
			await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify(event),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			const prepare = mockDb.prepare as Mock
			const statement = prepare.mock.results[0].value
			expect(statement.bind).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.any(String), 'member')
		})

		it('should default unknown roles to member', async () => {
			const event = createOrgMembershipCreatedEvent({ role: 'org:custom_unknown_role' })
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			const webhook = createClerkWebhook(mockDeps)
			await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify(event),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			const prepare = mockDb.prepare as Mock
			const statement = prepare.mock.results[0].value
			expect(statement.bind).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
				expect.any(String),
				'member', // unknown role defaults to member
			)
		})

		it('should handle missing org or user data gracefully', async () => {
			const event = {
				type: 'organization.membership.created',
				data: {
					organization: null,
					public_user_data: null,
					role: 'admin',
				},
			}
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			const webhook = createClerkWebhook(mockDeps)
			const response = await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify(event),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			// Should return 200 (acknowledged) but not insert
			expect(response.status).toBe(200)

			const prepare = mockDb.prepare as Mock
			expect(prepare).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO account_access'))
		})
	})

	describe('Unhandled Event Types', () => {
		it('should acknowledge unhandled event types without error', async () => {
			const event = {
				type: 'session.created',
				data: { id: 'sess_123' },
			}
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			const webhook = createClerkWebhook(mockDeps)
			const response = await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify(event),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			expect(response.status).toBe(200)
			const body = (await response.json()) as { success: boolean }
			expect(body.success).toBe(true)
		})
	})

	describe('Database Errors', () => {
		it('should return 503 when database is not available', async () => {
			const event = createUserCreatedEvent()
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			const webhook = createClerkWebhook(mockDeps)
			const response = await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify(event),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					// No DB binding
				} as Env,
			)

			expect(response.status).toBe(503)
			const body = (await response.json()) as { error: string }
			expect(body.error).toBe('Database not available')
		})

		it('should return 500 on database error during event handling', async () => {
			const event = createUserCreatedEvent()
			;(mockDeps.verifySignature as Mock).mockReturnValue(event)

			// Make database throw
			const errorStatement: MockD1PreparedStatement = {
				bind: vi.fn().mockReturnThis(),
				run: vi.fn().mockRejectedValue(new Error('Database connection failed')),
				first: vi.fn().mockResolvedValue(null),
			}
			mockDb.prepare = vi.fn().mockReturnValue(errorStatement)

			const webhook = createClerkWebhook(mockDeps)
			const response = await webhook.request(
				'/',
				{
					method: 'POST',
					headers: createSvixHeaders(),
					body: JSON.stringify(event),
				},
				{
					CLERK_WEBHOOK_SECRET: 'whsec_test123',
					DB: mockDb as unknown as D1Database,
				} as Env,
			)

			expect(response.status).toBe(500)
			const body = (await response.json()) as { error: string }
			expect(body.error).toBe('Internal server error')
		})
	})
})
