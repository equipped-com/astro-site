/**
 * Inventory API Tests
 *
 * Tests for catalog inventory endpoints following Gherkin BDD criteria.
 * @see tasks/catalog/catalog-api.md
 *
 * Coverage:
 * - @REQ-API-007: List inventory items (sys_admin only)
 * - @REQ-API-008: Add inventory item
 * - @REQ-API-009: Update inventory status
 */

import { Hono } from 'hono'
import { beforeEach, describe, expect, test } from 'vitest'
import inventoryRouter from './inventory'
import { createTestDatabase, seedTestData } from '@/test/drizzle-helpers'
import * as schema from '@/db/schema'
import type { D1Database } from '@miniflare/d1'

// Mock types
interface MockEnv {
	DB: D1Database
	CLERK_SECRET_KEY: string
}

let db: ReturnType<typeof createTestDatabase>['db']
let dbBinding: D1Database

// Helper to create test app with real database and context
function createTestApp(
	options: {
		isSysAdmin?: boolean
		userId?: string
	} = {},
) {
	const { isSysAdmin = false, userId = 'user_alice' } = options

	const app = new Hono<{
		Bindings: MockEnv
		Variables: {
			userId?: string
			sessionId?: string
			sysAdmin?: boolean
			user?: { id: string; email: string; first_name?: string; last_name?: string }
		}
	}>()

	// Error handler
	app.onError((err, c) => {
		console.error('Test app error:', err.message, err.stack)
		return c.json({ error: err.message }, 500)
	})

	app.use('*', async (c, next) => {
		// @ts-expect-error - mocking env
		c.env = { DB: dbBinding, CLERK_SECRET_KEY: 'test_secret' }
		c.set('userId', userId)
		c.set('sessionId', 'session_123')

		if (isSysAdmin) {
			c.set('sysAdmin', true)
			c.set('user', {
				id: userId,
				email: 'admin@tryequipped.com',
				first_name: 'Admin',
				last_name: 'User',
			})
		} else {
			c.set('user', {
				id: userId,
				email: 'user@example.com',
				first_name: 'Regular',
				last_name: 'User',
			})
		}

		return next()
	})
	app.route('/', inventoryRouter)
	return app
}

/**
 * Feature: Catalog CRUD API Endpoints
 */
describe('Inventory API', () => {
	beforeEach(async () => {
		// Create fresh database with migrations for each test
		const dbResult = createTestDatabase()
		db = dbResult.db
		dbBinding = dbResult.d1

		// Seed test data
		await seedTestData(db)

		// Add test inventory item
		await db.insert(schema.inventoryItems).values({
			id: 'inv_test_001',
			productId: 'prod_test_macbook',
			serialNumber: 'C02XJ0XHJG5H',
			condition: 'new',
			status: 'available',
			purchaseCost: 2000,
			salePrice: 2499,
			warehouseLocation: 'A1-B2-C3',
			notes: 'Brand new in box',
		})
	})

	/**
	 * @REQ-API-007 @Inventory @List
	 * Scenario: List inventory items (sys_admin only)
	 *   Given I am a sys_admin
	 *   When I GET "/api/catalog/inventory?status=available"
	 *   Then I should see all available inventory items
	 *   And each should include serial_number, condition, location
	 */
	describe('@REQ-API-007 @Inventory @List - List inventory items (sys_admin only)', () => {
		test('should return all inventory items as sys_admin', async () => {
			const app = createTestApp({ isSysAdmin: true })
			const res = await app.request('/')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.items).toHaveLength(1)
			expect(data.items[0]).toHaveProperty('serialNumber')
			expect(data.items[0]).toHaveProperty('condition')
			expect(data.items[0]).toHaveProperty('warehouseLocation')
		})

		test('should filter inventory by status', async () => {
			const app = createTestApp({ isSysAdmin: true })
			const res = await app.request('/?status=available')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.items).toHaveLength(1)
			expect(data.items[0].status).toBe('available')
		})

		test('should filter inventory by condition', async () => {
			const app = createTestApp({ isSysAdmin: true })
			const res = await app.request('/?condition=new')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.items).toHaveLength(1)
			expect(data.items[0].condition).toBe('new')
		})

		test('should filter inventory by product_id', async () => {
			const app = createTestApp({ isSysAdmin: true })
			const res = await app.request('/?product_id=prod_test_macbook')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.items).toHaveLength(1)
			expect(data.items[0].productId).toBe('prod_test_macbook')
		})
	})

	/**
	 * @REQ-API-008 @Inventory @Create
	 * Scenario: Add inventory item
	 *   Given I am a sys_admin
	 *   And product "MacBook Pro 14"" exists
	 *   When I POST to "/api/catalog/inventory" with:
	 *     | product_id | serial_number | condition | status    |
	 *     | prod_123   | C02XYZ123ABC  | new       | available |
	 *   Then the response status should be 201
	 *   And the inventory item should be created
	 */
	describe('@REQ-API-008 @Inventory @Create - Add inventory item', () => {
		test('should create a new inventory item as sys_admin', async () => {
			const app = createTestApp({ isSysAdmin: true })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					product_id: 'prod_test_macbook',
					serial_number: 'C02XYZ123ABC',
					condition: 'new',
					status: 'available',
				}),
			})
			const data = await res.json()

			expect(res.status).toBe(201)
			expect(data.item).toBeDefined()
			expect(data.item.serialNumber).toBe('C02XYZ123ABC')
			expect(data.item.condition).toBe('new')
			expect(data.item.status).toBe('available')
		})

		test('should reject create with missing required fields', async () => {
			const app = createTestApp({ isSysAdmin: true })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					product_id: 'prod_test_macbook',
					// Missing condition and status
				}),
			})
			const data = await res.json()

			expect(res.status).toBe(400)
			expect(data.error).toBe('Validation failed')
			expect(data.message).toContain('Missing required fields')
		})

		test('should reject create with invalid product_id', async () => {
			const app = createTestApp({ isSysAdmin: true })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					product_id: 'prod_nonexistent',
					condition: 'new',
					status: 'available',
				}),
			})
			const data = await res.json()

			expect(res.status).toBe(400)
			expect(data.error).toBe('Validation failed')
			expect(data.message).toContain('Invalid product_id')
		})
	})

	/**
	 * @REQ-API-009 @Inventory @Update
	 * Scenario: Update inventory status
	 *   Given an inventory item with status "available"
	 *   When I PUT "/api/catalog/inventory/:id" with status "sold"
	 *   Then the status should update to "sold"
	 *   And updated_at should be refreshed
	 */
	describe('@REQ-API-009 @Inventory @Update - Update inventory status', () => {
		test('should update inventory item status as sys_admin', async () => {
			const app = createTestApp({ isSysAdmin: true })
			const res = await app.request('/inv_test_001', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: 'sold',
				}),
			})
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.item).toBeDefined()
			expect(data.item.status).toBe('sold')
			expect(data.item.updatedAt).toBeDefined()
		})

		test('should return 404 for non-existent inventory item', async () => {
			const app = createTestApp({ isSysAdmin: true })
			const res = await app.request('/inv_nonexistent', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: 'sold',
				}),
			})
			const data = await res.json()

			expect(res.status).toBe(404)
			expect(data.error).toBe('Not found')
			expect(data.message).toContain('Inventory item not found')
		})

		test('should update multiple fields at once', async () => {
			const app = createTestApp({ isSysAdmin: true })
			const res = await app.request('/inv_test_001', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: 'reserved',
					condition: 'like_new',
					notes: 'Reserved for customer',
					warehouse_location: 'B3-C4-D5',
				}),
			})
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.item.status).toBe('reserved')
			expect(data.item.condition).toBe('like_new')
			expect(data.item.notes).toBe('Reserved for customer')
		})
	})
})
