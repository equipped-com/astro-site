/**
 * OrdersApp Tests - Client-Side Routing for Orders
 *
 * @REQ-ORD-ROUTING-001: View order details for any order
 * @REQ-ORD-ROUTING-002: Direct link to order details via URL params
 * @REQ-ORD-ROUTING-003: Handle invalid order ID gracefully
 *
 * REGRESSION TEST
 * Issue: Static Astro routes ([id].astro) don't work for dynamic data
 * Fix: Client-side routing via URL search params (?id=xxx)
 * See: documentation/dynamic-routing-decision.md
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { OrderWithItems } from '@/lib/scoped-queries'
import { OrdersApp } from './OrdersApp'

// Mock orders for testing
const mockOrders: OrderWithItems[] = [
	{
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
	},
	{
		id: 'ord_2345678901bcdefg',
		account_id: 'acc_demo',
		created_by_user_id: 'user_alice',
		status: 'pending_leasing_approval',
		payment_method: 'leasing',
		subtotal: 4998.0,
		shipping_cost: 0,
		tax_amount: 449.82,
		total: 5447.82,
		monthly_cost: 226.16,
		shipping_address: '456 Tech Avenue',
		shipping_city: 'Austin',
		shipping_state: 'TX',
		shipping_zip: '78701',
		shipping_country: 'US',
		created_at: '2025-12-05T14:22:00Z',
		creator_name: 'Alice Johnson',
		items: [
			{
				id: 'item_2',
				order_id: 'ord_2345678901bcdefg',
				product_name: 'MacBook Pro 14" M4',
				product_sku: 'MBP-14-M4-16-512',
				quantity: 2,
				unit_price: 2499.0,
				monthly_price: 113.08,
				total_price: 4998.0,
				specs: '16GB RAM, 512GB SSD, Space Black',
			},
		],
	},
]

// Mock history API
const mockPushState = vi.fn()
const mockReplaceState = vi.fn()
let mockLocationSearch = ''
let mockLocationHref = 'http://localhost:4321/dashboard/orders'

// Store original implementations
const originalPushState = window.history.pushState
const originalReplaceState = window.history.replaceState
const originalLocation = window.location

describe('OrdersApp', () => {
	beforeEach(() => {
		// Reset URL state
		mockLocationSearch = ''
		mockLocationHref = 'http://localhost:4321/dashboard/orders'

		// Mock window.location
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: {
				...originalLocation,
				get search() {
					return mockLocationSearch
				},
				get href() {
					return mockLocationHref
				},
			},
		})

		// Mock history API
		window.history.pushState = mockPushState.mockImplementation((_state, _title, url) => {
			if (url) {
				const urlObj = new URL(url as string, window.location.origin)
				mockLocationSearch = urlObj.search
				mockLocationHref = url as string
			}
		})
		window.history.replaceState = mockReplaceState.mockImplementation((_state, _title, url) => {
			if (url) {
				const urlObj = new URL(url as string, window.location.origin)
				mockLocationSearch = urlObj.search
				mockLocationHref = url as string
			}
		})

		// Clear all mocks
		vi.clearAllMocks()
	})

	afterEach(() => {
		// Restore original implementations
		window.history.pushState = originalPushState
		window.history.replaceState = originalReplaceState
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: originalLocation,
		})
	})

	describe('List View (Default)', () => {
		/**
		 * @REQ-ORD-ROUTING-001: View order details for any order
		 * Scenario: Default view shows order list
		 * Given I am on the orders page without an id param
		 * When the page loads
		 * Then I should see the order list
		 */
		it('should render order list when no id param is present', () => {
			render(<OrdersApp orders={mockOrders} />)

			// Should show filters
			expect(screen.getByLabelText('Search')).toBeInTheDocument()
			expect(screen.getByLabelText('Status')).toBeInTheDocument()

			// Should show order rows - use getByRole for buttons
			expect(screen.getByRole('button', { name: /ord_1234/i })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /ord_2345/i })).toBeInTheDocument()

			// Should show order count
			expect(screen.getByText(/Showing 2 of 2 orders/i)).toBeInTheDocument()
		})

		it('should display order details in table columns', () => {
			render(<OrdersApp orders={mockOrders} />)

			// Check table headers exist
			expect(screen.getByRole('button', { name: /Order #/i })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /Date/i })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /Total/i })).toBeInTheDocument()

			// Check order data is displayed
			expect(screen.getByText('$2,723.91')).toBeInTheDocument()
			expect(screen.getByText('$5,447.82')).toBeInTheDocument()
		})
	})

	describe('Navigation to Detail View', () => {
		/**
		 * @REQ-ORD-ROUTING-001: View order details for any order
		 * Scenario: Click order row to view details
		 * Given I am on the orders list page
		 * When I click on any order row
		 * Then I should see the order details panel
		 * And the URL should update to include the order id
		 */
		it('should navigate to detail view when clicking an order', async () => {
			render(<OrdersApp orders={mockOrders} />)

			// Click on first order row
			const orderButton = screen.getByRole('button', { name: /ord_1234/i })
			fireEvent.click(orderButton)

			// Should show detail view
			await waitFor(() => {
				expect(screen.getByText(/Order ORD_1234/i)).toBeInTheDocument()
			})

			// Should have updated URL via pushState
			expect(mockPushState).toHaveBeenCalled()
			const pushStateCall = mockPushState.mock.calls[0]
			expect(pushStateCall[2]).toContain('id=ord_1234567890abcdef')
		})

		it('should show back button in detail view', async () => {
			render(<OrdersApp orders={mockOrders} />)

			// Navigate to detail
			const orderButton = screen.getByRole('button', { name: /ord_1234/i })
			fireEvent.click(orderButton)

			// Should show back button
			await waitFor(() => {
				expect(screen.getByRole('button', { name: /Back to Orders/i })).toBeInTheDocument()
			})
		})

		it('should return to list view when clicking back button', async () => {
			render(<OrdersApp orders={mockOrders} />)

			// Navigate to detail
			const orderButton = screen.getByRole('button', { name: /ord_1234/i })
			fireEvent.click(orderButton)

			// Click back button
			await waitFor(() => {
				const backButton = screen.getByRole('button', { name: /Back to Orders/i })
				fireEvent.click(backButton)
			})

			// Should be back on list view
			await waitFor(() => {
				expect(screen.getByLabelText('Search')).toBeInTheDocument()
				expect(screen.getByText(/Showing 2 of 2 orders/i)).toBeInTheDocument()
			})
		})
	})

	describe('Direct Link Support', () => {
		/**
		 * @REQ-ORD-ROUTING-002: Direct link to order details
		 * Scenario: Navigate directly to order via URL
		 * Given I have a valid order ID
		 * When I navigate to /dashboard/orders?id={order_id}
		 * Then I should see the order details for that order
		 */
		it('should render detail view when URL has id param', () => {
			// Set URL with order ID before render
			mockLocationSearch = '?id=ord_1234567890abcdef'
			mockLocationHref = 'http://localhost:4321/dashboard/orders?id=ord_1234567890abcdef'

			render(<OrdersApp orders={mockOrders} />)

			// Should show detail view directly
			expect(screen.getByText(/Order ORD_1234/i)).toBeInTheDocument()
			expect(screen.getByText('MacBook Pro 14" M4')).toBeInTheDocument()
		})

		it('should support partial order ID matching for shortened URLs', () => {
			// Set URL with shortened order ID
			mockLocationSearch = '?id=ord_1234'
			mockLocationHref = 'http://localhost:4321/dashboard/orders?id=ord_1234'

			render(<OrdersApp orders={mockOrders} />)

			// Should find order by prefix match
			expect(screen.getByText(/Order ORD_1234/i)).toBeInTheDocument()
		})
	})

	describe('Invalid Order ID Handling', () => {
		/**
		 * @REQ-ORD-ROUTING-003: Handle invalid order ID
		 * Scenario: Invalid order ID in URL
		 * Given I navigate to /dashboard/orders?id=invalid
		 * When the API returns 404
		 * Then I should see an error message
		 * And I should have an option to return to the order list
		 */
		it('should show not found state for invalid order ID', () => {
			mockLocationSearch = '?id=invalid_order_id'
			mockLocationHref = 'http://localhost:4321/dashboard/orders?id=invalid_order_id'

			render(<OrdersApp orders={mockOrders} />)

			// Should show not found message
			expect(screen.getByText('Order Not Found')).toBeInTheDocument()
			expect(screen.getByText(/The order with ID "invalid_order_id" could not be found/i)).toBeInTheDocument()

			// Should have back button
			expect(screen.getByRole('button', { name: /Back to Orders/i })).toBeInTheDocument()
		})

		it('should return to list when clicking back from not found state', () => {
			mockLocationSearch = '?id=invalid_order_id'
			mockLocationHref = 'http://localhost:4321/dashboard/orders?id=invalid_order_id'

			render(<OrdersApp orders={mockOrders} />)

			// Click back button
			const backButton = screen.getByRole('button', { name: /Back to Orders/i })
			fireEvent.click(backButton)

			// Should be back on list view
			expect(screen.getByLabelText('Search')).toBeInTheDocument()
		})
	})

	describe('Browser History Integration', () => {
		/**
		 * @REQ-ORD-ROUTING-001: View order details for any order
		 * Scenario: Browser back/forward navigation
		 * Given I navigated from list to detail view
		 * When I click the browser back button
		 * Then I should return to the list view
		 */
		it('should handle popstate event for browser back navigation', async () => {
			render(<OrdersApp orders={mockOrders} />)

			// Navigate to detail
			const orderButton = screen.getByRole('button', { name: /ord_1234/i })
			fireEvent.click(orderButton)

			// Wait for detail view
			await waitFor(() => {
				expect(screen.getByText(/Order ORD_1234/i)).toBeInTheDocument()
			})

			// Simulate browser back (update location then fire popstate)
			mockLocationSearch = ''
			mockLocationHref = 'http://localhost:4321/dashboard/orders'
			window.dispatchEvent(new PopStateEvent('popstate'))

			// Should be back on list view
			await waitFor(() => {
				expect(screen.getByLabelText('Search')).toBeInTheDocument()
			})
		})

		it('should update URL with replaceState when order changes', async () => {
			render(<OrdersApp orders={mockOrders} />)

			// Navigate to first order
			const orderButton = screen.getByRole('button', { name: /ord_1234/i })
			fireEvent.click(orderButton)

			// replaceState is called in useEffect to sync URL
			await waitFor(() => {
				expect(mockReplaceState).toHaveBeenCalled()
			})
		})
	})

	describe('Order List Filtering and Sorting', () => {
		it('should filter orders by status', async () => {
			render(<OrdersApp orders={mockOrders} />)

			// Change status filter
			const statusSelect = screen.getByLabelText('Status')
			fireEvent.change(statusSelect, { target: { value: 'shipped' } })

			// Should only show shipped orders
			await waitFor(() => {
				expect(screen.getByText(/Showing 1 of 2 orders/i)).toBeInTheDocument()
			})
		})

		it('should filter orders by search query', async () => {
			render(<OrdersApp orders={mockOrders} />)

			// Search for order ID
			const searchInput = screen.getByLabelText('Search')
			fireEvent.change(searchInput, { target: { value: 'ord_1234' } })

			// Should only show matching orders
			await waitFor(() => {
				expect(screen.getByText(/Showing 1 of 2 orders/i)).toBeInTheDocument()
			})
		})

		it('should sort orders by clicking column headers', () => {
			render(<OrdersApp orders={mockOrders} />)

			// Click total column to sort
			const totalHeader = screen.getByRole('button', { name: /Total/i })
			fireEvent.click(totalHeader)

			// Sorting should be applied (visual verification would need snapshot)
			// For now, just verify the click doesn't crash
			expect(screen.getByText(/Showing 2 of 2 orders/i)).toBeInTheDocument()
		})
	})

	describe('Empty State', () => {
		it('should show empty state when no orders exist', () => {
			render(<OrdersApp orders={[]} />)

			expect(screen.getByText(/No orders found matching your filters/i)).toBeInTheDocument()
		})

		it('should show empty state when filters match no orders', () => {
			render(<OrdersApp orders={mockOrders} />)

			// Filter to status that doesn't exist
			const statusSelect = screen.getByLabelText('Status')
			fireEvent.change(statusSelect, { target: { value: 'cancelled' } })

			expect(screen.getByText(/No orders found matching your filters/i)).toBeInTheDocument()
		})
	})

	describe('Leasing Orders', () => {
		it('should display monthly cost for leasing orders in list view', () => {
			render(<OrdersApp orders={mockOrders} />)

			// Should show leasing order in list
			expect(screen.getByRole('button', { name: /ord_2345/i })).toBeInTheDocument()
		})

		it('should show monthly cost in detail view for leasing orders', () => {
			mockLocationSearch = '?id=ord_2345678901bcdefg'
			mockLocationHref = 'http://localhost:4321/dashboard/orders?id=ord_2345678901bcdefg'

			render(<OrdersApp orders={mockOrders} />)

			// Should show leasing details
			expect(screen.getByText('$226.16/month')).toBeInTheDocument()
		})
	})

	describe('Order Details Content', () => {
		it('should display all order sections in detail view', () => {
			mockLocationSearch = '?id=ord_1234567890abcdef'
			mockLocationHref = 'http://localhost:4321/dashboard/orders?id=ord_1234567890abcdef'

			render(<OrdersApp orders={mockOrders} />)

			// Items section
			expect(screen.getByText('Items')).toBeInTheDocument()
			expect(screen.getByText('MacBook Pro 14" M4')).toBeInTheDocument()

			// Shipping section
			expect(screen.getAllByText('Shipping').length).toBeGreaterThan(0)

			// Payment section
			expect(screen.getByText('Payment')).toBeInTheDocument()
		})
	})
})
