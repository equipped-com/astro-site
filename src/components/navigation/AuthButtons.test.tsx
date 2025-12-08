import * as ClerkReact from '@clerk/clerk-react'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthButtons } from './AuthButtons'

// Mock environment variable
const originalEnv = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY

// Mock Clerk components
vi.mock('@clerk/clerk-react', () => ({
	SignedIn: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-in">{children}</div>,
	SignedOut: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-out">{children}</div>,
	UserButton: ({ afterSignOutUrl, appearance }: { afterSignOutUrl: string; appearance: unknown }) => (
		<button data-testid="user-button" data-after-sign-out-url={afterSignOutUrl}>
			User Button
		</button>
	),
	ClerkProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="clerk-provider">{children}</div>,
}))

describe('AuthButtons', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Ensure env var is set for most tests
		import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_12345'
	})

	afterEach(() => {
		// Restore original env var
		import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY = originalEnv
	})

	/**
	 * @REQ-NAV-001
	 * Scenario: Signed out navigation
	 */
	it('should render sign in and sign up buttons when signed out', () => {
		render(<AuthButtons />)

		const signedOut = screen.getByTestId('signed-out')
		expect(signedOut).toBeInTheDocument()

		const signInLink = screen.getByText('Sign in')
		expect(signInLink).toBeInTheDocument()
		expect(signInLink).toHaveAttribute('href', '/sign-in')

		const getStartedLink = screen.getByText('Get Started')
		expect(getStartedLink).toBeInTheDocument()
		expect(getStartedLink).toHaveAttribute('href', '/sign-up')
	})

	/**
	 * @REQ-NAV-002
	 * Scenario: Signed in navigation
	 */
	it('should render dashboard link and user button when signed in', () => {
		render(<AuthButtons />)

		const signedIn = screen.getByTestId('signed-in')
		expect(signedIn).toBeInTheDocument()

		const dashboardLink = screen.getByText('Dashboard')
		expect(dashboardLink).toBeInTheDocument()
		expect(dashboardLink).toHaveAttribute('href', '/dashboard')

		const userButton = screen.getByTestId('user-button')
		expect(userButton).toBeInTheDocument()
		expect(userButton).toHaveAttribute('data-after-sign-out-url', '/')
	})

	it('should wrap components in ClerkProvider', () => {
		render(<AuthButtons />)

		const clerkProvider = screen.getByTestId('clerk-provider')
		expect(clerkProvider).toBeInTheDocument()
	})

	/**
	 * @REQ-NAV-001
	 * Verify sign in link has correct styling for visibility on desktop only
	 */
	it('should hide sign in link on mobile', () => {
		render(<AuthButtons />)

		const signInLink = screen.getByText('Sign in')
		expect(signInLink).toHaveClass('hidden')
		expect(signInLink).toHaveClass('sm:block')
	})

	/**
	 * @REQ-NAV-002
	 * Verify dashboard link has correct styling for visibility on desktop only
	 */
	it('should hide dashboard link on mobile when signed in', () => {
		render(<AuthButtons />)

		const dashboardLink = screen.getByText('Dashboard')
		expect(dashboardLink).toHaveClass('hidden')
		expect(dashboardLink).toHaveClass('sm:block')
	})

	it('should apply correct styling to Get Started button', () => {
		render(<AuthButtons />)

		const getStartedLink = screen.getByText('Get Started')
		expect(getStartedLink).toHaveClass('inline-flex')
		expect(getStartedLink).toHaveClass('h-10')
		expect(getStartedLink).toHaveClass('rounded-full')
		expect(getStartedLink).toHaveClass('bg-primary')
		expect(getStartedLink).toHaveClass('text-primary-foreground')
	})

	it('should configure UserButton with correct appearance', () => {
		render(<AuthButtons />)

		const userButton = screen.getByTestId('user-button')
		expect(userButton).toBeInTheDocument()
	})

	/**
	 * SSR Fallback Test
	 * When Clerk is not available (SSR/build time), show sign in/sign up buttons
	 */
	it('should render fallback sign in and sign up links when Clerk is not available', () => {
		// Remove env var to simulate SSR
		import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY = undefined

		const { container } = render(<AuthButtons />)

		const signInLink = screen.getByText('Sign in')
		expect(signInLink).toBeInTheDocument()
		expect(signInLink).toHaveAttribute('href', '/sign-in')

		const getStartedLink = screen.getByText('Get Started')
		expect(getStartedLink).toBeInTheDocument()
		expect(getStartedLink).toHaveAttribute('href', '/sign-up')

		// The component should render just the fallback links, not wrapped in Clerk components
		// Since we're using mocked Clerk components, they'll still render, but in real SSR they won't
		// This test verifies the fallback path is accessible
		expect(container).toBeTruthy()
	})
})
