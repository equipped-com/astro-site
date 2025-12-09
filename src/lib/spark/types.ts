/**
 * Spark Shipping API Types
 *
 * Type definitions for Spark Shipping integration for drop-shipping,
 * inventory management, and order fulfillment tracking.
 */

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface SparkApiResponse<T> {
	success: boolean
	data?: T
	error?: string
	statusCode?: number
	details?: Record<string, unknown>
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

export interface SparkInventoryItem {
	sku: string
	productName: string
	category: string
	available: number
	reserved: number
	onOrder: number
	warehouse: string
	warehouseId: string
	lastUpdated: string
	price: SparkPrice
	vendor?: string
	weight?: number
	dimensions?: SparkDimensions
}

export interface SparkPrice {
	cost: string
	retail: string
	currency: string
}

export interface SparkDimensions {
	length: number
	width: number
	height: number
	unit: 'in' | 'cm'
}

export interface SparkInventoryResponse {
	items: SparkInventoryItem[]
	pagination: SparkPaginationInfo
	lastSyncedAt: string
}

export interface SparkPaginationInfo {
	hasNextPage: boolean
	hasPreviousPage: boolean
	nextCursor?: string
	previousCursor?: string
	totalCount?: number
}

// ============================================================================
// ORDER FULFILLMENT TYPES
// ============================================================================

export interface SparkFulfillmentRequest {
	orderId: string
	orderNumber: string
	lineItems: SparkLineItem[]
	shippingAddress: SparkAddress
	shippingMethod?: 'standard' | 'express' | 'overnight'
	notes?: string
	customerEmail?: string
	customerPhone?: string
}

export interface SparkLineItem {
	sku: string
	productName: string
	quantity: number
	price: string
}

export interface SparkAddress {
	name: string
	company?: string
	address1: string
	address2?: string
	city: string
	state: string
	postalCode: string
	country: string
	phone?: string
}

export interface SparkFulfillmentResponse {
	success: boolean
	sparkOrderId: string
	orderId: string
	status: SparkFulfillmentStatus
	estimatedShipDate?: string
	trackingNumbers?: string[]
	carrier?: string
	createdAt: string
	message?: string
	error?: string
}

export type SparkFulfillmentStatus =
	| 'pending'
	| 'processing'
	| 'shipped'
	| 'delivered'
	| 'cancelled'
	| 'failed'

// ============================================================================
// SHIPMENT TRACKING TYPES
// ============================================================================

export interface SparkTrackingInfo {
	orderId: string
	sparkOrderId: string
	trackingNumber: string
	carrier: string
	status: SparkShipmentStatus
	estimatedDelivery?: string
	shippedDate?: string
	deliveredDate?: string
	trackingEvents: SparkTrackingEvent[]
	shippingAddress: SparkAddress
	currentLocation?: string
}

export type SparkShipmentStatus =
	| 'label_created'
	| 'in_transit'
	| 'out_for_delivery'
	| 'delivered'
	| 'exception'
	| 'failed_delivery'
	| 'returned'

export interface SparkTrackingEvent {
	timestamp: string
	status: string
	location?: string
	message: string
}

// ============================================================================
// PRICING SYNC TYPES
// ============================================================================

export interface SparkPricingUpdate {
	sku: string
	cost: string
	retail: string
	effectiveDate: string
	currency: string
}

export interface SparkPricingResponse {
	updates: SparkPricingUpdate[]
	syncedAt: string
	changedCount: number
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface SparkWebhookPayload {
	event: SparkWebhookEvent
	timestamp: string
	data: SparkWebhookData
}

export type SparkWebhookEvent =
	| 'inventory.updated'
	| 'order.fulfilled'
	| 'shipment.shipped'
	| 'shipment.delivered'
	| 'pricing.updated'

export interface SparkWebhookData {
	orderId?: string
	sparkOrderId?: string
	sku?: string
	trackingNumber?: string
	status?: string
	inventory?: SparkInventoryItem
	// Flexible for different webhook types
	[key: string]: unknown
}

// ============================================================================
// API REQUEST PARAMS
// ============================================================================

export interface SparkInventoryParams {
	skus?: string[] // Filter by specific SKUs
	category?: string
	warehouse?: string
	available?: boolean // Only show items with available > 0
	limit?: number
	cursor?: string
}

export interface SparkTrackingParams {
	orderId?: string
	sparkOrderId?: string
	trackingNumber?: string
}

export interface SparkPricingParams {
	skus?: string[]
	changedSince?: string // ISO date
	limit?: number
	cursor?: string
}
