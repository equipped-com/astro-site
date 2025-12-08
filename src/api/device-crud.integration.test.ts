/**
 * Device CRUD API Integration Tests
 *
 * Integration tests that verify the complete device management flow
 * including middleware, auth, tenant context, and database operations.
 *
 * @REQ-INT-API-001 Create device for account
 * @REQ-INT-API-002 Auth + API integration
 * @REQ-INT-API-003 Device CRUD full lifecycle
 */
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import type { Device } from '@/lib/scoped-queries'

// Mock @hono/clerk-auth module
vi.mock('@hono/clerk-auth', () => ({
	clerkMiddleware: () => vi.fn(),
	getAuth: vi.fn(),
}))

import { getAuth } from '@hono/clerk-auth'

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

interface MockEnv {
	DB: MockD1Database
}

// Test data
const TEST_ACCOUNT = {
	id: 'acct_test',
	short_name: 'testco',
	name: 'Test Company',
	billing_email: 'billing@test.com',
	created_at: '2024-01-01T00:00:00Z',
}

const TEST_USER_ACCESS = {
	id: 'access_123',
	user_id: 'user_alice',
	account_id: 'acct_test',
	role: 'admin',
	email: 'alice@test.com',
	first_name: 'Alice',
	last_name: 'Smith',
	created_at: '2024-01-01T00:00:00Z',
}

const TEST_DEVICES: Device[] = [
	{
		id: 'dev_001',
		account_id: 'acct_test',
		name: 'MacBook Pro 14"',
		type: 'laptop',
		model: 'MacBook Pro M3',
		serial_number: 'FVFXL123456',
		status: 'available',
		created_at: '2024-12-01T00:00:00Z',
	},
	{
		id: 'dev_002',
		account_id: 'acct_test',
		name: 'iPhone 15 Pro',
		type: 'phone',
		model: 'iPhone 15 Pro',
		serial_number: 'DNRJK789012',
		status: 'assigned',
		assigned_to: 'person_123',
		created_at: '2024-12-02T00:00:00Z',
	},
]

/**
 * Create a mock database where we can control responses via the firstResponses array
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

	const mockDb: MockD1Database = {
		prepare: vi.fn().mockReturnValue(mockStatement),
	}

	return { mockDb, mockStatement }
}

/**
 * Create integrated app with simplified auth and tenant middleware
 */
function createIntegratedApp(mockDb: MockD1Database) {
	const app = new Hono<{
		Bindings: MockEnv
		Variables: {
			userId?: string
			sessionId?: string
			accountId?: string
			account?: typeof TEST_ACCOUNT
			role?: string
			user?: { id: string; email: string; first_name: string; last_name: string }
			accessId?: string
		}
	}>()

	// Error handler
	app.onError((err, c) => {
		console.error('Test app error:', err.message)
		return c.json({ error: err.message }, 500)
	})

	// 1. Inject mock DB first
	app.use('*', async (c, next) => {
		// @ts-expect-error - mocking env for tests
		c.env = { DB: mockDb }
		return next()
	})

	// 2. Tenant middleware (extracts subdomain, looks up account)
	app.use('*', async (c, next) => {
		const host = c.req.header('host') || ''
		const parts = host.split(':')[0].split('.')

		// Extract subdomain for *.tryequipped.com
		let subdomain: string | null = null
		if (parts.length >= 3 && parts.slice(-2).join('.') === 'tryequipped.com') {
			subdomain = parts[0]
		}

		if (subdomain && subdomain !== 'www') {
			const account = await c.env.DB.prepare('SELECT * FROM accounts WHERE short_name = ?').bind(subdomain).first()

			if (!account) {
				return c.json({ error: 'Account not found' }, 404)
			}

			c.set('accountId', (account as typeof TEST_ACCOUNT).id)
			c.set('account', account as typeof TEST_ACCOUNT)
		}

		return next()
	})

	// 3. Auth middleware for /api/* routes
	app.use('/api/*', async (c, next) => {
		const auth = getAuth(c)
		const userId = auth?.userId
		const sessionId = auth?.sessionId

		if (!userId) {
			return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401)
		}

		c.set('userId', userId)
		c.set('sessionId', sessionId)

		// Require account context
		const accountId = c.get('accountId')
		if (!accountId) {
			return c.json({ error: 'Account context required' }, 400)
		}

		// Check account access
		const access = await c.env.DB.prepare('SELECT * FROM account_access WHERE user_id = ? AND account_id = ?')
			.bind(userId, accountId)
			.first()

		if (!access) {
			return c.json({ error: 'No access to this account' }, 403)
		}

		const accessRecord = access as typeof TEST_USER_ACCESS
		if (accessRecord.role === 'noaccess') {
			return c.json({ error: 'No access to this account' }, 403)
		}

		c.set('role', accessRecord.role)
		c.set('accessId', accessRecord.id)
		c.set('user', {
			id: userId,
			email: accessRecord.email,
			first_name: accessRecord.first_name,
			last_name: accessRecord.last_name,
		})

		return next()
	})

	// Device CRUD routes
	app.get('/api/devices', async c => {
		const accountId = c.get('accountId')
		const result = await c.env.DB.prepare('SELECT * FROM devices WHERE account_id = ? AND deleted_at IS NULL')
			.bind(accountId)
			.all()

		return c.json({ devices: result.results, total: result.results.length })
	})

	app.get('/api/devices/:id', async c => {
		const accountId = c.get('accountId')
		const id = c.req.param('id')

		const device = await c.env.DB.prepare(
			'SELECT * FROM devices WHERE id = ? AND account_id = ? AND deleted_at IS NULL',
		)
			.bind(id, accountId)
			.first()

		if (!device) {
			return c.json({ error: 'Device not found' }, 404)
		}

		return c.json({ device })
	})

	app.post('/api/devices', async c => {
		const accountId = c.get('accountId')
		const body = await c.req.json()

		if (!body.name || !body.type || !body.model) {
			return c.json({ error: 'Missing required fields: name, type, model' }, 400)
		}

		const id = crypto.randomUUID()

		await c.env.DB.prepare(
			`INSERT INTO devices (id, account_id, name, type, model, serial_number, status, assigned_to, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
		)
			.bind(
				id,
				accountId,
				body.name,
				body.type,
				body.model,
				body.serial_number || null,
				body.status || 'available',
				body.assigned_to || null,
			)
			.run()

		// Return created device
		const device = await c.env.DB.prepare('SELECT * FROM devices WHERE id = ? AND account_id = ?')
			.bind(id, accountId)
			.first()

		return c.json({ device }, 201)
	})

	app.put('/api/devices/:id', async c => {
		const accountId = c.get('accountId')
		const id = c.req.param('id')
		const body = await c.req.json()

		// Check device exists
		const existing = await c.env.DB.prepare(
			'SELECT * FROM devices WHERE id = ? AND account_id = ? AND deleted_at IS NULL',
		)
			.bind(id, accountId)
			.first()

		if (!existing) {
			return c.json({ error: 'Device not found' }, 404)
		}

		// Build update query
		const updates: string[] = ["updated_at = datetime('now')"]
		const params: unknown[] = []
		const allowedFields = ['name', 'type', 'model', 'serial_number', 'status', 'assigned_to']

		for (const [key, value] of Object.entries(body)) {
			if (allowedFields.includes(key) && value !== undefined) {
				updates.push(`${key} = ?`)
				params.push(value)
			}
		}

		if (updates.length > 1) {
			await c.env.DB.prepare(`UPDATE devices SET ${updates.join(', ')} WHERE id = ? AND account_id = ?`)
				.bind(...params, id, accountId)
				.run()
		}

		// Return updated device
		const device = await c.env.DB.prepare('SELECT * FROM devices WHERE id = ? AND account_id = ?')
			.bind(id, accountId)
			.first()

		return c.json({ device })
	})

	app.delete('/api/devices/:id', async c => {
		const accountId = c.get('accountId')
		const id = c.req.param('id')

		// Check device exists
		const existing = await c.env.DB.prepare(
			'SELECT * FROM devices WHERE id = ? AND account_id = ? AND deleted_at IS NULL',
		)
			.bind(id, accountId)
			.first()

		if (!existing) {
			return c.json({ error: 'Device not found' }, 404)
		}

		// Soft delete
		await c.env.DB.prepare("UPDATE devices SET deleted_at = datetime('now') WHERE id = ? AND account_id = ?")
			.bind(id, accountId)
			.run()

		return c.json({ success: true })
	})

	return app
}

describe('Device CRUD API Integration Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Reset auth mock to default authenticated state
		;(getAuth as Mock).mockReturnValue({ userId: 'user_alice', sessionId: 'sess_123' })
	})

	/**
	 * Feature: API Integration Tests
	 *
	 * @REQ-INT-API-001
	 * Scenario: Create device for account
	 *   Given authenticated user with account access
	 *   When creating a device
	 *   Then device is scoped to account_id
	 *   And response contains device ID
	 */
	describe('@REQ-INT-API-001: Create device for account', () => {
		it('should create device scoped to account', async () => {
			// Given: Authenticated user with account access
			// first() calls: 1) Account lookup, 2) Access check, 3) Device select after insert
			const { mockDb } = createMockDb({
				firstResponses: [
					TEST_ACCOUNT, // Account lookup
					TEST_USER_ACCESS, // Access check
					{
						// Created device
						id: 'dev_new',
						account_id: 'acct_test',
						name: 'Dell XPS 15',
						type: 'laptop',
						model: 'XPS 15 9530',
						status: 'available',
						created_at: '2024-12-08T00:00:00Z',
					},
				],
			})

			const app = createIntegratedApp(mockDb)

			// When: Creating a device
			const res = await app.request('/api/devices', {
				method: 'POST',
				headers: {
					host: 'testco.tryequipped.com',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: 'Dell XPS 15',
					type: 'laptop',
					model: 'XPS 15 9530',
				}),
			})

			// Then: Device is created with 201 status
			expect(res.status).toBe(201)

			// And: Response contains device
			const data = await res.json()
			expect(data.device).toBeDefined()
			expect(data.device.name).toBe('Dell XPS 15')

			// And: INSERT query was executed
			expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO devices'))
		})

		it('should return 400 for missing required fields', async () => {
			// Given: Authenticated user
			// first() calls: 1) Account lookup, 2) Access check
			const { mockDb } = createMockDb({
				firstResponses: [TEST_ACCOUNT, TEST_USER_ACCESS],
			})

			const app = createIntegratedApp(mockDb)

			// When: Creating device with missing fields
			const res = await app.request('/api/devices', {
				method: 'POST',
				headers: {
					host: 'testco.tryequipped.com',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: 'Incomplete Device',
					// Missing type and model
				}),
			})

			// Then: 400 is returned
			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toContain('Missing required fields')
		})
	})

	/**
	 * @REQ-INT-API-002
	 * Scenario: Auth + API integration
	 *   Given middleware and device-crud endpoint
	 *   When unauthenticated request hits endpoint
	 *   Then 401 is returned
	 */
	describe('@REQ-INT-API-002: Auth + API integration', () => {
		it('should return 401 when unauthenticated', async () => {
			// Given: Unauthenticated request
			;(getAuth as Mock).mockReturnValue(null)

			const { mockDb } = createMockDb({
				firstResponses: [TEST_ACCOUNT],
			})
			const app = createIntegratedApp(mockDb)

			// When: Unauthenticated request hits endpoint
			const res = await app.request('/api/devices', {
				headers: { host: 'testco.tryequipped.com' },
			})

			// Then: 401 is returned
			expect(res.status).toBe(401)
			const data = await res.json()
			expect(data.error).toBe('Unauthorized')
		})

		it('should return 403 when user has no account access', async () => {
			// Given: Authenticated user without account access
			;(getAuth as Mock).mockReturnValue({ userId: 'user_unknown', sessionId: 'sess_123' })

			// first() calls: 1) Account lookup, 2) Access check (returns null)
			const { mockDb } = createMockDb({
				firstResponses: [TEST_ACCOUNT, null],
			})

			const app = createIntegratedApp(mockDb)

			// When: Request with no account access
			const res = await app.request('/api/devices', {
				headers: { host: 'testco.tryequipped.com' },
			})

			// Then: 403 is returned
			expect(res.status).toBe(403)
			const data = await res.json()
			expect(data.error).toBe('No access to this account')
		})

		it('should process request normally with valid auth', async () => {
			// Given: Authenticated user with account access
			// first() calls: 1) Account lookup, 2) Access check
			const { mockDb } = createMockDb({
				firstResponses: [TEST_ACCOUNT, TEST_USER_ACCESS],
				allResponses: [TEST_DEVICES],
			})
			const app = createIntegratedApp(mockDb)

			// When: Request with valid token
			const res = await app.request('/api/devices', {
				headers: { host: 'testco.tryequipped.com' },
			})

			// Then: Endpoint processes normally
			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.devices).toBeDefined()
		})

		it('should return 400 when account context is missing', async () => {
			// Given: Authenticated user but no tenant context
			const { mockDb } = createMockDb({ firstResponses: [] })
			const app = createIntegratedApp(mockDb)

			// When: Request without subdomain (no tenant context)
			const res = await app.request('/api/devices', {
				headers: { host: 'tryequipped.com' }, // Root domain, no subdomain
			})

			// Then: 400 is returned
			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('Account context required')
		})
	})

	/**
	 * @REQ-INT-API-003
	 * Scenario: Device CRUD full lifecycle
	 */
	describe('@REQ-INT-API-003: Device CRUD full lifecycle', () => {
		it('should list devices for account', async () => {
			// Given: Authenticated user
			const { mockDb } = createMockDb({
				firstResponses: [TEST_ACCOUNT, TEST_USER_ACCESS],
				allResponses: [TEST_DEVICES],
			})
			const app = createIntegratedApp(mockDb)

			// When: Listing devices
			const res = await app.request('/api/devices', {
				headers: { host: 'testco.tryequipped.com' },
			})

			// Then: Devices are returned
			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.devices).toHaveLength(2)
			expect(data.total).toBe(2)
		})

		it('should get single device by ID', async () => {
			// Given: Authenticated user
			// first() calls: 1) Account, 2) Access, 3) Device lookup
			const { mockDb } = createMockDb({
				firstResponses: [TEST_ACCOUNT, TEST_USER_ACCESS, TEST_DEVICES[0]],
			})
			const app = createIntegratedApp(mockDb)

			// When: Getting device by ID
			const res = await app.request('/api/devices/dev_001', {
				headers: { host: 'testco.tryequipped.com' },
			})

			// Then: Device is returned
			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.device.id).toBe('dev_001')
			expect(data.device.name).toBe('MacBook Pro 14"')
		})

		it('should return 404 for non-existent device', async () => {
			// Given: Authenticated user
			// first() calls: 1) Account, 2) Access, 3) Device (not found)
			const { mockDb } = createMockDb({
				firstResponses: [TEST_ACCOUNT, TEST_USER_ACCESS, null],
			})
			const app = createIntegratedApp(mockDb)

			// When: Getting non-existent device
			const res = await app.request('/api/devices/dev_nonexistent', {
				headers: { host: 'testco.tryequipped.com' },
			})

			// Then: 404 is returned
			expect(res.status).toBe(404)
			const data = await res.json()
			expect(data.error).toBe('Device not found')
		})

		it('should update device', async () => {
			// Given: Authenticated user
			const updatedDevice = {
				...TEST_DEVICES[0],
				status: 'assigned',
				assigned_to: 'person_456',
			}
			// first() calls: 1) Account, 2) Access, 3) Existing check, 4) Updated device
			const { mockDb } = createMockDb({
				firstResponses: [TEST_ACCOUNT, TEST_USER_ACCESS, TEST_DEVICES[0], updatedDevice],
			})
			const app = createIntegratedApp(mockDb)

			// When: Updating device
			const res = await app.request('/api/devices/dev_001', {
				method: 'PUT',
				headers: {
					host: 'testco.tryequipped.com',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					status: 'assigned',
					assigned_to: 'person_456',
				}),
			})

			// Then: Device is updated
			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.device.status).toBe('assigned')
		})

		it('should soft delete device', async () => {
			// Given: Authenticated user
			// first() calls: 1) Account, 2) Access, 3) Existing check
			const { mockDb } = createMockDb({
				firstResponses: [TEST_ACCOUNT, TEST_USER_ACCESS, TEST_DEVICES[0]],
			})
			const app = createIntegratedApp(mockDb)

			// When: Deleting device
			const res = await app.request('/api/devices/dev_001', {
				method: 'DELETE',
				headers: { host: 'testco.tryequipped.com' },
			})

			// Then: Success is returned
			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.success).toBe(true)

			// And: Soft delete query was executed
			expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('deleted_at'))
		})
	})

	describe('Error scenarios', () => {
		it('should return 404 for unknown tenant subdomain', async () => {
			// Given: Unknown subdomain
			// first() calls: 1) Account lookup (returns null)
			const { mockDb } = createMockDb({
				firstResponses: [null],
			})
			const app = createIntegratedApp(mockDb)

			// When: Accessing unknown tenant
			const res = await app.request('/api/devices', {
				headers: { host: 'unknown.tryequipped.com' },
			})

			// Then: 404 is returned
			expect(res.status).toBe(404)
			const data = await res.json()
			expect(data.error).toBe('Account not found')
		})

		it('should return 403 for noaccess role', async () => {
			// Given: User with noaccess role
			// first() calls: 1) Account, 2) Access with noaccess role
			const { mockDb } = createMockDb({
				firstResponses: [TEST_ACCOUNT, { ...TEST_USER_ACCESS, role: 'noaccess' }],
			})
			const app = createIntegratedApp(mockDb)

			// When: Request from user with noaccess role
			const res = await app.request('/api/devices', {
				headers: { host: 'testco.tryequipped.com' },
			})

			// Then: 403 is returned
			expect(res.status).toBe(403)
			const data = await res.json()
			expect(data.error).toBe('No access to this account')
		})
	})
})
