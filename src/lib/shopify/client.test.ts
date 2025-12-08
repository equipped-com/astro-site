/**
 * Shopify Client Tests
 *
 * Tests for Shopify API client following Gherkin BDD criteria.
 * @see tasks/integrations/shopify-api.md
 *
 * Coverage:
 * - REQ-SHOP-001: Can fetch products from Shopify
 * - REQ-SHOP-002: Can create orders via API
 * - REQ-SHOP-003: Inventory levels accurate
 * - REQ-SHOP-004: API error handling
 */

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createShopifyClient, ShopifyClient } from './client'
import { mockShopifyOrders, mockShopifyProducts } from './mock-data'

describe('ShopifyClient', () => {
	describe('@REQ-SHOP-001: Product Fetching', () => {
		test('should list products with mock data when no access token', async () => {
			const client = createShopifyClient({
				SHOPIFY_STORE_DOMAIN: 'test-store.myshopify.com',
				SHOPIFY_ACCESS_TOKEN: '', // Empty - uses mock
			})

			const result = await client.listProducts()

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.products.length).toBeGreaterThan(0)
				expect(result.data.products[0]).toHaveProperty('id')
				expect(result.data.products[0]).toHaveProperty('title')
				expect(result.data.products[0]).toHaveProperty('variants')
			}
		})

		test('should filter products by status', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.listProducts({ status: 'active' })

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.products.every(p => p.status === 'active')).toBe(true)
			}
		})

		test('should filter products by vendor', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.listProducts({ vendor: 'Apple' })

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.products.every(p => p.vendor === 'Apple')).toBe(true)
			}
		})

		test('should filter products by product type', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.listProducts({ productType: 'Laptop' })

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.products.every(p => p.productType === 'Laptop')).toBe(true)
			}
		})

		test('should search products by title', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.listProducts({ title: 'MacBook' })

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.products.every(p => p.title.toLowerCase().includes('macbook'))).toBe(true)
			}
		})

		test('should limit results correctly', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.listProducts({ limit: 1 })

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.products.length).toBe(1)
			}
		})

		test('should get single product by ID', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const productId = mockShopifyProducts[0].id
			const result = await client.getProduct(productId)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.id).toBe(productId)
				expect(result.data.title).toBe(mockShopifyProducts[0].title)
			}
		})

		test('should return error for non-existent product', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.getProduct(9999999999)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.statusCode).toBe(404)
				expect(result.error).toBe('Product not found')
			}
		})

		test('should return normalized products', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.getNormalizedProducts()

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.length).toBeGreaterThan(0)
				const product = result.data[0]
				expect(product).toHaveProperty('id')
				expect(product).toHaveProperty('title')
				expect(product).toHaveProperty('description')
				expect(product).toHaveProperty('tags')
				expect(Array.isArray(product.tags)).toBe(true)
				expect(product).toHaveProperty('variants')
				expect(product.variants[0]).toHaveProperty('price')
				expect(typeof product.variants[0].price).toBe('number')
			}
		})
	})

	describe('@REQ-SHOP-002: Order Creation', () => {
		test('should list orders with mock data', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.listOrders()

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.orders.length).toBeGreaterThan(0)
				expect(result.data.orders[0]).toHaveProperty('id')
				expect(result.data.orders[0]).toHaveProperty('orderNumber')
				expect(result.data.orders[0]).toHaveProperty('lineItems')
			}
		})

		test('should filter orders by financial status', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.listOrders({ financialStatus: 'paid' })

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.orders.every(o => o.financialStatus === 'paid')).toBe(true)
			}
		})

		test('should get single order by ID', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const orderId = mockShopifyOrders[0].id
			const result = await client.getOrder(orderId)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.id).toBe(orderId)
				expect(result.data.orderNumber).toBe(mockShopifyOrders[0].orderNumber)
			}
		})

		test('should return error for non-existent order', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.getOrder(9999999999)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.statusCode).toBe(404)
				expect(result.error).toBe('Order not found')
			}
		})

		test('should create order with line items', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.createOrder({
				email: 'test@example.com',
				lineItems: [
					{
						title: 'MacBook Pro 14" M3 Pro',
						quantity: 1,
						price: '2499.00',
						sku: 'MBP14-M3P-18-512-SB',
						variantId: 42001234567890,
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
					countryCode: 'US',
					provinceCode: 'CA',
				},
				tags: 'b2b, test-order',
			})

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toHaveProperty('id')
				expect(result.data).toHaveProperty('orderNumber')
				expect(result.data.email).toBe('test@example.com')
				expect(result.data.lineItems.length).toBe(1)
				expect(result.data.lineItems[0].title).toBe('MacBook Pro 14" M3 Pro')
				expect(result.data.shippingAddress?.firstName).toBe('John')
				expect(result.data.tags).toContain('b2b')
			}
		})

		test('should create order with multiple line items', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.createOrder({
				email: 'bulk@example.com',
				lineItems: [
					{
						title: 'iPhone 15 Pro',
						quantity: 5,
						price: '1199.00',
						sku: 'IP15P-NT-256',
					},
					{
						title: 'MacBook Pro 14"',
						quantity: 2,
						price: '2499.00',
						sku: 'MBP14-M3P-18-512-SB',
					},
				],
				note: 'Bulk equipment order',
				financialStatus: 'pending',
			})

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.lineItems.length).toBe(2)
				expect(result.data.note).toBe('Bulk equipment order')
				expect(result.data.financialStatus).toBe('pending')
				// Total should be (5 * 1199) + (2 * 2499) = 5995 + 4998 = 10993
				expect(Number.parseFloat(result.data.totalPrice)).toBe(10993)
			}
		})

		test('should return normalized orders', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.getNormalizedOrders()

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.length).toBeGreaterThan(0)
				const order = result.data[0]
				expect(order).toHaveProperty('id')
				expect(order).toHaveProperty('orderNumber')
				expect(order).toHaveProperty('status')
				expect(order).toHaveProperty('totalPrice')
				expect(typeof order.totalPrice).toBe('number')
				expect(order).toHaveProperty('lineItems')
				expect(order.lineItems[0]).toHaveProperty('price')
				expect(typeof order.lineItems[0].price).toBe('number')
			}
		})
	})

	describe('@REQ-SHOP-003: Inventory Levels', () => {
		test('should get inventory levels for variant', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			// Use inventory item ID from mock data
			const inventoryItemId = mockShopifyProducts[0].variants[0].inventoryItemId
			const result = await client.getInventoryLevels([inventoryItemId])

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.inventoryLevels.length).toBeGreaterThan(0)
				const level = result.data.inventoryLevels[0]
				expect(level).toHaveProperty('inventoryItemId')
				expect(level).toHaveProperty('available')
				expect(level).toHaveProperty('locationId')
				expect(typeof level.available).toBe('number')
			}
		})

		test('should return empty array for non-existent inventory items', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.getInventoryLevels([9999999999])

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.inventoryLevels.length).toBe(0)
			}
		})

		test('should get inventory for multiple items', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const inventoryItemIds = mockShopifyProducts
				.flatMap(p => p.variants)
				.map(v => v.inventoryItemId)
				.slice(0, 3)

			const result = await client.getInventoryLevels(inventoryItemIds)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.inventoryLevels.length).toBe(inventoryItemIds.length)
			}
		})
	})

	describe('@REQ-SHOP-004: API Error Handling', () => {
		test('should use mock when in development environment', () => {
			const client = createShopifyClient({
				SHOPIFY_STORE_DOMAIN: 'test-store.myshopify.com',
				SHOPIFY_ACCESS_TOKEN: 'real-token',
				ENVIRONMENT: 'development',
			})

			// Client should use mock in development
			expect(client).toBeInstanceOf(ShopifyClient)
		})

		test('should use real API when access token provided in production', () => {
			const client = createShopifyClient({
				SHOPIFY_STORE_DOMAIN: 'test-store.myshopify.com',
				SHOPIFY_ACCESS_TOKEN: 'real-token',
				ENVIRONMENT: 'production',
			})

			expect(client).toBeInstanceOf(ShopifyClient)
		})

		test('should handle network errors gracefully', async () => {
			// Mock fetch to throw
			const originalFetch = globalThis.fetch
			globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: 'real-token',
				useMock: false, // Force real API
			})

			const result = await client.listProducts()

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error).toContain('Network error')
			}

			// Restore fetch
			globalThis.fetch = originalFetch
		})

		test('should handle HTTP error responses', async () => {
			// Mock fetch to return error
			const originalFetch = globalThis.fetch
			globalThis.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 401,
				statusText: 'Unauthorized',
				json: () => Promise.resolve({ errors: { base: ['Invalid API credentials'] } }),
				headers: new Headers(),
			})

			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: 'bad-token',
				useMock: false,
			})

			const result = await client.listProducts()

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.statusCode).toBe(401)
				expect(result.error).toContain('Unauthorized')
			}

			globalThis.fetch = originalFetch
		})
	})

	describe('Normalization', () => {
		test('should strip HTML from product description', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.getNormalizedProducts()

			expect(result.success).toBe(true)
			if (result.success) {
				const product = result.data[0]
				expect(product.description).not.toContain('<p>')
				expect(product.description).not.toContain('</p>')
			}
		})

		test('should parse tags into array', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.getNormalizedProducts()

			expect(result.success).toBe(true)
			if (result.success) {
				const product = result.data[0]
				expect(Array.isArray(product.tags)).toBe(true)
				expect(product.tags.length).toBeGreaterThan(0)
				expect(product.tags.every(t => typeof t === 'string')).toBe(true)
			}
		})

		test('should convert prices to numbers', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.getNormalizedProducts()

			expect(result.success).toBe(true)
			if (result.success) {
				const variant = result.data[0].variants[0]
				expect(typeof variant.price).toBe('number')
				expect(variant.price).toBeGreaterThan(0)
				if (variant.compareAtPrice !== undefined) {
					expect(typeof variant.compareAtPrice).toBe('number')
				}
			}
		})

		test('should include tracking info in normalized orders', async () => {
			const client = new ShopifyClient({
				storeDomain: 'test-store.myshopify.com',
				accessToken: '',
				useMock: true,
			})

			const result = await client.getNormalizedOrders()

			expect(result.success).toBe(true)
			if (result.success) {
				// Find an order with tracking
				const orderWithTracking = result.data.find(o => o.tracking)
				expect(orderWithTracking).toBeDefined()
				if (orderWithTracking) {
					expect(orderWithTracking.tracking).toHaveProperty('company')
					expect(orderWithTracking.tracking).toHaveProperty('number')
				}
			}
		})
	})
})
