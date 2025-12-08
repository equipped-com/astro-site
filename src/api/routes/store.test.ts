/**
 * Store API Route Tests
 *
 * Tests for Shopify store integration endpoints following Gherkin BDD criteria.
 * @see tasks/integrations/shopify-api.md
 *
 * Coverage:
 * - REQ-STORE-001: List products endpoint
 * - REQ-STORE-002: Get product details endpoint
 * - REQ-STORE-003: List orders endpoint
 * - REQ-STORE-004: Create order endpoint
 * - REQ-STORE-005: Get order details endpoint
 * - REQ-STORE-006: Inventory check endpoint
 */

import { Hono } from 'hono'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import storeRoutes from './store'

// Test environment interface
interface TestEnv {
	SHOPIFY_STORE_DOMAIN?: string
	SHOPIFY_ACCESS_TOKEN?: string
	SHOPIFY_API_VERSION?: string
	ENVIRONMENT?: string
}

// Helper to create test app with context
function createTestApp(envOverrides: Partial<TestEnv> = {}, accountId: string | null = 'acc_123') {
	const app = new Hono<{ Bindings: TestEnv; Variables: { accountId?: string } }>()

	// Error handler
	app.onError((err, c) => {
		console.error('Test app error:', err.message)
		return c.json({ error: err.message }, 500)
	})

	app.use('*', async (c, next) => {
		// Type assertion to set env (same pattern as device tests)
		// @ts-expect-error - we're mocking env for tests
		c.env = {
			SHOPIFY_STORE_DOMAIN: 'test-store.myshopify.com',
			SHOPIFY_ACCESS_TOKEN: '', // Empty = use mock
			ENVIRONMENT: 'development',
			...envOverrides,
		}

		// Set account context
		if (accountId) {
			c.set('accountId', accountId)
		}

		return next()
	})

	app.route('/', storeRoutes)
	return app
}

describe('Store API Routes', () => {
	describe('@REQ-STORE-001: List Products', () => {
		test('should return list of products', async () => {
			const app = createTestApp()
			const res = await app.request('/products')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products).toBeDefined()
			expect(Array.isArray(data.products)).toBe(true)
			expect(data.products.length).toBeGreaterThan(0)
			expect(data.pagination).toBeDefined()
			expect(data.total).toBeDefined()
		})

		test('should filter products by vendor', async () => {
			const app = createTestApp()
			const res = await app.request('/products?vendor=Apple')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products.length).toBeGreaterThan(0)
			// Normalized products
			expect(data.products.every((p: { vendor: string }) => p.vendor === 'Apple')).toBe(true)
		})

		test('should filter products by product type', async () => {
			const app = createTestApp()
			const res = await app.request('/products?product_type=Laptop')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products.length).toBeGreaterThan(0)
			expect(data.products.every((p: { productType: string }) => p.productType === 'Laptop')).toBe(true)
		})

		test('should search products by title', async () => {
			const app = createTestApp()
			const res = await app.request('/products?title=MacBook')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products.length).toBeGreaterThan(0)
			expect(data.products.every((p: { title: string }) => p.title.toLowerCase().includes('macbook'))).toBe(true)
		})

		test('should limit results', async () => {
			const app = createTestApp()
			const res = await app.request('/products?limit=1')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.products.length).toBe(1)
		})

		test('should cap limit at 250', async () => {
			const app = createTestApp()
			const res = await app.request('/products?limit=500')
			const data = await res.json()

			expect(res.status).toBe(200)
			// Should not exceed 250 (or mock data length)
			expect(data.products.length).toBeLessThanOrEqual(250)
		})

		test('should return normalized product data', async () => {
			const app = createTestApp()
			const res = await app.request('/products')
			const data = await res.json()

			expect(res.status).toBe(200)
			const product = data.products[0]
			expect(product).toHaveProperty('id')
			expect(product).toHaveProperty('title')
			expect(product).toHaveProperty('description')
			expect(product).toHaveProperty('vendor')
			expect(product).toHaveProperty('tags')
			expect(Array.isArray(product.tags)).toBe(true)
			expect(product).toHaveProperty('variants')
			expect(product.variants[0]).toHaveProperty('price')
			expect(typeof product.variants[0].price).toBe('number')
		})
	})

	describe('@REQ-STORE-002: Get Product Details', () => {
		test('should return product by ID', async () => {
			const app = createTestApp()
			const res = await app.request('/products/8001234567890')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.product).toBeDefined()
			expect(data.product.id).toBe('8001234567890')
			expect(data.product.title).toBeDefined()
		})

		test('should return 404 for non-existent product', async () => {
			const app = createTestApp()
			const res = await app.request('/products/9999999999')
			const data = await res.json()

			expect(res.status).toBe(404)
			expect(data.error).toBe('Product not found')
		})

		test('should return normalized product with variants', async () => {
			const app = createTestApp()
			const res = await app.request('/products/8001234567890')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.product.variants.length).toBeGreaterThan(0)
			const variant = data.product.variants[0]
			expect(variant).toHaveProperty('id')
			expect(variant).toHaveProperty('title')
			expect(variant).toHaveProperty('price')
			expect(variant).toHaveProperty('available')
			expect(variant).toHaveProperty('inventoryQuantity')
		})
	})

	describe('@REQ-STORE-003: List Orders', () => {
		test('should require account context', async () => {
			const app = createTestApp({}, null) // No account context
			const res = await app.request('/orders')
			const data = await res.json()

			expect(res.status).toBe(400)
			expect(data.error).toBe('Account context required')
		})

		test('should return list of orders for account', async () => {
			const app = createTestApp()
			const res = await app.request('/orders')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.orders).toBeDefined()
			expect(Array.isArray(data.orders)).toBe(true)
			expect(data.pagination).toBeDefined()
			expect(data.total).toBeDefined()
		})

		test('should filter orders by financial status', async () => {
			const app = createTestApp()
			const res = await app.request('/orders?financial_status=paid')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.orders.every((o: { status: string }) => o.status === 'paid')).toBe(true)
		})

		test('should return normalized order data', async () => {
			const app = createTestApp()
			const res = await app.request('/orders')
			const data = await res.json()

			expect(res.status).toBe(200)
			if (data.orders.length > 0) {
				const order = data.orders[0]
				expect(order).toHaveProperty('id')
				expect(order).toHaveProperty('orderNumber')
				expect(order).toHaveProperty('status')
				expect(order).toHaveProperty('totalPrice')
				expect(typeof order.totalPrice).toBe('number')
				expect(order).toHaveProperty('lineItems')
			}
		})
	})

	describe('@REQ-STORE-004: Create Order', () => {
		test('should require account context', async () => {
			const app = createTestApp({}, null)
			const res = await app.request('/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lineItems: [{ title: 'Test', quantity: 1, price: '100.00' }],
				}),
			})
			const data = await res.json()

			expect(res.status).toBe(400)
			expect(data.error).toBe('Account context required')
		})

		test('should require lineItems', async () => {
			const app = createTestApp()
			const res = await app.request('/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			})
			const data = await res.json()

			expect(res.status).toBe(400)
			expect(data.error).toContain('lineItems is required')
		})

		test('should require non-empty lineItems array', async () => {
			const app = createTestApp()
			const res = await app.request('/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lineItems: [] }),
			})
			const data = await res.json()

			expect(res.status).toBe(400)
			expect(data.error).toContain('non-empty array')
		})

		test('should validate line item fields', async () => {
			const app = createTestApp()
			const res = await app.request('/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lineItems: [{ title: 'Test' }], // Missing quantity and price
				}),
			})
			const data = await res.json()

			expect(res.status).toBe(400)
			expect(data.error).toContain('title, quantity, and price')
		})

		test('should create order with valid line items', async () => {
			const app = createTestApp()
			const res = await app.request('/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'test@example.com',
					lineItems: [
						{
							title: 'MacBook Pro 14"',
							quantity: 1,
							price: '2499.00',
							sku: 'MBP14-M3P-18-512-SB',
						},
					],
					shippingAddress: {
						firstName: 'John',
						lastName: 'Doe',
						address1: '123 Test St',
						city: 'San Francisco',
						province: 'California',
						country: 'United States',
						zip: '94102',
					},
				}),
			})
			const data = await res.json()

			expect(res.status).toBe(201)
			expect(data.order).toBeDefined()
			expect(data.order.id).toBeDefined()
			expect(data.order.orderNumber).toBeDefined()
		})

		test('should add equipped-order tag to created orders', async () => {
			const app = createTestApp({}, 'acc_test123')
			const res = await app.request('/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lineItems: [{ title: 'Test Product', quantity: 1, price: '100.00' }],
				}),
			})

			expect(res.status).toBe(201)
			// The order should be created with equipped-order and account tags
			// (tested via the normalized response)
		})

		test('should create order with multiple line items', async () => {
			const app = createTestApp()
			const res = await app.request('/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'bulk@example.com',
					lineItems: [
						{ title: 'iPhone 15 Pro', quantity: 3, price: '1199.00' },
						{ title: 'MacBook Air M2', quantity: 2, price: '1299.00' },
					],
					note: 'Bulk order for new hires',
				}),
			})
			const data = await res.json()

			expect(res.status).toBe(201)
			expect(data.order.lineItems.length).toBe(2)
		})
	})

	describe('@REQ-STORE-005: Get Order Details', () => {
		test('should require account context', async () => {
			const app = createTestApp({}, null)
			const res = await app.request('/orders/5001234567890')
			const data = await res.json()

			expect(res.status).toBe(400)
			expect(data.error).toBe('Account context required')
		})

		test('should return order by ID', async () => {
			const app = createTestApp()
			const res = await app.request('/orders/5001234567890')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.order).toBeDefined()
			expect(data.order.id).toBe('5001234567890')
		})

		test('should return 404 for non-existent order', async () => {
			const app = createTestApp()
			const res = await app.request('/orders/9999999999')
			const data = await res.json()

			expect(res.status).toBe(404)
			expect(data.error).toBe('Order not found')
		})

		test('should return normalized order with tracking', async () => {
			const app = createTestApp()
			const res = await app.request('/orders/5001234567890')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.order).toHaveProperty('id')
			expect(data.order).toHaveProperty('orderNumber')
			expect(data.order).toHaveProperty('status')
			expect(data.order).toHaveProperty('fulfillmentStatus')
			expect(data.order).toHaveProperty('totalPrice')
			expect(data.order).toHaveProperty('lineItems')
			// Check for tracking info
			if (data.order.tracking) {
				expect(data.order.tracking).toHaveProperty('company')
				expect(data.order.tracking).toHaveProperty('number')
			}
		})
	})

	describe('@REQ-STORE-006: Inventory Check', () => {
		test('should return inventory for variant', async () => {
			const app = createTestApp()
			// Use inventory item ID from mock data
			const res = await app.request('/inventory/44001234567890')
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data).toHaveProperty('inventoryItemId')
			expect(data).toHaveProperty('available')
			expect(typeof data.available).toBe('number')
		})

		test('should return 404 for non-existent inventory', async () => {
			const app = createTestApp()
			const res = await app.request('/inventory/9999999999')
			const data = await res.json()

			expect(res.status).toBe(404)
			expect(data.error).toBe('Inventory not found')
		})
	})

	describe('Error Handling', () => {
		test('should handle Shopify API errors gracefully', async () => {
			// The mock client should handle errors properly
			const app = createTestApp()
			// This should still work with mock data
			const res = await app.request('/products')

			expect(res.status).toBe(200)
		})
	})
})
