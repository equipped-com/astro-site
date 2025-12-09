/**
 * Spark Shipping Integration
 *
 * Main entry point for Spark Shipping API integration.
 * Exports client, types, and utilities.
 */

export type { SparkClientConfig } from './client'
export { createSparkClient, SparkClient } from './client'
export {
	generateTrackingEvents,
	mapShipmentToFulfillmentStatus,
	mockInventoryItems,
	mockTrackingData,
} from './mock-data'
export * from './types'
