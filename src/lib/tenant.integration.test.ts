/**
 * Multi-Tenant Isolation Integration Tests
 *
 * Tests that verify tenant isolation across the entire stack:
 * - Middleware sets correct account context
 * - API endpoints only return tenant-scoped data
 * - Cross-tenant access is blocked
 *
 * @REQ-INT-MT-001 Multi-tenant isolation verified
 * @REQ-INT-MT-002 Two accounts cannot see each other's data
 * @REQ-INT-MT-003 Tenant context propagates through request lifecycle
 *
 * @vitest-environment node
 */

import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireTenant, tenantMiddleware } from '@/api/middleware/tenant'

// Mock D1 database types
interface MockD1PreparedStatement {
	bind: (...values: unknown[]) => MockD1PreparedStatement
	run: () => Promise<{ results: unknown[]; success: boolean; meta: { changes?: number } }>
	first: <T>() => Promise<T | null>
	all: () => Promise<{ results: unknown[] }>
}

interface MockD1Database {
	prepare: (query: string) => MockD1PreparedStatement
}

// Test accounts for multi-tenant scenarios
const ACCOUNT_A = {
	id: 'acct_alpha',
	short_name: 'alpha',
	name: 'Alpha Corporation',
	billing_email: 'billing@alpha.com',
	created_at: '2024-01-01T00:00:00Z',
}

const ACCOUNT_B = {
	id: 'acct_beta',
	short_name: 'beta',
	name: 'Beta Enterprises',
	billing_email: 'billing@beta.com',
	created_at: '2024-01-01T00:00:00Z',
}

// Test devices for each account
const DEVICES_ACCOUNT_A = [
	{
		id: 'dev_a1',
		account_id: 'acct_alpha',
		name: 'MacBook Pro (Alpha)',
		type: 'laptop',
		model: 'MacBook Pro 14"',
		status: 'available',
		created_at: '2024-12-01T00:00:00Z',
	},
	{
		id: 'dev_a2',
		account_id: 'acct_alpha',
		name: 'iPhone 15 (Alpha)',
		type: 'phone',
		model: 'iPhone 15 Pro',
		status: 'assigned',
		created_at: '2024-12-02T00:00:00Z',
	},
]

const DEVICES_ACCOUNT_B = [
	{
		id: 'dev_b1',
		account_id: 'acct_beta',
		name: 'Dell XPS (Beta)',
		type: 'laptop',
		model: 'Dell XPS 15',
		status: 'available',
		created_at: '2024-12-01T00:00:00Z',
	},
]

/**
 * Create a mock database with sequential responses
 */
function createMockDb(options: { firstResponses: (unknown | null)[]; allResponses?: unknown[][] }) {
	let firstCallIndex = 0
	let allCallIndex = 0

	const mockStatement: MockD1PreparedStatement = {
		bind: vi.fn().mockReturnThis(),
		run: vi.fn().mockResolvedValue({ results: [], success: true, meta: { changes: 1 } }),
		first: vi.fn().mockImplementation(async () => {
			const response = options.firstResponses[firstCallIndex]
			firstCallIndex++
			return response ?? null
		}),
		all: vi.fn().mockImplementation(async () => {
			const response = options.allResponses?.[allCallIndex] ?? []
			allCallIndex++
			return { results: response }
		}),
	}

	return {
		prepare: vi.fn().mockReturnValue(mockStatement),
		_mockStatement: mockStatement,
	}
}

// Create a test app that simulates full stack integration
function createIntegrationApp(mockDb: MockD1Database) {
	const app = new Hono<{
		Bindings: { DB: MockD1Database }
		Variables: {
			accountId?: string
			account?: typeof ACCOUNT_A
			subdomain?: string
			isReservedSubdomain?: boolean
		}
	}>()

	// IMPORTANT: Inject mock DB BEFORE tenant middleware (so DB is available for tenant lookup)
	app.use('*', async (c, next) => {
		// @ts-expect-error - we're mocking env for tests
		c.env = { DB: mockDb }
		return next()
	})

	// Apply tenant middleware
	app.use('*', tenantMiddleware())

	// API routes that require tenant context
	app.get('/api/devices', requireTenant(), async c => {
		const accountId = c.get('accountId')
		const result = await c.env.DB.prepare('SELECT * FROM devices WHERE account_id = ?').bind(accountId).all()
		return c.json({ devices: result.results, total: result.results.length })
	})

	app.get('/api/devices/:id', requireTenant(), async c => {
		const accountId = c.get('accountId')
		const id = c.req.param('id')
		const device = await c.env.DB.prepare('SELECT * FROM devices WHERE id = ? AND account_id = ?')
			.bind(id, accountId)
			.first()
		if (!device) {
			return c.json({ error: 'Device not found' }, 404)
		}
		return c.json({ device })
	})

	return app
}

describe('Multi-Tenant Isolation Integration Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * Feature: Multi-Tenant Data Isolation
	 *
	 * @REQ-INT-MT-001
	 * Scenario: Multi-tenant isolation
	 *   Given two different accounts
	 *   When user from account A queries devices
	 *   Then only account A devices are returned
	 *   And account B devices are never visible
	 */
	describe('@REQ-INT-MT-001: Multi-tenant isolation', () => {
		it('should only return devices for Account A when accessed via alpha subdomain', async () => {
			// Given: Two different accounts (A and B) with their own devices
			// first() calls: 1) Account lookup
			const mockDb = createMockDb({
				firstResponses: [ACCOUNT_A],
				allResponses: [DEVICES_ACCOUNT_A],
			})

			const app = createIntegrationApp(mockDb)

			// When: User from account A queries devices via alpha subdomain
			const res = await app.request('/api/devices', {
				headers: { host: 'alpha.tryequipped.com' },
			})

			// Then: Only account A devices are returned
			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.devices).toHaveLength(2)
			expect(data.devices.every((d: { account_id: string }) => d.account_id === 'acct_alpha')).toBe(true)

			// And: Account B devices are never visible
			expect(data.devices.some((d: { account_id: string }) => d.account_id === 'acct_beta')).toBe(false)
		})

		it('should only return devices for Account B when accessed via beta subdomain', async () => {
			// Given: Two different accounts (A and B) with their own devices
			const mockDb = createMockDb({
				firstResponses: [ACCOUNT_B],
				allResponses: [DEVICES_ACCOUNT_B],
			})

			const app = createIntegrationApp(mockDb)

			// When: User from account B queries devices via beta subdomain
			const res = await app.request('/api/devices', {
				headers: { host: 'beta.tryequipped.com' },
			})

			// Then: Only account B devices are returned
			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.devices).toHaveLength(1)
			expect(data.devices.every((d: { account_id: string }) => d.account_id === 'acct_beta')).toBe(true)

			// And: Account A devices are never visible
			expect(data.devices.some((d: { account_id: string }) => d.account_id === 'acct_alpha')).toBe(false)
		})
	})

	/**
	 * @REQ-INT-MT-002
	 * Scenario: Cross-tenant access blocked
	 *   Given user is authenticated in Account A
	 *   When user tries to access device from Account B
	 *   Then 404 is returned (device not found in their scope)
	 */
	describe('@REQ-INT-MT-002: Cross-tenant access is blocked', () => {
		it("should return 404 when Account A tries to access Account B's device", async () => {
			// Given: User is authenticated in Account A
			// first() calls: 1) Account lookup, 2) Device lookup (not found)
			const mockDb = createMockDb({
				firstResponses: [ACCOUNT_A, null],
			})

			const app = createIntegrationApp(mockDb)

			// When: Account A user tries to access Account B's device (dev_b1)
			const res = await app.request('/api/devices/dev_b1', {
				headers: { host: 'alpha.tryequipped.com' },
			})

			// Then: 404 is returned (device not found in their scope)
			expect(res.status).toBe(404)
			const data = await res.json()
			expect(data.error).toBe('Device not found')
		})

		it('should scope device queries by account_id', async () => {
			// Given: User is in Account A context
			const mockDb = createMockDb({
				firstResponses: [ACCOUNT_A, DEVICES_ACCOUNT_A[0]],
			})

			const app = createIntegrationApp(mockDb)

			// When: User queries a specific device
			await app.request('/api/devices/dev_a1', {
				headers: { host: 'alpha.tryequipped.com' },
			})

			// Then: Query includes account_id filter
			expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('account_id'))
		})
	})

	/**
	 * @REQ-INT-MT-003
	 * Scenario: Tenant context propagates correctly
	 *   Given a request to alpha.tryequipped.com
	 *   When tenant middleware processes the request
	 *   Then account context is set correctly
	 *   And downstream handlers can access the context
	 */
	describe('@REQ-INT-MT-003: Tenant context propagation', () => {
		it('should propagate tenant context through request lifecycle', async () => {
			// Given: Request to alpha.tryequipped.com
			const mockDb = createMockDb({
				firstResponses: [ACCOUNT_A],
			})

			const app = new Hono<{
				Bindings: { DB: MockD1Database }
				Variables: { accountId?: string; account?: typeof ACCOUNT_A }
			}>()

			// Inject mock DB first
			app.use('*', async (c, next) => {
				// @ts-expect-error - mocking env for tests
				c.env = { DB: mockDb }
				return next()
			})

			// Apply tenant middleware
			app.use('*', tenantMiddleware())

			// Custom route that verifies context
			app.get('/api/context-check', c => {
				const capturedAccountId = c.get('accountId')
				const capturedAccount = c.get('account')
				return c.json({ accountId: capturedAccountId, account: capturedAccount })
			})

			// When: Request is processed
			const res = await app.request('/api/context-check', {
				headers: { host: 'alpha.tryequipped.com' },
			})

			// Then: Account context is set correctly
			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.accountId).toBe('acct_alpha')
			expect(data.account.short_name).toBe('alpha')
		})

		it('should isolate contexts between concurrent requests', async () => {
			// Given: Two concurrent requests to different accounts
			const mockDbAlpha = createMockDb({
				firstResponses: [ACCOUNT_A],
			})

			const mockDbBeta = createMockDb({
				firstResponses: [ACCOUNT_B],
			})

			// Create apps for each tenant
			const appAlpha = new Hono<{
				Bindings: { DB: MockD1Database }
				Variables: { accountId?: string; account?: typeof ACCOUNT_A }
			}>()
			appAlpha.use('*', async (c, next) => {
				// @ts-expect-error - mocking env for tests
				c.env = { DB: mockDbAlpha }
				return next()
			})
			appAlpha.use('*', tenantMiddleware())
			appAlpha.get('/', c => c.json({ accountId: c.get('accountId') }))

			const appBeta = new Hono<{
				Bindings: { DB: MockD1Database }
				Variables: { accountId?: string; account?: typeof ACCOUNT_B }
			}>()
			appBeta.use('*', async (c, next) => {
				// @ts-expect-error - mocking env for tests
				c.env = { DB: mockDbBeta }
				return next()
			})
			appBeta.use('*', tenantMiddleware())
			appBeta.get('/', c => c.json({ accountId: c.get('accountId') }))

			// When: Both requests are processed concurrently
			const [resAlpha, resBeta] = await Promise.all([
				appAlpha.request('/', { headers: { host: 'alpha.tryequipped.com' } }),
				appBeta.request('/', { headers: { host: 'beta.tryequipped.com' } }),
			])

			// Then: Each has the correct isolated context
			const dataAlpha = await resAlpha.json()
			const dataBeta = await resBeta.json()

			expect(dataAlpha.accountId).toBe('acct_alpha')
			expect(dataBeta.accountId).toBe('acct_beta')
		})
	})

	describe('Error Handling', () => {
		it('should return 404 for unknown tenant subdomain', async () => {
			// Given: Unknown subdomain
			const mockDb = createMockDb({
				firstResponses: [null],
			})

			const app = new Hono<{ Bindings: { DB: MockD1Database } }>()

			// Apply tenant middleware
			app.use('*', tenantMiddleware())
			app.get('/', c => c.json({ ok: true }))

			// When: Accessing unknown tenant - pass env via third arg
			const res = await app.request('/', { headers: { host: 'nonexistent.tryequipped.com' } }, { DB: mockDb })

			// Then: 404 is returned
			expect(res.status).toBe(404)
			const data = await res.json()
			expect(data.error).toBe('Account not found')
		})

		it('should return 400 when API requires tenant but none provided', async () => {
			// Given: Request to root domain (no subdomain)
			const mockDb = createMockDb({ firstResponses: [] })

			const app = new Hono<{
				Bindings: { DB: MockD1Database }
				Variables: { accountId?: string }
			}>()
			app.use('*', async (c, next) => {
				// @ts-expect-error - mocking env for tests
				c.env = { DB: mockDb }
				return next()
			})
			app.use('*', tenantMiddleware())
			app.get('/api/devices', requireTenant(), c => c.json({ ok: true }))

			// When: Accessing API without tenant context
			const res = await app.request('/api/devices', {
				headers: { host: 'tryequipped.com' },
			})

			// Then: 400 is returned
			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('Account context required')
		})
	})
})
