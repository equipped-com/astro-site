/**
 * Impersonation API Routes Tests
 *
 * @REQ-SA-006 Enter impersonation mode
 * @REQ-SA-008 Actions are logged with admin context
 * @REQ-SA-009 Exit impersonation
 * @REQ-SA-010 Restricted actions while impersonating
 */
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import impersonationRoutes from './impersonation'

// Mock sysadmin middleware
vi.mock('../../middleware/sysadmin', () => ({
	requireSysAdmin: () => async (c: any, next: any) => {
		const authHeader = c.req.header('Authorization')
		if (!authHeader || !authHeader.startsWith('Bearer admin-')) {
			return c.json({ error: 'Unauthorized' }, 401)
		}
		// Simulate sys admin context
		c.set('userId', 'user_admin123')
		c.set('sysAdmin', true)
		c.set('user', {
			id: 'user_admin123',
			email: 'admin@tryequipped.com',
			first_name: 'John',
			last_name: 'Admin',
		})
		return next()
	},
}))

// Mock database
const mockDb = {
	prepare: vi.fn().mockReturnThis(),
	bind: vi.fn().mockReturnThis(),
	first: vi.fn(),
	run: vi.fn(),
	all: vi.fn(),
}

// Create test app with middleware to inject DB
function createTestApp() {
	const app = new Hono<{ Bindings: { DB: typeof mockDb }; Variables: any }>()
	// Inject mock DB into env
	app.use('*', async (c, next) => {
		// @ts-expect-error - mocking env
		c.env = { DB: mockDb }
		return next()
	})
	app.route('/api/admin/impersonation', impersonationRoutes)
	return app
}

describe('Impersonation API Routes', () => {
	let app: ReturnType<typeof createTestApp>

	beforeEach(() => {
		vi.clearAllMocks()
		app = createTestApp()

		// Reset mock database
		mockDb.first.mockResolvedValue(null)
		mockDb.run.mockResolvedValue({ success: true })
		mockDb.all.mockResolvedValue({ results: [] })
	})

	describe('POST /api/admin/impersonation/start', () => {
		/**
		 * @REQ-SA-006
		 * Scenario: Enter impersonation mode
		 *   Given I am viewing customer "Acme Corp" in admin
		 *   When I click "View as Customer"
		 *   Then I should see Acme's dashboard
		 */
		it('should start impersonation session for valid account', async () => {
			mockDb.first.mockResolvedValueOnce({
				id: 'acc_123',
				name: 'Acme Corp',
				short_name: 'acme',
			})

			const res = await app.request('/api/admin/impersonation/start', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer admin-token',
				},
				body: JSON.stringify({ accountId: 'acc_123' }),
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.success).toBe(true)
			expect(data.session).toBeDefined()
			expect(data.session.accountId).toBe('acc_123')
			expect(data.session.accountName).toBe('Acme Corp')
			expect(data.session.adminEmail).toBe('admin@tryequipped.com')
		})

		it('should return 400 when accountId is missing', async () => {
			const res = await app.request('/api/admin/impersonation/start', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer admin-token',
				},
				body: JSON.stringify({}),
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('Account ID is required')
		})

		it('should return 404 when account does not exist', async () => {
			mockDb.first.mockResolvedValueOnce(null)

			const res = await app.request('/api/admin/impersonation/start', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer admin-token',
				},
				body: JSON.stringify({ accountId: 'nonexistent' }),
			})

			expect(res.status).toBe(404)
			const data = await res.json()
			expect(data.error).toBe('Account not found')
		})

		it('should require sys admin authentication', async () => {
			const res = await app.request('/api/admin/impersonation/start', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ accountId: 'acc_123' }),
			})

			expect(res.status).toBe(401)
		})

		/**
		 * @REQ-SA-008
		 * Scenario: Actions are logged
		 *   When I perform any action while impersonating
		 *   Then audit_log should record action
		 */
		it('should log impersonation start to audit log', async () => {
			mockDb.first.mockResolvedValueOnce({
				id: 'acc_123',
				name: 'Acme Corp',
				short_name: 'acme',
			})

			await app.request('/api/admin/impersonation/start', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer admin-token',
				},
				body: JSON.stringify({ accountId: 'acc_123' }),
			})

			// Verify audit log was created (using audit_log table, not audit_logs)
			expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO audit_log'))
			expect(mockDb.bind).toHaveBeenCalledWith(
				expect.any(String), // id
				'user_admin123', // user_id
				'acc_123', // account_id
				'impersonation_start', // action (not "started")
				'account', // entity_type
				'acc_123', // entity_id
				expect.any(String), // changes JSON
			)
		})
	})

	describe('POST /api/admin/impersonation/end', () => {
		/**
		 * @REQ-SA-009
		 * Scenario: Exit impersonation
		 *   When I click "Exit" in admin banner
		 *   Then I should return to admin dashboard
		 */
		it('should end impersonation session', async () => {
			const res = await app.request('/api/admin/impersonation/end', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer admin-token',
				},
				body: JSON.stringify({ accountId: 'acc_123' }),
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.success).toBe(true)
		})

		it('should return 400 when accountId is missing', async () => {
			const res = await app.request('/api/admin/impersonation/end', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer admin-token',
				},
				body: JSON.stringify({}),
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('Account ID is required')
		})

		it('should log impersonation end to audit log', async () => {
			await app.request('/api/admin/impersonation/end', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer admin-token',
				},
				body: JSON.stringify({ accountId: 'acc_123' }),
			})

			expect(mockDb.bind).toHaveBeenCalledWith(
				expect.any(String), // id
				'user_admin123', // user_id
				'acc_123', // account_id
				'impersonation_end', // action (not "ended")
				'account', // entity_type
				'acc_123', // entity_id
				expect.any(String), // changes JSON
			)
		})
	})

	describe('POST /api/admin/impersonation/log', () => {
		/**
		 * @REQ-SA-008
		 * Scenario: Actions are logged
		 *   Then audit_log should record:
		 *     | Field | Value |
		 *     | user_id | My admin user ID |
		 *     | account_id | Customer's account ID |
		 *     | action | The action performed |
		 *     | is_impersonation | true |
		 */
		it('should log an action during impersonation', async () => {
			const res = await app.request('/api/admin/impersonation/log', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer admin-token',
				},
				body: JSON.stringify({
					accountId: 'acc_123',
					action: 'view_devices',
					details: { count: 10 },
				}),
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.success).toBe(true)
			expect(data.auditId).toBeDefined()
		})

		it('should include admin context in audit log', async () => {
			await app.request('/api/admin/impersonation/log', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer admin-token',
				},
				body: JSON.stringify({
					accountId: 'acc_123',
					action: 'view_devices',
					details: { count: 10 },
				}),
			})

			// Verify the logged details include admin info
			// The implementation uses 7 params: id, user_id, account_id, action, entity_type, entity_id, changes
			const bindCall = mockDb.bind.mock.calls.find(call => call[3] === 'view_devices')
			expect(bindCall).toBeDefined()

			// Changes JSON is in 7th position (index 6)
			const changes = JSON.parse(bindCall[6])
			expect(changes.admin_email).toBe('admin@tryequipped.com')
			expect(changes.admin_name).toBe('John Admin')
			expect(changes.count).toBe(10)
		})

		it('should return 400 when required fields are missing', async () => {
			const res = await app.request('/api/admin/impersonation/log', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer admin-token',
				},
				body: JSON.stringify({ accountId: 'acc_123' }),
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('Account ID and action are required')
		})
	})

	describe('GET /api/admin/impersonation/check-action', () => {
		/**
		 * @REQ-SA-010
		 * Scenario: Restricted actions while impersonating
		 *   Then I should NOT be able to:
		 *     | Delete the account |
		 *     | Change billing/payment |
		 *     | Remove the owner |
		 */
		it('should return restricted for delete_account', async () => {
			const res = await app.request('/api/admin/impersonation/check-action?action=delete_account', {
				headers: { Authorization: 'Bearer admin-token' },
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.isRestricted).toBe(true)
			expect(data.message).toBe('Action restricted in admin mode')
		})

		it('should return restricted for change_billing', async () => {
			const res = await app.request('/api/admin/impersonation/check-action?action=change_billing', {
				headers: { Authorization: 'Bearer admin-token' },
			})

			const data = await res.json()
			expect(data.isRestricted).toBe(true)
		})

		it('should return restricted for remove_owner', async () => {
			const res = await app.request('/api/admin/impersonation/check-action?action=remove_owner', {
				headers: { Authorization: 'Bearer admin-token' },
			})

			const data = await res.json()
			expect(data.isRestricted).toBe(true)
		})

		it('should return allowed for non-restricted actions', async () => {
			const res = await app.request('/api/admin/impersonation/check-action?action=view_devices', {
				headers: { Authorization: 'Bearer admin-token' },
			})

			const data = await res.json()
			expect(data.isRestricted).toBe(false)
			expect(data.message).toBe('Action allowed')
		})

		it('should return 400 when action is missing', async () => {
			const res = await app.request('/api/admin/impersonation/check-action', {
				headers: { Authorization: 'Bearer admin-token' },
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('Action is required')
		})
	})

	describe('GET /api/admin/impersonation/audit-logs', () => {
		it('should return impersonation audit logs', async () => {
			mockDb.all.mockResolvedValueOnce({
				results: [
					{
						id: 'log_1',
						user_id: 'user_admin123',
						account_id: 'acc_123',
						action: 'impersonation_started',
						is_impersonation: 1,
						created_at: '2024-01-15T10:30:00Z',
						admin_email: 'admin@tryequipped.com',
					},
				],
			})

			const res = await app.request('/api/admin/impersonation/audit-logs', {
				headers: { Authorization: 'Bearer admin-token' },
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.logs).toHaveLength(1)
			expect(data.logs[0].action).toBe('impersonation_started')
		})

		it('should filter by accountId', async () => {
			mockDb.all.mockResolvedValueOnce({ results: [] })

			await app.request('/api/admin/impersonation/audit-logs?accountId=acc_123', {
				headers: { Authorization: 'Bearer admin-token' },
			})

			expect(mockDb.bind).toHaveBeenCalledWith('acc_123', 50)
		})

		it('should respect limit parameter', async () => {
			mockDb.all.mockResolvedValueOnce({ results: [] })

			await app.request('/api/admin/impersonation/audit-logs?limit=10', {
				headers: { Authorization: 'Bearer admin-token' },
			})

			expect(mockDb.bind).toHaveBeenCalledWith(10)
		})
	})
})
