/**
 * @REQ dashboard/dashboard-home
 * @description Tests for QuickStats component displaying device, people, and order counts
 *
 * Feature: Dashboard Quick Stats
 *   As a user
 *   I want to see overview statistics at a glance
 *   So that I can quickly understand my account status
 */

import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { QuickStats } from './QuickStats'

// Mock fetch
global.fetch = vi.fn()

describe('QuickStats', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Loading state while fetching stats
	 *   Given the stats API is loading
	 *   When the QuickStats component is rendered
	 *   Then skeleton loaders should be displayed
	 */
	it('should show loading skeletons while fetching data', () => {
		(fetch as Mock).mockImplementation(
			() =>
				new Promise(() => {
					// Never resolve to keep loading state
				}),
		)

		const { container } = render(<QuickStats />)

		// CardSkeleton with variant="stat" renders animated skeleton elements
		const skeletons = container.querySelectorAll('.animate-pulse')
		expect(skeletons.length).toBeGreaterThan(0)
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Display device count and active devices
	 *   Given I have 10 devices total
	 *   And 7 devices are active (in_use or assigned)
	 *   When the stats load
	 *   Then I should see "10" for total devices
	 *   And I should see "7 active" as subtext
	 */
	it('should display device count with active status', async () => {
		(fetch as Mock).mockImplementation((url: string | URL) => {
			const urlStr = url.toString()
			if (urlStr.includes('/devices')) {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						devices: [
							{ id: '1', status: 'in_use' },
							{ id: '2', status: 'assigned' },
							{ id: '3', status: 'assigned' },
							{ id: '4', status: 'available' },
							{ id: '5', status: 'in_use' },
							{ id: '6', status: 'maintenance' },
							{ id: '7', status: 'in_use' },
							{ id: '8', status: 'in_use' },
							{ id: '9', status: 'assigned' },
							{ id: '10', status: 'retired' },
						],
					}),
				} as Response)
			}
			if (urlStr.includes('/people')) {
				return Promise.resolve({
					ok: true,
					json: async () => ({ people: [] }),
				} as Response)
			}
			return Promise.reject(new Error('Unknown endpoint'))
		})

		render(<QuickStats />)

		await waitFor(() => {
			expect(screen.getByText('Devices')).toBeInTheDocument()
		})

		// 10 total devices
		expect(screen.getByText('10')).toBeInTheDocument()
		// 7 active (in_use + assigned = 5 + 2 = 7)
		expect(screen.getByText('7 active')).toBeInTheDocument()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Display people count and active members
	 *   Given I have 5 team members total
	 *   And 4 are active
	 *   When the stats load
	 *   Then I should see "5" for total people
	 *   And I should see "4 active" as subtext
	 */
	it('should display people count with active status', async () => {
		(fetch as Mock).mockImplementation((url: string | URL) => {
			const urlStr = url.toString()
			if (urlStr.includes('/people')) {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						people: [
							{ id: '1', status: 'active' },
							{ id: '2', status: 'active' },
							{ id: '3', status: 'active' },
							{ id: '4', status: 'active' },
							{ id: '5', status: 'offboarded' },
						],
					}),
				} as Response)
			}
			if (urlStr.includes('/devices')) {
				return Promise.resolve({
					ok: true,
					json: async () => ({ devices: [] }),
				} as Response)
			}
			return Promise.reject(new Error('Unknown endpoint'))
		})

		render(<QuickStats />)

		await waitFor(() => {
			expect(screen.getByText('Team Members')).toBeInTheDocument()
		})

		expect(screen.getByText('5')).toBeInTheDocument()
		expect(screen.getByText('4 active')).toBeInTheDocument()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Display zero counts for empty account
	 *   Given I have no devices, people, or orders
	 *   When the stats load
	 *   Then all counts should show "0"
	 */
	it('should display zeros for empty account', async () => {
		(fetch as Mock).mockImplementation((url: string | URL) => {
			const urlStr = url.toString()
			if (urlStr.includes('/devices')) {
				return Promise.resolve({
					ok: true,
					json: async () => ({ devices: [] }),
				} as Response)
			}
			if (urlStr.includes('/people')) {
				return Promise.resolve({
					ok: true,
					json: async () => ({ people: [] }),
				} as Response)
			}
			return Promise.reject(new Error('Unknown endpoint'))
		})

		render(<QuickStats />)

		await waitFor(() => {
			expect(screen.getByText('Devices')).toBeInTheDocument()
		})

		// All counts should be 0
		const zeros = screen.getAllByText('0')
		expect(zeros.length).toBeGreaterThanOrEqual(3) // At least 3 stat cards
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Error handling when API fails
	 *   Given the API returns an error
	 *   When the QuickStats component loads
	 *   Then an error message should be displayed
	 */
	it('should display error message when API fails', async () => {
		(fetch as Mock).mockRejectedValue(new Error('Network error'))

		render(<QuickStats />)

		await waitFor(() => {
			expect(screen.getByText(/Error loading stats/i)).toBeInTheDocument()
		})
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Stat cards link to respective pages
	 *   Given stats are loaded successfully
	 *   When I view the QuickStats component
	 *   Then each stat card should be a clickable link to its detail page
	 */
	it('should render stat cards as links to detail pages', async () => {
		(fetch as Mock).mockImplementation((url: string | URL) => {
			const urlStr = url.toString()
			if (urlStr.includes('/devices')) {
				return Promise.resolve({
					ok: true,
					json: async () => ({ devices: [{ id: '1', status: 'in_use' }] }),
				} as Response)
			}
			if (urlStr.includes('/people')) {
				return Promise.resolve({
					ok: true,
					json: async () => ({ people: [{ id: '1', status: 'active' }] }),
				} as Response)
			}
			return Promise.reject(new Error('Unknown endpoint'))
		})

		render(<QuickStats />)

		await waitFor(() => {
			expect(screen.getByText('Devices')).toBeInTheDocument()
		})

		const devicesLink = screen.getByText('Devices').closest('a')
		const peopleLink = screen.getByText('Team Members').closest('a')
		const ordersLink = screen.getByText('Orders').closest('a')

		expect(devicesLink).toHaveAttribute('href', '/dashboard/devices')
		expect(peopleLink).toHaveAttribute('href', '/dashboard/people')
		expect(ordersLink).toHaveAttribute('href', '/dashboard/orders')
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Custom API base URL
	 *   Given a custom API base URL is provided
	 *   When the QuickStats component fetches data
	 *   Then it should use the custom base URL
	 */
	it('should use custom API base URL when provided', async () => {
		const customBaseUrl = 'https://custom-api.example.com'

		(fetch as Mock).mockImplementation((url: string | URL) => {
			const urlStr = url.toString()
			expect(urlStr.startsWith(customBaseUrl)).toBe(true)

			if (urlStr.includes('/devices')) {
				return Promise.resolve({
					ok: true,
					json: async () => ({ devices: [] }),
				} as Response)
			}
			if (urlStr.includes('/people')) {
				return Promise.resolve({
					ok: true,
					json: async () => ({ people: [] }),
				} as Response)
			}
			return Promise.reject(new Error('Unknown endpoint'))
		})

		render(<QuickStats apiBaseUrl={customBaseUrl} />)

		await waitFor(() => {
			expect(screen.getByText('Devices')).toBeInTheDocument()
		})
	})
})
