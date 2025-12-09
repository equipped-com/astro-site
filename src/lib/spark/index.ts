/**
 * Spark Shipping Integration
 *
 * Main entry point for Spark Shipping API integration.
 * Exports client, types, and utilities.
 */

export { SparkClient, createSparkClient } from './client'
export type { SparkClientConfig } from './client'
export * from './types'
export { mockInventoryItems, mockTrackingData, generateTrackingEvents, mapShipmentToFulfillmentStatus } from './mock-data'
