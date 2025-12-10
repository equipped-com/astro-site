/**
 * Tests for Scoped Query Helpers
 *
 * @REQ-MT-006 All queries scoped to current tenant
 * @REQ-MT-007 Inserts automatically include account_id
 * @REQ-MT-008 Cross-tenant query blocked
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { scopedQuery } from './scoped-queries'
import type { Account } from './tenant-context'

// Mock D1 database
function createMockD1Database() {
	const mockPreparedStatement = {
		bind: vi.fn().mockReturnThis(),
		all: vi.fn(),
		first: vi.fn(),
		run: vi.fn(),
	}

	return {
		prepare: vi.fn().mockReturnValue(mockPreparedStatement),
		_mockStatement: mockPreparedStatement,
	}
}

// Mock Hono context with tenant
function createMockContext(accountId: string, db: any) {
	const mockAccount: Account = {
		id: accountId,
		short_name: accountId === 'acct_acme' ? 'acme' : 'other',
		name: accountId === 'acct_acme' ? 'Acme Corp' : 'Other Corp',
		created_at: '2024-01-01T00:00:00Z',
	}

	const values = new Map<string, unknown>()
	values.set('account', mockAccount)
	values.set('accountId', accountId)

	return {
		get: (key: string) => values.get(key),
		set: (key: string, value: unknown) => values.set(key, value),
		env: { DB: db },
	} as any
}

describe('scopedQuery - Devices', () => {
	let mockDb: ReturnType<typeof createMockD1Database>

	beforeEach(() => {
		mockDb = createMockD1Database()
	})

	describe('Feature: Tenant Data Isolation', () => {
		/**
		 * @REQ-MT-006
		 * Scenario: All queries scoped to current tenant
		 */
		it('should scope device list query to account', () => {
			// Given I am authenticated as user in Account "acme"
			const context = createMockContext('acct_acme', mockDb)

			// When I query the devices table
			const queries = scopedQuery(context)
			queries.devices.list()

			// Then all queries should include "WHERE account_id = 'acme_id'"
			expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM devices WHERE account_id = ? ORDER BY created_at DESC')
			expect(mockDb._mockStatement.bind).toHaveBeenCalledWith('acct_acme')
		})

		it('should scope device get query to account', () => {
			// Given I am in tenant context for Account "acme"
			const context = createMockContext('acct_acme', mockDb)

			// When I query a specific device
			const queries = scopedQuery(context)
			queries.devices.get('device_123')

			// Then the query should include account_id filter
			expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM devices WHERE id = ? AND account_id = ?')
			expect(mockDb._mockStatement.bind).toHaveBeenCalledWith('device_123', 'acct_acme')
		})

		/**
		 * @REQ-MT-007
		 * Scenario: Inserts automatically include account_id
		 */
		it('should automatically set account_id on device insert', () => {
			// Given I am in tenant context for Account "acme"
			const context = createMockContext('acct_acme', mockDb)

			// When I insert a new device
			const queries = scopedQuery(context)
			queries.devices.insert({
				name: 'MacBook Pro',
				type: 'laptop',
				model: 'M3 Pro',
				serial_number: 'ABC123',
			})

			// Then the device should automatically have account_id set to "acme_id"
			expect(mockDb.prepare).toHaveBeenCalledWith(
				expect.stringContaining(
					'INSERT INTO devices (id, account_id, name, type, model, serial_number, status, assigned_to, created_at)',
				),
			)
			// Second parameter should be account_id
			const bindCall = mockDb._mockStatement.bind.mock.calls[0]
			expect(bindCall[1]).toBe('acct_acme') // account_id is second param
			expect(bindCall[2]).toBe('MacBook Pro') // name
			expect(bindCall[3]).toBe('laptop') // type
		})

		it('should scope device update to account', () => {
			// Given I am in tenant context for Account "acme"
			const context = createMockContext('acct_acme', mockDb)

			// When I update a device
			const queries = scopedQuery(context)
			queries.devices.update('device_123', {
				name: 'Updated Name',
				status: 'in_use',
			})

			// Then the update should be scoped to account
			expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE id = ? AND account_id = ?'))
			// Last two parameters should be device_id and account_id
			const bindCall = mockDb._mockStatement.bind.mock.calls[0]
			const params = bindCall.slice(0) // Get all params
			expect(params[params.length - 2]).toBe('device_123') // id
			expect(params[params.length - 1]).toBe('acct_acme') // account_id
		})

		it('should scope device delete to account', () => {
			// Given I am in tenant context for Account "acme"
			const context = createMockContext('acct_acme', mockDb)

			// When I delete a device
			const queries = scopedQuery(context)
			queries.devices.delete('device_123')

			// Then the delete should be scoped to account
			expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM devices WHERE id = ? AND account_id = ?')
			expect(mockDb._mockStatement.bind).toHaveBeenCalledWith('device_123', 'acct_acme')
		})

		/**
		 * @REQ-MT-008
		 * Scenario: Cross-tenant query blocked
		 */
		it('should prevent cross-tenant access by different account context', () => {
			// Given I am in tenant context for Account "acme"
			const acmeContext = createMockContext('acct_acme', mockDb)

			// When I query devices
			const acmeQueries = scopedQuery(acmeContext)
			acmeQueries.devices.list()

			// Then queries are bound to acme account
			expect(mockDb._mockStatement.bind).toHaveBeenCalledWith('acct_acme')

			// Reset mocks
			vi.clearAllMocks()

			// Given a different account context
			const otherContext = createMockContext('acct_other', mockDb)

			// When that account queries devices
			const otherQueries = scopedQuery(otherContext)
			otherQueries.devices.list()

			// Then queries are bound to different account
			expect(mockDb._mockStatement.bind).toHaveBeenCalledWith('acct_other')
			// And NOT to acme account
			expect(mockDb._mockStatement.bind).not.toHaveBeenCalledWith('acct_acme')
		})
	})
})

describe('scopedQuery - People', () => {
	let mockDb: ReturnType<typeof createMockD1Database>

	beforeEach(() => {
		mockDb = createMockD1Database()
	})

	it('should scope people list query to account', () => {
		const context = createMockContext('acct_acme', mockDb)

		const queries = scopedQuery(context)
		queries.people.list()

		expect(mockDb.prepare).toHaveBeenCalledWith(
			'SELECT * FROM people WHERE account_id = ? ORDER BY last_name, first_name',
		)
		expect(mockDb._mockStatement.bind).toHaveBeenCalledWith('acct_acme')
	})

	it('should scope people get query to account', () => {
		const context = createMockContext('acct_acme', mockDb)

		const queries = scopedQuery(context)
		queries.people.get('person_123')

		expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM people WHERE id = ? AND account_id = ?')
		expect(mockDb._mockStatement.bind).toHaveBeenCalledWith('person_123', 'acct_acme')
	})

	it('should automatically set account_id on person insert', () => {
		const context = createMockContext('acct_acme', mockDb)

		const queries = scopedQuery(context)
		queries.people.insert({
			first_name: 'Alice',
			last_name: 'Smith',
			email: 'alice@acme.com',
			phone: '+1234567890',
		})

		expect(mockDb.prepare).toHaveBeenCalledWith(
			expect.stringContaining(
				'INSERT INTO people (id, account_id, first_name, last_name, email, phone, status, created_at)',
			),
		)
		const bindCall = mockDb._mockStatement.bind.mock.calls[0]
		expect(bindCall[1]).toBe('acct_acme') // account_id is second param
	})

	it('should scope person update to account', () => {
		const context = createMockContext('acct_acme', mockDb)

		const queries = scopedQuery(context)
		queries.people.update('person_123', {
			email: 'newemail@acme.com',
		})

		expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE id = ? AND account_id = ?'))
		const bindCall = mockDb._mockStatement.bind.mock.calls[0]
		const params = bindCall.slice(0)
		expect(params[params.length - 1]).toBe('acct_acme') // account_id is last param
	})

	it('should scope person delete to account', () => {
		const context = createMockContext('acct_acme', mockDb)

		const queries = scopedQuery(context)
		queries.people.delete('person_123')

		expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM people WHERE id = ? AND account_id = ?')
		expect(mockDb._mockStatement.bind).toHaveBeenCalledWith('person_123', 'acct_acme')
	})
})

describe('scopedQuery - Orders', () => {
	let mockDb: ReturnType<typeof createMockD1Database>

	beforeEach(() => {
		mockDb = createMockD1Database()
	})

	it('should scope orders list query to account', () => {
		const context = createMockContext('acct_acme', mockDb)

		const queries = scopedQuery(context)
		queries.orders.list()

		expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM orders WHERE account_id = ? ORDER BY created_at DESC')
		expect(mockDb._mockStatement.bind).toHaveBeenCalledWith('acct_acme')
	})

	it('should scope orders get query to account', () => {
		const context = createMockContext('acct_acme', mockDb)

		const queries = scopedQuery(context)
		queries.orders.get('order_123')

		expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM orders WHERE id = ? AND account_id = ?')
		expect(mockDb._mockStatement.bind).toHaveBeenCalledWith('order_123', 'acct_acme')
	})

	it('should automatically set account_id on order insert', () => {
		const context = createMockContext('acct_acme', mockDb)

		const queries = scopedQuery(context)
		queries.orders.insert({
			created_by_user_id: 'user_123',
			subtotal: 2500.0,
			total: 2500.0,
		})

		expect(mockDb.prepare).toHaveBeenCalledWith(
			expect.stringContaining(
				'INSERT INTO orders',
			),
		)
		expect(mockDb.prepare).toHaveBeenCalledWith(
			expect.stringContaining(
				'account_id',
			),
		)
		const bindCall = mockDb._mockStatement.bind.mock.calls[0]
		expect(bindCall[1]).toBe('acct_acme') // account_id is second param
	})

	it('should scope order update to account', () => {
		const context = createMockContext('acct_acme', mockDb)

		const queries = scopedQuery(context)
		queries.orders.update('order_123', {
			status: 'shipped',
		})

		expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE id = ? AND account_id = ?'))
		const bindCall = mockDb._mockStatement.bind.mock.calls[0]
		const params = bindCall.slice(0)
		expect(params[params.length - 1]).toBe('acct_acme') // account_id is last param
	})

	it('should scope order delete to account', () => {
		const context = createMockContext('acct_acme', mockDb)

		const queries = scopedQuery(context)
		queries.orders.delete('order_123')

		expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM orders WHERE id = ? AND account_id = ?')
		expect(mockDb._mockStatement.bind).toHaveBeenCalledWith('order_123', 'acct_acme')
	})
})

describe('scopedQuery - Error Handling', () => {
	it('should throw error when tenant context is missing', () => {
		// Given no tenant context
		const context = {
			get: () => undefined,
			env: { DB: createMockD1Database() },
		} as any

		// When I attempt to create scoped queries
		// Then it should throw "Tenant context required"
		expect(() => scopedQuery(context)).toThrow('Tenant context required')
	})

	it('should throw error when database is not configured', () => {
		// Given tenant context exists but no database
		const mockAccount: Account = {
			id: 'acct_acme',
			short_name: 'acme',
			name: 'Acme Corp',
			created_at: '2024-01-01T00:00:00Z',
		}

		const values = new Map<string, unknown>()
		values.set('account', mockAccount)
		values.set('accountId', 'acct_acme')

		const context = {
			get: (key: string) => values.get(key),
			env: {}, // No DB
		} as any

		// When I attempt to create scoped queries
		// Then it should throw "Database not configured"
		expect(() => scopedQuery(context)).toThrow('Database not configured')
	})
})
