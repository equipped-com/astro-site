/**
 * Device Assignment API Tests
 *
 * Tests device assignment/unassignment flows with full audit trail.
 * Maps to task acceptance criteria via @REQ tags.
 *
 * Coverage:
 * - @REQ-FLEET-ASSIGN-001: Assign device to employee
 * - @REQ-FLEET-ASSIGN-002: View assignment history
 * - @REQ-FLEET-ASSIGN-003: Unassign device (return)
 * - @REQ-FLEET-ASSIGN-004: Schedule device collection
 * - @REQ-FLEET-ASSIGN-005: Assignment audit log
 */

import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import deviceAssignmentsRoutes from './device-assignments'

// Mock getAuth from Clerk
vi.mock('@hono/clerk-auth', () => ({
	getAuth: vi.fn(() => ({
		userId: 'user_test123',
		sessionId: 'sess_test123',
	})),
}))

// Helper to create mock environment with database operations
function createMockEnv() {
	const mockDevices = new Map()
	const mockPeople = new Map()
	const mockAssignments = new Map()
	const mockAuditLogs: unknown[] = []

	return {
		DB: {
			prepare: vi.fn((sql: string) => ({
				bind: vi.fn((...params: unknown[]) => ({
					first: vi.fn(() => {
						if (sql.includes('SELECT * FROM devices')) {
							const deviceId = params[0] as string
							return mockDevices.get(deviceId) || null
						}
						if (sql.includes('SELECT * FROM people WHERE id')) {
							const personId = params[0] as string
							return mockPeople.get(personId) || null
						}
						// Handle JOIN query for assignment with person/device details
						if (sql.includes('FROM device_assignments da') && sql.includes('JOIN people p') && sql.includes('JOIN devices d')) {
							const assignmentId = params[0] as string
							return mockAssignments.get(assignmentId) || null
						}
						if (sql.includes('FROM device_assignments') && sql.includes('WHERE id')) {
							return Array.from(mockAssignments.values()).find((a: { id: string }) => a.id === params[0])
						}
						if (
							sql.includes('FROM device_assignments') &&
							sql.includes('WHERE device_id') &&
							sql.includes('returned_at IS NULL')
						) {
							const deviceId = params[0] as string
							return (
								Array.from(mockAssignments.values()).find(
									(a: { device_id: string; returned_at: string | null }) => a.device_id === deviceId && !a.returned_at,
								) || null
							)
						}
						if (sql.includes('FROM audit_log')) {
							return mockAuditLogs[mockAuditLogs.length - 1] || null
						}
						return null
					}),
					all: vi.fn(() => {
						if (sql.includes('FROM device_assignments da')) {
							if (sql.includes('WHERE da.device_id')) {
								const deviceId = params[0] as string
								return {
									results: Array.from(mockAssignments.values())
										.filter((a: { device_id: string }) => a.device_id === deviceId)
										.sort(
											(a: { assigned_at: string }, b: { assigned_at: string }) =>
												new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime(),
										),
								}
							}
							if (sql.includes('WHERE da.person_id')) {
								const personId = params[0] as string
								return {
									results: Array.from(mockAssignments.values())
										.filter((a: { person_id: string }) => a.person_id === personId)
										.sort(
											(a: { assigned_at: string }, b: { assigned_at: string }) =>
												new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime(),
										),
								}
							}
							if (sql.includes('returned_at IS NULL')) {
								return {
									results: Array.from(mockAssignments.values())
										.filter((a: { returned_at: string | null }) => !a.returned_at)
										.sort(
											(a: { assigned_at: string }, b: { assigned_at: string }) =>
												new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime(),
										),
								}
							}
						}
						if (sql.includes('FROM audit_log')) {
							return { results: mockAuditLogs }
						}
						return { results: [] }
					}),
					run: vi.fn(() => {
						if (sql.includes('INSERT INTO device_assignments')) {
							const id = params[0] as string
							const deviceId = params[1] as string
							const personId = params[2] as string
							const assignedByUserId = params[3] as string
							const notes = params[4] as string | null

							const device = mockDevices.get(deviceId)
							const person = mockPeople.get(personId)

							const assignment = {
								id,
								device_id: deviceId,
								person_id: personId,
								assigned_by_user_id: assignedByUserId,
								assigned_at: new Date().toISOString(),
								returned_at: null,
								notes,
								first_name: person?.first_name,
								last_name: person?.last_name,
								email: person?.email,
								device_name: device?.name,
								device_model: device?.model,
							}
							mockAssignments.set(id, assignment)
						}
						if (sql.includes('UPDATE devices SET status') && sql.includes('deployed')) {
							const personId = params[0] as string
							const deviceId = params[1] as string
							const device = mockDevices.get(deviceId)
							if (device) {
								device.status = 'deployed'
								device.assigned_to_person_id = personId
								device.updated_at = new Date().toISOString()
							}
						}
						if (sql.includes('UPDATE devices SET status') && sql.includes('available')) {
							const deviceId = params[0] as string
							const device = mockDevices.get(deviceId)
							if (device) {
								device.status = 'available'
								device.assigned_to_person_id = null
								device.updated_at = new Date().toISOString()
							}
						}
						if (sql.includes('UPDATE device_assignments SET returned_at')) {
							const notes = params[0] as string
							const id = params[2] as string
							const assignment = mockAssignments.get(id)
							if (assignment) {
								assignment.returned_at = new Date().toISOString()
								if (notes && assignment.notes) {
									assignment.notes += `\n${notes}`
								} else if (notes) {
									assignment.notes = notes
								}
							}
						}
						if (sql.includes('INSERT INTO audit_log')) {
							const auditEntry = {
								id: params[0],
								account_id: params[1],
								user_id: params[2],
								action: params[3],
								entity_type: params[4],
								entity_id: params[5],
								changes: params[6],
								created_at: new Date().toISOString(),
							}
							mockAuditLogs.push(auditEntry)
						}
						if (sql.includes('INSERT INTO devices')) {
							const [id, account_id, name, type, model, serial_number, status] = params
							mockDevices.set(id as string, {
								id,
								account_id,
								name,
								type,
								model,
								serial_number,
								status,
								assigned_to_person_id: null,
								created_at: new Date().toISOString(),
								updated_at: null,
								deleted_at: null,
							})
						}
						if (sql.includes('INSERT INTO people')) {
							const [id, account_id, first_name, last_name, email, phone, status] = params
							mockPeople.set(id as string, {
								id,
								account_id,
								first_name,
								last_name,
								email,
								phone,
								status,
								created_at: new Date().toISOString(),
								updated_at: null,
							})
						}
						return { meta: { changes: 1 } }
					}),
				})),
			})),
		},
		devices: mockDevices,
		people: mockPeople,
		assignments: mockAssignments,
		auditLogs: mockAuditLogs,
	}
}

describe('Device Assignment API', () => {
	let app: Hono
	let mockEnv: ReturnType<typeof createMockEnv>

	beforeEach(() => {
		mockEnv = createMockEnv()

		app = new Hono<{ Bindings: Env; Variables: { accountId?: string; userId?: string; role?: string } }>()

		app.onError((err, c) => {
			console.error('Test app error:', err.message)
			return c.json({ error: err.message }, 500)
		})

		app.use('*', async (c, next) => {
			// @ts-expect-error - mocking env for tests
			c.env = mockEnv
			c.set('accountId', 'acct_test')
			c.set('userId', 'user_test123')
			c.set('role', 'admin')
			await next()
		})

		app.route('/', deviceAssignmentsRoutes)
	})

	/**
	 * @REQ-FLEET-ASSIGN-001
	 * Scenario: Assign device to employee
	 */
	describe('POST /assign', () => {
		it('should assign device to person and update device status to deployed', async () => {
			// Create device
			const deviceId = 'dev_1'
			mockEnv.devices.set(deviceId, {
				id: deviceId,
				account_id: 'acct_test',
				name: 'MacBook Pro 16',
				type: 'laptop',
				model: 'MacBook Pro 16" M3 (2024)',
				serial_number: 'C02XYZ123ABC',
				status: 'available',
				assigned_to_person_id: null,
				created_at: new Date().toISOString(),
				updated_at: null,
				deleted_at: null,
			})

			// Create person
			const personId = 'person_1'
			mockEnv.people.set(personId, {
				id: personId,
				account_id: 'acct_test',
				first_name: 'Alice',
				last_name: 'Smith',
				email: 'alice@example.com',
				status: 'active',
				created_at: new Date().toISOString(),
				updated_at: null,
			})

			const response = await app.request('/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					device_id: deviceId,
					person_id: personId,
					notes: 'New hire setup',
				}),
			})

			expect(response.status).toBe(201)
			const data = await response.json()

			expect(data.assignment).toMatchObject({
				device_id: deviceId,
				person_id: personId,
				first_name: 'Alice',
				last_name: 'Smith',
				device_name: 'MacBook Pro 16',
				notes: 'New hire setup',
			})
			expect(data.assignment.assigned_at).toBeTruthy()
			expect(data.assignment.returned_at).toBeNull()

			// Verify device status updated
			const device = mockEnv.devices.get(deviceId)
			expect(device.status).toBe('deployed')
			expect(device.assigned_to_person_id).toBe(personId)
		})

		it('should return 404 if device not found', async () => {
			const response = await app.request('/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					device_id: 'nonexistent',
					person_id: 'person_1',
				}),
			})

			expect(response.status).toBe(404)
			const data = await response.json()
			expect(data.error).toContain('Device not found')
		})

		it('should return 400 if required fields missing', async () => {
			const response = await app.request('/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					device_id: 'dev_1',
				}),
			})

			expect(response.status).toBe(400)
			const data = await response.json()
			expect(data.error).toContain('required')
		})
	})

	/**
	 * @REQ-FLEET-ASSIGN-002
	 * Scenario: View assignment history
	 */
	describe('GET /device/:device_id', () => {
		it('should return assignment history for device', async () => {
			const deviceId = 'dev_1'
			mockEnv.devices.set(deviceId, {
				id: deviceId,
				account_id: 'acct_test',
				name: 'MacBook Air',
				type: 'laptop',
				model: 'MacBook Air 13" M2 (2023)',
				status: 'deployed',
				assigned_to_person_id: 'person_2',
				deleted_at: null,
			})

			// Create assignment history
			mockEnv.assignments.set('assign_1', {
				id: 'assign_1',
				device_id: deviceId,
				person_id: 'person_1',
				first_name: 'Alice',
				last_name: 'Smith',
				email: 'alice@example.com',
				assigned_at: '2024-01-01T00:00:00Z',
				returned_at: '2024-03-15T00:00:00Z',
			})

			mockEnv.assignments.set('assign_2', {
				id: 'assign_2',
				device_id: deviceId,
				person_id: 'person_2',
				first_name: 'Bob',
				last_name: 'Jones',
				email: 'bob@example.com',
				assigned_at: '2024-03-16T00:00:00Z',
				returned_at: null,
			})

			const response = await app.request(`/device/${deviceId}`)

			expect(response.status).toBe(200)
			const data = await response.json()

			expect(data.assignments).toHaveLength(2)
			expect(data.assignments[0]).toMatchObject({
				person_id: 'person_2',
				first_name: 'Bob',
				last_name: 'Jones',
			})
			expect(data.assignments[0].returned_at).toBeNull()

			expect(data.assignments[1]).toMatchObject({
				person_id: 'person_1',
				first_name: 'Alice',
				last_name: 'Smith',
			})
			expect(data.assignments[1].returned_at).toBeTruthy()
		})
	})

	/**
	 * @REQ-FLEET-ASSIGN-003
	 * Scenario: Unassign device (return)
	 */
	describe('POST /unassign', () => {
		it('should unassign device and set returned_at timestamp', async () => {
			const deviceId = 'dev_1'
			const personId = 'person_1'
			const assignmentId = 'assign_1'

			mockEnv.devices.set(deviceId, {
				id: deviceId,
				account_id: 'acct_test',
				name: 'iPhone 15',
				type: 'phone',
				model: 'iPhone 15 Pro (2023)',
				status: 'deployed',
				assigned_to_person_id: personId,
				deleted_at: null,
			})

			mockEnv.assignments.set(assignmentId, {
				id: assignmentId,
				device_id: deviceId,
				person_id: personId,
				first_name: 'Bob',
				last_name: 'Jones',
				assigned_at: new Date().toISOString(),
				returned_at: null,
			})

			const response = await app.request('/unassign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					device_id: deviceId,
					collection_method: 'in_person',
					notes: 'Employee departed',
				}),
			})

			expect(response.status).toBe(200)
			const data = await response.json()

			expect(data.assignment.returned_at).toBeTruthy()
			expect(data.collection_method).toBe('in_person')

			// Verify device status updated
			const device = mockEnv.devices.get(deviceId)
			expect(device.status).toBe('available')
			expect(device.assigned_to_person_id).toBeNull()
		})

		it('should return 404 if no active assignment found', async () => {
			const deviceId = 'dev_unassigned'
			mockEnv.devices.set(deviceId, {
				id: deviceId,
				account_id: 'acct_test',
				name: 'Unassigned Device',
				type: 'laptop',
				model: 'Test Model',
				status: 'available',
				assigned_to_person_id: null,
				deleted_at: null,
			})

			const response = await app.request('/unassign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					device_id: deviceId,
				}),
			})

			expect(response.status).toBe(404)
			const data = await response.json()
			expect(data.error).toContain('No active assignment')
		})
	})

	/**
	 * @REQ-FLEET-ASSIGN-004
	 * Scenario: Schedule device collection
	 */
	describe('Collection methods', () => {
		it('should support ship_label collection method', async () => {
			const deviceId = 'dev_1'
			const assignmentId = 'assign_1'

			mockEnv.devices.set(deviceId, {
				id: deviceId,
				account_id: 'acct_test',
				name: 'Test Device',
				status: 'deployed',
				assigned_to_person_id: 'person_1',
				deleted_at: null,
			})

			mockEnv.assignments.set(assignmentId, {
				id: assignmentId,
				device_id: deviceId,
				person_id: 'person_1',
				assigned_at: new Date().toISOString(),
				returned_at: null,
			})

			const response = await app.request('/unassign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					device_id: deviceId,
					collection_method: 'ship_label',
				}),
			})

			expect(response.status).toBe(200)
			const data = await response.json()
			expect(data.collection_method).toBe('ship_label')
		})

		it('should support schedule_pickup collection method', async () => {
			const deviceId = 'dev_2'
			const assignmentId = 'assign_2'

			mockEnv.devices.set(deviceId, {
				id: deviceId,
				account_id: 'acct_test',
				name: 'Test Device 2',
				status: 'deployed',
				assigned_to_person_id: 'person_2',
				deleted_at: null,
			})

			mockEnv.assignments.set(assignmentId, {
				id: assignmentId,
				device_id: deviceId,
				person_id: 'person_2',
				assigned_at: new Date().toISOString(),
				returned_at: null,
			})

			const response = await app.request('/unassign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					device_id: deviceId,
					collection_method: 'schedule_pickup',
				}),
			})

			expect(response.status).toBe(200)
			const data = await response.json()
			expect(data.collection_method).toBe('schedule_pickup')
		})
	})

	/**
	 * @REQ-FLEET-ASSIGN-005
	 * Scenario: Assignment audit log
	 */
	describe('Audit logging', () => {
		it('should create audit log entry for assignment', async () => {
			const deviceId = 'dev_1'
			const personId = 'person_1'

			mockEnv.devices.set(deviceId, {
				id: deviceId,
				account_id: 'acct_test',
				name: 'Audit Test',
				status: 'available',
				deleted_at: null,
			})

			mockEnv.people.set(personId, {
				id: personId,
				account_id: 'acct_test',
				first_name: 'Test',
				last_name: 'User',
				email: 'test@example.com',
			})

			await app.request('/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					device_id: deviceId,
					person_id: personId,
				}),
			})

			expect(mockEnv.auditLogs.length).toBeGreaterThan(0)

			const auditLog = mockEnv.auditLogs[mockEnv.auditLogs.length - 1]
			expect(auditLog).toMatchObject({
				account_id: 'acct_test',
				user_id: 'user_test123',
				action: 'assign',
				entity_type: 'device_assignment',
			})

			const changes = JSON.parse((auditLog as { changes: string }).changes)
			expect(changes).toMatchObject({
				device_id: deviceId,
				person_id: personId,
			})
		})
	})

	describe('GET /active', () => {
		it('should return only active assignments', async () => {
			// Create active assignment
			mockEnv.devices.set('dev_1', {
				id: 'dev_1',
				account_id: 'acct_test',
				name: 'Active Device',
				deleted_at: null,
			})

			mockEnv.assignments.set('assign_active', {
				id: 'assign_active',
				device_id: 'dev_1',
				person_id: 'person_1',
				first_name: 'Active',
				last_name: 'User',
				assigned_at: new Date().toISOString(),
				returned_at: null,
			})

			// Create returned assignment
			mockEnv.assignments.set('assign_returned', {
				id: 'assign_returned',
				device_id: 'dev_2',
				person_id: 'person_2',
				first_name: 'Past',
				last_name: 'User',
				assigned_at: new Date().toISOString(),
				returned_at: new Date().toISOString(),
			})

			const response = await app.request('/active')

			expect(response.status).toBe(200)
			const data = await response.json()

			expect(data.assignments).toHaveLength(1)
			expect(data.assignments[0]).toMatchObject({
				id: 'assign_active',
				person_id: 'person_1',
			})
			expect(data.assignments[0].returned_at).toBeNull()
		})
	})
})
