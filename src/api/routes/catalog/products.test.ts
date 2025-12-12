/**
 * Products API Tests
 *
 * Tests for catalog products endpoints following Gherkin BDD criteria.
 * @see tasks/catalog/catalog-api.md
 *
 * Coverage:
 * - @REQ-API-004: List products with filters
 * - @REQ-API-005: Create product (sys_admin only)
 * - @REQ-API-006: Search products by name or SKU
 */

import { Hono } from 'hono'
import { beforeEach, describe, expect, test } from 'vitest'
import productsRouter from './products'
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
	app.route('/', productsRouter)
	return app
}

/**
 * Feature: Catalog CRUD API Endpoints
 */
describe('Products API', () => {
	beforeEach(async () => {
		// Create fresh database with migrations for each test
		const dbResult = createTestDatabase()
		db = dbResult.db
		dbBinding = dbResult.d1

		// Seed test data
		await seedTestData(db)

		// Add additional test product
		await db.insert(schema.products).values({
			id: 'prod_test_macbook_air',
			brandId: 'brand_test_apple',
			name: 'MacBook Air 13"',
			modelIdentifier: 'MacBookAir10,1',
			sku: 'MBA-13-M2-2022',
			productType: 'laptop',
			description: 'Test MacBook Air',
			msrp: 1299.0,
			isActive: true,
		})
	})

	/**
	 * @REQ-API-004 @Products @List
	 * Scenario: List products with filters
	 *   Given the catalog has 20 products
	 *   When I GET "/api/catalog/products?brand=apple&type=laptop"
	 *   Then I should see only Apple laptops
	 *   And results should be paginated
	 */
	describe('@REQ-API-004 @Products @List - List products with filters', () => {
		test('should return all products without filters', async () => {
			const app = createTestApp({ isSysAdmin: false })
			const res = await app.request('/')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products).toBeDefined()
			expect(data.pagination).toBeDefined()
			expect(data.pagination.page).toBe(1)
			expect(data.pagination.limit).toBe(50)
		})

		test('should filter products by brand', async () => {
			const app = createTestApp({ isSysAdmin: false })
			const res = await app.request('/?brand=brand_test_apple')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products).toHaveLength(2)
			expect(data.products[0].brandId).toBe('brand_test_apple')
		})

		test('should filter products by type', async () => {
			const app = createTestApp({ isSysAdmin: false })
			const res = await app.request('/?type=laptop')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products).toHaveLength(2)
			expect(data.products[0].productType).toBe('laptop')
		})

		test('should support pagination', async () => {
			const app = createTestApp({ isSysAdmin: false })
			const res = await app.request('/?page=2&limit=10')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.pagination.page).toBe(2)
			expect(data.pagination.limit).toBe(10)
		})
	})

	/**
	 * @REQ-API-005 @Products @Create
	 * Scenario: Create product (sys_admin only)
	 *   Given I am a sys_admin
	 *   When I POST to "/api/catalog/products" with:
	 *     | name              | brand_id    | sku            | msrp   |
	 *     | MacBook Pro 14"   | brand_apple | MBP14-M3-512   | 1999   |
	 *   Then the response status should be 201
	 *   And the product should be created with specs
	 */
	describe('@REQ-API-005 @Products @Create - Create product (sys_admin only)', () => {
		test('should create a new product as sys_admin', async () => {
			const app = createTestApp({ isSysAdmin: true })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					brand_id: 'brand_test_apple',
					name: 'MacBook Pro 14"',
					sku: 'MBP14-M3-512',
					product_type: 'laptop',
					msrp: 1999,
					specs: { cpu: 'M3 Pro', memory: '16GB', storage: '512GB' },
				}),
			})
			const data = await res.json()

			expect(res.status).toBe(201)
			expect(data.product).toBeDefined()
			expect(data.product.name).toBe('MacBook Pro 14"')
			expect(data.product.sku).toBe('MBP14-M3-512')
		})

		test('should reject create with missing required fields', async () => {
			const app = createTestApp({ isSysAdmin: true })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'MacBook Pro 14"',
					// Missing brand_id, sku, product_type
				}),
			})
			const data = await res.json()

			expect(res.status).toBe(400)
			expect(data.error).toBe('Validation failed')
			expect(data.message).toContain('Missing required fields')
		})

		test('should reject create with invalid brand_id', async () => {
			const app = createTestApp({ isSysAdmin: true })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					brand_id: 'brand_nonexistent',
					name: 'MacBook Pro 14"',
					sku: 'MBP14-M3-512',
					product_type: 'laptop',
				}),
			})
			const data = await res.json()

			expect(res.status).toBe(400)
			expect(data.error).toBe('Validation failed')
			expect(data.message).toContain('Invalid brand_id')
		})
	})

	/**
	 * @REQ-API-006 @Products @Search
	 * Scenario: Search products by name or SKU
	 *   Given products exist with names "MacBook Pro", "MacBook Air"
	 *   When I GET "/api/catalog/products?search=MacBook"
	 *   Then I should see both products
	 *   When I GET "/api/catalog/products?search=MBP14"
	 *   Then I should see only "MacBook Pro 14""
	 */
	describe('@REQ-API-006 @Products @Search - Search products by name or SKU', () => {
		test('should search products by name', async () => {
			const app = createTestApp({ isSysAdmin: false })
			const res = await app.request('/?search=MacBook')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products.length).toBeGreaterThan(0)
		})

		test('should search products by SKU', async () => {
			const app = createTestApp({ isSysAdmin: false })
			const res = await app.request('/?search=MBA-13')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products.length).toBeGreaterThan(0)
			expect(data.products[0].sku).toContain('MBA-13')
		})
	})
})
