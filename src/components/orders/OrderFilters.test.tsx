import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OrderFilters } from './OrderFilters'

describe('OrderFilters Component', () => {
	describe('Filter UI rendering', () => {
		it('should render search input field', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			const searchInput = screen.getByLabelText('Search')
			expect(searchInput).toBeInTheDocument()
			expect(searchInput).toHaveAttribute('placeholder', 'Search by order # or product name...')
		})

		it('should render status filter dropdown with all status options', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			const statusSelect = screen.getByLabelText('Status')
			expect(statusSelect).toBeInTheDocument()

			// Check all status options
			expect(screen.getByText('All Orders')).toBeInTheDocument()
			expect(screen.getByText('Pending')).toBeInTheDocument()
			expect(screen.getByText('Pending leasing approval')).toBeInTheDocument()
			expect(screen.getByText('Processing')).toBeInTheDocument()
			expect(screen.getByText('Shipped')).toBeInTheDocument()
			expect(screen.getByText('Delivered')).toBeInTheDocument()
			expect(screen.getByText('Cancelled')).toBeInTheDocument()
			expect(screen.getByText('Returned')).toBeInTheDocument()
		})

		it('should render date range inputs', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			const fromDateInput = screen.getByLabelText('From Date')
			const toDateInput = screen.getByLabelText('To Date')

			expect(fromDateInput).toBeInTheDocument()
			expect(toDateInput).toBeInTheDocument()
			expect(fromDateInput).toHaveAttribute('type', 'date')
			expect(toDateInput).toHaveAttribute('type', 'date')
		})
	})

	describe('Filter change callbacks', () => {
		it('should call onFilterChange when search query changes', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			const searchInput = screen.getByLabelText('Search')
			fireEvent.change(searchInput, { target: { value: 'MacBook' } })

			expect(mockOnFilterChange).toHaveBeenCalledWith({
				status: 'all',
				searchQuery: 'MacBook',
			})
		})

		it('should call onFilterChange when status filter changes', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			const statusSelect = screen.getByLabelText('Status')
			fireEvent.change(statusSelect, { target: { value: 'shipped' } })

			expect(mockOnFilterChange).toHaveBeenCalledWith({
				status: 'shipped',
				searchQuery: '',
			})
		})

		it('should call onFilterChange when date from changes', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			const fromDateInput = screen.getByLabelText('From Date')
			fireEvent.change(fromDateInput, { target: { value: '2025-12-01' } })

			expect(mockOnFilterChange).toHaveBeenCalledWith({
				status: 'all',
				searchQuery: '',
				dateFrom: '2025-12-01',
			})
		})

		it('should call onFilterChange when date to changes', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			const toDateInput = screen.getByLabelText('To Date')
			fireEvent.change(toDateInput, { target: { value: '2025-12-31' } })

			expect(mockOnFilterChange).toHaveBeenCalledWith({
				status: 'all',
				searchQuery: '',
				dateTo: '2025-12-31',
			})
		})

		it('should remove date filter when date is cleared', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			const fromDateInput = screen.getByLabelText('From Date')

			// Set a date
			fireEvent.change(fromDateInput, { target: { value: '2025-12-01' } })
			expect(mockOnFilterChange).toHaveBeenCalledWith({
				status: 'all',
				searchQuery: '',
				dateFrom: '2025-12-01',
			})

			// Clear the date
			fireEvent.change(fromDateInput, { target: { value: '' } })
			expect(mockOnFilterChange).toHaveBeenCalledWith({
				status: 'all',
				searchQuery: '',
				dateFrom: undefined,
			})
		})
	})

	describe('Multiple filter combinations', () => {
		it('should combine search and status filters', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			// First apply search filter
			const searchInput = screen.getByLabelText('Search')
			fireEvent.change(searchInput, { target: { value: 'MacBook' } })

			// Then apply status filter
			const statusSelect = screen.getByLabelText('Status')
			fireEvent.change(statusSelect, { target: { value: 'shipped' } })

			expect(mockOnFilterChange).toHaveBeenLastCalledWith({
				status: 'shipped',
				searchQuery: 'MacBook',
			})
		})

		it('should combine all filter types', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			// Apply all filters
			fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'MacBook' } })
			fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'delivered' } })
			fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2025-12-01' } })
			fireEvent.change(screen.getByLabelText('To Date'), { target: { value: '2025-12-31' } })

			expect(mockOnFilterChange).toHaveBeenLastCalledWith({
				status: 'delivered',
				searchQuery: 'MacBook',
				dateFrom: '2025-12-01',
				dateTo: '2025-12-31',
			})
		})
	})

	describe('Filter persistence', () => {
		it('should maintain search query value after typing', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			const searchInput = screen.getByLabelText('Search') as HTMLInputElement
			fireEvent.change(searchInput, { target: { value: 'MacBook Pro' } })

			expect(searchInput.value).toBe('MacBook Pro')
		})

		it('should maintain status filter value after selection', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			const statusSelect = screen.getByLabelText('Status') as HTMLSelectElement
			fireEvent.change(statusSelect, { target: { value: 'processing' } })

			expect(statusSelect.value).toBe('processing')
		})

		it('should maintain date values after selection', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			const fromDateInput = screen.getByLabelText('From Date') as HTMLInputElement
			const toDateInput = screen.getByLabelText('To Date') as HTMLInputElement

			fireEvent.change(fromDateInput, { target: { value: '2025-12-01' } })
			fireEvent.change(toDateInput, { target: { value: '2025-12-31' } })

			expect(fromDateInput.value).toBe('2025-12-01')
			expect(toDateInput.value).toBe('2025-12-31')
		})
	})

	describe('Input accessibility', () => {
		it('should have proper labels associated with inputs', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			const searchInput = screen.getByLabelText('Search')
			const statusSelect = screen.getByLabelText('Status')
			const fromDateInput = screen.getByLabelText('From Date')
			const toDateInput = screen.getByLabelText('To Date')

			expect(searchInput).toHaveAttribute('id', 'search')
			expect(statusSelect).toHaveAttribute('id', 'status')
			expect(fromDateInput).toHaveAttribute('id', 'dateFrom')
			expect(toDateInput).toHaveAttribute('id', 'dateTo')
		})

		it('should have proper input types', () => {
			const mockOnFilterChange = vi.fn()
			render(<OrderFilters onFilterChange={mockOnFilterChange} />)

			expect(screen.getByLabelText('Search')).toHaveAttribute('type', 'text')
			expect(screen.getByLabelText('From Date')).toHaveAttribute('type', 'date')
			expect(screen.getByLabelText('To Date')).toHaveAttribute('type', 'date')
		})
	})
})
