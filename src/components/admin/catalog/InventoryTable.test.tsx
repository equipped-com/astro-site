/**
 * @REQ-UI-006 @Inventory - Manage inventory
 * @REQ-UI-007 @Inventory @QuickEdit - Quick edit inventory status
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import InventoryTable from './InventoryTable'

describe('InventoryTable', () => {
	const mockProducts = [
		{ id: '1', name: 'MacBook Pro 14-inch M3' },
		{ id: '2', name: 'Dell XPS 15' },
	]

	const mockItems = [
		{
			id: '1',
			productId: '1',
			productName: 'MacBook Pro 14-inch M3',
			brandName: 'Apple',
			serialNumber: 'ABC123456',
			condition: 'new',
			status: 'available',
			purchaseCost: 1800,
			salePrice: 1999,
			notes: 'Test note',
			warehouseLocation: 'A-1-2',
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		},
	]

	beforeEach(() => {
		global.fetch = vi.fn()
	})

	/**
	 * @REQ-UI-006 @Inventory
	 * Scenario: Manage inventory
	 *   Given I am on the inventory page
	 *   Then I should see all inventory items
	 */
	it('should display all inventory items', async () => {
		(global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 1000, total: 2 } }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: mockItems }),
			} as Response)

		render(<InventoryTable />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14-inch M3')).toBeInTheDocument()
			expect(screen.getByText('ABC123456')).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-UI-006 @Inventory
	 * Scenario: Manage inventory
	 *   And each item should show:
	 *     | Field          | Visible |
	 *     | Product name   | Yes     |
	 *     | Serial number  | Yes     |
	 *     | Condition      | Yes     |
	 *     | Status         | Yes     |
	 *     | Location       | Yes     |
	 */
	it('should show all required fields for each item', async () => {
		(global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 1000, total: 2 } }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: mockItems }),
			} as Response)

		render(<InventoryTable />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14-inch M3')).toBeInTheDocument()
			expect(screen.getByText('ABC123456')).toBeInTheDocument()
			expect(screen.getByText('New')).toBeInTheDocument()
			expect(screen.getByText('Available')).toBeInTheDocument()
			expect(screen.getByText('A-1-2')).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-UI-007 @Inventory @QuickEdit
	 * Scenario: Quick edit inventory status
	 *   Given an inventory item with status "available"
	 *   When I click the status dropdown
	 *   And I select "sold"
	 *   Then the status should update immediately
	 */
	it('should allow quick editing of inventory status', async () => {
		(global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 1000, total: 2 } }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: mockItems }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ item: { ...mockItems[0], status: 'sold' } }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: [{ ...mockItems[0], status: 'sold' }] }),
			} as Response)

		render(<InventoryTable />)

		await waitFor(() => {
			expect(screen.getByText('Available')).toBeInTheDocument()
		})

		// Click status to edit
		const statusButton = screen.getByTestId('edit-status-1')
		fireEvent.click(statusButton)

		await waitFor(() => {
			expect(screen.getByRole('combobox')).toBeInTheDocument()
		})

		// Change status
		const statusSelect = screen.getByRole('combobox') as HTMLSelectElement
		fireEvent.change(statusSelect, { target: { value: 'sold' } })

		// Save
		const saveButton = screen.getByTestId('save-status-1')
		fireEvent.click(saveButton)

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				'/api/catalog/inventory/1',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify({ status: 'sold' }),
				}),
			)
		})
	})

	/**
	 * @REQ-UI-006 @Inventory
	 * Scenario: Filter inventory
	 */
	it('should allow filtering by product', async () => {
		(global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 1000, total: 2 } }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: mockItems }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: mockItems }),
			} as Response)

		render(<InventoryTable />)

		await waitFor(() => {
			expect(screen.getByText('All Products')).toBeInTheDocument()
		})

		const productSelect = screen.getByDisplayValue('All Products') as HTMLSelectElement
		fireEvent.change(productSelect, { target: { value: '1' } })

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('product_id=1'),
			)
		})
	})

	/**
	 * @REQ-UI-006 @Inventory
	 * Scenario: Filter inventory by status
	 */
	it('should allow filtering by status', async () => {
		(global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 1000, total: 2 } }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: mockItems }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: mockItems }),
			} as Response)

		render(<InventoryTable />)

		await waitFor(() => {
			expect(screen.getByText('All Status')).toBeInTheDocument()
		})

		const statusSelect = screen.getByDisplayValue('All Status') as HTMLSelectElement
		fireEvent.change(statusSelect, { target: { value: 'available' } })

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('status=available'),
			)
		})
	})

	/**
	 * @REQ-UI-006 @Inventory
	 * Scenario: Filter inventory by condition
	 */
	it('should allow filtering by condition', async () => {
		(global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 1000, total: 2 } }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: mockItems }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: mockItems }),
			} as Response)

		render(<InventoryTable />)

		await waitFor(() => {
			expect(screen.getByText('All Conditions')).toBeInTheDocument()
		})

		const conditionSelect = screen.getByDisplayValue('All Conditions') as HTMLSelectElement
		fireEvent.change(conditionSelect, { target: { value: 'new' } })

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('condition=new'),
			)
		})
	})
})
