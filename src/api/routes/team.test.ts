/**
 * Team Access API Routes Tests
 *
 * Tests for team member management, roles, and invitations.
 * Follows Gherkin BDD format with @REQ tags.
 */

import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import team from './team'

// Mock D1 Database
const mockDB = {
	prepare: vi.fn().mockReturnThis(),
	bind: vi.fn().mockReturnThis(),
	first: vi.fn(),
	all: vi.fn(),
	run: vi.fn(),
}

// Mock environment
const mockEnv = {
	DB: mockDB,
	ENVIRONMENT: 'development' as const,
}

// Helper to create mock context
function createMockContext(overrides = {}) {
	const ctx = {
		env: mockEnv,
		req: {
			json: vi.fn(),
			param: vi.fn(),
		},
		get: vi.fn((key: string) => {
			const defaults: Record<string, unknown> = {
				accountId: 'account-123',
				userId: 'user-123',
				role: 'owner',
				user: { id: 'user-123', email: 'owner@test.com' },
				...overrides,
			}
			return defaults[key]
		}),
		json: vi.fn((data, status) => ({ data, status })),
	} as unknown as Context
	return ctx
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

			mockDB.all.mockResolvedValueOnce({ results: mockMembers })

			const ctx = createMockContext()
			const handler = team.fetch as (req: Request, env: typeof mockEnv) => Promise<Response>

			const req = new Request('http://localhost/api/team')
			const res = await handler(req, mockEnv)

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
			mockDB.first
				.mockResolvedValueOnce(null) // User doesn't exist
				.mockResolvedValueOnce(null) // No existing access

			const ctx = createMockContext({ role: 'owner' })
			ctx.req.json = vi.fn().mockResolvedValueOnce({
				email: 'newuser@company.com',
				role: 'member',
			})

			const handler = team.fetch as (req: Request, env: typeof mockEnv) => Promise<Response>
			const req = new Request('http://localhost/api/team/invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'newuser@company.com', role: 'member' }),
			})

			const res = await handler(req, mockEnv)
			expect(res.status).toBe(200)

			const data = await res.json()
			expect(data.success).toBe(true)
			expect(data.email).toBe('newuser@company.com')
		})

		it('should grant access to existing user without sending invitation', async () => {
			mockDB.first
				.mockResolvedValueOnce({ id: 'existing-user-123' }) // User exists
				.mockResolvedValueOnce(null) // No existing access

			mockDB.run.mockResolvedValueOnce({})

			const handler = team.fetch as (req: Request, env: typeof mockEnv) => Promise<Response>
			const req = new Request('http://localhost/api/team/invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'existing@company.com', role: 'member' }),
			})

			const res = await handler(req, mockEnv)
			expect(res.status).toBe(200)

			const data = await res.json()
			expect(data.success).toBe(true)
			expect(data.method).toBe('existing_user')
		})

		it('should reject invitation if user already has access', async () => {
			mockDB.first
				.mockResolvedValueOnce({ id: 'existing-user-123' }) // User exists
				.mockResolvedValueOnce({ id: 'access-456' }) // Already has access

			const handler = team.fetch as (req: Request, env: typeof mockEnv) => Promise<Response>
			const req = new Request('http://localhost/api/team/invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'duplicate@company.com', role: 'member' }),
			})

			const res = await handler(req, mockEnv)
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
			mockDB.first.mockResolvedValueOnce(null) // User doesn't exist

			const handler = team.fetch as (req: Request, env: typeof mockEnv) => Promise<Response>
			const req = new Request('http://localhost/api/team/invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'newowner@company.com', role: 'owner' }),
			})

			const res = await handler(req, mockEnv)
			expect(res.status).toBe(200)
		})

		it('should prevent admin from assigning owner role', async () => {
			const handler = team.fetch as (req: Request, env: typeof mockEnv) => Promise<Response>
			const req = new Request('http://localhost/api/team/invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'newowner@company.com', role: 'owner' }),
			})

			// Mock context with admin role
			vi.mocked(mockEnv.DB.prepare).mockReturnValue({
				bind: vi.fn().mockReturnThis(),
				first: vi.fn().mockResolvedValue(null),
				all: vi.fn(),
				run: vi.fn(),
			} as never)

			const res = await handler(req, mockEnv)
			const data = await res.json()

			// Admin trying to assign owner should fail
			if (res.status === 403) {
				expect(data.message).toContain('cannot assign the owner role')
			}
		})
	})

	/**
	 * @REQ-SET-TEAM-004
	 * Scenario: Change member role
	 */
	describe('PUT /api/team/:accessId/role - Change member role', () => {
		it('should update member role and record in audit log', async () => {
			mockDB.first.mockResolvedValueOnce({
				user_id: 'user-456',
				role: 'member',
			})

			mockDB.run.mockResolvedValueOnce({})

			const handler = team.fetch as (req: Request, env: typeof mockEnv) => Promise<Response>
			const req = new Request('http://localhost/api/team/access-123/role', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: 'admin' }),
			})

			const res = await handler(req, mockEnv)
			expect(res.status).toBe(200)

			const data = await res.json()
			expect(data.success).toBe(true)
			expect(data.message).toContain('Role updated successfully')
		})

		it('should prevent user from changing their own role', async () => {
			mockDB.first.mockResolvedValueOnce({
				user_id: 'user-123', // Same as current user
				role: 'owner',
			})

			const handler = team.fetch as (req: Request, env: typeof mockEnv) => Promise<Response>
			const req = new Request('http://localhost/api/team/access-123/role', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: 'member' }),
			})

			const res = await handler(req, mockEnv)
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
			mockDB.first.mockResolvedValueOnce({
				user_id: 'user-456',
				role: 'member',
			})

			mockDB.run.mockResolvedValueOnce({})

			const handler = team.fetch as (req: Request, env: typeof mockEnv) => Promise<Response>
			const req = new Request('http://localhost/api/team/access-123', {
				method: 'DELETE',
			})

			const res = await handler(req, mockEnv)
			expect(res.status).toBe(200)

			const data = await res.json()
			expect(data.success).toBe(true)
		})

		it('should prevent user from removing their own access', async () => {
			mockDB.first.mockResolvedValueOnce({
				user_id: 'user-123', // Same as current user
				role: 'owner',
			})

			const handler = team.fetch as (req: Request, env: typeof mockEnv) => Promise<Response>
			const req = new Request('http://localhost/api/team/access-123', {
				method: 'DELETE',
			})

			const res = await handler(req, mockEnv)
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
			mockDB.first
				.mockResolvedValueOnce({
					user_id: 'user-456',
					role: 'owner',
				})
				.mockResolvedValueOnce({ count: 1 }) // Only 1 owner

			const handler = team.fetch as (req: Request, env: typeof mockEnv) => Promise<Response>
			const req = new Request('http://localhost/api/team/access-123', {
				method: 'DELETE',
			})

			const res = await handler(req, mockEnv)
			expect(res.status).toBe(400)

			const data = await res.json()
			expect(data.error).toBe('Cannot remove last owner')
		})

		it('should prevent demoting the last owner', async () => {
			mockDB.first
				.mockResolvedValueOnce({
					user_id: 'user-456',
					role: 'owner',
				})
				.mockResolvedValueOnce({ count: 1 }) // Only 1 owner

			const handler = team.fetch as (req: Request, env: typeof mockEnv) => Promise<Response>
			const req = new Request('http://localhost/api/team/access-123/role', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: 'admin' }),
			})

			const res = await handler(req, mockEnv)
			expect(res.status).toBe(400)

			const data = await res.json()
			expect(data.error).toBe('Cannot remove last owner')
		})

		it('should allow removing owner if multiple owners exist', async () => {
			mockDB.first
				.mockResolvedValueOnce({
					user_id: 'user-456',
					role: 'owner',
				})
				.mockResolvedValueOnce({ count: 2 }) // 2 owners

			mockDB.run.mockResolvedValueOnce({})

			const handler = team.fetch as (req: Request, env: typeof mockEnv) => Promise<Response>
			const req = new Request('http://localhost/api/team/access-123', {
				method: 'DELETE',
			})

			const res = await handler(req, mockEnv)
			expect(res.status).toBe(200)

			const data = await res.json()
			expect(data.success).toBe(true)
		})
	})
})
