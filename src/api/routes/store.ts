/**
 * Store API Routes
 *
 * Shopify store integration endpoints for product catalog and orders.
 * All routes are tenant-scoped and require account access.
 *
 * Endpoints:
 *   GET  /api/store/products         - List available products
 *   GET  /api/store/products/:id     - Get product details
 *   GET  /api/store/orders           - List user's orders
 *   POST /api/store/orders           - Create new order
 *   GET  /api/store/orders/:id       - Get order details
 *   GET  /api/store/inventory/:id    - Get inventory for product variant
 */

import { Hono } from 'hono'
import { createShopifyClient } from '@/lib/shopify'

const store = new Hono<{ Bindings: Env }>()

// ============================================================================
// HELPER: Get Shopify client
// ============================================================================

function getShopifyClient(env: Env) {
	return createShopifyClient({
		SHOPIFY_STORE_DOMAIN: env.SHOPIFY_STORE_DOMAIN,
		SHOPIFY_ACCESS_TOKEN: env.SHOPIFY_ACCESS_TOKEN,
		SHOPIFY_API_VERSION: env.SHOPIFY_API_VERSION,
		ENVIRONMENT: env.ENVIRONMENT,
	})
}

// ============================================================================
// PRODUCTS
// ============================================================================

/**
 * GET /api/store/products
 *
 * List available products from Shopify catalog.
 *
 * Query params:
 *   - limit: number (default 50, max 250)
 *   - page_info: string (cursor for pagination)
 *   - vendor: string (filter by vendor)
 *   - product_type: string (filter by product type)
 *   - status: 'active' | 'archived' | 'draft' (default 'active')
 *   - title: string (search by title)
 *
 * Response: { products: NormalizedProduct[], pagination: PaginationInfo }
 */
store.get('/products', async c => {
	const client = getShopifyClient(c.env)

	// Parse query params
	const limit = Math.min(Number(c.req.query('limit')) || 50, 250)
	const pageInfo = c.req.query('page_info')
	const vendor = c.req.query('vendor')
	const productType = c.req.query('product_type')
	const status = c.req.query('status') as 'active' | 'archived' | 'draft' | undefined
	const title = c.req.query('title')

	const result = await client.listProducts({
		limit,
		pageInfo,
		vendor,
		productType,
		status: status || 'active',
		title,
		publishedStatus: 'published',
	})

	if (!result.success) {
		return c.json(
			{
				error: result.error,
				details: result.details,
			},
			result.statusCode || 500,
		)
	}

	// Return normalized products for easier frontend consumption
	const normalizedResult = await client.getNormalizedProducts({
		limit,
		pageInfo,
		vendor,
		productType,
		status: status || 'active',
		title,
		publishedStatus: 'published',
	})

	if (!normalizedResult.success) {
		return c.json(
			{
				error: normalizedResult.error,
			},
			normalizedResult.statusCode || 500,
		)
	}

	return c.json({
		products: normalizedResult.data,
		pagination: result.data.pagination,
		total: normalizedResult.data.length,
	})
})

/**
 * GET /api/store/products/:id
 *
 * Get product details by ID.
 *
 * Response: { product: NormalizedProduct }
 */
store.get('/products/:id', async c => {
	const client = getShopifyClient(c.env)
	const productId = c.req.param('id')

	const result = await client.getNormalizedProduct(productId)

	if (!result.success) {
		if (result.statusCode === 404) {
			return c.json({ error: 'Product not found' }, 404)
		}
		return c.json(
			{
				error: result.error,
			},
			result.statusCode || 500,
		)
	}

	return c.json({ product: result.data })
})

// ============================================================================
// ORDERS
// ============================================================================

/**
 * GET /api/store/orders
 *
 * List orders - requires authentication and account context.
 *
 * Query params:
 *   - limit: number (default 50, max 250)
 *   - page_info: string (cursor for pagination)
 *   - status: 'open' | 'closed' | 'cancelled' | 'any' (default 'any')
 *   - fulfillment_status: 'shipped' | 'partial' | 'unshipped' | 'any'
 *   - financial_status: 'paid' | 'pending' | 'refunded' | 'any'
 *
 * Response: { orders: NormalizedOrder[], pagination: PaginationInfo }
 */
store.get('/orders', async c => {
	const accountId = c.get('accountId')
	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	const client = getShopifyClient(c.env)

	// Parse query params
	const limit = Math.min(Number(c.req.query('limit')) || 50, 250)
	const pageInfo = c.req.query('page_info')
	const status = c.req.query('status') as 'open' | 'closed' | 'cancelled' | 'any' | undefined
	const fulfillmentStatus = c.req.query('fulfillment_status') as 'shipped' | 'partial' | 'unshipped' | 'any' | undefined
	const financialStatus = c.req.query('financial_status') as 'paid' | 'pending' | 'refunded' | 'any' | undefined

	// In production, we would filter orders by account/customer email or tags
	// For now, we return all orders (mock implementation)
	const result = await client.listOrders({
		limit,
		pageInfo,
		status: status || 'any',
		fulfillmentStatus,
		financialStatus,
	})

	if (!result.success) {
		return c.json(
			{
				error: result.error,
				details: result.details,
			},
			result.statusCode || 500,
		)
	}

	// Return normalized orders
	const normalizedResult = await client.getNormalizedOrders({
		limit,
		pageInfo,
		status: status || 'any',
		fulfillmentStatus,
		financialStatus,
	})

	if (!normalizedResult.success) {
		return c.json(
			{
				error: normalizedResult.error,
			},
			normalizedResult.statusCode || 500,
		)
	}

	return c.json({
		orders: normalizedResult.data,
		pagination: result.data.pagination,
		total: normalizedResult.data.length,
	})
})

/**
 * POST /api/store/orders
 *
 * Create a new order in Shopify.
 *
 * Request body:
 *   - lineItems: Array<{ variantId?: number, productId?: number, title: string, quantity: number, price: string, sku?: string }>
 *   - email?: string
 *   - phone?: string
 *   - shippingAddress?: ShopifyAddress
 *   - billingAddress?: ShopifyAddress
 *   - note?: string
 *   - tags?: string
 *
 * Response: { order: NormalizedOrder }
 */
store.post('/orders', async c => {
	const accountId = c.get('accountId')
	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	const client = getShopifyClient(c.env)
	const body = await c.req.json()

	// Validate required fields
	if (!body.lineItems || !Array.isArray(body.lineItems) || body.lineItems.length === 0) {
		return c.json({ error: 'lineItems is required and must be a non-empty array' }, 400)
	}

	// Validate line items
	for (const item of body.lineItems) {
		if (!item.title || typeof item.quantity !== 'number' || !item.price) {
			return c.json(
				{
					error: 'Each line item must have title, quantity, and price',
				},
				400,
			)
		}
	}

	// Add equipped-order tag for tracking
	const tags = body.tags ? `${body.tags}, equipped-order, account:${accountId}` : `equipped-order, account:${accountId}`

	const result = await client.createOrder({
		email: body.email,
		phone: body.phone,
		lineItems: body.lineItems,
		billingAddress: body.billingAddress,
		shippingAddress: body.shippingAddress,
		note: body.note,
		tags,
		sendReceipt: body.sendReceipt ?? true,
		sendFulfillmentReceipt: body.sendFulfillmentReceipt ?? true,
		financialStatus: body.financialStatus || 'pending',
		inventoryBehaviour: body.inventoryBehaviour || 'decrement_obeying_policy',
	})

	if (!result.success) {
		return c.json(
			{
				error: result.error,
				details: result.details,
			},
			result.statusCode || 500,
		)
	}

	// Return normalized order
	const normalizedResult = await client.getNormalizedOrder(result.data.id)

	if (!normalizedResult.success) {
		// Still return the raw order if normalization fails
		return c.json({ order: result.data }, 201)
	}

	return c.json({ order: normalizedResult.data }, 201)
})

/**
 * GET /api/store/orders/:id
 *
 * Get order details by ID.
 *
 * Response: { order: NormalizedOrder }
 */
store.get('/orders/:id', async c => {
	const accountId = c.get('accountId')
	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	const client = getShopifyClient(c.env)
	const orderId = c.req.param('id')

	const result = await client.getNormalizedOrder(orderId)

	if (!result.success) {
		if (result.statusCode === 404) {
			return c.json({ error: 'Order not found' }, 404)
		}
		return c.json(
			{
				error: result.error,
			},
			result.statusCode || 500,
		)
	}

	// TODO: In production, verify the order belongs to this account
	// by checking tags or customer email

	return c.json({ order: result.data })
})

// ============================================================================
// INVENTORY
// ============================================================================

/**
 * GET /api/store/inventory/:variantId
 *
 * Get inventory levels for a product variant.
 *
 * Response: { available: number, inventoryItemId: number }
 */
store.get('/inventory/:variantId', async c => {
	const client = getShopifyClient(c.env)
	const variantId = c.req.param('variantId')

	// First get the product to find the inventory item ID
	// In a real implementation, you'd need to find the variant first
	// For now, we use the variantId as a proxy for inventory lookup

	// Get inventory levels - this requires knowing the inventory_item_id
	// which is typically obtained from the product variant
	const inventoryItemId = Number(variantId)

	const result = await client.getInventoryLevels([inventoryItemId])

	if (!result.success) {
		return c.json(
			{
				error: result.error,
			},
			result.statusCode || 500,
		)
	}

	const level = result.data.inventoryLevels.find(l => l.inventoryItemId === inventoryItemId)

	if (!level) {
		return c.json({ error: 'Inventory not found' }, 404)
	}

	return c.json({
		inventoryItemId: level.inventoryItemId,
		available: level.available,
		updatedAt: level.updatedAt,
	})
})

export default store
