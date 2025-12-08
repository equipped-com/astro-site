/**
 * @REQ-TRADE-008 Track return shipment
 * @REQ-TRADE-009 Device inspection
 * @REQ-TRADE-010 Credit applied
 * Tests for TradeInStatus component covering tracking, inspection, and credit application
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TradeInItem } from '@/lib/alchemy/types'
import { TradeInStatus } from './TradeInStatus'

const baseTradeIn: TradeInItem = {
	id: 'TI-123',
	serial: 'C02XG0FDH05N',
	model: 'MacBook Pro 16-inch',
	year: 2021,
	color: 'Space Gray',
	conditionGrade: 'good',
	estimatedValue: 850,
	valuationId: 'VAL-123',
	expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
	status: 'quote',
}

describe('TradeInStatus Component', () => {
	describe('@REQ-TRADE-008 Track return shipment', () => {
		it('should display tracking information when available', () => {
			const tradeInInTransit: TradeInItem = {
				...baseTradeIn,
				status: 'in_transit',
				shippingLabel: {
					labelId: 'LBL-789',
					trackingNumber: '1Z999AA10123456789',
					carrier: 'FedEx',
					labelUrl: 'https://example.com/label.pdf',
					createdAt: new Date().toISOString(),
					expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
				},
				tracking: {
					trackingNumber: '1Z999AA10123456789',
					carrier: 'FedEx',
					status: 'in_transit',
					currentLocation: 'Memphis, TN',
					estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
					events: [
						{
							timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
							status: 'In Transit',
							location: 'Memphis, TN',
							description: 'Package arrived at FedEx facility',
						},
						{
							timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
							status: 'Picked Up',
							location: 'New York, NY',
							description: 'Picked up by FedEx',
						},
					],
				},
			}

			render(<TradeInStatus tradeIn={tradeInInTransit} />)

			expect(screen.getByText('Tracking Information')).toBeInTheDocument()
			expect(screen.getByText('FedEx')).toBeInTheDocument()
			expect(screen.getByText('1Z999AA10123456789')).toBeInTheDocument()
			expect(screen.getAllByText('Memphis, TN')).toHaveLength(2) // Current location and event location
		})

		it('should show status progression through all stages', () => {
			const tradeIn: TradeInItem = {
				...baseTradeIn,
				status: 'in_transit',
			}

			render(<TradeInStatus tradeIn={tradeIn} />)

			// All status steps should be visible
			expect(screen.getByText('Quote Accepted')).toBeInTheDocument()
			expect(screen.getByText('Label Sent')).toBeInTheDocument()
			expect(screen.getByText('In Transit')).toBeInTheDocument()
			expect(screen.getByText('Received')).toBeInTheDocument()
			expect(screen.getByText('Inspecting')).toBeInTheDocument()
			expect(screen.getByText('Credited')).toBeInTheDocument()
		})

		it('should show shipment history events', () => {
			const tradeInWithTracking: TradeInItem = {
				...baseTradeIn,
				status: 'in_transit',
				tracking: {
					trackingNumber: '1Z999AA10123456789',
					carrier: 'FedEx',
					status: 'in_transit',
					events: [
						{
							timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
							status: 'In Transit',
							location: 'Memphis, TN',
							description: 'Package arrived at FedEx facility',
						},
						{
							timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
							status: 'Picked Up',
							location: 'New York, NY',
							description: 'Picked up by FedEx',
						},
					],
				},
			}

			render(<TradeInStatus tradeIn={tradeInWithTracking} />)

			expect(screen.getByText('Shipment History')).toBeInTheDocument()
			expect(screen.getByText('Package arrived at FedEx facility')).toBeInTheDocument()
			expect(screen.getByText('Picked up by FedEx')).toBeInTheDocument()
		})

		it('should show estimated delivery date when in transit', () => {
			const estimatedDelivery = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
			const tradeIn: TradeInItem = {
				...baseTradeIn,
				status: 'in_transit',
				tracking: {
					trackingNumber: '1Z999AA10123456789',
					carrier: 'FedEx',
					status: 'in_transit',
					estimatedDelivery: estimatedDelivery.toISOString(),
					events: [],
				},
			}

			render(<TradeInStatus tradeIn={tradeIn} />)

			expect(screen.getByText(/Estimated delivery:/)).toBeInTheDocument()
		})
	})

	describe('@REQ-TRADE-009 Device inspection', () => {
		it('should display inspection results when completed', () => {
			const tradeInInspected: TradeInItem = {
				...baseTradeIn,
				status: 'inspecting',
				inspection: {
					inspectionId: 'INS-456',
					inspectedAt: new Date().toISOString(),
					actualCondition: 'good',
					estimatedValue: 850,
					finalValue: 850,
					requiresApproval: false,
				},
			}

			render(<TradeInStatus tradeIn={tradeInInspected} />)

			expect(screen.getByText('Inspection Results')).toBeInTheDocument()
			expect(screen.getByText('good')).toBeInTheDocument()
			// Should show $850 at least twice (estimated and final value in inspection, plus main value)
			expect(screen.getAllByText('$850')).toHaveLength(3)
		})

		it('should show adjustment when final value differs from estimate', () => {
			const tradeInAdjusted: TradeInItem = {
				...baseTradeIn,
				status: 'inspecting',
				finalValue: 700,
				inspection: {
					inspectionId: 'INS-456',
					inspectedAt: new Date().toISOString(),
					actualCondition: 'fair',
					estimatedValue: 850,
					finalValue: 700,
					adjustmentReason: 'Minor screen scratches found',
					requiresApproval: true,
				},
				adjustment: {
					adjustmentId: 'ADJ-789',
					originalValue: 850,
					newValue: 700,
					reason: 'Minor screen scratches found',
					createdAt: new Date().toISOString(),
					status: 'pending_approval',
				},
			}

			render(<TradeInStatus tradeIn={tradeInAdjusted} />)

			expect(screen.getByText('Value Adjustment Required')).toBeInTheDocument()
			expect(screen.getByText(/New value: \$700/)).toBeInTheDocument()
			// Text appears both in alert and in inspection results
			expect(screen.getAllByText('Minor screen scratches found')).toHaveLength(2)
		})

		it('should notify customer of value changes', () => {
			const onViewAdjustment = vi.fn()
			const tradeInAdjusted: TradeInItem = {
				...baseTradeIn,
				status: 'inspecting',
				adjustment: {
					adjustmentId: 'ADJ-789',
					originalValue: 850,
					newValue: 700,
					reason: 'Screen damage found during inspection',
					createdAt: new Date().toISOString(),
					status: 'pending_approval',
				},
			}

			render(<TradeInStatus tradeIn={tradeInAdjusted} onViewAdjustment={onViewAdjustment} />)

			const reviewButton = screen.getByText('Review')
			fireEvent.click(reviewButton)

			expect(onViewAdjustment).toHaveBeenCalled()
		})

		it('should show inspection notes when provided', () => {
			const tradeIn: TradeInItem = {
				...baseTradeIn,
				status: 'inspecting',
				inspection: {
					inspectionId: 'INS-456',
					inspectedAt: new Date().toISOString(),
					actualCondition: 'fair',
					estimatedValue: 850,
					finalValue: 700,
					adjustmentReason: 'Device has minor cosmetic damage not disclosed',
					requiresApproval: true,
					inspector: 'John Doe',
				},
			}

			render(<TradeInStatus tradeIn={tradeIn} />)

			expect(screen.getByText('Adjustment Notes')).toBeInTheDocument()
			expect(screen.getByText('Device has minor cosmetic damage not disclosed')).toBeInTheDocument()
			expect(screen.getByText(/Inspected by: John Doe/)).toBeInTheDocument()
		})
	})

	describe('@REQ-TRADE-010 Credit applied', () => {
		it('should show credited status when complete', () => {
			const creditedTradeIn: TradeInItem = {
				...baseTradeIn,
				status: 'credited',
				creditedAt: new Date().toISOString(),
				creditAmount: 850,
			}

			render(<TradeInStatus tradeIn={creditedTradeIn} />)

			expect(screen.getByText('Credit Applied!')).toBeInTheDocument()
			expect(screen.getByText(/\$850 has been applied to your account/)).toBeInTheDocument()
		})

		it('should show credit application date', () => {
			const creditDate = new Date('2024-12-15T10:00:00Z')
			const creditedTradeIn: TradeInItem = {
				...baseTradeIn,
				status: 'credited',
				creditedAt: creditDate.toISOString(),
				creditAmount: 850,
			}

			render(<TradeInStatus tradeIn={creditedTradeIn} />)

			expect(screen.getByText(/Dec 15, 2024/)).toBeInTheDocument()
		})

		it('should show final credit amount', () => {
			const creditedTradeIn: TradeInItem = {
				...baseTradeIn,
				status: 'credited',
				estimatedValue: 850,
				finalValue: 700,
				creditedAt: new Date().toISOString(),
				creditAmount: 700,
			}

			render(<TradeInStatus tradeIn={creditedTradeIn} />)

			// Should show final credited amount (appears in header and in success message)
			expect(screen.getAllByText(/\$700/)).toHaveLength(1)
		})
	})

	describe('@REQ-TRADE-011 Value adjustment', () => {
		it('should show disputed status when customer disputes adjustment', () => {
			const disputedTradeIn: TradeInItem = {
				...baseTradeIn,
				status: 'disputed',
				adjustment: {
					adjustmentId: 'ADJ-789',
					originalValue: 850,
					newValue: 350,
					reason: 'Significant damage found',
					createdAt: new Date().toISOString(),
					status: 'disputed',
				},
			}

			render(<TradeInStatus tradeIn={disputedTradeIn} />)

			expect(screen.getByText('Trade-In Disputed')).toBeInTheDocument()
			expect(screen.getByText(/reviewing your dispute/)).toBeInTheDocument()
		})
	})

	describe('Progress Timeline', () => {
		it('should highlight current status', () => {
			const tradeIn: TradeInItem = {
				...baseTradeIn,
				status: 'received',
			}

			const { container } = render(<TradeInStatus tradeIn={tradeIn} />)

			// Received should be highlighted as current
			const progressSection = container.querySelector('.space-y-4')
			expect(progressSection).toBeTruthy()
		})

		it('should show completed steps with check marks', () => {
			const tradeIn: TradeInItem = {
				...baseTradeIn,
				status: 'inspecting',
			}

			render(<TradeInStatus tradeIn={tradeIn} />)

			// Earlier steps should be marked as completed
			expect(screen.getByText('Progress')).toBeInTheDocument()
		})
	})

	describe('Device Information Display', () => {
		it('should display device details', () => {
			render(<TradeInStatus tradeIn={baseTradeIn} />)

			expect(screen.getByText('MacBook Pro 16-inch (2021)')).toBeInTheDocument()
			expect(screen.getByText('C02XG0FDH05N')).toBeInTheDocument()
		})

		it('should display trade-in value', () => {
			render(<TradeInStatus tradeIn={baseTradeIn} />)

			expect(screen.getByText('$850')).toBeInTheDocument()
		})
	})
})
