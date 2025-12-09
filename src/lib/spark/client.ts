/**
 * Spark Shipping API Client
 *
 * Handles communication with Spark Shipping API for drop-shipping,
 * inventory management, order fulfillment, and shipment tracking.
 *
 * In production, uses real API endpoints with proper authentication.
 * For development, uses mock data to simulate the API behavior.
 */

import { generateTrackingEvents, mapShipmentToFulfillmentStatus, mockInventoryItems, mockTrackingData } from './mock-data'
import type {
	SparkApiResponse,
	SparkFulfillmentRequest,
	SparkFulfillmentResponse,
	SparkInventoryParams,
	SparkInventoryResponse,
	SparkPricingParams,
	SparkPricingResponse,
	SparkPricingUpdate,
	SparkTrackingInfo,
	SparkTrackingParams,
} from './types'

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface SparkClientConfig {
	apiUrl: string
	apiKey: string
	useMock?: boolean
}

const DEFAULT_LIMIT = 50

// ============================================================================
// CLIENT CLASS
// ============================================================================

export class SparkClient {
	private readonly apiUrl: string
	private readonly apiKey: string
	private readonly useMock: boolean
	// In-memory cache for mock mode
	private mockFulfillmentCache: Map<string, SparkFulfillmentResponse> = new Map()

	constructor(config: SparkClientConfig) {
		this.apiUrl = config.apiUrl
		this.apiKey = config.apiKey
		this.useMock = config.useMock ?? !config.apiKey
	}

	// ============================================================================
	// PRIVATE HELPERS
	// ============================================================================

	/**
	 * Make authenticated request to Spark API
	 */
	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<SparkApiResponse<T>> {
		const url = `${this.apiUrl}${endpoint}`

		try {
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.apiKey}`,
					...options.headers,
				},
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				return {
					success: false,
					error: `Spark API error: ${response.statusText}`,
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

	// ============================================================================
	// INVENTORY
	// ============================================================================

	/**
	 * Get current inventory levels
	 */
	async getInventory(params: SparkInventoryParams = {}): Promise<SparkApiResponse<SparkInventoryResponse>> {
		if (this.useMock) {
			return this.mockGetInventory(params)
		}

		const queryParams = new URLSearchParams()
		if (params.skus?.length) queryParams.set('skus', params.skus.join(','))
		if (params.category) queryParams.set('category', params.category)
		if (params.warehouse) queryParams.set('warehouse', params.warehouse)
		if (params.available !== undefined) queryParams.set('available', String(params.available))
		if (params.limit) queryParams.set('limit', String(params.limit))
		if (params.cursor) queryParams.set('cursor', params.cursor)

		const endpoint = `/inventory${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
		return this.request<SparkInventoryResponse>(endpoint)
	}

	/**
	 * Get inventory for specific SKU
	 */
	async getInventoryBySku(sku: string): Promise<SparkApiResponse<SparkInventoryResponse>> {
		return this.getInventory({ skus: [sku] })
	}

	// ============================================================================
	// ORDER FULFILLMENT
	// ============================================================================

	/**
	 * Trigger order fulfillment
	 */
	async fulfillOrder(request: SparkFulfillmentRequest): Promise<SparkApiResponse<SparkFulfillmentResponse>> {
		if (this.useMock) {
			return this.mockFulfillOrder(request)
		}

		return this.request<SparkFulfillmentResponse>('/fulfillment', {
			method: 'POST',
			body: JSON.stringify(request),
		})
	}

	/**
	 * Get fulfillment status
	 */
	async getFulfillmentStatus(orderId: string): Promise<SparkApiResponse<SparkFulfillmentResponse>> {
		if (this.useMock) {
			return this.mockGetFulfillmentStatus(orderId)
		}

		return this.request<SparkFulfillmentResponse>(`/fulfillment/${orderId}`)
	}

	// ============================================================================
	// SHIPMENT TRACKING
	// ============================================================================

	/**
	 * Get tracking information
	 */
	async getTracking(params: SparkTrackingParams): Promise<SparkApiResponse<SparkTrackingInfo>> {
		if (this.useMock) {
			return this.mockGetTracking(params)
		}

		// Build query based on available params
		let endpoint = '/tracking'
		if (params.orderId) {
			endpoint = `/tracking/order/${params.orderId}`
		} else if (params.sparkOrderId) {
			endpoint = `/tracking/spark/${params.sparkOrderId}`
		} else if (params.trackingNumber) {
			endpoint = `/tracking/number/${params.trackingNumber}`
		}

		return this.request<SparkTrackingInfo>(endpoint)
	}

	/**
	 * Get tracking by order ID
	 */
	async getTrackingByOrderId(orderId: string): Promise<SparkApiResponse<SparkTrackingInfo>> {
		return this.getTracking({ orderId })
	}

	/**
	 * Get tracking by tracking number
	 */
	async getTrackingByNumber(trackingNumber: string): Promise<SparkApiResponse<SparkTrackingInfo>> {
		return this.getTracking({ trackingNumber })
	}

	// ============================================================================
	// PRICING
	// ============================================================================

	/**
	 * Get pricing updates
	 */
	async getPricing(params: SparkPricingParams = {}): Promise<SparkApiResponse<SparkPricingResponse>> {
		if (this.useMock) {
			return this.mockGetPricing(params)
		}

		const queryParams = new URLSearchParams()
		if (params.skus?.length) queryParams.set('skus', params.skus.join(','))
		if (params.changedSince) queryParams.set('changed_since', params.changedSince)
		if (params.limit) queryParams.set('limit', String(params.limit))
		if (params.cursor) queryParams.set('cursor', params.cursor)

		const endpoint = `/pricing${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
		return this.request<SparkPricingResponse>(endpoint)
	}

	/**
	 * Get recent pricing changes
	 */
	async getRecentPricingChanges(hours = 24): Promise<SparkApiResponse<SparkPricingResponse>> {
		const changedSince = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
		return this.getPricing({ changedSince })
	}

	// ============================================================================
	// MOCK IMPLEMENTATIONS
	// ============================================================================

	private mockGetInventory(params: SparkInventoryParams): SparkApiResponse<SparkInventoryResponse> {
		let items = [...mockInventoryItems]

		// Filter by SKUs
		if (params.skus?.length) {
			const skuSet = new Set(params.skus)
			items = items.filter(item => skuSet.has(item.sku))
		}

		// Filter by category
		if (params.category) {
			items = items.filter(item => item.category.toLowerCase() === params.category?.toLowerCase())
		}

		// Filter by warehouse
		if (params.warehouse) {
			items = items.filter(item => item.warehouse === params.warehouse)
		}

		// Filter by availability
		if (params.available) {
			items = items.filter(item => item.available > 0)
		}

		// Apply limit
		const limit = params.limit || DEFAULT_LIMIT
		const hasMore = items.length > limit
		items = items.slice(0, limit)

		return {
			success: true,
			data: {
				items,
				pagination: {
					hasNextPage: hasMore,
					hasPreviousPage: !!params.cursor,
					totalCount: mockInventoryItems.length,
				},
				lastSyncedAt: new Date().toISOString(),
			},
		}
	}

	private mockFulfillOrder(request: SparkFulfillmentRequest): SparkApiResponse<SparkFulfillmentResponse> {
		// Generate mock Spark order ID
		const sparkOrderId = `SPK-${new Date().getFullYear()}-${Math.random().toString().slice(2, 8).padStart(6, '0')}`
		const trackingNumber = `TRK${Math.random().toString().slice(2, 12).padStart(10, '0')}US`

		// Estimate ship date (1-2 business days)
		const estimatedShipDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()

		const fulfillmentResponse: SparkFulfillmentResponse = {
			success: true,
			sparkOrderId,
			orderId: request.orderId,
			status: 'processing',
			estimatedShipDate,
			trackingNumbers: [trackingNumber],
			carrier: 'UPS',
			createdAt: new Date().toISOString(),
			message: 'Order successfully submitted for fulfillment',
		}

		// Cache for later retrieval
		this.mockFulfillmentCache.set(request.orderId, fulfillmentResponse)

		return {
			success: true,
			data: fulfillmentResponse,
		}
	}

	private mockGetFulfillmentStatus(orderId: string): SparkApiResponse<SparkFulfillmentResponse> {
		// Check cache first (for newly created orders)
		const cachedFulfillment = this.mockFulfillmentCache.get(orderId)
		if (cachedFulfillment) {
			return {
				success: true,
				data: cachedFulfillment,
			}
		}

		// Check if we have tracking data for this order
		const trackingInfo = mockTrackingData[orderId]

		if (!trackingInfo) {
			return {
				success: false,
				error: 'Order not found',
				statusCode: 404,
			}
		}

		const fulfillmentStatus = mapShipmentToFulfillmentStatus(trackingInfo.status)

		return {
			success: true,
			data: {
				success: true,
				sparkOrderId: trackingInfo.sparkOrderId,
				orderId: trackingInfo.orderId,
				status: fulfillmentStatus,
				trackingNumbers: [trackingInfo.trackingNumber],
				carrier: trackingInfo.carrier,
				createdAt: trackingInfo.shippedDate || new Date().toISOString(),
			},
		}
	}

	private mockGetTracking(params: SparkTrackingParams): SparkApiResponse<SparkTrackingInfo> {
		// Find tracking info by any available identifier
		let trackingInfo: SparkTrackingInfo | undefined

		if (params.orderId) {
			trackingInfo = mockTrackingData[params.orderId]
		} else if (params.sparkOrderId) {
			trackingInfo = Object.values(mockTrackingData).find(t => t.sparkOrderId === params.sparkOrderId)
		} else if (params.trackingNumber) {
			trackingInfo = Object.values(mockTrackingData).find(t => t.trackingNumber === params.trackingNumber)
		}

		if (!trackingInfo) {
			return {
				success: false,
				error: 'Tracking information not found',
				statusCode: 404,
			}
		}

		return {
			success: true,
			data: trackingInfo,
		}
	}

	private mockGetPricing(params: SparkPricingParams): SparkApiResponse<SparkPricingResponse> {
		let items = [...mockInventoryItems]

		// Filter by SKUs
		if (params.skus?.length) {
			const skuSet = new Set(params.skus)
			items = items.filter(item => skuSet.has(item.sku))
		}

		// Convert to pricing updates
		const updates: SparkPricingUpdate[] = items.map(item => ({
			sku: item.sku,
			cost: item.price.cost,
			retail: item.price.retail,
			effectiveDate: item.lastUpdated,
			currency: item.price.currency,
		}))

		return {
			success: true,
			data: {
				updates,
				syncedAt: new Date().toISOString(),
				changedCount: updates.length,
			},
		}
	}
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Spark client from environment variables
 */
export function createSparkClient(env: {
	SPARK_API_URL?: string
	SPARK_API_KEY?: string
	ENVIRONMENT?: string
}): SparkClient {
	const apiUrl = env.SPARK_API_URL || ''
	const apiKey = env.SPARK_API_KEY || ''
	const useMock = !apiKey || env.ENVIRONMENT === 'development'

	return new SparkClient({
		apiUrl,
		apiKey,
		useMock,
	})
}
