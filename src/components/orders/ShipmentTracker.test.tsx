/**
 * @REQ-ORD-008: Track shipment
 * Tests that shipment tracking displays carrier info, tracking details, and estimated delivery
 */

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ShipmentTracker } from './ShipmentTracker'

describe('ShipmentTracker', () => {
	/**
	 * @REQ-ORD-008: Track shipment
	 * Scenario: Track shipment
	 * Given order status is "Shipped"
	 * And tracking number exists
	 * When I click "Track shipment"
	 * Then I should see carrier information
	 */
	it('should display carrier information', () => {
		render(
			<ShipmentTracker
				trackingNumber="1Z999AA10123456784"
				carrier="UPS"
				estimatedDelivery="2025-12-15T18:00:00Z"
				status="shipped"
			/>,
		)

		expect(screen.getByText('UPS')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Then I should see tracking details
	 */
	it('should display tracking number', () => {
		render(
			<ShipmentTracker
				trackingNumber="1Z999AA10123456784"
				carrier="UPS"
				estimatedDelivery="2025-12-15T18:00:00Z"
				status="shipped"
			/>,
		)

		expect(screen.getByText('Tracking Number')).toBeInTheDocument()
		expect(screen.getByText('1Z999AA10123456784')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Then I should see estimated delivery date
	 */
	it('should display estimated delivery date', () => {
		render(
			<ShipmentTracker
				trackingNumber="1Z999AA10123456784"
				carrier="UPS"
				estimatedDelivery="2025-12-15T18:00:00Z"
				status="shipped"
			/>,
		)

		expect(screen.getByText(/Estimated delivery:/i)).toBeInTheDocument()
		// Date format may include year if different from current year
		expect(screen.getByText(/Dec/i)).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Then I should see tracking link button
	 */
	it('should provide "Track shipment" button', () => {
		render(
			<ShipmentTracker
				trackingNumber="1Z999AA10123456784"
				carrier="UPS"
				estimatedDelivery="2025-12-15T18:00:00Z"
				status="shipped"
			/>,
		)

		const trackButton = screen.getByText('Track shipment')
		expect(trackButton).toBeInTheDocument()
		expect(trackButton.closest('a')).toHaveAttribute('href', expect.stringContaining('ups.com'))
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Verify UPS tracking URL generation
	 */
	it('should generate correct UPS tracking URL', () => {
		render(
			<ShipmentTracker
				trackingNumber="1Z999AA10123456784"
				carrier="UPS"
				estimatedDelivery="2025-12-15T18:00:00Z"
				status="shipped"
			/>,
		)

		const trackButton = screen.getByText('Track shipment')
		const link = trackButton.closest('a')
		expect(link).toHaveAttribute('href', 'https://www.ups.com/track?tracknum=1Z999AA10123456784')
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Verify FedEx tracking URL generation
	 */
	it('should generate correct FedEx tracking URL', () => {
		render(
			<ShipmentTracker
				trackingNumber="123456789012"
				carrier="FedEx"
				estimatedDelivery="2025-12-15T18:00:00Z"
				status="shipped"
			/>,
		)

		const trackButton = screen.getByText('Track shipment')
		const link = trackButton.closest('a')
		expect(link).toHaveAttribute('href', 'https://www.fedex.com/fedextrack/?trknbr=123456789012')
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Verify USPS tracking URL generation
	 */
	it('should generate correct USPS tracking URL', () => {
		render(
			<ShipmentTracker
				trackingNumber="9400111899561234567890"
				carrier="USPS"
				estimatedDelivery="2025-12-15T18:00:00Z"
				status="shipped"
			/>,
		)

		const trackButton = screen.getByText('Track shipment')
		const link = trackButton.closest('a')
		expect(link).toHaveAttribute('href', 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899561234567890')
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Verify DHL tracking URL generation
	 */
	it('should generate correct DHL tracking URL', () => {
		render(
			<ShipmentTracker
				trackingNumber="1234567890"
				carrier="DHL"
				estimatedDelivery="2025-12-15T18:00:00Z"
				status="shipped"
			/>,
		)

		const trackButton = screen.getByText('Track shipment')
		const link = trackButton.closest('a')
		expect(link).toHaveAttribute('href', 'https://www.dhl.com/en/express/tracking.html?AWB=1234567890')
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Fallback to Google search for unknown carriers
	 */
	it('should fallback to Google search for unknown carriers', () => {
		render(
			<ShipmentTracker
				trackingNumber="TRACK123"
				carrier="UnknownCarrier"
				estimatedDelivery="2025-12-15T18:00:00Z"
				status="shipped"
			/>,
		)

		const trackButton = screen.getByText('Track shipment')
		const link = trackButton.closest('a')
		expect(link).toHaveAttribute('href', expect.stringContaining('google.com/search'))
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Edge case: No carrier specified
	 */
	it('should display "Unknown Carrier" when carrier is not specified', () => {
		render(
			<ShipmentTracker
				trackingNumber="TRACK123"
				carrier={null}
				estimatedDelivery="2025-12-15T18:00:00Z"
				status="shipped"
			/>,
		)

		expect(screen.getByText('Unknown Carrier')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Edge case: No estimated delivery
	 */
	it('should not display estimated delivery when not provided', () => {
		render(
			<ShipmentTracker trackingNumber="1Z999AA10123456784" carrier="UPS" estimatedDelivery={null} status="shipped" />,
		)

		expect(screen.queryByText(/Estimated delivery:/i)).not.toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Edge case: Order already delivered
	 */
	it('should show "Delivered" status instead of estimated delivery', () => {
		render(
			<ShipmentTracker
				trackingNumber="1Z999AA10123456784"
				carrier="UPS"
				estimatedDelivery="2025-12-15T18:00:00Z"
				status="delivered"
			/>,
		)

		expect(screen.getByText('Delivered')).toBeInTheDocument()
		expect(screen.queryByText(/Estimated delivery:/i)).not.toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Edge case: Estimated delivery is today
	 */
	it('should display "Today" for same-day delivery', () => {
		const today = new Date()
		today.setHours(18, 0, 0, 0)

		render(
			<ShipmentTracker
				trackingNumber="1Z999AA10123456784"
				carrier="UPS"
				estimatedDelivery={today.toISOString()}
				status="shipped"
			/>,
		)

		expect(screen.getByText(/Today/i)).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Edge case: Estimated delivery is tomorrow
	 */
	it('should display "Tomorrow" for next-day delivery', () => {
		const tomorrow = new Date()
		tomorrow.setDate(tomorrow.getDate() + 1)
		tomorrow.setHours(18, 0, 0, 0)

		render(
			<ShipmentTracker
				trackingNumber="1Z999AA10123456784"
				carrier="UPS"
				estimatedDelivery={tomorrow.toISOString()}
				status="shipped"
			/>,
		)

		expect(screen.getByText(/Tomorrow/i)).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Verify carrier name is case-insensitive
	 */
	it('should handle case-insensitive carrier names', () => {
		render(
			<ShipmentTracker
				trackingNumber="1Z999AA10123456784"
				carrier="ups"
				estimatedDelivery="2025-12-15T18:00:00Z"
				status="shipped"
			/>,
		)

		expect(screen.getByText('UPS')).toBeInTheDocument()
		const trackButton = screen.getByText('Track shipment')
		const link = trackButton.closest('a')
		expect(link).toHaveAttribute('href', expect.stringContaining('ups.com'))
	})

	/**
	 * @REQ-ORD-008: Track shipment
	 * Verify link opens in new tab
	 */
	it('should open tracking link in new tab', () => {
		render(
			<ShipmentTracker
				trackingNumber="1Z999AA10123456784"
				carrier="UPS"
				estimatedDelivery="2025-12-15T18:00:00Z"
				status="shipped"
			/>,
		)

		const trackButton = screen.getByText('Track shipment')
		const link = trackButton.closest('a')
		expect(link).toHaveAttribute('target', '_blank')
		expect(link).toHaveAttribute('rel', 'noopener noreferrer')
	})
})
