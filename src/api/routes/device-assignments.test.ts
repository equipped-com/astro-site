/**
 * Device Assignment API Tests
 *
 * Tests device assignment/unassignment flows with full audit trail.
 * Maps to task acceptance criteria via @REQ tags.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, createTestContext } from '../test-helpers'

describe('Device Assignment API', () => {
	let testContext: Awaited<ReturnType<typeof createTestContext>>
	let app: Awaited<ReturnType<typeof createTestApp>>

	beforeEach(async () => {
		testContext = await createTestContext()
		app = await createTestApp(testContext.env)
	})

	/**
	 * @REQ-FLEET-ASSIGN-001
	 * Scenario: Assign device to employee
	 */
	describe('POST /api/device-assignments/assign', () => {
		it('should assign device to person and update device status to deployed', async () => {
			// Create a device
			const deviceRes = await app.request('/api/devices', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					name: 'MacBook Pro 16',
					type: 'laptop',
					model: 'MacBook Pro 16" M3 (2024)',
					serial_number: 'C02XYZ123ABC',
					status: 'available',
				}),
			})
			expect(deviceRes.status).toBe(201)
			const { device } = await deviceRes.json()

			// Create a person
			const personRes = await app.request('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					first_name: 'Alice',
					last_name: 'Smith',
					email: 'alice@example.com',
					status: 'active',
				}),
			})
			expect(personRes.status).toBe(201)
			const { person } = await personRes.json()

			// Assign device to person
			const assignRes = await app.request('/api/device-assignments/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device.id,
					person_id: person.id,
					notes: 'New hire setup',
				}),
			})

			expect(assignRes.status).toBe(201)
			const { assignment } = await assignRes.json()

			expect(assignment).toMatchObject({
				device_id: device.id,
				person_id: person.id,
				first_name: 'Alice',
				last_name: 'Smith',
				device_name: 'MacBook Pro 16',
				notes: 'New hire setup',
			})
			expect(assignment.assigned_at).toBeTruthy()
			expect(assignment.returned_at).toBeNull()

			// Verify device status updated to deployed
			const updatedDeviceRes = await app.request(`/api/devices/${device.id}`, {
				headers: testContext.authHeaders,
			})
			const { device: updatedDevice } = await updatedDeviceRes.json()

			expect(updatedDevice.status).toBe('deployed')
			expect(updatedDevice.assigned_to_person_id).toBe(person.id)
		})

		it('should create audit log entry for assignment', async () => {
			const deviceRes = await app.request('/api/devices', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					name: 'iPad Pro',
					type: 'tablet',
					model: 'iPad Pro 12.9" (2023)',
					status: 'available',
				}),
			})
			const { device } = await deviceRes.json()

			const personRes = await app.request('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					first_name: 'Bob',
					last_name: 'Jones',
					email: 'bob@example.com',
				}),
			})
			const { person } = await personRes.json()

			await app.request('/api/device-assignments/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device.id,
					person_id: person.id,
				}),
			})

			// Check audit log
			const auditLog = await testContext.env.DB.prepare(
				'SELECT * FROM audit_log WHERE entity_type = ? AND action = ? ORDER BY created_at DESC LIMIT 1',
			)
				.bind('device_assignment', 'assign')
				.first()

			expect(auditLog).toBeTruthy()
			expect(auditLog?.account_id).toBe(testContext.accountId)
			expect(auditLog?.user_id).toBe(testContext.userId)

			const changes = JSON.parse(auditLog?.changes as string)
			expect(changes).toMatchObject({
				device_id: device.id,
				person_id: person.id,
			})
		})

		it('should return 404 if device not found', async () => {
			const res = await app.request('/api/device-assignments/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: 'nonexistent-device',
					person_id: 'nonexistent-person',
				}),
			})

			expect(res.status).toBe(404)
		})

		it('should return 400 if device_id or person_id missing', async () => {
			const res = await app.request('/api/device-assignments/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: 'some-device',
				}),
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toContain('required')
		})
	})

	/**
	 * @REQ-FLEET-ASSIGN-002
	 * Scenario: View assignment history
	 */
	describe('GET /api/device-assignments/device/:device_id', () => {
		it('should return assignment history for device', async () => {
			// Create device
			const deviceRes = await app.request('/api/devices', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					name: 'MacBook Air',
					type: 'laptop',
					model: 'MacBook Air 13" M2 (2023)',
					status: 'available',
				}),
			})
			const { device } = await deviceRes.json()

			// Create two people
			const person1Res = await app.request('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					first_name: 'Alice',
					last_name: 'Smith',
					email: 'alice@example.com',
				}),
			})
			const { person: person1 } = await person1Res.json()

			const person2Res = await app.request('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					first_name: 'Bob',
					last_name: 'Jones',
					email: 'bob@example.com',
				}),
			})
			const { person: person2 } = await person2Res.json()

			// First assignment
			await app.request('/api/device-assignments/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device.id,
					person_id: person1.id,
				}),
			})

			// Unassign
			await app.request('/api/device-assignments/unassign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device.id,
				}),
			})

			// Second assignment
			await app.request('/api/device-assignments/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device.id,
					person_id: person2.id,
				}),
			})

			// Get history
			const historyRes = await app.request(`/api/device-assignments/device/${device.id}`, {
				headers: testContext.authHeaders,
			})

			expect(historyRes.status).toBe(200)
			const { assignments } = await historyRes.json()

			expect(assignments).toHaveLength(2)
			expect(assignments[0]).toMatchObject({
				person_id: person2.id,
				first_name: 'Bob',
				last_name: 'Jones',
			})
			expect(assignments[0].returned_at).toBeNull()

			expect(assignments[1]).toMatchObject({
				person_id: person1.id,
				first_name: 'Alice',
				last_name: 'Smith',
			})
			expect(assignments[1].returned_at).toBeTruthy()
		})
	})

	/**
	 * @REQ-FLEET-ASSIGN-003
	 * Scenario: Unassign device (return)
	 */
	describe('POST /api/device-assignments/unassign', () => {
		it('should unassign device and set returned_at timestamp', async () => {
			// Create and assign device
			const deviceRes = await app.request('/api/devices', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					name: 'iPhone 15',
					type: 'phone',
					model: 'iPhone 15 Pro (2023)',
					status: 'available',
				}),
			})
			const { device } = await deviceRes.json()

			const personRes = await app.request('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					first_name: 'Bob',
					last_name: 'Jones',
					email: 'bob@example.com',
					status: 'offboarding',
				}),
			})
			const { person } = await personRes.json()

			await app.request('/api/device-assignments/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device.id,
					person_id: person.id,
				}),
			})

			// Unassign
			const unassignRes = await app.request('/api/device-assignments/unassign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device.id,
					collection_method: 'in_person',
					notes: 'Employee departed',
				}),
			})

			expect(unassignRes.status).toBe(200)
			const { assignment } = await unassignRes.json()

			expect(assignment.returned_at).toBeTruthy()
			expect(assignment.notes).toContain('Employee departed')

			// Verify device status updated to available
			const updatedDeviceRes = await app.request(`/api/devices/${device.id}`, {
				headers: testContext.authHeaders,
			})
			const { device: updatedDevice } = await updatedDeviceRes.json()

			expect(updatedDevice.status).toBe('available')
			expect(updatedDevice.assigned_to_person_id).toBeNull()
		})

		it('should return 404 if no active assignment found', async () => {
			const deviceRes = await app.request('/api/devices', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					name: 'Unassigned Device',
					type: 'laptop',
					model: 'Test Model',
					status: 'available',
				}),
			})
			const { device } = await deviceRes.json()

			const unassignRes = await app.request('/api/device-assignments/unassign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device.id,
				}),
			})

			expect(unassignRes.status).toBe(404)
			const data = await unassignRes.json()
			expect(data.error).toContain('No active assignment')
		})
	})

	/**
	 * @REQ-FLEET-ASSIGN-004
	 * Scenario: Schedule device collection
	 */
	describe('Collection method options', () => {
		it('should support ship_label collection method', async () => {
			const deviceRes = await app.request('/api/devices', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					name: 'Test Device',
					type: 'laptop',
					model: 'Test Model',
					status: 'available',
				}),
			})
			const { device } = await deviceRes.json()

			const personRes = await app.request('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					first_name: 'Test',
					last_name: 'User',
					email: 'test@example.com',
				}),
			})
			const { person } = await personRes.json()

			await app.request('/api/device-assignments/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device.id,
					person_id: person.id,
				}),
			})

			const unassignRes = await app.request('/api/device-assignments/unassign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device.id,
					collection_method: 'ship_label',
				}),
			})

			expect(unassignRes.status).toBe(200)
			const data = await unassignRes.json()
			expect(data.collection_method).toBe('ship_label')
		})

		it('should support schedule_pickup collection method', async () => {
			const deviceRes = await app.request('/api/devices', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					name: 'Test Device 2',
					type: 'laptop',
					model: 'Test Model',
					status: 'available',
				}),
			})
			const { device } = await deviceRes.json()

			const personRes = await app.request('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					first_name: 'Test',
					last_name: 'User2',
					email: 'test2@example.com',
				}),
			})
			const { person } = await personRes.json()

			await app.request('/api/device-assignments/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device.id,
					person_id: person.id,
				}),
			})

			const unassignRes = await app.request('/api/device-assignments/unassign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device.id,
					collection_method: 'schedule_pickup',
				}),
			})

			expect(unassignRes.status).toBe(200)
			const data = await unassignRes.json()
			expect(data.collection_method).toBe('schedule_pickup')
		})
	})

	/**
	 * @REQ-FLEET-ASSIGN-005
	 * Scenario: Assignment audit log
	 */
	describe('Audit logging', () => {
		it('should create audit log entries for assign and unassign actions', async () => {
			const deviceRes = await app.request('/api/devices', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					name: 'Audit Test Device',
					type: 'laptop',
					model: 'Test Model',
					status: 'available',
				}),
			})
			const { device } = await deviceRes.json()

			const personRes = await app.request('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					first_name: 'Audit',
					last_name: 'Test',
					email: 'audit@example.com',
				}),
			})
			const { person } = await personRes.json()

			// Assign
			await app.request('/api/device-assignments/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device.id,
					person_id: person.id,
				}),
			})

			// Unassign
			await app.request('/api/device-assignments/unassign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device.id,
				}),
			})

			// Check audit logs
			const auditLogs = await testContext.env.DB.prepare(
				'SELECT * FROM audit_log WHERE entity_type = ? AND account_id = ? ORDER BY created_at ASC',
			)
				.bind('device_assignment', testContext.accountId)
				.all()

			expect(auditLogs.results.length).toBeGreaterThanOrEqual(2)

			const assignLog = auditLogs.results.find((log: { action: string }) => log.action === 'assign')
			const unassignLog = auditLogs.results.find((log: { action: string }) => log.action === 'unassign')

			expect(assignLog).toBeTruthy()
			expect(assignLog?.user_id).toBe(testContext.userId)

			expect(unassignLog).toBeTruthy()
			expect(unassignLog?.user_id).toBe(testContext.userId)
		})
	})

	describe('GET /api/device-assignments/active', () => {
		it('should return only active assignments', async () => {
			// Create devices and people
			const device1Res = await app.request('/api/devices', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					name: 'Active Device 1',
					type: 'laptop',
					model: 'Test Model',
					status: 'available',
				}),
			})
			const { device: device1 } = await device1Res.json()

			const device2Res = await app.request('/api/devices', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					name: 'Active Device 2',
					type: 'laptop',
					model: 'Test Model',
					status: 'available',
				}),
			})
			const { device: device2 } = await device2Res.json()

			const person1Res = await app.request('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					first_name: 'Active',
					last_name: 'User1',
					email: 'active1@example.com',
				}),
			})
			const { person: person1 } = await person1Res.json()

			const person2Res = await app.request('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					first_name: 'Active',
					last_name: 'User2',
					email: 'active2@example.com',
				}),
			})
			const { person: person2 } = await person2Res.json()

			// Assign both devices
			await app.request('/api/device-assignments/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device1.id,
					person_id: person1.id,
				}),
			})

			await app.request('/api/device-assignments/assign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device2.id,
					person_id: person2.id,
				}),
			})

			// Unassign one device
			await app.request('/api/device-assignments/unassign', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...testContext.authHeaders,
				},
				body: JSON.stringify({
					device_id: device1.id,
				}),
			})

			// Get active assignments
			const activeRes = await app.request('/api/device-assignments/active', {
				headers: testContext.authHeaders,
			})

			expect(activeRes.status).toBe(200)
			const { assignments } = await activeRes.json()

			expect(assignments).toHaveLength(1)
			expect(assignments[0]).toMatchObject({
				device_id: device2.id,
				person_id: person2.id,
				first_name: 'Active',
				last_name: 'User2',
			})
			expect(assignments[0].returned_at).toBeNull()
		})
	})
})
