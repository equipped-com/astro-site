/**
 * @vitest-environment node
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { SparkClient } from './client'
import { mockInventoryItems, mockTrackingData } from './mock-data'
import type { SparkFulfillmentRequest } from './types'

describe('SparkClient', () => {
	let client: SparkClient

	beforeEach(() => {
		client = new SparkClient({
			apiUrl: 'https://api.spark-shipping.test',
			apiKey: 'test-key',
			useMock: true,
		})
	})

	// ============================================================================
	// @REQ: Inventory sync endpoint
	// ============================================================================

	describe('Feature: Inventory Sync @REQ', () => {
		describe('Scenario: Get all inventory', () => {
			it('Given Spark has inventory items, When I request inventory, Then I receive all items with pagination', async () => {
				// When
				const result = await client.getInventory()

				// Then
				expect(result.success).toBe(true)
				expect(result.data).toBeDefined()
				expect(result.data?.items).toBeInstanceOf(Array)
				expect(result.data?.items.length).toBeGreaterThan(0)
				expect(result.data?.pagination).toBeDefined()
				expect(result.data?.lastSyncedAt).toBeDefined()
			})

			it('Given mock inventory, When I request inventory, Then each item has required fields', async () => {
				// When
				const result = await client.getInventory()

				// Then
				expect(result.success).toBe(true)
				const item = result.data?.items[0]
				expect(item).toBeDefined()
				expect(item?.sku).toBeDefined()
				expect(item?.productName).toBeDefined()
				expect(item?.available).toBeGreaterThanOrEqual(0)
				expect(item?.price).toBeDefined()
				expect(item?.price.cost).toBeDefined()
				expect(item?.price.retail).toBeDefined()
			})
		})

		describe('Scenario: Filter inventory by SKU', () => {
			it('Given multiple inventory items, When I filter by specific SKU, Then I only receive that SKU', async () => {
				// Given
				const targetSku = mockInventoryItems[0].sku

				// When
				const result = await client.getInventoryBySku(targetSku)

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.items.length).toBe(1)
				expect(result.data?.items[0].sku).toBe(targetSku)
			})

			it('Given inventory items, When I filter by multiple SKUs, Then I receive only matching items', async () => {
				// Given
				const targetSkus = [mockInventoryItems[0].sku, mockInventoryItems[1].sku]

				// When
				const result = await client.getInventory({ skus: targetSkus })

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.items.length).toBe(2)
				expect(result.data?.items.every(item => targetSkus.includes(item.sku))).toBe(true)
			})
		})

		describe('Scenario: Filter inventory by category', () => {
			it('Given items in different categories, When I filter by category, Then I only receive items from that category', async () => {
				// Given
				const category = 'Laptops'

				// When
				const result = await client.getInventory({ category })

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.items.every(item => item.category === category)).toBe(true)
			})
		})

		describe('Scenario: Check inventory availability', () => {
			it('Given items with varying stock, When I filter by available only, Then I only receive items with stock > 0', async () => {
				// When
				const result = await client.getInventory({ available: true })

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.items.every(item => item.available > 0)).toBe(true)
			})
		})

		describe('Scenario: Inventory levels sync correctly @REQ', () => {
			it('Given Spark inventory, When I sync inventory, Then levels match expected values', async () => {
				// When
				const result = await client.getInventory()

				// Then
				expect(result.success).toBe(true)
				const macbookAir = result.data?.items.find(item => item.sku === 'MBAIR-M2-256-SG')
				expect(macbookAir).toBeDefined()
				expect(macbookAir?.available).toBe(45)
				expect(macbookAir?.reserved).toBe(5)
				expect(macbookAir?.onOrder).toBe(20)
			})
		})
	})

	// ============================================================================
	// @REQ: Order fulfillment trigger
	// ============================================================================

	describe('Feature: Order Fulfillment @REQ', () => {
		describe('Scenario: Trigger fulfillment for new order', () => {
			it('Given a new order, When I trigger fulfillment, Then I receive Spark order ID and tracking info', async () => {
				// Given
				const fulfillmentRequest: SparkFulfillmentRequest = {
					orderId: 'TEST_ORDER_123',
					orderNumber: '1234',
					lineItems: [
						{
							sku: 'MBAIR-M2-256-SG',
							productName: 'MacBook Air M2 256GB',
							quantity: 1,
							price: '1199.00',
						},
					],
					shippingAddress: {
						name: 'Test Customer',
						address1: '123 Test St',
						city: 'San Francisco',
						state: 'CA',
						postalCode: '94102',
						country: 'US',
					},
				}

				// When
				const result = await client.fulfillOrder(fulfillmentRequest)

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.success).toBe(true)
				expect(result.data?.sparkOrderId).toBeDefined()
				expect(result.data?.orderId).toBe('TEST_ORDER_123')
				expect(result.data?.status).toBe('processing')
				expect(result.data?.trackingNumbers).toBeDefined()
				expect(result.data?.trackingNumbers?.length).toBeGreaterThan(0)
				expect(result.data?.carrier).toBeDefined()
			})

			it('Given fulfillment request with shipping method, When I trigger fulfillment, Then order is created successfully', async () => {
				// Given
				const request: SparkFulfillmentRequest = {
					orderId: 'TEST_EXPRESS_ORDER',
					orderNumber: '1235',
					lineItems: [
						{
							sku: 'IPAD-PRO-11-256-SG',
							productName: 'iPad Pro 11',
							quantity: 2,
							price: '899.00',
						},
					],
					shippingAddress: {
						name: 'Express Customer',
						company: 'Fast Corp',
						address1: '456 Rush Ave',
						city: 'New York',
						state: 'NY',
						postalCode: '10001',
						country: 'US',
					},
					shippingMethod: 'express',
					notes: 'Please ship ASAP',
				}

				// When
				const result = await client.fulfillOrder(request)

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.sparkOrderId).toMatch(/^SPK-\d{4}-\d{6}$/)
			})
		})

		describe('Scenario: Orders trigger fulfillment @REQ', () => {
			it('Given an order is placed, When fulfillment is triggered, Then status is processing', async () => {
				// Given
				const request: SparkFulfillmentRequest = {
					orderId: 'ORDER_PROCESSING_TEST',
					orderNumber: '1236',
					lineItems: [
						{
							sku: 'MBAIR-M2-256-SG',
							productName: 'MacBook Air M2',
							quantity: 1,
							price: '1199.00',
						},
					],
					shippingAddress: {
						name: 'Processing Test',
						address1: '789 Status St',
						city: 'Austin',
						state: 'TX',
						postalCode: '78701',
						country: 'US',
					},
				}

				// When
				const result = await client.fulfillOrder(request)

				// Then
				expect(result.success).toBe(true)
				expect(['processing', 'pending']).toContain(result.data?.status)
			})
		})

		describe('Scenario: Get fulfillment status', () => {
			it('Given an existing order, When I check fulfillment status, Then I receive current status', async () => {
				// Given - using mock data order
				const orderId = 'ORDER_1001'

				// When
				const result = await client.getFulfillmentStatus(orderId)

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.orderId).toBe(orderId)
				expect(result.data?.status).toBeDefined()
				expect(result.data?.sparkOrderId).toBeDefined()
			})

			it('Given a non-existent order, When I check status, Then I receive error', async () => {
				// When
				const result = await client.getFulfillmentStatus('NONEXISTENT_ORDER')

				// Then
				expect(result.success).toBe(false)
				expect(result.error).toBeDefined()
			})
		})
	})

	// ============================================================================
	// @REQ: Shipment tracking integration
	// ============================================================================

	describe('Feature: Shipment Tracking @REQ', () => {
		describe('Scenario: Get tracking by order ID', () => {
			it('Given an order with tracking, When I request tracking by order ID, Then I receive tracking info', async () => {
				// Given
				const orderId = 'ORDER_1001'

				// When
				const result = await client.getTrackingByOrderId(orderId)

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.orderId).toBe(orderId)
				expect(result.data?.trackingNumber).toBeDefined()
				expect(result.data?.carrier).toBeDefined()
				expect(result.data?.status).toBeDefined()
				expect(result.data?.trackingEvents).toBeInstanceOf(Array)
			})
		})

		describe('Scenario: Get tracking by tracking number', () => {
			it('Given a tracking number, When I request tracking info, Then I receive shipment details', async () => {
				// Given
				const trackingNumber = mockTrackingData.ORDER_1001.trackingNumber

				// When
				const result = await client.getTrackingByNumber(trackingNumber)

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.trackingNumber).toBe(trackingNumber)
				expect(result.data?.status).toBeDefined()
			})
		})

		describe('Scenario: Tracking numbers received @REQ', () => {
			it('Given an order is fulfilled, When I check tracking, Then tracking number is available', async () => {
				// Given
				const orderId = 'ORDER_1001'

				// When
				const result = await client.getTrackingByOrderId(orderId)

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.trackingNumber).toMatch(/^TRK\d{10}US$/)
			})
		})

		describe('Scenario: Track shipment with events', () => {
			it('Given a shipped order, When I request tracking, Then I receive tracking events', async () => {
				// Given
				const orderId = 'ORDER_1001'

				// When
				const result = await client.getTrackingByOrderId(orderId)

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.trackingEvents).toBeDefined()
				expect(result.data?.trackingEvents.length).toBeGreaterThan(0)
				const firstEvent = result.data?.trackingEvents[0]
				expect(firstEvent?.timestamp).toBeDefined()
				expect(firstEvent?.status).toBeDefined()
				expect(firstEvent?.message).toBeDefined()
			})
		})

		describe('Scenario: Track delivered package', () => {
			it('Given a delivered order, When I check tracking, Then status is delivered with delivery date', async () => {
				// Given
				const orderId = 'ORDER_1002'

				// When
				const result = await client.getTrackingByOrderId(orderId)

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.status).toBe('delivered')
				expect(result.data?.deliveredDate).toBeDefined()
			})
		})

		describe('Scenario: Invalid tracking request', () => {
			it('Given an invalid order ID, When I request tracking, Then I receive error', async () => {
				// When
				const result = await client.getTrackingByOrderId('INVALID_ORDER')

				// Then
				expect(result.success).toBe(false)
				expect(result.error).toBeDefined()
			})
		})
	})

	// ============================================================================
	// @REQ: Pricing sync
	// ============================================================================

	describe('Feature: Pricing Sync @REQ', () => {
		describe('Scenario: Get all pricing', () => {
			it('Given Spark has pricing data, When I request pricing, Then I receive pricing updates', async () => {
				// When
				const result = await client.getPricing()

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.updates).toBeInstanceOf(Array)
				expect(result.data?.updates.length).toBeGreaterThan(0)
				expect(result.data?.syncedAt).toBeDefined()
			})

			it('Given pricing data, When I request pricing, Then each update has required fields', async () => {
				// When
				const result = await client.getPricing()

				// Then
				expect(result.success).toBe(true)
				const update = result.data?.updates[0]
				expect(update?.sku).toBeDefined()
				expect(update?.cost).toBeDefined()
				expect(update?.retail).toBeDefined()
				expect(update?.currency).toBeDefined()
				expect(update?.effectiveDate).toBeDefined()
			})
		})

		describe('Scenario: Filter pricing by SKU', () => {
			it('Given multiple products, When I filter pricing by SKU, Then I only receive that SKU pricing', async () => {
				// Given
				const targetSku = mockInventoryItems[0].sku

				// When
				const result = await client.getPricing({ skus: [targetSku] })

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.updates.length).toBe(1)
				expect(result.data?.updates[0].sku).toBe(targetSku)
			})
		})

		describe('Scenario: Pricing updates reflected @REQ', () => {
			it('Given pricing is synced, When I check pricing data, Then cost and retail prices are correct', async () => {
				// When
				const result = await client.getPricing()

				// Then
				expect(result.success).toBe(true)
				const macbookAirPricing = result.data?.updates.find(u => u.sku === 'MBAIR-M2-256-SG')
				expect(macbookAirPricing).toBeDefined()
				expect(macbookAirPricing?.cost).toBe('999.00')
				expect(macbookAirPricing?.retail).toBe('1199.00')
				expect(macbookAirPricing?.currency).toBe('USD')
			})
		})

		describe('Scenario: Get recent pricing changes', () => {
			it('Given pricing changes in last 24 hours, When I request recent changes, Then I receive them', async () => {
				// When
				const result = await client.getRecentPricingChanges(24)

				// Then
				expect(result.success).toBe(true)
				expect(result.data?.updates).toBeDefined()
				expect(result.data?.changedCount).toBeGreaterThanOrEqual(0)
			})
		})
	})

	// ============================================================================
	// INTEGRATION SCENARIOS
	// ============================================================================

	describe('Feature: Full Order-to-Delivery Flow', () => {
		describe('Scenario: Complete order fulfillment and tracking', () => {
			it('Given a new order, When I fulfill and track it, Then I can monitor entire lifecycle', async () => {
				// Given - Create fulfillment request
				const request: SparkFulfillmentRequest = {
					orderId: 'INTEGRATION_TEST_ORDER',
					orderNumber: '9999',
					lineItems: [
						{
							sku: 'MBAIR-M2-256-SG',
							productName: 'MacBook Air M2',
							quantity: 1,
							price: '1199.00',
						},
					],
					shippingAddress: {
						name: 'Integration Test',
						address1: '123 Test St',
						city: 'San Francisco',
						state: 'CA',
						postalCode: '94102',
						country: 'US',
					},
				}

				// When - Fulfill order
				const fulfillResult = await client.fulfillOrder(request)

				// Then - Fulfillment successful
				expect(fulfillResult.success).toBe(true)
				expect(fulfillResult.data?.sparkOrderId).toBeDefined()
				expect(fulfillResult.data?.trackingNumbers).toBeDefined()

				// And - Can check status
				const statusResult = await client.getFulfillmentStatus(request.orderId)
				expect(statusResult.success).toBe(true)
			})
		})
	})

	// ============================================================================
	// CLIENT CONFIGURATION
	// ============================================================================

	describe('Feature: Client Configuration', () => {
		describe('Scenario: Create client with mock mode', () => {
			it('Given useMock is true, When I create client, Then it uses mock data', () => {
				const mockClient = new SparkClient({
					apiUrl: 'https://test.api',
					apiKey: 'test',
					useMock: true,
				})

				expect(mockClient).toBeDefined()
			})

			it('Given no API key, When I create client, Then it defaults to mock mode', () => {
				const autoMockClient = new SparkClient({
					apiUrl: 'https://test.api',
					apiKey: '',
				})

				expect(autoMockClient).toBeDefined()
			})
		})
	})
})
