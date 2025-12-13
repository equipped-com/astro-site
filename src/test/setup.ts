/**
 * Vitest setup file
 *
 * This file runs before each test file and sets up global test utilities.
 * Centralizes mocking for Clerk authentication across all tests.
 */
import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'

// Mock console methods to reduce noise in test output
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// Restore console in afterEach if needed for debugging
beforeEach(() => {
	vi.clearAllMocks()
})

// ============================================
// CLERK MOCKING - Centralized for all tests
// ============================================

/**
 * Mock @clerk/clerk-react for React component tests
 * Provides default authenticated state that can be overridden per-test
 */
vi.mock('@clerk/clerk-react', () => ({
	useUser: vi.fn(() => ({
		user: {
			id: 'user_test_default',
			emailAddresses: [{ emailAddress: 'test@example.com' }],
			firstName: 'Test',
			lastName: 'User',
		},
		isSignedIn: true,
		isLoaded: true,
	})),
	useSession: vi.fn(() => ({
		session: {
			id: 'session_test_default',
			status: 'active',
		},
		isLoaded: true,
	})),
	useAuth: vi.fn(() => ({
		userId: 'user_test_default',
		sessionId: 'session_test_default',
		isSignedIn: true,
		isLoaded: true,
	})),
	SignedIn: ({ children }: { children: ReactNode }) => children,
	SignedOut: ({ children }: { children: ReactNode }) => null,
	UserButton: () => null,
	ClerkProvider: ({ children }: { children: ReactNode }) => children,
	RedirectToSignIn: () => null,
	useClerk: vi.fn(() => ({
		signOut: vi.fn(),
		openSignIn: vi.fn(),
		openSignUp: vi.fn(),
	})),
}))

/**
 * Mock @hono/clerk-auth for API route tests
 * Provides authenticated context for Hono middleware tests
 */
vi.mock('@hono/clerk-auth', () => ({
	clerkMiddleware: () => (c: any, next: any) => next(),
	getAuth: vi.fn(() => ({
		userId: 'user_test_default',
		sessionId: 'session_test_default',
	})),
}))
