/**
 * Sys Admin Middleware Tests
 *
 * @REQ-SA-002 Sys admin email domain check
 */

import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkSysAdmin, requireSysAdmin } from './sysadmin'

function createMockContext(overrides: Partial<Context> = {}): Context {
	const mockContext = {
		req: {},
		env: {},
		get: vi.fn(),
		set: vi.fn(),
		json: vi.fn((data, status) => ({ data, status })),
		...overrides,
	} as unknown as Context

	return mockContext
}

describe('Sys Admin Middleware', () => {
	describe('requireSysAdmin()', () => {
		/**
		 * @REQ-SA-002
		 * Scenario: Sys admin email domain check
		 *   Given user has email "staff@tryequipped.com"
		 *   Then user should have sys_admin access
		 */
		it('should allow access for @tryequipped.com email', async () => {
			// Given user with @tryequipped.com email
			const mockClerkClient = {
				users: {
					getUser: vi.fn().mockResolvedValue({
						id: 'user_123',
						emailAddresses: [{ emailAddress: 'staff@tryequipped.com' }],
						firstName: 'Admin',
						lastName: 'User',
					}),
				},
			}

			const mockGetAuth = vi.fn(() => ({
				userId: 'user_123',
				sessionId: 'session_123',
			}))

			vi.doMock('@hono/clerk-auth', () => ({
				getAuth: mockGetAuth,
			}))

			const next = vi.fn()
			const context = createMockContext({
				get: vi.fn(key => {
					if (key === 'clerk') return mockClerkClient
					return undefined
				}),
			})

			// When middleware is called
			const middleware = requireSysAdmin()
			await middleware(context, next)

			// Then access should be granted
			expect(next).toHaveBeenCalled()
			expect(context.set).toHaveBeenCalledWith('sysAdmin', true)
			expect(context.set).toHaveBeenCalledWith('userId', 'user_123')
		})

		/**
		 * @REQ-SA-002
		 * Scenario: Sys admin email domain check
		 *   Given user has email "user@company.com"
		 *   Then user should NOT have sys_admin access
		 */
		it('should deny access for non-admin email domain', async () => {
			// Given user with non-admin email
			const mockClerkClient = {
				users: {
					getUser: vi.fn().mockResolvedValue({
						id: 'user_456',
						emailAddresses: [{ emailAddress: 'user@company.com' }],
					}),
				},
			}

			const mockGetAuth = vi.fn(() => ({
				userId: 'user_456',
				sessionId: 'session_456',
			}))

			vi.doMock('@hono/clerk-auth', () => ({
				getAuth: mockGetAuth,
			}))

			const next = vi.fn()
			const context = createMockContext({
				get: vi.fn(key => {
					if (key === 'clerk') return mockClerkClient
					return undefined
				}),
			})

			// When middleware is called
			const middleware = requireSysAdmin()
			const result = await middleware(context, next)

			// Then access should be denied
			expect(next).not.toHaveBeenCalled()
			expect(result).toBeDefined()
			expect(context.json).toHaveBeenCalledWith(
				{
					error: 'Forbidden',
					message: 'System administrator access required',
				},
				403,
			)
		})

		it('should allow access for @getupgraded.com email', async () => {
			const mockClerkClient = {
				users: {
					getUser: vi.fn().mockResolvedValue({
						id: 'user_789',
						emailAddresses: [{ emailAddress: 'admin@getupgraded.com' }],
						firstName: 'Upgraded',
						lastName: 'Admin',
					}),
				},
			}

			const mockGetAuth = vi.fn(() => ({
				userId: 'user_789',
				sessionId: 'session_789',
			}))

			vi.doMock('@hono/clerk-auth', () => ({
				getAuth: mockGetAuth,
			}))

			const next = vi.fn()
			const context = createMockContext({
				get: vi.fn(key => {
					if (key === 'clerk') return mockClerkClient
					return undefined
				}),
			})

			const middleware = requireSysAdmin()
			await middleware(context, next)

			expect(next).toHaveBeenCalled()
			expect(context.set).toHaveBeenCalledWith('sysAdmin', true)
		})

		it('should allow access for @cogzero.com email', async () => {
			const mockClerkClient = {
				users: {
					getUser: vi.fn().mockResolvedValue({
						id: 'user_999',
						emailAddresses: [{ emailAddress: 'staff@cogzero.com' }],
						firstName: 'Cog',
						lastName: 'Admin',
					}),
				},
			}

			const mockGetAuth = vi.fn(() => ({
				userId: 'user_999',
				sessionId: 'session_999',
			}))

			vi.doMock('@hono/clerk-auth', () => ({
				getAuth: mockGetAuth,
			}))

			const next = vi.fn()
			const context = createMockContext({
				get: vi.fn(key => {
					if (key === 'clerk') return mockClerkClient
					return undefined
				}),
			})

			const middleware = requireSysAdmin()
			await middleware(context, next)

			expect(next).toHaveBeenCalled()
			expect(context.set).toHaveBeenCalledWith('sysAdmin', true)
		})

		it('should return 401 if no authentication', async () => {
			const mockGetAuth = vi.fn(() => ({ userId: null }))

			vi.doMock('@hono/clerk-auth', () => ({
				getAuth: mockGetAuth,
			}))

			const next = vi.fn()
			const context = createMockContext()

			const middleware = requireSysAdmin()
			const result = await middleware(context, next)

			expect(next).not.toHaveBeenCalled()
			expect(context.json).toHaveBeenCalledWith(
				{
					error: 'Unauthorized',
					message: 'Authentication required',
				},
				401,
			)
		})
	})

	describe('checkSysAdmin()', () => {
		it('should return true for admin email domain', async () => {
			const mockClerkClient = {
				users: {
					getUser: vi.fn().mockResolvedValue({
						id: 'user_123',
						emailAddresses: [{ emailAddress: 'staff@tryequipped.com' }],
					}),
				},
			}

			const mockGetAuth = vi.fn(() => ({
				userId: 'user_123',
				sessionId: 'session_123',
			}))

			vi.doMock('@hono/clerk-auth', () => ({
				getAuth: mockGetAuth,
			}))

			const context = createMockContext({
				get: vi.fn(key => {
					if (key === 'clerk') return mockClerkClient
					return undefined
				}),
			})

			const result = await checkSysAdmin(context)

			expect(result).toBe(true)
		})

		it('should return false for non-admin email domain', async () => {
			const mockClerkClient = {
				users: {
					getUser: vi.fn().mockResolvedValue({
						id: 'user_456',
						emailAddresses: [{ emailAddress: 'user@company.com' }],
					}),
				},
			}

			const mockGetAuth = vi.fn(() => ({
				userId: 'user_456',
				sessionId: 'session_456',
			}))

			vi.doMock('@hono/clerk-auth', () => ({
				getAuth: mockGetAuth,
			}))

			const context = createMockContext({
				get: vi.fn(key => {
					if (key === 'clerk') return mockClerkClient
					return undefined
				}),
			})

			const result = await checkSysAdmin(context)

			expect(result).toBe(false)
		})

		it('should return false if no authentication', async () => {
			const mockGetAuth = vi.fn(() => ({ userId: null }))

			vi.doMock('@hono/clerk-auth', () => ({
				getAuth: mockGetAuth,
			}))

			const context = createMockContext()

			const result = await checkSysAdmin(context)

			expect(result).toBe(false)
		})
	})
})
