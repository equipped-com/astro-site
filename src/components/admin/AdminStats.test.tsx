/**
 * Admin Stats Component Tests
 *
 * @REQ-SA-001 Access admin dashboard and view global statistics
 */
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminStats from './AdminStats'

// Mock fetch
global.fetch = vi.fn()

const mockStats = {
	totalCustomers: 42,
	totalDevices: 1250,
	totalOrders: 387,
	totalUsers: 156,
}

describe('AdminStats Component', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * @REQ-SA-001
	 * Scenario: Access admin dashboard
	 *   Then I should see the admin dashboard
	 *   And I should see global navigation
	 */
	it('should display global platform statistics', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockStats,
		})

		render(<AdminStats />)

		await waitFor(() => {
			expect(screen.getByText('Total Customers')).toBeInTheDocument()
			expect(screen.getByText('42')).toBeInTheDocument()

			expect(screen.getByText('Total Devices')).toBeInTheDocument()
			expect(screen.getByText('1,250')).toBeInTheDocument()

			expect(screen.getByText('Total Orders')).toBeInTheDocument()
			expect(screen.getByText('387')).toBeInTheDocument()

			expect(screen.getByText('Total Users')).toBeInTheDocument()
			expect(screen.getByText('156')).toBeInTheDocument()
		})
	})

	it('should format large numbers with locale separators', async () => {
		const largeStats = {
			totalCustomers: 1234,
			totalDevices: 56789,
			totalOrders: 9876,
			totalUsers: 4567,
		}

		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => largeStats,
		})

		render(<AdminStats />)

		await waitFor(() => {
			expect(screen.getByText('1,234')).toBeInTheDocument()
			expect(screen.getByText('56,789')).toBeInTheDocument()
			expect(screen.getByText('9,876')).toBeInTheDocument()
			expect(screen.getByText('4,567')).toBeInTheDocument()
		})
	})

	it('should display loading state while fetching', () => {
		;(global.fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

		render(<AdminStats />)

		// Should show spinner
		expect(screen.getByTestId('spinner')).toBeInTheDocument()
	})

	it('should display error state on fetch failure', async () => {
		;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

		render(<AdminStats />)

		await waitFor(() => {
			expect(screen.getByText('Error loading stats')).toBeInTheDocument()
			expect(screen.getByText('Network error')).toBeInTheDocument()
		})
	})

	it('should render links to detailed views', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockStats,
		})

		render(<AdminStats />)

		await waitFor(() => {
			const links = screen.getAllByRole('link')
			expect(links).toHaveLength(4)

			// Check href attributes
			expect(links[0]).toHaveAttribute('href', '/admin/customers')
			expect(links[1]).toHaveAttribute('href', '/admin/devices')
			expect(links[2]).toHaveAttribute('href', '/admin/orders')
			expect(links[3]).toHaveAttribute('href', '/admin/users')
		})
	})

	it('should handle zero stats gracefully', async () => {
		const zeroStats = {
			totalCustomers: 0,
			totalDevices: 0,
			totalOrders: 0,
			totalUsers: 0,
		}

		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => zeroStats,
		})

		render(<AdminStats />)

		await waitFor(() => {
			const zeroElements = screen.getAllByText('0')
			expect(zeroElements.length).toBe(4)
		})
	})
})
