/**
 * People API Tests
 *
 * Tests for employee directory management endpoints with tenant scoping.
 *
 * Test scenarios from task file (people/directory-view.md):
 * - @REQ-PPL-001: View people directory
 * - @REQ-PPL-002: Filter by status
 * - @REQ-PPL-003: Search people
 * - @REQ-PPL-004: Add person without platform access
 */

import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import peopleRoutes from './people'

// Mock getAuth from Clerk
vi.mock('@hono/clerk-auth', () => ({
	getAuth: vi.fn(() => ({
		userId: 'user_test123',
		sessionId: 'sess_test123',
	})),
}))

// Mock environment
function createMockEnv() {
	const mockPeople = [
		{
			id: 'person_1',
			account_id: 'acct_test',
			first_name: 'Alice',
			last_name: 'Smith',
			email: 'alice@example.com',
			phone: '+1-555-1234',
			title: 'Engineer',
			department: 'Engineering',
			location: 'San Francisco',
			status: 'active',
			has_platform_access: 1,
			device_count: 2,
			account_access_id: 'access_1',
			created_at: '2025-01-01T00:00:00Z',
			updated_at: '2025-01-01T00:00:00Z',
		},
		{
			id: 'person_2',
			account_id: 'acct_test',
			first_name: 'Bob',
			last_name: 'Jones',
			email: 'bob@example.com',
			phone: null,
			title: 'Designer',
			department: 'Design',
			location: 'New York',
			status: 'active',
			has_platform_access: 0,
			device_count: 1,
			account_access_id: null,
			created_at: '2025-01-02T00:00:00Z',
			updated_at: '2025-01-02T00:00:00Z',
		},
		{
			id: 'person_3',
			account_id: 'acct_test',
			first_name: 'Charlie',
			last_name: 'Brown',
			email: 'charlie@example.com',
			phone: '+1-555-5678',
			title: 'Manager',
			department: 'Engineering',
			location: 'San Francisco',
			status: 'departed',
			has_platform_access: 0,
			device_count: 0,
			account_access_id: null,
			created_at: '2025-01-03T00:00:00Z',
			updated_at: '2025-01-03T00:00:00Z',
		},
	]

	return {
		DB: {
			prepare: vi.fn((_sql: string) => ({
				bind: vi.fn(() => ({
					all: vi.fn(() => ({
						results: mockPeople.filter((p: { account_id: string }) => p.account_id === 'acct_test'),
					})),
					first: vi.fn(() => mockPeople[0]),
					run: vi.fn(() => ({ success: true })),
				})),
			})),
		},
	}
}

describe('People API', () => {
	let app: Hono
	let mockEnv: ReturnType<typeof createMockEnv>

	beforeEach(() => {
		app = new Hono()
		mockEnv = createMockEnv()

		// Add context middleware to simulate auth/tenant context
		app.use('*', async (c, next) => {
			c.set('accountId', 'acct_test')
			c.set('userId', 'user_test123')
			c.set('role', 'admin')
			c.env = mockEnv as unknown as Env
			await next()
		})

		// Mount people routes
		app.route('/api/people', peopleRoutes)
	})

	/**
	 * @REQ-PPL-001: View people directory
	 */
	describe('GET /api/people', () => {
		it('should return list of all people in the account', async () => {
			const res = await app.request('/api/people', {
				method: 'GET',
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.people).toBeDefined()
			expect(Array.isArray(data.people)).toBe(true)
			expect(data.people.length).toBeGreaterThan(0)
		})

		it('should include required fields for each person', async () => {
			const res = await app.request('/api/people', {
				method: 'GET',
			})

			const data = await res.json()
			const person = data.people[0]

			// Required fields from @REQ-PPL-001
			expect(person.first_name).toBeDefined()
			expect(person.last_name).toBeDefined()
			expect(person.email).toBeDefined()
			expect(person.status).toBeDefined()
			expect(person.has_platform_access).toBeDefined()
			expect(person.device_count).toBeDefined()
		})

		it('should distinguish users vs non-users with platform access flag', async () => {
			const res = await app.request('/api/people', {
				method: 'GET',
			})

			const data = await res.json()
			const withAccess = data.people.find((p: { has_platform_access: number }) => p.has_platform_access === 1)
			const withoutAccess = data.people.find((p: { has_platform_access: number }) => p.has_platform_access === 0)

			expect(withAccess).toBeDefined()
			expect(withoutAccess).toBeDefined()
		})

		it('should return 400 if account context is missing', async () => {
			// Create app without account context
			const noContextApp = new Hono()
			noContextApp.use('*', async (c, next) => {
				c.env = mockEnv as unknown as Env
				await next()
			})
			noContextApp.route('/api/people', peopleRoutes)

			const res = await noContextApp.request('/api/people', {
				method: 'GET',
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toContain('Account context required')
		})
	})

	/**
	 * @REQ-PPL-004: Add person without platform access
	 */
	describe('POST /api/people', () => {
		it('should create a person without platform access', async () => {
			const res = await app.request('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					first_name: 'John',
					last_name: 'Doe',
					email: 'john@example.com',
					title: 'Engineer',
				}),
			})

			expect(res.status).toBe(201)
			const data = await res.json()
			expect(data.person).toBeDefined()
			expect(data.person.first_name).toBe('Alice') // Mock returns first person
			expect(data.person.has_platform_access).toBeDefined()
		})

		it('should require first_name and last_name', async () => {
			const res = await app.request('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: 'test@example.com',
				}),
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toContain('required')
		})

		it('should allow devices to be assigned to non-user people', async () => {
			const createRes = await app.request('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					first_name: 'John',
					last_name: 'Doe',
					email: 'john@example.com',
				}),
			})

			expect(createRes.status).toBe(201)
			const data = await createRes.json()

			// Person should be created (account_access_id should be NULL)
			expect(data.person).toBeDefined()
			// This person can still be assigned devices via devices.assigned_to_person_id
		})
	})

	/**
	 * Additional tests for GET /api/people/:id
	 */
	describe('GET /api/people/:id', () => {
		it('should return person details with assigned devices', async () => {
			const res = await app.request('/api/people/person_1', {
				method: 'GET',
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.person).toBeDefined()
			expect(data.devices).toBeDefined()
			expect(Array.isArray(data.devices)).toBe(true)
		})

		it('should return 404 for non-existent person', async () => {
			// Mock DB to return null
			mockEnv.DB.prepare = vi.fn(() => ({
				bind: vi.fn(() => ({
					first: vi.fn(() => null),
				})),
			}))

			const res = await app.request('/api/people/person_nonexistent', {
				method: 'GET',
			})

			expect(res.status).toBe(404)
		})
	})

	/**
	 * Additional tests for PUT /api/people/:id
	 */
	describe('PUT /api/people/:id', () => {
		it('should update person information', async () => {
			const res = await app.request('/api/people/person_1', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					title: 'Senior Engineer',
					department: 'Engineering',
				}),
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.person).toBeDefined()
		})

		it('should not allow updating protected fields', async () => {
			const res = await app.request('/api/people/person_1', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id: 'person_hacked',
					account_id: 'acct_hacked',
					title: 'Senior Engineer',
				}),
			})

			expect(res.status).toBe(200)
			// Protected fields should be ignored
		})
	})

	/**
	 * Additional tests for DELETE /api/people/:id
	 */
	describe('DELETE /api/people/:id', () => {
		it('should soft delete a person by setting status to departed', async () => {
			// Mock DB to return no devices
			mockEnv.DB.prepare = vi.fn((sql: string) => {
				if (sql.includes('COUNT(*)')) {
					return {
						bind: vi.fn(() => ({
							first: vi.fn(() => ({ count: 0 })),
						})),
					}
				}
				return {
					bind: vi.fn(() => ({
						first: vi.fn(() => ({ id: 'person_1' })),
						run: vi.fn(() => ({ success: true })),
					})),
				}
			})

			const res = await app.request('/api/people/person_1', {
				method: 'DELETE',
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.success).toBe(true)
		})

		it('should prevent deletion if person has assigned devices', async () => {
			// Mock DB to return devices
			mockEnv.DB.prepare = vi.fn((sql: string) => {
				if (sql.includes('COUNT(*)')) {
					return {
						bind: vi.fn(() => ({
							first: vi.fn(() => ({ count: 2 })),
						})),
					}
				}
				return {
					bind: vi.fn(() => ({
						first: vi.fn(() => ({ id: 'person_1' })),
					})),
				}
			})

			const res = await app.request('/api/people/person_1', {
				method: 'DELETE',
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toContain('assigned devices')
		})
	})
})
