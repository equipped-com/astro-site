/**
 * @REQ-UI-003 @Products - Browse products
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import ProductTable from './ProductTable'

describe('ProductTable', () => {
	const mockBrands = [
		{ id: '1', name: 'Apple' },
		{ id: '2', name: 'Dell' },
	]

	const mockProducts = [
		{
			id: '1',
			brandId: '1',
			brandName: 'Apple',
			name: 'MacBook Pro 14-inch M3',
			modelIdentifier: 'MBP14-M3-512',
			modelNumber: 'A2779',
			sku: 'APL-MBP14-M3-512',
			productType: 'laptop',
			description: 'Powerful laptop',
			specs: '{"cpu":"M3","memory":"16GB"}',
			msrp: 1999,
			imageUrl: 'https://example.com/mbp.jpg',
			isActive: true,
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		},
	]

	beforeEach(() => {
		global.fetch = vi.fn()
		global.confirm = vi.fn(() => true)
	})

	/**
	 * @REQ-UI-003 @Products
	 * Scenario: Browse products
	 *   Given I am on the products page
	 *   Then I should see all products in a data table
	 */
	it('should display all products in a table', async () => {
		;(global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ brands: mockBrands }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 20, total: 1 } }),
			} as Response)

		render(<ProductTable />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14-inch M3')).toBeInTheDocument()
			// Apple appears in both dropdown filter and table, so use getAllByText
			expect(screen.getAllByText('Apple').length).toBeGreaterThan(0)
		})
	})

	/**
	 * @REQ-UI-003 @Products
	 * Scenario: Browse products
	 *   And I should be able to:
	 *     | Action         | Available |
	 *     | Filter by brand| Yes       |
	 */
	it('should allow filtering by brand', async () => {
		;(global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ brands: mockBrands }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 20, total: 1 } }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 20, total: 1 } }),
			} as Response)

		render(<ProductTable />)

		await waitFor(() => {
			expect(screen.getByText('All Brands')).toBeInTheDocument()
		})

		// Find and click brand filter
		const brandSelect = screen.getByDisplayValue('All Brands') as HTMLSelectElement
		fireEvent.change(brandSelect, { target: { value: '1' } })

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('brand=1'))
		})
	})

	/**
	 * @REQ-UI-003 @Products
	 * Scenario: Browse products
	 *   And I should be able to:
	 *     | Action         | Available |
	 *     | Filter by type | Yes       |
	 */
	it('should allow filtering by type', async () => {
		;(global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ brands: mockBrands }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 20, total: 1 } }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 20, total: 1 } }),
			} as Response)

		render(<ProductTable />)

		await waitFor(() => {
			expect(screen.getByText('All Types')).toBeInTheDocument()
		})

		const typeSelect = screen.getByDisplayValue('All Types') as HTMLSelectElement
		fireEvent.change(typeSelect, { target: { value: 'laptop' } })

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('type=laptop'))
		})
	})

	/**
	 * @REQ-UI-003 @Products
	 * Scenario: Browse products
	 *   And I should be able to:
	 *     | Action         | Available |
	 *     | Search by name | Yes       |
	 */
	it('should allow searching by name', async () => {
		;(global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ brands: mockBrands }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 20, total: 1 } }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 20, total: 1 } }),
			} as Response)

		render(<ProductTable />)

		await waitFor(() => {
			expect(screen.getByPlaceholderText(/Search by name or SKU/i)).toBeInTheDocument()
		})

		const searchInput = screen.getByPlaceholderText(/Search by name or SKU/i)
		fireEvent.change(searchInput, { target: { value: 'MacBook' } })

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('search=MacBook'))
		})
	})

	/**
	 * @REQ-UI-003 @Products
	 * Scenario: Browse products
	 *   And I should be able to:
	 *     | Action         | Available |
	 *     | Paginate       | Yes       |
	 */
	it('should allow pagination', async () => {
		;(global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ brands: mockBrands }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 20, total: 50 } }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 2, limit: 20, total: 50 } }),
			} as Response)

		render(<ProductTable />)

		await waitFor(() => {
			expect(screen.getByText('Next')).toBeInTheDocument()
		})

		const nextButton = screen.getByText('Next')
		fireEvent.click(nextButton)

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'))
		})
	})

	/**
	 * @REQ-UI-003 @Products
	 * Scenario: Delete product
	 */
	it('should allow deleting a product', async () => {
		;(global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ brands: mockBrands }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: mockProducts, pagination: { page: 1, limit: 20, total: 1 } }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ products: [], pagination: { page: 1, limit: 20, total: 0 } }),
			} as Response)

		render(<ProductTable />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14-inch M3')).toBeInTheDocument()
		})

		const deleteButton = screen.getByTestId('delete-product-APL-MBP14-M3-512')
		fireEvent.click(deleteButton)

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith('/api/catalog/products/1', {
				method: 'DELETE',
			})
		})
	})
})
