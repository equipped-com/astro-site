/**
 * Shopify API Client
 *
 * Handles communication with Shopify Admin REST API for product catalog and orders.
 * In production, uses real API endpoints with proper authentication.
 * For development, uses mock data to simulate the API behavior.
 *
 * @see https://shopify.dev/docs/api/admin-rest
 */

import { mockShopifyOrders, mockShopifyProducts, normalizeOrder, normalizeProduct } from './mock-data'
import type {
	NormalizedOrder,
	NormalizedProduct,
	ShopifyApiResponse,
	ShopifyCreateOrderParams,
	ShopifyInventoryLevel,
	ShopifyInventoryResponse,
	ShopifyOrder,
	ShopifyOrderListParams,
	ShopifyOrdersResponse,
	ShopifyPaginationInfo,
	ShopifyProduct,
	ShopifyProductListParams,
	ShopifyProductsResponse,
} from './types'

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ShopifyClientConfig {
	storeDomain: string
	accessToken: string
	apiVersion?: string
	useMock?: boolean
}

const API_VERSION = '2024-01'
const DEFAULT_LIMIT = 50

// ============================================================================
// CLIENT CLASS
// ============================================================================

export class ShopifyClient {
	private readonly storeDomain: string
	private readonly accessToken: string
	private readonly apiVersion: string
	private readonly useMock: boolean
	private readonly baseUrl: string

	constructor(config: ShopifyClientConfig) {
		this.storeDomain = config.storeDomain
		this.accessToken = config.accessToken
		this.apiVersion = config.apiVersion || API_VERSION
		this.useMock = config.useMock ?? !config.accessToken

		// Build base URL
		this.baseUrl = `https://${this.storeDomain}/admin/api/${this.apiVersion}`
	}

	// ============================================================================
	// PRIVATE HELPERS
	// ============================================================================

	/**
	 * Make authenticated request to Shopify API
	 */
	private async request<T>(
		endpoint: string,
		options: RequestInit = {},
	): Promise<ShopifyApiResponse<T>> {
		const url = `${this.baseUrl}${endpoint}`

		try {
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					'X-Shopify-Access-Token': this.accessToken,
					...options.headers,
				},
			})

			// Parse pagination from Link header
			const linkHeader = response.headers.get('Link')

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				return {
					success: false,
					error: `Shopify API error: ${response.statusText}`,
					statusCode: response.status,
					details: errorData as Record<string, unknown>,
				}
			}

			const data = await response.json()
			return {
				success: true,
				data: data as T,
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}

	/**
	 * Parse Link header for pagination
	 */
	private parsePaginationHeader(linkHeader: string | null): ShopifyPaginationInfo {
		const pagination: ShopifyPaginationInfo = {
			hasNextPage: false,
			hasPreviousPage: false,
		}

		if (!linkHeader) return pagination

		const links = linkHeader.split(',')
		for (const link of links) {
			const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/)
			if (match) {
				const [, url, rel] = match
				const pageInfoMatch = url.match(/page_info=([^&]+)/)

				if (rel === 'next' && pageInfoMatch) {
					pagination.hasNextPage = true
					pagination.nextPageInfo = pageInfoMatch[1]
				} else if (rel === 'previous' && pageInfoMatch) {
					pagination.hasPreviousPage = true
					pagination.previousPageInfo = pageInfoMatch[1]
				}
			}
		}

		return pagination
	}

	// ============================================================================
	// PRODUCTS
	// ============================================================================

	/**
	 * List products from Shopify catalog
	 */
	async listProducts(params: ShopifyProductListParams = {}): Promise<ShopifyApiResponse<ShopifyProductsResponse>> {
		if (this.useMock) {
			return this.mockListProducts(params)
		}

		const queryParams = new URLSearchParams()
		if (params.limit) queryParams.set('limit', String(params.limit))
		if (params.pageInfo) queryParams.set('page_info', params.pageInfo)
		if (params.ids) queryParams.set('ids', params.ids)
		if (params.sinceId) queryParams.set('since_id', String(params.sinceId))
		if (params.title) queryParams.set('title', params.title)
		if (params.vendor) queryParams.set('vendor', params.vendor)
		if (params.handle) queryParams.set('handle', params.handle)
		if (params.productType) queryParams.set('product_type', params.productType)
		if (params.collectionId) queryParams.set('collection_id', String(params.collectionId))
		if (params.status) queryParams.set('status', params.status)
		if (params.publishedStatus) queryParams.set('published_status', params.publishedStatus)
		if (params.fields?.length) queryParams.set('fields', params.fields.join(','))

		const endpoint = `/products.json${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
		const result = await this.request<{ products: ShopifyProduct[] }>(endpoint)

		if (!result.success) {
			return result
		}

		return {
			success: true,
			data: {
				products: result.data.products,
				pagination: {
					hasNextPage: result.data.products.length >= (params.limit || DEFAULT_LIMIT),
					hasPreviousPage: !!params.pageInfo,
				},
			},
		}
	}

	/**
	 * Get single product by ID
	 */
	async getProduct(productId: string | number): Promise<ShopifyApiResponse<ShopifyProduct>> {
		if (this.useMock) {
			return this.mockGetProduct(productId)
		}

		const result = await this.request<{ product: ShopifyProduct }>(`/products/${productId}.json`)

		if (!result.success) {
			return result
		}

		return {
			success: true,
			data: result.data.product,
		}
	}

	/**
	 * Get inventory levels for products
	 */
	async getInventoryLevels(inventoryItemIds: number[]): Promise<ShopifyApiResponse<ShopifyInventoryResponse>> {
		if (this.useMock) {
			return this.mockGetInventoryLevels(inventoryItemIds)
		}

		const ids = inventoryItemIds.join(',')
		const result = await this.request<{ inventory_levels: ShopifyInventoryLevel[] }>(
			`/inventory_levels.json?inventory_item_ids=${ids}`,
		)

		if (!result.success) {
			return result
		}

		return {
			success: true,
			data: {
				inventoryLevels: result.data.inventory_levels,
				pagination: { hasNextPage: false, hasPreviousPage: false },
			},
		}
	}

	// ============================================================================
	// ORDERS
	// ============================================================================

	/**
	 * List orders from Shopify
	 */
	async listOrders(params: ShopifyOrderListParams = {}): Promise<ShopifyApiResponse<ShopifyOrdersResponse>> {
		if (this.useMock) {
			return this.mockListOrders(params)
		}

		const queryParams = new URLSearchParams()
		if (params.limit) queryParams.set('limit', String(params.limit))
		if (params.pageInfo) queryParams.set('page_info', params.pageInfo)
		if (params.ids) queryParams.set('ids', params.ids)
		if (params.sinceId) queryParams.set('since_id', String(params.sinceId))
		if (params.status) queryParams.set('status', params.status)
		if (params.financialStatus) queryParams.set('financial_status', params.financialStatus)
		if (params.fulfillmentStatus) queryParams.set('fulfillment_status', params.fulfillmentStatus)
		if (params.createdAtMin) queryParams.set('created_at_min', params.createdAtMin)
		if (params.createdAtMax) queryParams.set('created_at_max', params.createdAtMax)
		if (params.updatedAtMin) queryParams.set('updated_at_min', params.updatedAtMin)
		if (params.updatedAtMax) queryParams.set('updated_at_max', params.updatedAtMax)
		if (params.fields?.length) queryParams.set('fields', params.fields.join(','))

		const endpoint = `/orders.json${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
		const result = await this.request<{ orders: ShopifyOrder[] }>(endpoint)

		if (!result.success) {
			return result
		}

		return {
			success: true,
			data: {
				orders: result.data.orders,
				pagination: {
					hasNextPage: result.data.orders.length >= (params.limit || DEFAULT_LIMIT),
					hasPreviousPage: !!params.pageInfo,
				},
			},
		}
	}

	/**
	 * Get single order by ID
	 */
	async getOrder(orderId: string | number): Promise<ShopifyApiResponse<ShopifyOrder>> {
		if (this.useMock) {
			return this.mockGetOrder(orderId)
		}

		const result = await this.request<{ order: ShopifyOrder }>(`/orders/${orderId}.json`)

		if (!result.success) {
			return result
		}

		return {
			success: true,
			data: result.data.order,
		}
	}

	/**
	 * Create a new order in Shopify
	 */
	async createOrder(params: ShopifyCreateOrderParams): Promise<ShopifyApiResponse<ShopifyOrder>> {
		if (this.useMock) {
			return this.mockCreateOrder(params)
		}

		// Transform line items to Shopify format
		const lineItems = params.lineItems.map(item => ({
			variant_id: item.variantId,
			product_id: item.productId,
			title: item.title,
			quantity: item.quantity,
			price: item.price,
			sku: item.sku,
		}))

		const orderData = {
			order: {
				email: params.email,
				phone: params.phone,
				line_items: lineItems,
				billing_address: params.billingAddress
					? this.transformAddressToSnakeCase(params.billingAddress)
					: undefined,
				shipping_address: params.shippingAddress
					? this.transformAddressToSnakeCase(params.shippingAddress)
					: undefined,
				note: params.note,
				tags: params.tags,
				send_receipt: params.sendReceipt,
				send_fulfillment_receipt: params.sendFulfillmentReceipt,
				financial_status: params.financialStatus,
				fulfillment_status: params.fulfillmentStatus,
				inventory_behaviour: params.inventoryBehaviour,
			},
		}

		const result = await this.request<{ order: ShopifyOrder }>('/orders.json', {
			method: 'POST',
			body: JSON.stringify(orderData),
		})

		if (!result.success) {
			return result
		}

		return {
			success: true,
			data: result.data.order,
		}
	}

	/**
	 * Transform address to snake_case for Shopify API
	 */
	private transformAddressToSnakeCase(address: NonNullable<ShopifyCreateOrderParams['billingAddress']>) {
		return {
			first_name: address.firstName,
			last_name: address.lastName,
			address1: address.address1,
			address2: address.address2,
			city: address.city,
			province: address.province,
			country: address.country,
			zip: address.zip,
			phone: address.phone,
			name: address.name,
			company: address.company,
			country_code: address.countryCode,
			province_code: address.provinceCode,
		}
	}

	// ============================================================================
	// NORMALIZED DATA HELPERS
	// ============================================================================

	/**
	 * Get products in normalized format for Equipped catalog
	 */
	async getNormalizedProducts(params: ShopifyProductListParams = {}): Promise<ShopifyApiResponse<NormalizedProduct[]>> {
		const result = await this.listProducts(params)

		if (!result.success) {
			return result
		}

		return {
			success: true,
			data: result.data.products.map(normalizeProduct),
		}
	}

	/**
	 * Get single product in normalized format
	 */
	async getNormalizedProduct(productId: string | number): Promise<ShopifyApiResponse<NormalizedProduct>> {
		const result = await this.getProduct(productId)

		if (!result.success) {
			return result
		}

		return {
			success: true,
			data: normalizeProduct(result.data),
		}
	}

	/**
	 * Get orders in normalized format for Equipped order tracking
	 */
	async getNormalizedOrders(params: ShopifyOrderListParams = {}): Promise<ShopifyApiResponse<NormalizedOrder[]>> {
		const result = await this.listOrders(params)

		if (!result.success) {
			return result
		}

		return {
			success: true,
			data: result.data.orders.map(normalizeOrder),
		}
	}

	/**
	 * Get single order in normalized format
	 */
	async getNormalizedOrder(orderId: string | number): Promise<ShopifyApiResponse<NormalizedOrder>> {
		const result = await this.getOrder(orderId)

		if (!result.success) {
			return result
		}

		return {
			success: true,
			data: normalizeOrder(result.data),
		}
	}

	// ============================================================================
	// MOCK IMPLEMENTATIONS
	// ============================================================================

	private mockListProducts(params: ShopifyProductListParams): ShopifyApiResponse<ShopifyProductsResponse> {
		let products = [...mockShopifyProducts]

		// Filter by status
		if (params.status) {
			products = products.filter(p => p.status === params.status)
		}

		// Filter by vendor
		if (params.vendor) {
			products = products.filter(p => p.vendor.toLowerCase() === params.vendor?.toLowerCase())
		}

		// Filter by product type
		if (params.productType) {
			products = products.filter(p => p.productType.toLowerCase() === params.productType?.toLowerCase())
		}

		// Filter by handle
		if (params.handle) {
			products = products.filter(p => p.handle === params.handle)
		}

		// Filter by title (partial match)
		if (params.title) {
			const titleLower = params.title.toLowerCase()
			products = products.filter(p => p.title.toLowerCase().includes(titleLower))
		}

		// Filter by IDs
		if (params.ids) {
			const idSet = new Set(params.ids.split(',').map(id => Number(id.trim())))
			products = products.filter(p => idSet.has(p.id))
		}

		// Apply limit
		const limit = params.limit || DEFAULT_LIMIT
		products = products.slice(0, limit)

		return {
			success: true,
			data: {
				products,
				pagination: {
					hasNextPage: products.length >= limit,
					hasPreviousPage: false,
				},
			},
		}
	}

	private mockGetProduct(productId: string | number): ShopifyApiResponse<ShopifyProduct> {
		const id = typeof productId === 'string' ? Number(productId) : productId
		const product = mockShopifyProducts.find(p => p.id === id)

		if (!product) {
			return {
				success: false,
				error: 'Product not found',
				statusCode: 404,
			}
		}

		return {
			success: true,
			data: product,
		}
	}

	private mockGetInventoryLevels(inventoryItemIds: number[]): ShopifyApiResponse<ShopifyInventoryResponse> {
		const inventoryLevels: ShopifyInventoryLevel[] = []

		for (const product of mockShopifyProducts) {
			for (const variant of product.variants) {
				if (inventoryItemIds.includes(variant.inventoryItemId)) {
					inventoryLevels.push({
						inventoryItemId: variant.inventoryItemId,
						locationId: 1001, // Mock location ID
						available: variant.inventoryQuantity,
						updatedAt: variant.updatedAt,
					})
				}
			}
		}

		return {
			success: true,
			data: {
				inventoryLevels,
				pagination: { hasNextPage: false, hasPreviousPage: false },
			},
		}
	}

	private mockListOrders(params: ShopifyOrderListParams): ShopifyApiResponse<ShopifyOrdersResponse> {
		let orders = [...mockShopifyOrders]

		// Filter by status
		if (params.status && params.status !== 'any') {
			orders = orders.filter(o => {
				if (params.status === 'open') return !o.closedAt && !o.cancelledAt
				if (params.status === 'closed') return !!o.closedAt
				if (params.status === 'cancelled') return !!o.cancelledAt
				return true
			})
		}

		// Filter by financial status
		if (params.financialStatus && params.financialStatus !== 'any') {
			orders = orders.filter(o => o.financialStatus === params.financialStatus)
		}

		// Filter by fulfillment status
		if (params.fulfillmentStatus && params.fulfillmentStatus !== 'any') {
			orders = orders.filter(o => {
				if (params.fulfillmentStatus === 'unfulfilled') return !o.fulfillmentStatus
				if (params.fulfillmentStatus === 'unshipped') return !o.fulfillmentStatus
				return o.fulfillmentStatus === params.fulfillmentStatus
			})
		}

		// Filter by IDs
		if (params.ids) {
			const idSet = new Set(params.ids.split(',').map(id => Number(id.trim())))
			orders = orders.filter(o => idSet.has(o.id))
		}

		// Apply limit
		const limit = params.limit || DEFAULT_LIMIT
		orders = orders.slice(0, limit)

		return {
			success: true,
			data: {
				orders,
				pagination: {
					hasNextPage: orders.length >= limit,
					hasPreviousPage: false,
				},
			},
		}
	}

	private mockGetOrder(orderId: string | number): ShopifyApiResponse<ShopifyOrder> {
		const id = typeof orderId === 'string' ? Number(orderId) : orderId
		const order = mockShopifyOrders.find(o => o.id === id)

		if (!order) {
			return {
				success: false,
				error: 'Order not found',
				statusCode: 404,
			}
		}

		return {
			success: true,
			data: order,
		}
	}

	private mockCreateOrder(params: ShopifyCreateOrderParams): ShopifyApiResponse<ShopifyOrder> {
		// Generate mock order ID
		const orderId = Date.now()
		const orderNumber = 1000 + mockShopifyOrders.length + 1

		// Calculate totals
		const lineItemsTotal = params.lineItems.reduce((sum, item) => {
			return sum + Number.parseFloat(item.price) * item.quantity
		}, 0)

		const now = new Date().toISOString()

		const newOrder: ShopifyOrder = {
			id: orderId,
			adminGraphqlApiId: `gid://shopify/Order/${orderId}`,
			email: params.email,
			createdAt: now,
			updatedAt: now,
			number: orderNumber,
			note: params.note,
			token: `token_${Math.random().toString(36).substring(2, 10)}`,
			gateway: 'manual',
			totalPrice: lineItemsTotal.toFixed(2),
			subtotalPrice: lineItemsTotal.toFixed(2),
			totalWeight: 0,
			totalTax: '0.00',
			taxesIncluded: false,
			currency: 'USD',
			financialStatus: params.financialStatus || 'pending',
			confirmed: true,
			totalDiscounts: '0.00',
			totalLineItemsPrice: lineItemsTotal.toFixed(2),
			orderNumber,
			processingMethod: 'direct',
			fulfillmentStatus: params.fulfillmentStatus || null,
			contactEmail: params.email,
			billingAddress: params.billingAddress,
			shippingAddress: params.shippingAddress,
			lineItems: params.lineItems.map((item, index) => ({
				id: orderId * 100 + index,
				variantId: item.variantId || 0,
				title: item.title,
				quantity: item.quantity,
				sku: item.sku,
				fulfillmentService: 'manual',
				productId: item.productId || 0,
				requiresShipping: true,
				taxable: true,
				giftCard: false,
				name: item.title,
				productExists: true,
				fulfillableQuantity: item.quantity,
				grams: 0,
				price: item.price,
				totalDiscount: '0.00',
				fulfillmentStatus: null,
				priceSet: {
					shopMoney: { amount: item.price, currencyCode: 'USD' },
					presentmentMoney: { amount: item.price, currencyCode: 'USD' },
				},
				totalDiscountSet: {
					shopMoney: { amount: '0.00', currencyCode: 'USD' },
					presentmentMoney: { amount: '0.00', currencyCode: 'USD' },
				},
			})),
			shippingLines: [],
			fulfillments: [],
			tags: params.tags || '',
			name: `#${orderNumber}`,
			priceSet: {
				shopMoney: { amount: lineItemsTotal.toFixed(2), currencyCode: 'USD' },
				presentmentMoney: { amount: lineItemsTotal.toFixed(2), currencyCode: 'USD' },
			},
			subtotalPriceSet: {
				shopMoney: { amount: lineItemsTotal.toFixed(2), currencyCode: 'USD' },
				presentmentMoney: { amount: lineItemsTotal.toFixed(2), currencyCode: 'USD' },
			},
			totalDiscountsSet: {
				shopMoney: { amount: '0.00', currencyCode: 'USD' },
				presentmentMoney: { amount: '0.00', currencyCode: 'USD' },
			},
			totalLineItemsPriceSet: {
				shopMoney: { amount: lineItemsTotal.toFixed(2), currencyCode: 'USD' },
				presentmentMoney: { amount: lineItemsTotal.toFixed(2), currencyCode: 'USD' },
			},
			totalTaxSet: {
				shopMoney: { amount: '0.00', currencyCode: 'USD' },
				presentmentMoney: { amount: '0.00', currencyCode: 'USD' },
			},
		}

		return {
			success: true,
			data: newOrder,
		}
	}
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Shopify client from environment variables
 */
export function createShopifyClient(env: {
	SHOPIFY_STORE_DOMAIN?: string
	SHOPIFY_ACCESS_TOKEN?: string
	SHOPIFY_API_VERSION?: string
	ENVIRONMENT?: string
}): ShopifyClient {
	const storeDomain = env.SHOPIFY_STORE_DOMAIN || ''
	const accessToken = env.SHOPIFY_ACCESS_TOKEN || ''
	const useMock = !accessToken || env.ENVIRONMENT === 'development'

	return new ShopifyClient({
		storeDomain,
		accessToken,
		apiVersion: env.SHOPIFY_API_VERSION,
		useMock,
	})
}
