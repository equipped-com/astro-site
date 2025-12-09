/**
 * Mock data for Spark Shipping API
 *
 * Provides realistic test data for development and testing.
 */

import type {
	SparkFulfillmentStatus,
	SparkInventoryItem,
	SparkShipmentStatus,
	SparkTrackingEvent,
	SparkTrackingInfo,
} from './types'

// ============================================================================
// MOCK INVENTORY DATA
// ============================================================================

export const mockInventoryItems: SparkInventoryItem[] = [
	{
		sku: 'MBAIR-M2-256-SG',
		productName: 'MacBook Air M2 256GB Space Gray',
		category: 'Laptops',
		available: 45,
		reserved: 5,
		onOrder: 20,
		warehouse: 'US West Coast',
		warehouseId: 'WH-CA-01',
		lastUpdated: new Date().toISOString(),
		price: {
			cost: '999.00',
			retail: '1199.00',
			currency: 'USD',
		},
		vendor: 'Apple',
		weight: 2.7,
		dimensions: {
			length: 12,
			width: 8.5,
			height: 0.6,
			unit: 'in',
		},
	},
	{
		sku: 'MBAIR-M2-512-MN',
		productName: 'MacBook Air M2 512GB Midnight',
		category: 'Laptops',
		available: 32,
		reserved: 3,
		onOrder: 15,
		warehouse: 'US West Coast',
		warehouseId: 'WH-CA-01',
		lastUpdated: new Date().toISOString(),
		price: {
			cost: '1199.00',
			retail: '1499.00',
			currency: 'USD',
		},
		vendor: 'Apple',
		weight: 2.7,
		dimensions: {
			length: 12,
			width: 8.5,
			height: 0.6,
			unit: 'in',
		},
	},
	{
		sku: 'MBPRO-14-M3-512-SG',
		productName: 'MacBook Pro 14 M3 512GB Space Gray',
		category: 'Laptops',
		available: 18,
		reserved: 2,
		onOrder: 10,
		warehouse: 'US East Coast',
		warehouseId: 'WH-NY-01',
		lastUpdated: new Date().toISOString(),
		price: {
			cost: '1599.00',
			retail: '1999.00',
			currency: 'USD',
		},
		vendor: 'Apple',
		weight: 3.5,
		dimensions: {
			length: 12.3,
			width: 8.7,
			height: 0.6,
			unit: 'in',
		},
	},
	{
		sku: 'IPAD-PRO-11-256-SG',
		productName: 'iPad Pro 11 256GB Space Gray',
		category: 'Tablets',
		available: 67,
		reserved: 8,
		onOrder: 30,
		warehouse: 'US West Coast',
		warehouseId: 'WH-CA-01',
		lastUpdated: new Date().toISOString(),
		price: {
			cost: '749.00',
			retail: '899.00',
			currency: 'USD',
		},
		vendor: 'Apple',
		weight: 1.03,
		dimensions: {
			length: 9.7,
			width: 7,
			height: 0.23,
			unit: 'in',
		},
	},
	{
		sku: 'APPLECARE-MAC',
		productName: 'AppleCare+ for Mac',
		category: 'Services',
		available: 999,
		reserved: 0,
		onOrder: 0,
		warehouse: 'Digital',
		warehouseId: 'WH-DIGITAL',
		lastUpdated: new Date().toISOString(),
		price: {
			cost: '279.00',
			retail: '379.00',
			currency: 'USD',
		},
		vendor: 'Apple',
		weight: 0,
	},
	{
		sku: 'USB-C-CABLE-2M',
		productName: 'USB-C Charge Cable 2m',
		category: 'Accessories',
		available: 245,
		reserved: 15,
		onOrder: 100,
		warehouse: 'US West Coast',
		warehouseId: 'WH-CA-01',
		lastUpdated: new Date().toISOString(),
		price: {
			cost: '15.00',
			retail: '29.00',
			currency: 'USD',
		},
		vendor: 'Apple',
		weight: 0.2,
		dimensions: {
			length: 6,
			width: 4,
			height: 1,
			unit: 'in',
		},
	},
]

// ============================================================================
// MOCK TRACKING DATA
// ============================================================================

export const mockTrackingData: Record<string, SparkTrackingInfo> = {
	ORDER_1001: {
		orderId: 'ORDER_1001',
		sparkOrderId: 'SPK-2024-001234',
		trackingNumber: 'TRK1234567890US',
		carrier: 'UPS',
		status: 'in_transit',
		estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
		shippedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		trackingEvents: [
			{
				timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
				status: 'departed',
				location: 'San Francisco, CA',
				message: 'Package departed shipping facility',
			},
			{
				timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
				status: 'in_transit',
				location: 'Los Angeles, CA',
				message: 'Package in transit to destination',
			},
		],
		shippingAddress: {
			name: 'Jane Smith',
			company: 'Acme Corp',
			address1: '123 Business St',
			city: 'Austin',
			state: 'TX',
			postalCode: '78701',
			country: 'US',
			phone: '555-123-4567',
		},
		currentLocation: 'Los Angeles, CA',
	},
	ORDER_1002: {
		orderId: 'ORDER_1002',
		sparkOrderId: 'SPK-2024-001235',
		trackingNumber: 'TRK0987654321US',
		carrier: 'FedEx',
		status: 'delivered',
		estimatedDelivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		shippedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		deliveredDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		trackingEvents: [
			{
				timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
				status: 'departed',
				location: 'New York, NY',
				message: 'Package departed shipping facility',
			},
			{
				timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
				status: 'in_transit',
				location: 'Philadelphia, PA',
				message: 'Package in transit',
			},
			{
				timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
				status: 'delivered',
				location: 'Boston, MA',
				message: 'Package delivered',
			},
		],
		shippingAddress: {
			name: 'John Doe',
			company: 'Tech Startup Inc',
			address1: '456 Innovation Ave',
			city: 'Boston',
			state: 'MA',
			postalCode: '02101',
			country: 'US',
			phone: '555-987-6543',
		},
		currentLocation: 'Boston, MA',
	},
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate mock tracking events based on status
 */
export function generateTrackingEvents(status: SparkShipmentStatus): SparkTrackingEvent[] {
	const now = Date.now()
	const events: SparkTrackingEvent[] = [
		{
			timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
			status: 'label_created',
			location: 'San Francisco, CA',
			message: 'Shipping label created',
		},
	]

	if (status === 'label_created') {
		return events
	}

	events.push({
		timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
		status: 'departed',
		location: 'San Francisco, CA',
		message: 'Package departed shipping facility',
	})

	if (status === 'in_transit' || status === 'out_for_delivery' || status === 'delivered') {
		events.push({
			timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
			status: 'in_transit',
			location: 'Sacramento, CA',
			message: 'Package in transit',
		})
	}

	if (status === 'out_for_delivery' || status === 'delivered') {
		events.push({
			timestamp: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
			status: 'out_for_delivery',
			location: 'Local Facility',
			message: 'Out for delivery',
		})
	}

	if (status === 'delivered') {
		events.push({
			timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
			status: 'delivered',
			location: 'Delivered',
			message: 'Package delivered successfully',
		})
	}

	if (status === 'exception') {
		events.push({
			timestamp: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
			status: 'exception',
			location: 'Transit Hub',
			message: 'Delivery exception - will attempt redelivery',
		})
	}

	return events
}

/**
 * Determine fulfillment status from shipment status
 */
export function mapShipmentToFulfillmentStatus(shipmentStatus: SparkShipmentStatus): SparkFulfillmentStatus {
	const mapping: Record<SparkShipmentStatus, SparkFulfillmentStatus> = {
		label_created: 'processing',
		in_transit: 'shipped',
		out_for_delivery: 'shipped',
		delivered: 'delivered',
		exception: 'processing',
		failed_delivery: 'failed',
		returned: 'cancelled',
	}

	return mapping[shipmentStatus] || 'pending'
}
