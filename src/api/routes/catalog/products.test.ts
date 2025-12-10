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
import { beforeEach, describe, expect, test, vi } from 'vitest'
import productsRouter from './products'

// Mock types
interface MockEnv {
	DB: D1Database
	CLERK_SECRET_KEY: string
}

// Helper to create test app with mocked DB and context
function createTestApp(
	mockDb: D1Database,
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
		c.env = { DB: mockDb, CLERK_SECRET_KEY: 'test_secret' }
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
			const mockDb = {
				prepare: vi.fn(() => ({
					bind: vi.fn(() => ({
						all: vi.fn(async () => [
							{
								id: 'prod_1',
								brandId: 'brand_apple',
								brandName: 'Apple',
								name: 'MacBook Pro 14"',
								sku: 'MBP14-M3-512',
								productType: 'laptop',
								msrp: 1999,
								isActive: true,
							},
							{
								id: 'prod_2',
								brandId: 'brand_apple',
								brandName: 'Apple',
								name: 'MacBook Air 13"',
								sku: 'MBA13-M3-256',
								productType: 'laptop',
								msrp: 1299,
								isActive: true,
							},
						]),
					})),
				})),
			} as unknown as D1Database

			const app = createTestApp(mockDb, { isSysAdmin: false })
			const res = await app.request('/')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products).toBeDefined()
			expect(data.pagination).toBeDefined()
			expect(data.pagination.page).toBe(1)
			expect(data.pagination.limit).toBe(50)
		})

		test('should filter products by brand', async () => {
			const mockDb = {
				prepare: vi.fn(() => ({
					bind: vi.fn(() => ({
						all: vi.fn(async () => [
							{
								id: 'prod_1',
								brandId: 'brand_apple',
								brandName: 'Apple',
								name: 'MacBook Pro 14"',
								productType: 'laptop',
							},
						]),
					})),
				})),
			} as unknown as D1Database

			const app = createTestApp(mockDb, { isSysAdmin: false })
			const res = await app.request('/?brand=brand_apple')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products).toHaveLength(1)
			expect(data.products[0].brandId).toBe('brand_apple')
		})

		test('should filter products by type', async () => {
			const mockDb = {
				prepare: vi.fn(() => ({
					bind: vi.fn(() => ({
						all: vi.fn(async () => [
							{
								id: 'prod_1',
								brandId: 'brand_apple',
								brandName: 'Apple',
								name: 'MacBook Pro 14"',
								productType: 'laptop',
							},
						]),
					})),
				})),
			} as unknown as D1Database

			const app = createTestApp(mockDb, { isSysAdmin: false })
			const res = await app.request('/?type=laptop')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products).toHaveLength(1)
			expect(data.products[0].productType).toBe('laptop')
		})

		test('should support pagination', async () => {
			const mockDb = {
				prepare: vi.fn(() => ({
					bind: vi.fn(() => ({
						all: vi.fn(async () => [
							{ id: 'prod_1', name: 'Product 1' },
							{ id: 'prod_2', name: 'Product 2' },
						]),
					})),
				})),
			} as unknown as D1Database

			const app = createTestApp(mockDb, { isSysAdmin: false })
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
			const mockDb = {
				prepare: vi.fn(() => ({
					bind: vi.fn(() => ({
						run: vi.fn(async () => ({ success: true })),
						get: vi.fn(async () => ({
							id: 'brand_apple',
							name: 'Apple',
							slug: 'apple',
						})),
					})),
				})),
			} as unknown as D1Database

			// Override to return created product on second get
			let callCount = 0
			mockDb.prepare = vi.fn(() => ({
				bind: vi.fn(() => ({
					run: vi.fn(async () => ({ success: true })),
					get: vi.fn(async () => {
						callCount++
						if (callCount === 1) {
							// First call: check brand exists
							return {
								id: 'brand_apple',
								name: 'Apple',
								slug: 'apple',
							}
						}
						// Second call: return created product
						return {
							id: 'prod_123',
							brandId: 'brand_apple',
							brandName: 'Apple',
							name: 'MacBook Pro 14"',
							sku: 'MBP14-M3-512',
							productType: 'laptop',
							msrp: 1999,
							isActive: true,
							createdAt: '2024-12-10T00:00:00Z',
							updatedAt: '2024-12-10T00:00:00Z',
						}
					}),
				})),
			}))

			const app = createTestApp(mockDb, { isSysAdmin: true })
			const res = await app.request('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					brand_id: 'brand_apple',
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
			const mockDb = {} as unknown as D1Database

			const app = createTestApp(mockDb, { isSysAdmin: true })
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
			const mockDb = {
				prepare: vi.fn(() => ({
					bind: vi.fn(() => ({
						get: vi.fn(async () => null), // Brand not found
					})),
				})),
			} as unknown as D1Database

			const app = createTestApp(mockDb, { isSysAdmin: true })
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
			const mockDb = {
				prepare: vi.fn(() => ({
					bind: vi.fn(() => ({
						all: vi.fn(async () => [
							{
								id: 'prod_1',
								brandId: 'brand_apple',
								brandName: 'Apple',
								name: 'MacBook Pro 14"',
								sku: 'MBP14-M3-512',
							},
							{
								id: 'prod_2',
								brandId: 'brand_apple',
								brandName: 'Apple',
								name: 'MacBook Air 13"',
								sku: 'MBA13-M3-256',
							},
						]),
					})),
				})),
			} as unknown as D1Database

			const app = createTestApp(mockDb, { isSysAdmin: false })
			const res = await app.request('/?search=MacBook')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products).toHaveLength(2)
		})

		test('should search products by SKU', async () => {
			const mockDb = {
				prepare: vi.fn(() => ({
					bind: vi.fn(() => ({
						all: vi.fn(async () => [
							{
								id: 'prod_1',
								brandId: 'brand_apple',
								brandName: 'Apple',
								name: 'MacBook Pro 14"',
								sku: 'MBP14-M3-512',
							},
						]),
					})),
				})),
			} as unknown as D1Database

			const app = createTestApp(mockDb, { isSysAdmin: false })
			const res = await app.request('/?search=MBP14')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products).toHaveLength(1)
			expect(data.products[0].sku).toContain('MBP14')
		})
	})
})
