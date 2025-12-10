/**
 * Global Device View Component Tests
 *
 * @REQ-SA-004 Global device view with filtering and export
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GlobalDeviceView from './GlobalDeviceView'

// Mock fetch
global.fetch = vi.fn()

const mockDevices = [
	{
		id: 'dev_1',
		name: 'MacBook Pro 16"',
		type: 'macbook',
		serial_number: 'C02XY1234567',
		assigned_to_name: 'John Doe',
		account_name: 'Acme Corporation',
		account_short_name: 'acme',
		status: 'active',
		created_at: '2023-06-01T00:00:00Z',
	},
	{
		id: 'dev_2',
		name: 'iPad Pro',
		type: 'ipad',
		serial_number: 'DMPY1234567',
		assigned_to_name: 'Jane Smith',
		account_name: 'TechCorp Inc',
		account_short_name: 'techcorp',
		status: 'active',
		created_at: '2023-08-15T00:00:00Z',
	},
	{
		id: 'dev_3',
		name: 'iPhone 15 Pro',
		type: 'iphone',
		serial_number: null,
		assigned_to_name: null,
		account_name: 'Acme Corporation',
		account_short_name: 'acme',
		status: 'pending',
		created_at: '2024-01-01T00:00:00Z',
	},
]

describe('GlobalDeviceView Component', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * @REQ-SA-004
	 * Scenario: Global device view
	 *   When I navigate to Global > Devices
	 *   Then I should see devices across ALL customers
	 */
	it('should display all devices across all customers', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockDevices,
		})

		render(<GlobalDeviceView />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument()
			expect(screen.getByText('iPad Pro')).toBeInTheDocument()
			expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-SA-004
	 * Scenario: Global device view
	 *   And I should be able to filter by customer
	 */
	it('should filter devices by customer', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockDevices,
		})

		const user = userEvent.setup()
		render(<GlobalDeviceView />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument()
		})

		// When user filters by customer
		const customerSelect = screen.getByRole('combobox')
		await user.selectOptions(customerSelect, 'acme')

		// Then only Acme devices should be visible
		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument()
			expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
			expect(screen.queryByText('iPad Pro')).not.toBeInTheDocument()
		})

		expect(screen.getByText('Showing 2 of 3 devices')).toBeInTheDocument()
	})

	/**
	 * @REQ-SA-004
	 * Scenario: Global device view
	 *   And I should be able to export device data
	 */
	it('should provide export CSV functionality', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockDevices,
		})

		const user = userEvent.setup()
		render(<GlobalDeviceView />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument()
		})

		// Mock URL.createObjectURL
		const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
		const mockRevokeObjectURL = vi.fn()
		const originalCreateObjectURL = global.URL.createObjectURL
		const originalRevokeObjectURL = global.URL.revokeObjectURL
		global.URL.createObjectURL = mockCreateObjectURL
		global.URL.revokeObjectURL = mockRevokeObjectURL

		// Mock anchor element
		const mockClick = vi.fn()
		const mockAnchor = {
			click: mockClick,
			href: '',
			download: '',
			setAttribute: vi.fn(),
			getAttribute: vi.fn(),
			removeAttribute: vi.fn(),
		}
		const originalCreateElement = document.createElement.bind(document)
		vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
			if (tagName === 'a') {
				return mockAnchor as any
			}
			return originalCreateElement(tagName)
		})

		// When user clicks export button
		const exportButton = screen.getByText('Export CSV')
		await user.click(exportButton)

		// Then CSV should be generated and downloaded
		expect(mockCreateObjectURL).toHaveBeenCalled()
		expect(mockClick).toHaveBeenCalled()
		expect(mockRevokeObjectURL).toHaveBeenCalled()

		// Cleanup
		global.URL.createObjectURL = originalCreateObjectURL
		global.URL.revokeObjectURL = originalRevokeObjectURL
		vi.restoreAllMocks()
	})

	it('should search devices by name', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockDevices,
		})

		const user = userEvent.setup()
		render(<GlobalDeviceView />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument()
		})

		// Search by device name
		const searchInput = screen.getByPlaceholderText(/search by device name/i)
		await user.type(searchInput, 'iPad')

		await waitFor(() => {
			expect(screen.getByText('iPad Pro')).toBeInTheDocument()
			expect(screen.queryByText('MacBook Pro 16"')).not.toBeInTheDocument()
		})
	})

	it('should search devices by serial number', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockDevices,
		})

		const user = userEvent.setup()
		render(<GlobalDeviceView />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument()
		})

		// Search by serial number
		const searchInput = screen.getByPlaceholderText(/search by device name/i)
		await user.type(searchInput, 'C02XY')

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument()
			expect(screen.queryByText('iPad Pro')).not.toBeInTheDocument()
		})
	})

	it('should display "N/A" for missing serial numbers', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockDevices,
		})

		render(<GlobalDeviceView />)

		await waitFor(() => {
			expect(screen.getByText('N/A')).toBeInTheDocument()
		})
	})

	it('should display "Unassigned" for devices without assignee', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockDevices,
		})

		render(<GlobalDeviceView />)

		await waitFor(() => {
			expect(screen.getByText('Unassigned')).toBeInTheDocument()
		})
	})

	it('should show different status badges', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockDevices,
		})

		render(<GlobalDeviceView />)

		await waitFor(() => {
			const statusElements = screen.getAllByText(/active|pending/)
			expect(statusElements.length).toBeGreaterThan(0)
		})
	})

	it('should display loading state while fetching', () => {
		;(global.fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

		render(<GlobalDeviceView />)

		expect(screen.getByTestId('table-skeleton')).toBeInTheDocument()
	})

	it('should display error state on fetch failure', async () => {
		;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

		render(<GlobalDeviceView />)

		await waitFor(() => {
			expect(screen.getByText('Error loading devices')).toBeInTheDocument()
			expect(screen.getByText('Network error')).toBeInTheDocument()
		})
	})

	it('should show empty state when no devices match filters', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockDevices,
		})

		const user = userEvent.setup()
		render(<GlobalDeviceView />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument()
		})

		// Search for non-existent device
		const searchInput = screen.getByPlaceholderText(/search by device name/i)
		await user.type(searchInput, 'NonExistent')

		await waitFor(() => {
			expect(screen.getByText('No devices found')).toBeInTheDocument()
		})
	})
})
