/**
 * @REQ-ORD-006: View order details
 * Tests that order details are displayed with all required sections
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrderDetails } from './OrderDetails'
import type { OrderWithItems } from '@/lib/scoped-queries'

describe('OrderDetails', () => {
	const mockOrder: OrderWithItems = {
		id: 'ord_1234567890abcdef',
		account_id: 'acc_demo',
		created_by_user_id: 'user_alice',
		assigned_to_person_id: 'person_bob',
		status: 'shipped',
		payment_method: 'card',
		subtotal: 2499.0,
		shipping_cost: 0,
		tax_amount: 224.91,
		total: 2723.91,
		shipping_address: '123 Main Street',
		shipping_city: 'San Francisco',
		shipping_state: 'CA',
		shipping_zip: '94105',
		shipping_country: 'US',
		tracking_number: '1Z999AA10123456784',
		carrier: 'UPS',
		estimated_delivery: '2025-12-15T18:00:00Z',
		created_at: '2025-12-01T10:30:00Z',
		creator_name: 'Alice Johnson',
		assignee_name: 'Bob Smith',
		items: [
			{
				id: 'item_1',
				order_id: 'ord_1234567890abcdef',
				product_name: 'MacBook Pro 14" M4',
				product_sku: 'MBP-14-M4-16-512',
				quantity: 1,
				unit_price: 2499.0,
				total_price: 2499.0,
				specs: '16GB RAM, 512GB SSD, Space Black',
			},
		],
	}

	/**
	 * @REQ-ORD-006: View order details
	 * Scenario: View order details
	 * Given I have order #EQ-2024-001
	 * When I click on the order
	 * Then I should see: Header | Order #, date, status badge
	 */
	it('should display order header with number, date, and status', () => {
		render(<OrderDetails order={mockOrder} />)

		// Order number (first 8 chars uppercase)
		expect(screen.getByText(/Order ORD_1234/i)).toBeInTheDocument()

		// Date
		expect(screen.getByText(/December 1, 2025/i)).toBeInTheDocument()

		// Creator
		expect(screen.getByText(/Created by Alice Johnson/i)).toBeInTheDocument()

		// Status badge (tested via OrderStatusBadge component)
		expect(screen.getByText(/shipped/i)).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-006: View order details
	 * Then I should see: Items | Product name, specs, quantity, price
	 */
	it('should display line items with product details and specs', () => {
		render(<OrderDetails order={mockOrder} />)

		// Product name
		expect(screen.getByText('MacBook Pro 14" M4')).toBeInTheDocument()

		// SKU
		expect(screen.getByText(/SKU: MBP-14-M4-16-512/i)).toBeInTheDocument()

		// Specs
		expect(screen.getByText(/16GB RAM, 512GB SSD, Space Black/i)).toBeInTheDocument()

		// Quantity
		expect(screen.getByText(/Quantity: 1/i)).toBeInTheDocument()

		// Price
		expect(screen.getByText('$2,499.00')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-006: View order details
	 * Then I should see: Summary | Subtotal, shipping, tax, total
	 */
	it('should display order summary with subtotal, shipping, tax, and total', () => {
		render(<OrderDetails order={mockOrder} />)

		// Subtotal
		expect(screen.getByText('Subtotal')).toBeInTheDocument()
		expect(screen.getByText('$2,499.00')).toBeInTheDocument()

		// Shipping
		expect(screen.getByText('Shipping')).toBeInTheDocument()
		expect(screen.getByText('FREE')).toBeInTheDocument()

		// Tax
		expect(screen.getByText('Tax')).toBeInTheDocument()
		expect(screen.getByText('$224.91')).toBeInTheDocument()

		// Total
		expect(screen.getAllByText('Total')).toHaveLength(2) // One in header, one in summary
		expect(screen.getByText('$2,723.91')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-006: View order details
	 * Then I should see: Shipping | Address, recipient, tracking
	 */
	it('should display shipping information with address and recipient', () => {
		render(<OrderDetails order={mockOrder} />)

		// Section header
		expect(screen.getByText('Shipping')).toBeInTheDocument()

		// Address
		expect(screen.getByText(/123 Main Street, San Francisco, CA, 94105, US/i)).toBeInTheDocument()

		// Recipient
		expect(screen.getByText(/Recipient: Bob Smith/i)).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-006: View order details
	 * Then I should see: Payment | Method (card/leasing), monthly if applicable
	 */
	it('should display payment method for card payment', () => {
		render(<OrderDetails order={mockOrder} />)

		expect(screen.getByText('Payment')).toBeInTheDocument()
		expect(screen.getByText('Method')).toBeInTheDocument()
		expect(screen.getByText('Credit Card')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-007: Order timeline for leasing order
	 * Then timeline should show: Order placed | Completed
	 * And: Pending leasing approval | Completed or Current
	 * And: Monthly payment displayed
	 */
	it('should display leasing payment method with monthly cost', () => {
		const leasingOrder: OrderWithItems = {
			...mockOrder,
			payment_method: 'leasing',
			monthly_cost: 226.16,
		}

		render(<OrderDetails order={leasingOrder} />)

		expect(screen.getByText('Leasing')).toBeInTheDocument()
		expect(screen.getByText('Monthly Payment')).toBeInTheDocument()
		expect(screen.getByText('$226.16')).toBeInTheDocument()
		expect(screen.getByText('$226.16/month')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-006: View order details
	 * Edge case: Order with no items
	 */
	it('should handle order with no items gracefully', () => {
		const emptyOrder: OrderWithItems = {
			...mockOrder,
			items: [],
		}

		render(<OrderDetails order={emptyOrder} />)

		expect(screen.getByText('No items in this order')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-006: View order details
	 * Edge case: Order with shipping cost
	 */
	it('should display shipping cost when not free', () => {
		const orderWithShipping: OrderWithItems = {
			...mockOrder,
			shipping_cost: 15.0,
		}

		render(<OrderDetails order={orderWithShipping} />)

		expect(screen.getByText('$15.00')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-006: View order details
	 * Edge case: Order without shipping address
	 */
	it('should handle order without shipping address', () => {
		const orderNoAddress: OrderWithItems = {
			...mockOrder,
			shipping_address: undefined,
			shipping_city: undefined,
			shipping_state: undefined,
			shipping_zip: undefined,
			shipping_country: undefined,
			tracking_number: undefined,
		}

		render(<OrderDetails order={orderNoAddress} />)

		// Shipping section should not be rendered
		expect(screen.queryByText('Shipping')).not.toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-006: View order details
	 * Edge case: Order with product image
	 */
	it('should display product image when available', () => {
		const orderWithImage: OrderWithItems = {
			...mockOrder,
			items: [
				{
					...mockOrder.items![0],
					product_image_url: 'https://example.com/image.jpg',
				},
			],
		}

		render(<OrderDetails order={orderWithImage} />)

		const image = screen.getByAltText('MacBook Pro 14" M4')
		expect(image).toBeInTheDocument()
		expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
	})

	/**
	 * @REQ-ORD-006: View order details
	 * Edge case: Multiple items in order
	 */
	it('should display multiple line items', () => {
		const multiItemOrder: OrderWithItems = {
			...mockOrder,
			items: [
				{
					id: 'item_1',
					order_id: 'ord_1234567890abcdef',
					product_name: 'MacBook Pro 14" M4',
					product_sku: 'MBP-14-M4-16-512',
					quantity: 1,
					unit_price: 2499.0,
					total_price: 2499.0,
				},
				{
					id: 'item_2',
					order_id: 'ord_1234567890abcdef',
					product_name: 'Magic Keyboard',
					product_sku: 'MK-TOUCH-ID',
					quantity: 2,
					unit_price: 149.0,
					total_price: 298.0,
				},
			],
		}

		render(<OrderDetails order={multiItemOrder} />)

		expect(screen.getByText('MacBook Pro 14" M4')).toBeInTheDocument()
		expect(screen.getByText('Magic Keyboard')).toBeInTheDocument()
		expect(screen.getByText(/Quantity: 2/i)).toBeInTheDocument()
	})
})
