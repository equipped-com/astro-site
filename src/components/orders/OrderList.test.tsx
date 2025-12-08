import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { OrderWithItems } from '@/lib/scoped-queries'
import { OrderList } from './OrderList'

// Mock orders data for testing
const mockOrders: OrderWithItems[] = [
	{
		id: 'ord_001',
		account_id: 'acc_test',
		created_by_user_id: 'user_alice',
		assigned_to_person_id: 'person_bob',
		status: 'shipped',
		payment_method: 'card',
		subtotal: 2499.0,
		shipping_cost: 0,
		tax_amount: 224.91,
		total: 2723.91,
		tracking_number: '1Z999AA10123456784',
		carrier: 'UPS',
		created_at: '2025-12-01T10:30:00Z',
		creator_name: 'Alice Johnson',
		assignee_name: 'Bob Smith',
		items: [
			{
				id: 'item_1',
				order_id: 'ord_001',
				product_name: 'MacBook Pro 14" M4',
				product_sku: 'MBP-14-M4',
				quantity: 1,
				unit_price: 2499.0,
				total_price: 2499.0,
			},
		],
	},
	{
		id: 'ord_002',
		account_id: 'acc_test',
		created_by_user_id: 'user_bob',
		status: 'pending',
		payment_method: 'card',
		subtotal: 1599.0,
		shipping_cost: 0,
		tax_amount: 143.91,
		total: 1742.91,
		created_at: '2025-12-05T14:00:00Z',
		creator_name: 'Bob Smith',
		items: [
			{
				id: 'item_2',
				order_id: 'ord_002',
				product_name: 'iPad Pro 11" M4',
				product_sku: 'IPAD-11-M4',
				quantity: 1,
				unit_price: 1599.0,
				total_price: 1599.0,
			},
		],
	},
	{
		id: 'ord_003',
		account_id: 'acc_test',
		created_by_user_id: 'user_alice',
		status: 'delivered',
		payment_method: 'card',
		subtotal: 498.0,
		shipping_cost: 0,
		tax_amount: 44.82,
		total: 542.82,
		created_at: '2025-11-20T09:00:00Z',
		creator_name: 'Alice Johnson',
		items: [
			{
				id: 'item_3',
				order_id: 'ord_003',
				product_name: 'AirPods Pro (2nd gen)',
				product_sku: 'AIRPODS-PRO-2',
				quantity: 2,
				unit_price: 249.0,
				total_price: 498.0,
			},
		],
	},
]

describe('OrderList Component', () => {
	/**
	 * @REQ-ORD-001
	 * Feature: Order List
	 * Scenario: View order list
	 */
	describe('@REQ-ORD-001: View order list', () => {
		it('should render table with all required columns', () => {
			render(<OrderList orders={mockOrders} />)

			// Check all column headers are present
			expect(screen.getAllByText('Order #')[0]).toBeInTheDocument()
			expect(screen.getAllByText('Date')[0]).toBeInTheDocument()
			expect(screen.getByText('Items')).toBeInTheDocument()
			expect(screen.getAllByText('Total')[0]).toBeInTheDocument()
			expect(screen.getAllByText('Status')[0]).toBeInTheDocument()
			expect(screen.getByText('Tracking')).toBeInTheDocument()
			expect(screen.getByText('Created By')).toBeInTheDocument()
		})

		it('should display all orders in the table', () => {
			render(<OrderList orders={mockOrders} />)

			// Check that all 3 orders are rendered
			expect(screen.getAllByText('Alice Johnson').length).toBeGreaterThan(0)
			expect(screen.getAllByText('Bob Smith').length).toBeGreaterThan(0)

			// Check that order totals are displayed
			expect(screen.getByText('$2,723.91')).toBeInTheDocument()
			expect(screen.getByText('$1,742.91')).toBeInTheDocument()
			expect(screen.getByText('$542.82')).toBeInTheDocument()
		})

		it('should make Date, Total, and Status columns sortable', () => {
			render(<OrderList orders={mockOrders} />)

			// All sortable columns should be buttons
			const dateButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Date'))
			const totalButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Total'))
			const statusButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Status'))

			expect(dateButton).toBeInTheDocument()
			expect(totalButton).toBeInTheDocument()
			expect(statusButton).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-ORD-002
	 * Feature: Order List
	 * Scenario: Filter by status
	 */
	describe('@REQ-ORD-002: Filter by status', () => {
		it('should show only shipped orders when filtered by Shipped status', () => {
			render(<OrderList orders={mockOrders} />)

			// Select "Shipped" status
			const statusSelect = screen.getByLabelText('Status')
			fireEvent.change(statusSelect, { target: { value: 'shipped' } })

			// Should show only 1 order (the shipped one)
			expect(screen.getByText('Showing 1 of 3 orders')).toBeInTheDocument()

			// Should show the shipped order
			expect(screen.getByText('$2,723.91')).toBeInTheDocument()

			// Should NOT show other orders
			expect(screen.queryByText('$1,742.91')).not.toBeInTheDocument()
			expect(screen.queryByText('$542.82')).not.toBeInTheDocument()
		})

		it('should show all orders when filter is set to All Orders', () => {
			render(<OrderList orders={mockOrders} />)

			// Filter by shipped first
			const statusSelect = screen.getByLabelText('Status')
			fireEvent.change(statusSelect, { target: { value: 'shipped' } })
			expect(screen.getByText('Showing 1 of 3 orders')).toBeInTheDocument()

			// Reset to all
			fireEvent.change(statusSelect, { target: { value: 'all' } })
			expect(screen.getByText('Showing 3 of 3 orders')).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-ORD-003
	 * Feature: Order List
	 * Scenario: Search orders
	 */
	describe('@REQ-ORD-003: Search orders', () => {
		it('should show orders containing MacBook when searching for "MacBook"', () => {
			render(<OrderList orders={mockOrders} />)

			const searchInput = screen.getByLabelText('Search')
			fireEvent.change(searchInput, { target: { value: 'MacBook' } })

			// Should show only 1 order with MacBook
			expect(screen.getByText('Showing 1 of 3 orders')).toBeInTheDocument()
			expect(screen.getByText('$2,723.91')).toBeInTheDocument()

			// Should NOT show iPad or AirPods orders
			expect(screen.queryByText('$1,742.91')).not.toBeInTheDocument()
			expect(screen.queryByText('$542.82')).not.toBeInTheDocument()
		})

		it('should show specific order when searching by order ID', () => {
			render(<OrderList orders={mockOrders} />)

			const searchInput = screen.getByLabelText('Search')
			fireEvent.change(searchInput, { target: { value: 'ord_002' } })

			// Should show only 1 order
			expect(screen.getByText('Showing 1 of 3 orders')).toBeInTheDocument()
			expect(screen.getByText('$1,742.91')).toBeInTheDocument()
		})

		it('should be case-insensitive when searching', () => {
			render(<OrderList orders={mockOrders} />)

			const searchInput = screen.getByLabelText('Search')
			fireEvent.change(searchInput, { target: { value: 'macbook' } }) // lowercase

			// Should still find MacBook
			expect(screen.getByText('Showing 1 of 3 orders')).toBeInTheDocument()
			expect(screen.getByText('$2,723.91')).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-ORD-004
	 * Feature: Order List
	 * Scenario: Order status display
	 */
	describe('@REQ-ORD-004: Order status display', () => {
		it('should display status badges with appropriate colors', () => {
			render(<OrderList orders={mockOrders} />)

			// Check that status badges are rendered (using getAllByText since "Shipped" also appears in filter)
			const shipped = screen.getAllByText('Shipped')
			const pending = screen.getAllByText('Pending')
			const delivered = screen.getAllByText('Delivered')

			// At least one of each should be present
			expect(shipped.length).toBeGreaterThan(0)
			expect(pending.length).toBeGreaterThan(0)
			expect(delivered.length).toBeGreaterThan(0)
		})

		it('should show Pending status with yellow badge', () => {
			const { container } = render(<OrderList orders={mockOrders} />)

			// Find the badge in the table (not the filter label)
			const badges = container.querySelectorAll('.bg-yellow-100')
			expect(badges.length).toBeGreaterThan(0)
			expect(badges[0].textContent).toContain('Pending')
		})

		it('should show Shipped status with purple badge', () => {
			const { container } = render(<OrderList orders={mockOrders} />)

			// Find the badge in the table
			const badges = container.querySelectorAll('.bg-purple-100')
			expect(badges.length).toBeGreaterThan(0)
			expect(badges[0].textContent).toContain('Shipped')
		})

		it('should show Delivered status with green badge', () => {
			const { container } = render(<OrderList orders={mockOrders} />)

			// Find the badge in the table
			const badges = container.querySelectorAll('.bg-green-100')
			expect(badges.length).toBeGreaterThan(0)
			expect(badges[0].textContent).toContain('Delivered')
		})
	})

	/**
	 * @REQ-ORD-005
	 * Feature: Order List
	 * Scenario: Team-scoped orders
	 */
	describe('@REQ-ORD-005: Team-scoped orders', () => {
		it('should show orders from multiple team members', () => {
			render(<OrderList orders={mockOrders} />)

			// Should show orders created by both Alice and Bob
			expect(screen.getAllByText('Alice Johnson').length).toBeGreaterThan(0)
			expect(screen.getAllByText('Bob Smith').length).toBeGreaterThan(0)
		})

		it('should display who created each order', () => {
			render(<OrderList orders={mockOrders} />)

			// All orders should show creator name in the table
			const rows = screen.getAllByRole('row')
			expect(rows.length).toBeGreaterThan(1) // Header + data rows

			// Check that creator names are in the table
			expect(screen.getAllByText('Alice Johnson').length).toBeGreaterThan(0)
			expect(screen.getAllByText('Bob Smith').length).toBeGreaterThan(0)
		})
	})

	/**
	 * Additional functionality tests
	 */
	describe('Sorting functionality', () => {
		it('should sort by total amount in descending order by default when Total is clicked', () => {
			render(<OrderList orders={mockOrders} />)

			const totalButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Total'))
			fireEvent.click(totalButton!)

			// After clicking, highest total should be first
			const rows = screen.getAllByRole('row')
			const firstDataRow = rows[1] // Skip header row
			expect(firstDataRow.textContent).toContain('$2,723.91')
		})

		it('should reverse sort direction when clicking the same column twice', () => {
			render(<OrderList orders={mockOrders} />)

			const totalButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Total'))

			// First click - descending
			fireEvent.click(totalButton!)
			let rows = screen.getAllByRole('row')
			expect(rows[1].textContent).toContain('$2,723.91') // Highest

			// Second click - ascending
			fireEvent.click(totalButton!)
			rows = screen.getAllByRole('row')
			expect(rows[1].textContent).toContain('$542.82') // Lowest
		})
	})

	describe('Empty state', () => {
		it('should show empty state when no orders match filters', () => {
			render(<OrderList orders={mockOrders} />)

			const searchInput = screen.getByLabelText('Search')
			fireEvent.change(searchInput, { target: { value: 'nonexistent product' } })

			expect(screen.getByText('No orders found matching your filters.')).toBeInTheDocument()
		})

		it('should show empty state when orders array is empty', () => {
			render(<OrderList orders={[]} />)

			expect(screen.getByText('No orders found matching your filters.')).toBeInTheDocument()
		})
	})

	describe('Order details display', () => {
		it('should show tracking number as clickable link when available', () => {
			render(<OrderList orders={mockOrders} />)

			const trackingLink = screen.getByText('1Z999AA10123456784')
			expect(trackingLink.tagName).toBe('A')
			expect(trackingLink).toHaveAttribute('href')
			expect(trackingLink).toHaveAttribute('target', '_blank')
		})

		it('should show -- when tracking number is not available', () => {
			render(<OrderList orders={mockOrders} />)

			// Count how many -- appear in the tracking column
			const dashes = screen.getAllByText('--')
			expect(dashes.length).toBeGreaterThan(0) // At least some orders without tracking
		})

		it('should format dates in readable format', () => {
			render(<OrderList orders={mockOrders} />)

			// Check that dates are formatted (e.g., "Dec 1, 2025" instead of ISO string)
			expect(screen.getByText('Dec 1, 2025')).toBeInTheDocument()
			expect(screen.getByText('Dec 5, 2025')).toBeInTheDocument()
		})

		it('should format currency values correctly', () => {
			render(<OrderList orders={mockOrders} />)

			// Check currency formatting with $ and 2 decimal places
			expect(screen.getByText('$2,723.91')).toBeInTheDocument()
			expect(screen.getByText('$1,742.91')).toBeInTheDocument()
		})

		it('should display item count and product names', () => {
			render(<OrderList orders={mockOrders} />)

			// Single item order
			expect(screen.getByText('1 x MacBook Pro 14" M4')).toBeInTheDocument()

			// Multiple items of same product
			expect(screen.getByText('2 x AirPods Pro (2nd gen)')).toBeInTheDocument()
		})
	})
})
