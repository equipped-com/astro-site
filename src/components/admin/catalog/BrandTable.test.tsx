/**
 * @REQ-UI-002 @Brands - Manage brands
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BrandTable from './BrandTable'

describe('BrandTable', () => {
	const mockBrands = [
		{
			id: '1',
			name: 'Apple',
			slug: 'apple',
			logoUrl: 'https://example.com/apple.png',
			isActive: true,
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		},
		{
			id: '2',
			name: 'Dell',
			slug: 'dell',
			logoUrl: null,
			isActive: true,
			createdAt: '2024-01-02T00:00:00Z',
			updatedAt: '2024-01-02T00:00:00Z',
		},
	]

	beforeEach(() => {
		global.fetch = vi.fn()
		global.confirm = vi.fn(() => true)
	})

	/**
	 * @REQ-UI-002 @Brands
	 * Scenario: Manage brands
	 *   Given I am on the brands management page
	 *   When I view the page
	 *   Then I should see all brands in a table
	 */
	it('should display all brands in a table', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ brands: mockBrands }),
		} as Response)

		render(<BrandTable />)

		await waitFor(() => {
			expect(screen.getByText('Apple')).toBeInTheDocument()
			expect(screen.getByText('Dell')).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-UI-002 @Brands
	 * Scenario: Manage brands
	 *   And I should see "Add Brand" button
	 */
	it('should display add brand button', () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ brands: [] }),
		} as Response)

		render(<BrandTable />)

		expect(screen.getByTestId('add-brand-button')).toBeInTheDocument()
	})

	/**
	 * @REQ-UI-002 @Brands
	 * Scenario: Manage brands
	 *   When I click "Add Brand"
	 *   Then I should see a form with fields
	 */
	it('should show form when clicking add brand', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ brands: [] }),
		} as Response)

		render(<BrandTable />)

		const addButton = screen.getByTestId('add-brand-button')
		fireEvent.click(addButton)

		await waitFor(() => {
			expect(screen.getByLabelText(/Brand Name/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/Slug/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/Logo URL/i)).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-UI-002 @Brands
	 * Scenario: Manage brands
	 *   When I submit the form
	 *   Then the brand should be created
	 */
	it('should create brand when submitting form', async () => {
		vi.mocked(global.fetch)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ brands: [] }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ brand: mockBrands[0] }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ brands: [mockBrands[0]] }),
			} as Response)

		render(<BrandTable />)

		// Open form
		const addButton = screen.getByTestId('add-brand-button')
		fireEvent.click(addButton)

		await waitFor(() => {
			expect(screen.getByLabelText(/Brand Name/i)).toBeInTheDocument()
		})

		// Fill form
		fireEvent.change(screen.getByLabelText(/Brand Name/i), { target: { value: 'Apple' } })
		fireEvent.change(screen.getByLabelText(/Slug/i), { target: { value: 'apple' } })

		// Submit
		const submitButton = screen.getByText(/Create Brand/i)
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				'/api/catalog/brands',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ name: 'Apple', slug: 'apple', logo_url: '' }),
				}),
			)
		})
	})

	/**
	 * @REQ-UI-002 @Brands
	 * Scenario: Edit brand
	 */
	it('should allow editing a brand', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ brands: mockBrands }),
		} as Response)

		render(<BrandTable />)

		await waitFor(() => {
			expect(screen.getByText('Apple')).toBeInTheDocument()
		})

		const editButton = screen.getByTestId('edit-brand-apple')
		fireEvent.click(editButton)

		await waitFor(() => {
			expect(screen.getByDisplayValue('Apple')).toBeInTheDocument()
			expect(screen.getByText(/Save Changes/i)).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-UI-002 @Brands
	 * Scenario: Delete brand
	 */
	it('should allow deleting a brand', async () => {
		vi.mocked(global.fetch)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ brands: mockBrands }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ brands: [mockBrands[1]] }),
			} as Response)

		render(<BrandTable />)

		await waitFor(() => {
			expect(screen.getByText('Apple')).toBeInTheDocument()
		})

		const deleteButton = screen.getByTestId('delete-brand-apple')
		fireEvent.click(deleteButton)

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith('/api/catalog/brands/1', {
				method: 'DELETE',
			})
		})
	})
})
