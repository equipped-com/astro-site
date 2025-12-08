/**
 * Tests for Tenant Context Helper
 *
 * @REQ-MT-006 All queries scoped to current tenant
 * @REQ-MT-007 Inserts automatically include account_id
 * @REQ-MT-008 Cross-tenant query blocked
 * @REQ-MT-009 Global queries require sys_admin
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Role, User } from '../api/middleware'
import type { Account } from './tenant-context'
import { getTenantContext, tryGetTenantContext } from './tenant-context'

// Mock Hono context
function createMockContext(overrides?: {
	account?: Account
	accountId?: string
	user?: User
	userId?: string
	role?: Role
}) {
	const values = new Map<string, unknown>()

	// Set defaults
	if (overrides?.account) values.set('account', overrides.account)
	if (overrides?.accountId) values.set('accountId', overrides.accountId)
	if (overrides?.user) values.set('user', overrides.user)
	if (overrides?.userId) values.set('userId', overrides.userId)
	if (overrides?.role) values.set('role', overrides.role)

	return {
		get: (key: string) => values.get(key),
		set: (key: string, value: unknown) => values.set(key, value),
	} as any
}

describe('getTenantContext', () => {
	const mockAccount: Account = {
		id: 'acct_acme',
		short_name: 'acme',
		name: 'Acme Corporation',
		billing_email: 'billing@acme.com',
		created_at: '2024-01-01T00:00:00Z',
	}

	const mockUser: User = {
		id: 'user_alice',
		email: 'alice@acme.com',
		first_name: 'Alice',
		last_name: 'Smith',
	}

	describe('Feature: Tenant Data Isolation', () => {
		/**
		 * @REQ-MT-006
		 * Scenario: All queries scoped to current tenant
		 */
		it('should return tenant context when account is present', () => {
			// Given I am authenticated as user in Account "acme"
			const context = createMockContext({
				account: mockAccount,
				accountId: mockAccount.id,
				user: mockUser,
				userId: mockUser.id,
				role: 'member' as Role,
			})

			// When I get the tenant context
			const tenant = getTenantContext(context)

			// Then the context should include the account ID
			expect(tenant.accountId).toBe('acct_acme')
			expect(tenant.account).toEqual(mockAccount)
			expect(tenant.userId).toBe('user_alice')
			expect(tenant.user).toEqual(mockUser)
			expect(tenant.role).toBe('member')
		})

		/**
		 * @REQ-MT-009
		 * Scenario: Global queries require sys_admin
		 */
		it('should throw error when no tenant context is available', () => {
			// Given I am NOT in a tenant context
			const context = createMockContext({})

			// When I attempt to get tenant context
			// Then it should fail with "Tenant context required"
			expect(() => getTenantContext(context)).toThrow('Tenant context required')
		})

		it('should throw error when account is missing', () => {
			// Given account is undefined
			const context = createMockContext({
				accountId: 'acct_acme',
				// account is missing
			})

			// When I attempt to get tenant context
			// Then it should fail
			expect(() => getTenantContext(context)).toThrow('Tenant context required')
		})

		it('should throw error when accountId is missing', () => {
			// Given accountId is undefined
			const context = createMockContext({
				account: mockAccount,
				// accountId is missing
			})

			// When I attempt to get tenant context
			// Then it should fail
			expect(() => getTenantContext(context)).toThrow('Tenant context required')
		})

		it('should work without user context (unauthenticated routes)', () => {
			// Given tenant context exists but no user
			const context = createMockContext({
				account: mockAccount,
				accountId: mockAccount.id,
				// No user context
			})

			// When I get the tenant context
			const tenant = getTenantContext(context)

			// Then it should return tenant data without user
			expect(tenant.accountId).toBe('acct_acme')
			expect(tenant.account).toEqual(mockAccount)
			expect(tenant.userId).toBeUndefined()
			expect(tenant.user).toBeUndefined()
			expect(tenant.role).toBeUndefined()
		})
	})
})

describe('tryGetTenantContext', () => {
	const mockAccount: Account = {
		id: 'acct_acme',
		short_name: 'acme',
		name: 'Acme Corporation',
		created_at: '2024-01-01T00:00:00Z',
	}

	const mockUser: User = {
		id: 'user_alice',
		email: 'alice@acme.com',
		first_name: 'Alice',
		last_name: 'Smith',
	}

	it('should return tenant context when available', () => {
		// Given tenant context exists
		const context = createMockContext({
			account: mockAccount,
			accountId: mockAccount.id,
			user: mockUser,
			userId: mockUser.id,
			role: 'admin' as Role,
		})

		// When I try to get tenant context
		const tenant = tryGetTenantContext(context)

		// Then it should return the context
		expect(tenant).toBeDefined()
		expect(tenant?.accountId).toBe('acct_acme')
		expect(tenant?.account).toEqual(mockAccount)
		expect(tenant?.role).toBe('admin')
	})

	it('should return undefined when no tenant context', () => {
		// Given no tenant context
		const context = createMockContext({})

		// When I try to get tenant context
		const tenant = tryGetTenantContext(context)

		// Then it should return undefined instead of throwing
		expect(tenant).toBeUndefined()
	})

	it('should return undefined when account is missing', () => {
		// Given accountId but no account object
		const context = createMockContext({
			accountId: 'acct_acme',
			// account is missing
		})

		// When I try to get tenant context
		const tenant = tryGetTenantContext(context)

		// Then it should return undefined
		expect(tenant).toBeUndefined()
	})

	it('should return undefined when accountId is missing', () => {
		// Given account but no accountId
		const context = createMockContext({
			account: mockAccount,
			// accountId is missing
		})

		// When I try to get tenant context
		const tenant = tryGetTenantContext(context)

		// Then it should return undefined
		expect(tenant).toBeUndefined()
	})
})
