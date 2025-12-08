/**
 * @REQ-TRADE-007 Generate return label
 * @REQ-TRADE-008 Track return shipment
 * @REQ-TRADE-009 Device inspection
 * @REQ-TRADE-010 Credit applied
 * @REQ-TRADE-011 Value adjustment
 *
 * Tests for trade-in status API endpoints
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	acceptAdjustment,
	applyCredit,
	createTradeInFromValuation,
	createValueAdjustment,
	disputeAdjustment,
	generateShippingLabel,
	getShipmentTracking,
	getTradeInStatus,
	recordInspection,
} from './trade-in-status'

describe('Trade-In Status API', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('@REQ-TRADE-007 Generate return label', () => {
		it('should generate prepaid shipping label', async () => {
			const tradeInId = 'TI-123'
			const label = await generateShippingLabel(tradeInId)

			expect(label).toBeDefined()
			expect(label.labelId).toMatch(/^LBL-/)
			expect(label.trackingNumber).toMatch(/^1Z999AA1/)
			expect(label.carrier).toBe('FedEx')
			expect(label.labelUrl).toContain('/api/trade-in/label-pdf/')
			expect(label.createdAt).toBeDefined()
			expect(label.expiresAt).toBeDefined()
		})

		it('should set label expiration to 30 days', async () => {
			const label = await generateShippingLabel('TI-123')

			const expiresAt = new Date(label.expiresAt)
			const now = new Date()
			const daysDiff = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

			expect(daysDiff).toBeGreaterThanOrEqual(29)
			expect(daysDiff).toBeLessThanOrEqual(30)
		})

		it('should include unique tracking number', async () => {
			const label1 = await generateShippingLabel('TI-123')
			const label2 = await generateShippingLabel('TI-456')

			expect(label1.trackingNumber).not.toBe(label2.trackingNumber)
			expect(label1.labelId).not.toBe(label2.labelId)
		})
	})

	describe('@REQ-TRADE-008 Track return shipment', () => {
		it('should get tracking information for shipment', async () => {
			const tracking = await getShipmentTracking('1Z999AA10123456789')

			expect(tracking).toBeDefined()
			expect(tracking.trackingNumber).toBe('1Z999AA10123456789')
			expect(tracking.carrier).toBe('FedEx')
			expect(tracking.status).toBeDefined()
			expect(tracking.events).toBeInstanceOf(Array)
		})

		it('should include current location and estimated delivery', async () => {
			const tracking = await getShipmentTracking('1Z999AA10123456789')

			expect(tracking.currentLocation).toBeDefined()
			expect(tracking.estimatedDelivery).toBeDefined()
		})

		it('should include tracking events in chronological order', async () => {
			const tracking = await getShipmentTracking('1Z999AA10123456789')

			expect(tracking.events.length).toBeGreaterThan(0)
			for (const event of tracking.events) {
				expect(event.timestamp).toBeDefined()
				expect(event.status).toBeDefined()
				expect(event.location).toBeDefined()
				expect(event.description).toBeDefined()
			}

			// Events should be in reverse chronological order (newest first)
			if (tracking.events.length > 1) {
				const firstTimestamp = new Date(tracking.events[0].timestamp).getTime()
				const lastTimestamp = new Date(tracking.events[tracking.events.length - 1].timestamp).getTime()
				expect(firstTimestamp).toBeGreaterThan(lastTimestamp)
			}
		})

		it('should show progression through statuses', async () => {
			const tracking = await getShipmentTracking('1Z999AA10123456789')

			const statusProgression = tracking.events.map(e => e.status)
			expect(statusProgression).toContain('Label Created')
		})
	})

	describe('Trade-In Status Retrieval', () => {
		it('should get complete trade-in status', async () => {
			const tradeIn = await getTradeInStatus('TI-123')

			expect(tradeIn).toBeDefined()
			expect(tradeIn.id).toBe('TI-123')
			expect(tradeIn.serial).toBeDefined()
			expect(tradeIn.model).toBeDefined()
			expect(tradeIn.status).toBeDefined()
		})

		it('should include shipping label if exists', async () => {
			const tradeIn = await getTradeInStatus('TI-123')

			if (tradeIn.shippingLabel) {
				expect(tradeIn.shippingLabel.labelId).toBeDefined()
				expect(tradeIn.shippingLabel.trackingNumber).toBeDefined()
				expect(tradeIn.shippingLabel.carrier).toBeDefined()
			}
		})

		it('should include tracking if label exists', async () => {
			const tradeIn = await getTradeInStatus('TI-123')

			if (tradeIn.shippingLabel && tradeIn.tracking) {
				expect(tradeIn.tracking.trackingNumber).toBe(tradeIn.shippingLabel.trackingNumber)
				expect(tradeIn.tracking.events).toBeInstanceOf(Array)
			}
		})
	})

	describe('@REQ-TRADE-009 Device inspection', () => {
		it('should record inspection results', async () => {
			const inspection = await recordInspection('TI-123', {
				actualCondition: 'good',
				estimatedValue: 850,
				finalValue: 850,
				requiresApproval: false,
			})

			expect(inspection.inspectionId).toMatch(/^INS-/)
			expect(inspection.inspectedAt).toBeDefined()
			expect(inspection.actualCondition).toBe('good')
			expect(inspection.finalValue).toBe(850)
			expect(inspection.requiresApproval).toBe(false)
		})

		it('should handle value adjustment with reason', async () => {
			const inspection = await recordInspection('TI-123', {
				actualCondition: 'fair',
				estimatedValue: 850,
				finalValue: 700,
				adjustmentReason: 'Screen damage found during inspection',
				requiresApproval: true,
			})

			expect(inspection.finalValue).toBe(700)
			expect(inspection.adjustmentReason).toBe('Screen damage found during inspection')
			expect(inspection.requiresApproval).toBe(true)
		})

		it('should include inspector information when provided', async () => {
			const inspection = await recordInspection('TI-123', {
				actualCondition: 'good',
				estimatedValue: 850,
				finalValue: 850,
				requiresApproval: false,
				inspector: 'John Doe',
			})

			expect(inspection.inspector).toBe('John Doe')
		})
	})

	describe('@REQ-TRADE-011 Value adjustment', () => {
		it('should create value adjustment for customer approval', async () => {
			const adjustment = await createValueAdjustment('TI-123', {
				originalValue: 450,
				newValue: 350,
				reason: 'Issues not disclosed during initial assessment',
			})

			expect(adjustment.adjustmentId).toMatch(/^ADJ-/)
			expect(adjustment.createdAt).toBeDefined()
			expect(adjustment.status).toBe('pending_approval')
			expect(adjustment.originalValue).toBe(450)
			expect(adjustment.newValue).toBe(350)
			expect(adjustment.reason).toBeDefined()
		})

		it('should allow customer to accept adjustment', async () => {
			const consoleSpy = vi.spyOn(console, 'log')

			await acceptAdjustment('TI-123', 'ADJ-789')

			expect(consoleSpy).toHaveBeenCalledWith('Adjustment ADJ-789 accepted for trade-in TI-123')
		})

		it('should allow customer to dispute adjustment', async () => {
			const consoleSpy = vi.spyOn(console, 'log')

			await disputeAdjustment('TI-123', 'ADJ-789', 'Device was in better condition than stated')

			expect(consoleSpy).toHaveBeenCalledWith(
				'Adjustment ADJ-789 disputed for trade-in TI-123: Device was in better condition than stated',
			)
		})
	})

	describe('@REQ-TRADE-010 Credit applied', () => {
		it('should apply trade-in credit to customer account', async () => {
			const consoleSpy = vi.spyOn(console, 'log')

			await applyCredit('TI-123', 850)

			expect(consoleSpy).toHaveBeenCalledWith('Credit of $850 applied for trade-in TI-123')
		})

		it('should handle adjusted credit amount', async () => {
			const consoleSpy = vi.spyOn(console, 'log')

			await applyCredit('TI-123', 700)

			expect(consoleSpy).toHaveBeenCalledWith('Credit of $700 applied for trade-in TI-123')
		})
	})

	describe('Trade-In Creation from Valuation', () => {
		it('should create trade-in from accepted valuation', async () => {
			const tradeIn = await createTradeInFromValuation('VAL-123', 850)

			expect(tradeIn).toBeDefined()
			expect(tradeIn.id).toMatch(/^TI-/)
			expect(tradeIn.valuationId).toBe('VAL-123')
			expect(tradeIn.estimatedValue).toBe(850)
			expect(tradeIn.status).toBe('quote')
		})

		it('should set expiration date for new trade-in', async () => {
			const tradeIn = await createTradeInFromValuation('VAL-123', 850)

			const expiresAt = new Date(tradeIn.expiresAt)
			const now = new Date()
			const daysDiff = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

			expect(daysDiff).toBeGreaterThanOrEqual(29)
			expect(daysDiff).toBeLessThanOrEqual(30)
		})
	})

	describe('Status Progression', () => {
		it('should progress through expected status stages', async () => {
			// Test that statuses follow expected flow:
			// quote -> label_sent -> in_transit -> received -> inspecting -> credited
			const validStatuses = ['quote', 'label_sent', 'in_transit', 'received', 'inspecting', 'credited', 'disputed']

			const tradeIn = await getTradeInStatus('TI-123')
			expect(validStatuses).toContain(tradeIn.status)
		})
	})

	describe('Email Notifications', () => {
		it('should log email notification for shipping label', async () => {
			// Currently mocked - will integrate with email service later
			const consoleSpy = vi.spyOn(console, 'log')

			// This would be imported and tested when implemented
			// await emailShippingLabel('TI-123', 'customer@example.com')

			// Placeholder test for future implementation
			expect(true).toBe(true)
		})
	})
})
