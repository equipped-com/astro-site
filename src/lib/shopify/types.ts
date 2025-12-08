/**
 * Shopify Admin API Types
 *
 * Type definitions for Shopify Store API integration.
 * Based on Shopify Admin REST API 2024-01.
 * @see https://shopify.dev/docs/api/admin-rest
 */

// ============================================================================
// MONEY TYPES
// ============================================================================

export interface ShopifyMoney {
	amount: string
	currencyCode: string
}

export interface ShopifyPriceSet {
	shopMoney: ShopifyMoney
	presentmentMoney: ShopifyMoney
}

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export interface ShopifyProductImage {
	id: number
	productId: number
	position: number
	src: string
	alt?: string
	width: number
	height: number
	createdAt: string
	updatedAt: string
}

export interface ShopifyProductVariant {
	id: number
	productId: number
	title: string
	price: string
	compareAtPrice?: string
	sku?: string
	barcode?: string
	position: number
	inventoryPolicy: 'deny' | 'continue'
	fulfillmentService: string
	inventoryManagement?: 'shopify' | 'fulfillment_service'
	option1?: string
	option2?: string
	option3?: string
	createdAt: string
	updatedAt: string
	taxable: boolean
	grams: number
	imageId?: number
	weight: number
	weightUnit: 'g' | 'kg' | 'oz' | 'lb'
	inventoryItemId: number
	inventoryQuantity: number
	requiresShipping: boolean
	available: boolean
}

export interface ShopifyProductOption {
	id: number
	productId: number
	name: string
	position: number
	values: string[]
}

export interface ShopifyProduct {
	id: number
	title: string
	bodyHtml?: string
	vendor: string
	productType: string
	handle: string
	createdAt: string
	updatedAt: string
	publishedAt?: string
	templateSuffix?: string
	publishedScope: 'web' | 'global'
	tags: string
	status: 'active' | 'archived' | 'draft'
	adminGraphqlApiId: string
	variants: ShopifyProductVariant[]
	options: ShopifyProductOption[]
	images: ShopifyProductImage[]
	image?: ShopifyProductImage
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export interface ShopifyAddress {
	firstName?: string
	lastName?: string
	address1?: string
	address2?: string
	city?: string
	province?: string
	country?: string
	zip?: string
	phone?: string
	name?: string
	company?: string
	countryCode?: string
	provinceCode?: string
}

export interface ShopifyCustomer {
	id: number
	email: string
	firstName?: string
	lastName?: string
	phone?: string
	acceptsMarketing: boolean
	ordersCount: number
	totalSpent: string
	state: 'disabled' | 'invited' | 'enabled' | 'declined'
	note?: string
	verifiedEmail: boolean
	taxExempt: boolean
	taxExemptions: string[]
	tags: string
	currency: string
	defaultAddress?: ShopifyAddress
	createdAt: string
	updatedAt: string
}

export interface ShopifyOrderLineItem {
	id: number
	variantId: number
	title: string
	quantity: number
	sku?: string
	variantTitle?: string
	vendor?: string
	fulfillmentService: string
	productId: number
	requiresShipping: boolean
	taxable: boolean
	giftCard: boolean
	name: string
	variantInventoryManagement?: string
	productExists: boolean
	fulfillableQuantity: number
	grams: number
	price: string
	totalDiscount: string
	fulfillmentStatus?: 'fulfilled' | 'partial' | null
	priceSet: ShopifyPriceSet
	totalDiscountSet: ShopifyPriceSet
}

export interface ShopifyOrderShippingLine {
	id: number
	title: string
	price: string
	code?: string
	source: string
	phone?: string
	requestedFulfillmentServiceId?: number
	deliveryCategory?: string
	carrierIdentifier?: string
	discountedPrice: string
	priceSet: ShopifyPriceSet
	discountedPriceSet: ShopifyPriceSet
}

export interface ShopifyFulfillment {
	id: number
	orderId: number
	status: 'pending' | 'open' | 'success' | 'cancelled' | 'error' | 'failure'
	createdAt: string
	updatedAt: string
	trackingCompany?: string
	trackingNumber?: string
	trackingNumbers: string[]
	trackingUrl?: string
	trackingUrls: string[]
	lineItems: ShopifyOrderLineItem[]
}

export interface ShopifyOrder {
	id: number
	adminGraphqlApiId: string
	email?: string
	closedAt?: string
	createdAt: string
	updatedAt: string
	number: number
	note?: string
	token: string
	gateway: string
	totalPrice: string
	subtotalPrice: string
	totalWeight: number
	totalTax: string
	taxesIncluded: boolean
	currency: string
	financialStatus: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided'
	confirmed: boolean
	totalDiscounts: string
	totalLineItemsPrice: string
	orderNumber: number
	processingMethod: string
	fulfillmentStatus?: 'fulfilled' | 'partial' | 'unfulfilled' | null
	cancelReason?: 'customer' | 'declined' | 'fraud' | 'inventory' | 'other'
	cancelledAt?: string
	contactEmail?: string
	billingAddress?: ShopifyAddress
	shippingAddress?: ShopifyAddress
	customer?: ShopifyCustomer
	lineItems: ShopifyOrderLineItem[]
	shippingLines: ShopifyOrderShippingLine[]
	fulfillments: ShopifyFulfillment[]
	tags: string
	name: string
	priceSet: ShopifyPriceSet
	subtotalPriceSet: ShopifyPriceSet
	totalDiscountsSet: ShopifyPriceSet
	totalLineItemsPriceSet: ShopifyPriceSet
	totalTaxSet: ShopifyPriceSet
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

export interface ShopifyInventoryLevel {
	inventoryItemId: number
	locationId: number
	available: number
	updatedAt: string
}

export interface ShopifyInventoryItem {
	id: number
	sku?: string
	createdAt: string
	updatedAt: string
	requiresShipping: boolean
	cost?: string
	countryCodeOfOrigin?: string
	provinceCodeOfOrigin?: string
	harmonizedSystemCode?: string
	tracked: boolean
	countryHarmonizedSystemCodes: Array<{
		harmonizedSystemCode: string
		countryCode: string
	}>
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ShopifyProductListParams {
	limit?: number
	pageInfo?: string
	fields?: string[]
	ids?: string
	sinceId?: number
	title?: string
	vendor?: string
	handle?: string
	productType?: string
	collectionId?: number
	status?: 'active' | 'archived' | 'draft'
	publishedStatus?: 'published' | 'unpublished' | 'any'
}

export interface ShopifyOrderListParams {
	limit?: number
	pageInfo?: string
	fields?: string[]
	ids?: string
	sinceId?: number
	status?: 'open' | 'closed' | 'cancelled' | 'any'
	financialStatus?:
		| 'authorized'
		| 'pending'
		| 'paid'
		| 'partially_paid'
		| 'refunded'
		| 'voided'
		| 'partially_refunded'
		| 'any'
		| 'unpaid'
	fulfillmentStatus?: 'shipped' | 'partial' | 'unshipped' | 'any' | 'unfulfilled'
	createdAtMin?: string
	createdAtMax?: string
	updatedAtMin?: string
	updatedAtMax?: string
}

export interface ShopifyCreateOrderParams {
	email?: string
	phone?: string
	lineItems: Array<{
		variantId?: number
		productId?: number
		title: string
		quantity: number
		price: string
		sku?: string
	}>
	billingAddress?: ShopifyAddress
	shippingAddress?: ShopifyAddress
	note?: string
	tags?: string
	sendReceipt?: boolean
	sendFulfillmentReceipt?: boolean
	financialStatus?: 'pending' | 'paid'
	fulfillmentStatus?: 'fulfilled' | null
	inventoryBehaviour?: 'bypass' | 'decrement_ignoring_policy' | 'decrement_obeying_policy'
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface ShopifyPaginationInfo {
	hasNextPage: boolean
	hasPreviousPage: boolean
	nextPageInfo?: string
	previousPageInfo?: string
}

export interface ShopifyPaginatedResponse<T> {
	data: T[]
	pagination: ShopifyPaginationInfo
}

// ============================================================================
// CLIENT RESPONSE TYPES
// ============================================================================

export interface ShopifyApiSuccess<T> {
	success: true
	data: T
}

export interface ShopifyApiError {
	success: false
	error: string
	statusCode?: number
	details?: Record<string, unknown>
}

export type ShopifyApiResponse<T> = ShopifyApiSuccess<T> | ShopifyApiError

export interface ShopifyProductsResponse {
	products: ShopifyProduct[]
	pagination: ShopifyPaginationInfo
}

export interface ShopifyOrdersResponse {
	orders: ShopifyOrder[]
	pagination: ShopifyPaginationInfo
}

export interface ShopifyInventoryResponse {
	inventoryLevels: ShopifyInventoryLevel[]
	pagination: ShopifyPaginationInfo
}

// ============================================================================
// NORMALIZED TYPES (for internal use)
// ============================================================================

/**
 * Normalized product for Equipped catalog display
 */
export interface NormalizedProduct {
	id: string
	title: string
	description: string
	vendor: string
	productType: string
	handle: string
	status: 'active' | 'archived' | 'draft'
	tags: string[]
	images: Array<{
		id: string
		src: string
		alt?: string
	}>
	variants: Array<{
		id: string
		title: string
		price: number
		compareAtPrice?: number
		sku?: string
		available: boolean
		inventoryQuantity: number
	}>
	createdAt: string
	updatedAt: string
}

/**
 * Normalized order for Equipped order tracking
 */
export interface NormalizedOrder {
	id: string
	orderNumber: number
	email?: string
	status: ShopifyOrder['financialStatus']
	fulfillmentStatus: ShopifyOrder['fulfillmentStatus']
	totalPrice: number
	currency: string
	lineItems: Array<{
		id: string
		title: string
		quantity: number
		price: number
		sku?: string
		fulfillmentStatus?: string
	}>
	shippingAddress?: ShopifyAddress
	billingAddress?: ShopifyAddress
	tracking?: {
		company?: string
		number?: string
		url?: string
	}
	createdAt: string
	updatedAt: string
}
