/**
 * @REQ dashboard/dashboard-home
 * @description Tests for WelcomeCard component displaying user greetings
 *
 * Feature: Dashboard Welcome Card
 *   As a logged-in user
 *   I want to see a personalized welcome message
 *   So that I feel recognized and know I'm in the right place
 */

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WelcomeCard } from './WelcomeCard'

// Mock Clerk's useUser hook
vi.mock('@clerk/clerk-react', () => ({
	useUser: vi.fn(),
}))

const { useUser } = await import('@clerk/clerk-react')

describe('WelcomeCard', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Loading state while fetching user data
	 *   Given the user data is being loaded
	 *   When the WelcomeCard is rendered
	 *   Then a loading indicator should be displayed
	 */
	it('should show loading state when user data is not loaded', () => {
		vi.mocked(useUser).mockReturnValue({
			isLoaded: false,
			user: null,
			isSignedIn: false,
		} as any)

		render(<WelcomeCard />)

		expect(screen.getByText('Loading...')).toBeInTheDocument()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Display user's first name in morning greeting
	 *   Given a user named "Alice" is logged in
	 *   And the time is 10:00 AM
	 *   When the WelcomeCard is rendered
	 *   Then I should see "Good morning, Alice"
	 */
	it('should display morning greeting with user first name', () => {
		vi.mocked(useUser).mockReturnValue({
			isLoaded: true,
			user: {
				firstName: 'Alice',
				fullName: 'Alice Johnson',
			},
			isSignedIn: true,
		} as any)

		// Mock time to be 10 AM
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2025-01-15T10:00:00'))

		render(<WelcomeCard />)

		expect(screen.getByText(/Good morning, Alice/i)).toBeInTheDocument()
		expect(screen.getByText(/Welcome to your dashboard/i)).toBeInTheDocument()

		vi.useRealTimers()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Display afternoon greeting
	 *   Given a user is logged in
	 *   And the time is 3:00 PM
	 *   When the WelcomeCard is rendered
	 *   Then I should see "Good afternoon"
	 */
	it('should display afternoon greeting between 12 PM and 6 PM', () => {
		vi.mocked(useUser).mockReturnValue({
			isLoaded: true,
			user: {
				firstName: 'Bob',
				fullName: 'Bob Smith',
			},
			isSignedIn: true,
		} as any)

		vi.useFakeTimers()
		vi.setSystemTime(new Date('2025-01-15T15:00:00'))

		render(<WelcomeCard />)

		expect(screen.getByText(/Good afternoon, Bob/i)).toBeInTheDocument()

		vi.useRealTimers()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Display evening greeting
	 *   Given a user is logged in
	 *   And the time is 8:00 PM
	 *   When the WelcomeCard is rendered
	 *   Then I should see "Good evening"
	 */
	it('should display evening greeting after 6 PM', () => {
		vi.mocked(useUser).mockReturnValue({
			isLoaded: true,
			user: {
				firstName: 'Charlie',
				fullName: 'Charlie Brown',
			},
			isSignedIn: true,
		} as any)

		vi.useFakeTimers()
		vi.setSystemTime(new Date('2025-01-15T20:00:00'))

		render(<WelcomeCard />)

		expect(screen.getByText(/Good evening, Charlie/i)).toBeInTheDocument()

		vi.useRealTimers()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Fallback to full name when first name is unavailable
	 *   Given a user with only a full name set
	 *   When the WelcomeCard is rendered
	 *   Then I should see their full name in the greeting
	 */
	it('should use full name when first name is not available', () => {
		vi.mocked(useUser).mockReturnValue({
			isLoaded: true,
			user: {
				firstName: null,
				fullName: 'David Miller',
			},
			isSignedIn: true,
		} as any)

		vi.useFakeTimers()
		vi.setSystemTime(new Date('2025-01-15T14:00:00'))

		render(<WelcomeCard />)

		expect(screen.getByText(/Good afternoon, David Miller/i)).toBeInTheDocument()

		vi.useRealTimers()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Generic fallback when no name is available
	 *   Given a user with no name information
	 *   When the WelcomeCard is rendered
	 *   Then I should see "Good [time], there"
	 */
	it('should use generic greeting when no name is available', () => {
		vi.mocked(useUser).mockReturnValue({
			isLoaded: true,
			user: {
				firstName: null,
				fullName: null,
			},
			isSignedIn: true,
		} as any)

		vi.useFakeTimers()
		vi.setSystemTime(new Date('2025-01-15T09:00:00'))

		render(<WelcomeCard />)

		expect(screen.getByText(/Good morning, there/i)).toBeInTheDocument()

		vi.useRealTimers()
	})
})
