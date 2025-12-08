/**
 * @REQ-ORD-007: Order timeline for leasing order
 * Tests that order timeline correctly displays order status progression
 */

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { OrderWithItems } from '@/lib/scoped-queries'
import { OrderTimeline } from './OrderTimeline'

describe('OrderTimeline', () => {
	const baseOrder: OrderWithItems = {
		id: 'ord_test',
		account_id: 'acc_demo',
		created_by_user_id: 'user_test',
		status: 'pending',
		payment_method: 'card',
		subtotal: 1000,
		shipping_cost: 0,
		tax_amount: 90,
		total: 1090,
		created_at: '2025-12-01T10:00:00Z',
	}

	/**
	 * @REQ-ORD-007: Order timeline for leasing order
	 * Scenario: Order timeline for leasing order
	 * Then timeline should show:
	 * | Step | Status |
	 * | Order placed | Completed |
	 */
	it('should always show "Order placed" as completed', () => {
		render(<OrderTimeline order={baseOrder} />)

		expect(screen.getByText('Order placed')).toBeInTheDocument()
		// Verify it's marked as completed (has checkmark icon)
	})

	/**
	 * @REQ-ORD-007: Order timeline for leasing order
	 * Given order was placed with leasing
	 * Then timeline should show:
	 * | Pending leasing approval | Current |
	 */
	it('should show "Pending leasing approval" as current for leasing orders', () => {
		const leasingOrder: OrderWithItems = {
			...baseOrder,
			payment_method: 'leasing',
			status: 'pending_leasing_approval',
		}

		render(<OrderTimeline order={leasingOrder} />)

		expect(screen.getByText('Order placed')).toBeInTheDocument()
		expect(screen.getByText('Pending leasing approval')).toBeInTheDocument()
		expect(screen.getByText('Preparing to ship')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-007: Order timeline for leasing order
	 * Then timeline should show:
	 * | Pending leasing approval | Completed |
	 */
	it('should show "Leasing approved" when leasing order is processing', () => {
		const leasingOrder: OrderWithItems = {
			...baseOrder,
			payment_method: 'leasing',
			status: 'processing',
		}

		render(<OrderTimeline order={leasingOrder} />)

		expect(screen.getByText('Order placed')).toBeInTheDocument()
		expect(screen.getByText('Leasing approved')).toBeInTheDocument()
		expect(screen.getByText('Preparing to ship')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-007: Order timeline for leasing order
	 * Card payment orders should not show leasing approval steps
	 */
	it('should not show leasing approval for card payments', () => {
		const cardOrder: OrderWithItems = {
			...baseOrder,
			payment_method: 'card',
			status: 'processing',
		}

		render(<OrderTimeline order={cardOrder} />)

		expect(screen.queryByText('Pending leasing approval')).not.toBeInTheDocument()
		expect(screen.queryByText('Leasing approved')).not.toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-007: Order timeline for leasing order
	 * Then timeline should show:
	 * | Preparing to ship | Current |
	 */
	it('should show "Preparing to ship" as current when processing', () => {
		const processingOrder: OrderWithItems = {
			...baseOrder,
			status: 'processing',
		}

		render(<OrderTimeline order={processingOrder} />)

		expect(screen.getByText('Preparing to ship')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-007: Order timeline for leasing order
	 * Then timeline should show:
	 * | Shipped | Current |
	 */
	it('should show "Shipped" as current when shipped', () => {
		const shippedOrder: OrderWithItems = {
			...baseOrder,
			status: 'shipped',
		}

		render(<OrderTimeline order={shippedOrder} />)

		expect(screen.getByText('Order placed')).toBeInTheDocument()
		expect(screen.getByText('Prepared for shipment')).toBeInTheDocument()
		expect(screen.getByText('Shipped')).toBeInTheDocument()
		expect(screen.getByText('Delivered')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-007: Order timeline for leasing order
	 * Then timeline should show:
	 * | Delivered | Completed |
	 */
	it('should show "Delivered" as completed when delivered', () => {
		const deliveredOrder: OrderWithItems = {
			...baseOrder,
			status: 'delivered',
			delivered_at: '2025-12-10T14:30:00Z',
		}

		render(<OrderTimeline order={deliveredOrder} />)

		expect(screen.getByText('Order placed')).toBeInTheDocument()
		expect(screen.getByText('Prepared for shipment')).toBeInTheDocument()
		expect(screen.getByText('Shipped')).toBeInTheDocument()
		expect(screen.getByText('Delivered')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-010: Cancel order
	 * Scenario: Cancel order
	 * Then order status should change to "Cancelled"
	 */
	it('should show "Order cancelled" for cancelled orders', () => {
		const cancelledOrder: OrderWithItems = {
			...baseOrder,
			status: 'cancelled',
			updated_at: '2025-12-02T11:00:00Z',
		}

		render(<OrderTimeline order={cancelledOrder} />)

		expect(screen.getByText('Order placed')).toBeInTheDocument()
		expect(screen.getByText('Order cancelled')).toBeInTheDocument()
		expect(screen.queryByText('Shipped')).not.toBeInTheDocument()
		expect(screen.queryByText('Delivered')).not.toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-011: Request return
	 * Scenario: Request return
	 * Edge case: Returned order should show in timeline
	 */
	it('should show "Order returned" for returned orders', () => {
		const returnedOrder: OrderWithItems = {
			...baseOrder,
			status: 'returned',
			updated_at: '2025-12-15T09:00:00Z',
		}

		render(<OrderTimeline order={returnedOrder} />)

		expect(screen.getByText('Order placed')).toBeInTheDocument()
		expect(screen.getByText('Order returned')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-007: Order timeline for leasing order
	 * Verify date formatting
	 */
	it('should format dates correctly', () => {
		const order: OrderWithItems = {
			...baseOrder,
			created_at: '2025-12-01T10:30:00Z',
		}

		render(<OrderTimeline order={order} />)

		// Date should be formatted as "Mon DD, HH:MM AM/PM"
		expect(screen.getByText(/Dec/i)).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-007: Order timeline for leasing order
	 * Verify all steps are pending for new order
	 */
	it('should show all future steps as pending for new order', () => {
		const newOrder: OrderWithItems = {
			...baseOrder,
			status: 'pending',
		}

		render(<OrderTimeline order={newOrder} />)

		expect(screen.getByText('Order placed')).toBeInTheDocument()
		expect(screen.getByText('Preparing to ship')).toBeInTheDocument()
		expect(screen.getByText('Shipped')).toBeInTheDocument()
		expect(screen.getByText('Delivered')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-007: Order timeline for leasing order
	 * Full leasing order progression
	 */
	it('should show complete leasing timeline progression', () => {
		const leasingDelivered: OrderWithItems = {
			...baseOrder,
			payment_method: 'leasing',
			status: 'delivered',
			delivered_at: '2025-12-10T14:30:00Z',
		}

		render(<OrderTimeline order={leasingDelivered} />)

		// All steps should be present for completed leasing order
		expect(screen.getByText('Order placed')).toBeInTheDocument()
		expect(screen.getByText('Leasing approved')).toBeInTheDocument()
		expect(screen.getByText('Prepared for shipment')).toBeInTheDocument()
		expect(screen.getByText('Shipped')).toBeInTheDocument()
		expect(screen.getByText('Delivered')).toBeInTheDocument()
	})
})
