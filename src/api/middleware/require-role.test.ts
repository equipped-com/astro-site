/**
 * Role-Based Access Control Tests
 *
 * Tests for role hierarchy enforcement and permission checking.
 *
 * @REQ-RBAC-001 - Role hierarchy enforced
 * @REQ-RBAC-002 - Owner has highest access
 * @REQ-RBAC-003 - noaccess role denied
 * @REQ-RBAC-004 - Unknown roles handled safely
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Role } from './auth'
import {
	getRoleLevel,
	hasRole,
	ROLE_HIERARCHY,
	ROLE_NAMES,
	requireAdmin,
	requireBuyer,
	requireMember,
	requireOwner,
	requireRole,
	requireViewer,
} from './require-role'

// Helper to create mock Hono context
function createMockContext(role?: Role | undefined) {
	const values = new Map<string, unknown>()
	if (role !== undefined) {
		values.set('role', role)
	}

	return {
		get: vi.fn((key: string) => values.get(key)),
		set: vi.fn((key: string, value: unknown) => values.set(key, value)),
		json: vi.fn((body: unknown, status?: number) => ({ body, status: status ?? 200 })),
	}
}

// Mock next function
function createMockNext() {
	return vi.fn().mockResolvedValue(undefined)
}

describe('Role-Based Access Control', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * Feature: Role Hierarchy
	 *
	 * @REQ-RBAC-001 - Role hierarchy enforced
	 * Role hierarchy levels:
	 *   owner (5) > admin (4) > member (3) > buyer (2) > viewer (1) > noaccess (0)
	 */
	describe('ROLE_HIERARCHY', () => {
		it('should have correct hierarchy levels', () => {
			expect(ROLE_HIERARCHY.owner).toBe(5)
			expect(ROLE_HIERARCHY.admin).toBe(4)
			expect(ROLE_HIERARCHY.member).toBe(3)
			expect(ROLE_HIERARCHY.buyer).toBe(2)
			expect(ROLE_HIERARCHY.viewer).toBe(1)
			expect(ROLE_HIERARCHY.noaccess).toBe(0)
		})

		it('should maintain correct ordering (owner > admin > member > buyer > viewer > noaccess)', () => {
			expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.admin)
			expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.member)
			expect(ROLE_HIERARCHY.member).toBeGreaterThan(ROLE_HIERARCHY.buyer)
			expect(ROLE_HIERARCHY.buyer).toBeGreaterThan(ROLE_HIERARCHY.viewer)
			expect(ROLE_HIERARCHY.viewer).toBeGreaterThan(ROLE_HIERARCHY.noaccess)
		})
	})

	describe('ROLE_NAMES', () => {
		it('should have human-readable names for all roles', () => {
			expect(ROLE_NAMES.owner).toBe('Owner')
			expect(ROLE_NAMES.admin).toBe('Admin')
			expect(ROLE_NAMES.member).toBe('Member')
			expect(ROLE_NAMES.buyer).toBe('Buyer')
			expect(ROLE_NAMES.viewer).toBe('Viewer')
			expect(ROLE_NAMES.noaccess).toBe('No Access')
		})
	})

	/**
	 * Feature: requireRole Middleware
	 *
	 * @REQ-RBAC-002 - Owner has highest access
	 * Scenario: Owner can access any role-gated route
	 *   Given user has owner role
	 *   When accessing admin-only endpoint
	 *   Then access is granted
	 */
	describe('requireRole()', () => {
		// Owner access tests
		describe('owner role', () => {
			it('should allow owner to access owner-required routes', async () => {
				const c = createMockContext('owner')
				const next = createMockNext()
				const middleware = requireRole('owner')

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should allow owner to access admin-required routes', async () => {
				const c = createMockContext('owner')
				const next = createMockNext()
				const middleware = requireRole('admin')

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should allow owner to access member-required routes', async () => {
				const c = createMockContext('owner')
				const next = createMockNext()
				const middleware = requireRole('member')

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should allow owner to access buyer-required routes', async () => {
				const c = createMockContext('owner')
				const next = createMockNext()
				const middleware = requireRole('buyer')

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should allow owner to access viewer-required routes', async () => {
				const c = createMockContext('owner')
				const next = createMockNext()
				const middleware = requireRole('viewer')

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})
		})

		// Admin access tests
		describe('admin role', () => {
			it('should deny admin from owner-required routes', async () => {
				const c = createMockContext('admin')
				const next = createMockNext()
				const middleware = requireRole('owner')

				const result = await middleware(c as any, next)

				expect(result.status).toBe(403)
				expect(result.body.error).toBe('Owner access required')
				expect(result.body.required_role).toBe('owner')
				expect(result.body.your_role).toBe('admin')
				expect(next).not.toHaveBeenCalled()
			})

			it('should allow admin to access admin-required routes', async () => {
				const c = createMockContext('admin')
				const next = createMockNext()
				const middleware = requireRole('admin')

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should allow admin to access member-required routes', async () => {
				const c = createMockContext('admin')
				const next = createMockNext()
				const middleware = requireRole('member')

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})
		})

		// Member access tests
		describe('member role', () => {
			it('should deny member from admin-required routes', async () => {
				const c = createMockContext('member')
				const next = createMockNext()
				const middleware = requireRole('admin')

				const result = await middleware(c as any, next)

				expect(result.status).toBe(403)
				expect(result.body.error).toBe('Admin access required')
				expect(next).not.toHaveBeenCalled()
			})

			it('should allow member to access member-required routes', async () => {
				const c = createMockContext('member')
				const next = createMockNext()
				const middleware = requireRole('member')

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should allow member to access buyer-required routes', async () => {
				const c = createMockContext('member')
				const next = createMockNext()
				const middleware = requireRole('buyer')

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})
		})

		// Buyer access tests
		describe('buyer role', () => {
			it('should deny buyer from member-required routes', async () => {
				const c = createMockContext('buyer')
				const next = createMockNext()
				const middleware = requireRole('member')

				const result = await middleware(c as any, next)

				expect(result.status).toBe(403)
				expect(result.body.error).toBe('Member access required')
				expect(next).not.toHaveBeenCalled()
			})

			it('should allow buyer to access buyer-required routes', async () => {
				const c = createMockContext('buyer')
				const next = createMockNext()
				const middleware = requireRole('buyer')

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should allow buyer to access viewer-required routes', async () => {
				const c = createMockContext('buyer')
				const next = createMockNext()
				const middleware = requireRole('viewer')

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})
		})

		// Viewer access tests
		describe('viewer role', () => {
			it('should deny viewer from buyer-required routes', async () => {
				const c = createMockContext('viewer')
				const next = createMockNext()
				const middleware = requireRole('buyer')

				const result = await middleware(c as any, next)

				expect(result.status).toBe(403)
				expect(result.body.error).toBe('Buyer access required')
				expect(next).not.toHaveBeenCalled()
			})

			it('should allow viewer to access viewer-required routes', async () => {
				const c = createMockContext('viewer')
				const next = createMockNext()
				const middleware = requireRole('viewer')

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})
		})

		/**
		 * @REQ-RBAC-003 - noaccess role denied
		 * Scenario: RBAC prevents unauthorized access
		 *   Given a user with noaccess role
		 *   When accessing any protected endpoint
		 *   Then 403 Forbidden is returned
		 */
		describe('noaccess role', () => {
			it('should deny noaccess from all role-required routes', async () => {
				const c = createMockContext('noaccess')
				const next = createMockNext()
				const middleware = requireRole('viewer')

				const result = await middleware(c as any, next)

				expect(result.status).toBe(403)
				expect(result.body.error).toBe('Viewer access required')
				expect(result.body.your_role).toBe('noaccess')
				expect(next).not.toHaveBeenCalled()
			})

			it('should deny noaccess from all role levels', async () => {
				const roles: Role[] = ['owner', 'admin', 'member', 'buyer', 'viewer']

				for (const role of roles) {
					const c = createMockContext('noaccess')
					const next = createMockNext()
					const middleware = requireRole(role)

					const result = await middleware(c as any, next)

					expect(result.status).toBe(403)
					expect(next).not.toHaveBeenCalled()
				}
			})
		})

		// No role set tests
		describe('no role in context', () => {
			it('should return 403 when role is not set', async () => {
				const c = createMockContext(undefined)
				const next = createMockNext()
				const middleware = requireRole('viewer')

				const result = await middleware(c as any, next)

				expect(result.status).toBe(403)
				expect(result.body.error).toBe('Role not determined')
				expect(result.body.message).toBe('Unable to determine your role in this account')
				expect(next).not.toHaveBeenCalled()
			})
		})

		// Error message format
		describe('error message format', () => {
			it('should include required and current role in error', async () => {
				const c = createMockContext('viewer')
				const next = createMockNext()
				const middleware = requireRole('admin')

				const result = await middleware(c as any, next)

				expect(result.body).toEqual({
					error: 'Admin access required',
					message: 'This action requires Admin role or higher. Your current role is Viewer.',
					required_role: 'admin',
					your_role: 'viewer',
				})
			})
		})
	})

	/**
	 * Feature: Convenience Middleware Functions
	 */
	describe('Convenience Middleware Functions', () => {
		describe('requireOwner()', () => {
			it('should allow owner', async () => {
				const c = createMockContext('owner')
				const next = createMockNext()
				const middleware = requireOwner()

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should deny admin', async () => {
				const c = createMockContext('admin')
				const next = createMockNext()
				const middleware = requireOwner()

				const result = await middleware(c as any, next)

				expect(result.status).toBe(403)
			})
		})

		describe('requireAdmin()', () => {
			it('should allow admin', async () => {
				const c = createMockContext('admin')
				const next = createMockNext()
				const middleware = requireAdmin()

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should allow owner', async () => {
				const c = createMockContext('owner')
				const next = createMockNext()
				const middleware = requireAdmin()

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should deny member', async () => {
				const c = createMockContext('member')
				const next = createMockNext()
				const middleware = requireAdmin()

				const result = await middleware(c as any, next)

				expect(result.status).toBe(403)
			})
		})

		describe('requireMember()', () => {
			it('should allow member', async () => {
				const c = createMockContext('member')
				const next = createMockNext()
				const middleware = requireMember()

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should deny buyer', async () => {
				const c = createMockContext('buyer')
				const next = createMockNext()
				const middleware = requireMember()

				const result = await middleware(c as any, next)

				expect(result.status).toBe(403)
			})
		})

		describe('requireBuyer()', () => {
			it('should allow buyer', async () => {
				const c = createMockContext('buyer')
				const next = createMockNext()
				const middleware = requireBuyer()

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should deny viewer', async () => {
				const c = createMockContext('viewer')
				const next = createMockNext()
				const middleware = requireBuyer()

				const result = await middleware(c as any, next)

				expect(result.status).toBe(403)
			})
		})

		describe('requireViewer()', () => {
			it('should allow viewer', async () => {
				const c = createMockContext('viewer')
				const next = createMockNext()
				const middleware = requireViewer()

				await middleware(c as any, next)

				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should deny noaccess', async () => {
				const c = createMockContext('noaccess')
				const next = createMockNext()
				const middleware = requireViewer()

				const result = await middleware(c as any, next)

				expect(result.status).toBe(403)
			})
		})
	})

	/**
	 * Feature: Helper Functions
	 */
	describe('Helper Functions', () => {
		describe('hasRole()', () => {
			it('should return true when user has exact required role', () => {
				expect(hasRole('admin', 'admin')).toBe(true)
			})

			it('should return true when user has higher role than required', () => {
				expect(hasRole('owner', 'admin')).toBe(true)
				expect(hasRole('admin', 'member')).toBe(true)
				expect(hasRole('member', 'viewer')).toBe(true)
			})

			it('should return false when user has lower role than required', () => {
				expect(hasRole('viewer', 'admin')).toBe(false)
				expect(hasRole('member', 'owner')).toBe(false)
				expect(hasRole('buyer', 'member')).toBe(false)
			})

			it('should return false when user role is undefined', () => {
				expect(hasRole(undefined, 'viewer')).toBe(false)
			})

			it('should return false for noaccess role', () => {
				expect(hasRole('noaccess', 'viewer')).toBe(false)
			})

			it('should work for all role combinations', () => {
				const roles: Role[] = ['owner', 'admin', 'member', 'buyer', 'viewer', 'noaccess']

				for (const userRole of roles) {
					for (const requiredRole of roles) {
						const expected = ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
						expect(hasRole(userRole, requiredRole)).toBe(expected)
					}
				}
			})
		})

		describe('getRoleLevel()', () => {
			it('should return correct level for each role', () => {
				expect(getRoleLevel('owner')).toBe(5)
				expect(getRoleLevel('admin')).toBe(4)
				expect(getRoleLevel('member')).toBe(3)
				expect(getRoleLevel('buyer')).toBe(2)
				expect(getRoleLevel('viewer')).toBe(1)
				expect(getRoleLevel('noaccess')).toBe(0)
			})

			it('should return 0 for unknown role (defensive)', () => {
				// This tests the fallback behavior
				expect(getRoleLevel('unknown' as Role)).toBe(0)
			})
		})
	})

	/**
	 * Feature: Multi-Account Switching
	 *
	 * Scenario: Multi-account access works correctly
	 *   Given a user with access to multiple accounts
	 *   When switching accounts
	 *   Then resources are scoped correctly
	 *
	 * Note: This tests that the role system works independently per-account
	 * The actual multi-account switching is handled by account context middleware
	 */
	describe('Multi-Account Role Isolation', () => {
		it('should use role from current account context only', async () => {
			// User is admin in Account A
			const contextAccountA = createMockContext('admin')
			const nextA = createMockNext()
			const middleware = requireRole('admin')

			await middleware(contextAccountA as any, nextA)
			expect(nextA).toHaveBeenCalledTimes(1)

			// Same user is only viewer in Account B
			const contextAccountB = createMockContext('viewer')
			const nextB = createMockNext()

			const result = await middleware(contextAccountB as any, nextB)
			expect(result.status).toBe(403)
			expect(nextB).not.toHaveBeenCalled()
		})

		it('should correctly scope permission checks to current context', () => {
			// Test that hasRole checks are stateless and context-specific
			// Admin in one context
			expect(hasRole('admin', 'admin')).toBe(true)

			// Different role in same check should give different result
			expect(hasRole('viewer', 'admin')).toBe(false)
		})
	})
})
