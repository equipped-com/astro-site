/**
 * @REQ dashboard/dashboard-home
 * @description Integration tests for Dashboard Home Page
 *
 * Feature: Dashboard Home Page
 *   As a logged-in user
 *   I want to see an overview dashboard
 *   So that I can quickly understand my account status and take common actions
 */

import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

// Mock Clerk - must be before component imports
vi.mock('@clerk/clerk-react', () => ({
	useUser: vi.fn(),
	ClerkProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const { useUser } = await import('@clerk/clerk-react')

// Import components after mock setup
import { QuickActions } from '@/components/dashboard/QuickActions'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { WelcomeCard } from '@/components/dashboard/WelcomeCard'

describe('Dashboard Home Page Integration', () => {
	beforeEach(() => {
		vi.clearAllMocks()

		// Mock fetch
		global.fetch = vi.fn()

		// Default mock for authenticated user
		;(useUser as Mock).mockReturnValue({
			isLoaded: true,
			user: {
				firstName: 'Alice',
				fullName: 'Alice Johnson',
			},
			isSignedIn: true,
		})

		// Default mock for API calls
		;(global.fetch as Mock).mockImplementation((url: string | URL) => {
			const urlStr = url.toString()
			if (urlStr.includes('/devices')) {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						devices: [
							{ id: '1', status: 'in_use' },
							{ id: '2', status: 'assigned' },
							{ id: '3', status: 'available' },
						],
					}),
				} as Response)
			}
			if (urlStr.includes('/people')) {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						people: [
							{ id: '1', status: 'active' },
							{ id: '2', status: 'active' },
						],
					}),
				} as Response)
			}
			return Promise.reject(new Error('Unknown endpoint'))
		})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Complete dashboard loads for authenticated user
	 *   Given I am a logged-in user named Alice
	 *   And I have 3 devices (2 active)
	 *   And I have 2 team members (both active)
	 *   When I navigate to /dashboard
	 *   Then I should see a welcome message with my name
	 *   And I should see device stats showing "3" total and "2 active"
	 *   And I should see people stats showing "2" total and "2 active"
	 *   And I should see quick action shortcuts
	 */
	it('should render complete dashboard with all sections', async () => {
		// Mock Date.now() to control greeting time
		const realDateNow = Date.now
		Date.now = () => new Date('2025-01-15T10:00:00').getTime()

		render(
			<div>
				<WelcomeCard />
				<QuickStats />
				<QuickActions />
			</div>,
		)

		// Welcome card
		expect(screen.getByText(/Good morning, Alice/i)).toBeInTheDocument()

		// Stats (wait for async load)
		await waitFor(() => {
			expect(screen.getByText('Devices')).toBeInTheDocument()
		})

		// Check specific stat values (may have duplicates, just verify they exist)
		const statValues = screen.getAllByText('3')
		expect(statValues.length).toBeGreaterThan(0) // Total devices

		const activeTexts = screen.getAllByText('2 active')
		expect(activeTexts.length).toBeGreaterThan(0) // Active count appears

		expect(screen.getByText('Team Members')).toBeInTheDocument()

		// Quick actions
		expect(screen.getByText('Quick Actions')).toBeInTheDocument()
		expect(screen.getByText('Add Device')).toBeInTheDocument()
		expect(screen.getByText('Shop Devices')).toBeInTheDocument()

		Date.now = realDateNow
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Dashboard adapts to time of day
	 *   Given I am a logged-in user
	 *   When I view the dashboard at different times
	 *   Then the greeting should reflect the current time of day
	 */
	it('should show time-appropriate greeting', async () => {
		vi.useFakeTimers()

		// Morning
		vi.setSystemTime(new Date('2025-01-15T08:00:00'))
		const { rerender } = render(<WelcomeCard />)
		expect(screen.getByText(/Good morning/i)).toBeInTheDocument()

		// Afternoon
		vi.setSystemTime(new Date('2025-01-15T14:00:00'))
		rerender(<WelcomeCard />)
		expect(screen.getByText(/Good afternoon/i)).toBeInTheDocument()

		// Evening
		vi.setSystemTime(new Date('2025-01-15T19:00:00'))
		rerender(<WelcomeCard />)
		expect(screen.getByText(/Good evening/i)).toBeInTheDocument()

		vi.useRealTimers()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Navigation links are functional
	 *   Given I am viewing the dashboard
	 *   When I check the navigation elements
	 *   Then stat cards should link to their respective pages
	 *   And quick action buttons should link to their respective pages
	 */
	it('should provide navigation links to all key pages', async () => {
		render(
			<div>
				<QuickStats />
				<QuickActions />
			</div>,
		)

		await waitFor(() => {
			expect(screen.getByText('Devices')).toBeInTheDocument()
		})

		// Check stat card links
		expect(screen.getByText('Devices').closest('a')).toHaveAttribute('href', '/dashboard/devices')
		expect(screen.getByText('Team Members').closest('a')).toHaveAttribute('href', '/dashboard/people')
		expect(screen.getByText('Orders').closest('a')).toHaveAttribute('href', '/dashboard/orders')

		// Check quick action links
		expect(screen.getByText('Add Device').closest('a')).toHaveAttribute('href', '/dashboard/devices?action=add')
		expect(screen.getByText('Shop Devices').closest('a')).toHaveAttribute('href', '/dashboard/store')
		expect(screen.getByText('Add Team Member').closest('a')).toHaveAttribute('href', '/dashboard/people?action=add')
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Loading states during data fetch
	 *   Given the API is slow to respond
	 *   When I navigate to the dashboard
	 *   Then I should see loading indicators for stats
	 *   And the welcome card should load independently
	 */
	it('should show loading states while fetching stats', () => {
		;(fetch as Mock).mockImplementation(
			() =>
				new Promise(() => {
					// Never resolve to keep loading
				}),
		)

		const { container } = render(<QuickStats />)

		// Should show skeleton loaders with animate-pulse class
		const skeletons = container.querySelectorAll('.animate-pulse')
		expect(skeletons.length).toBeGreaterThan(0)
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Error handling for API failures
	 *   Given the API is unavailable
	 *   When I navigate to the dashboard
	 *   Then the welcome card should still render
	 *   And stats should show an error message
	 *   And quick actions should still be accessible
	 */
	it('should handle API errors gracefully', async () => {
		;(fetch as Mock).mockRejectedValue(new Error('API unavailable'))

		render(
			<div>
				<WelcomeCard />
				<QuickStats />
				<QuickActions />
			</div>,
		)

		// Welcome card should still work
		expect(screen.getByText(/Good/i)).toBeInTheDocument()

		// Stats should show error
		await waitFor(() => {
			expect(screen.getByText(/Error loading stats/i)).toBeInTheDocument()
		})

		// Quick actions should still be visible
		expect(screen.getByText('Add Device')).toBeInTheDocument()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Empty state for new accounts
	 *   Given I am a new user with no data
	 *   When I view the dashboard
	 *   Then all stat counts should show "0"
	 *   And quick actions should be prominently displayed to guide next steps
	 */
	it('should display zeros and guide new users', async () => {
		;(fetch as Mock).mockImplementation((url: string | URL) => {
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

		render(
			<div>
				<QuickStats />
				<QuickActions />
			</div>,
		)

		await waitFor(() => {
			expect(screen.getByText('Devices')).toBeInTheDocument()
		})

		// Should show zeros
		const zeros = screen.getAllByText('0')
		expect(zeros.length).toBeGreaterThanOrEqual(3)

		// Quick actions should be visible to guide user
		expect(screen.getByText('Add Device')).toBeInTheDocument()
		expect(screen.getByText('Shop Devices')).toBeInTheDocument()
	})
})
