/**
 * Impersonation Banner Component Tests
 *
 * @REQ-SA-007 Admin mode banner with customer name, exit button, and audit warning
 * @REQ-SA-009 Exit impersonation
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ImpersonationBanner from './ImpersonationBanner'

// Mock fetch
global.fetch = vi.fn()

// Mock localStorage
const mockStorage: Record<string, string> = {}
const mockLocalStorage = {
	getItem: vi.fn((key: string) => mockStorage[key] || null),
	setItem: vi.fn((key: string, value: string) => {
		mockStorage[key] = value
	}),
	removeItem: vi.fn((key: string) => {
		delete mockStorage[key]
	}),
	clear: vi.fn(() => {
		for (const key of Object.keys(mockStorage)) {
			delete mockStorage[key]
		}
	}),
}

// Store original location
const originalLocation = window.location

beforeEach(() => {
	vi.clearAllMocks()
	mockLocalStorage.clear()
	Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

	// Mock window.location
	Object.defineProperty(window, 'location', {
		value: { href: '' },
		writable: true,
	})
})

afterEach(() => {
	Object.defineProperty(window, 'location', {
		value: originalLocation,
		writable: true,
	})
})

const mockSession = {
	adminUserId: 'user_admin123',
	adminEmail: 'admin@tryequipped.com',
	adminName: 'John Admin',
	accountId: 'acc_customer456',
	accountName: 'Acme Corp',
	accountShortName: 'acme',
	startedAt: new Date().toISOString(),
}

describe('ImpersonationBanner Component', () => {
	describe('when not impersonating', () => {
		it('should not render anything', () => {
			const { container } = render(<ImpersonationBanner />)

			expect(container.firstChild).toBeNull()
		})
	})

	describe('when impersonating', () => {
		beforeEach(() => {
			mockStorage.equipped_impersonation_session = JSON.stringify(mockSession)
		})

		/**
		 * @REQ-SA-007
		 * Scenario: Admin mode banner
		 *   When I am impersonating a customer
		 *   Then I should see persistent banner with:
		 *     | Element |
		 *     | "Viewing as: Acme Corp" |
		 */
		it('should display the impersonation banner', () => {
			render(<ImpersonationBanner />)

			expect(screen.getByTestId('impersonation-banner')).toBeInTheDocument()
		})

		it('should show "Admin Mode" label', () => {
			render(<ImpersonationBanner />)

			expect(screen.getByText('Admin Mode')).toBeInTheDocument()
		})

		it('should display the customer name', () => {
			render(<ImpersonationBanner />)

			expect(screen.getByText('Acme Corp')).toBeInTheDocument()
			expect(screen.getByText(/Viewing as:/)).toBeInTheDocument()
		})

		/**
		 * @REQ-SA-007
		 * Scenario: Admin mode banner
		 *   Then I should see persistent banner with:
		 *     | Warning about audit logging |
		 */
		it('should show audit warning', () => {
			render(<ImpersonationBanner />)

			// Text appears twice (desktop and mobile versions)
			expect(screen.getAllByText('All actions are logged for audit purposes')).toHaveLength(2)
		})

		/**
		 * @REQ-SA-007
		 * Scenario: Admin mode banner
		 *   Then I should see persistent banner with:
		 *     | "Exit" button |
		 */
		it('should show exit button', () => {
			render(<ImpersonationBanner />)

			expect(screen.getByTestId('exit-impersonation-button')).toBeInTheDocument()
			expect(screen.getByText('Exit Impersonation')).toBeInTheDocument()
		})

		it('should have proper accessibility attributes', () => {
			render(<ImpersonationBanner />)

			const banner = screen.getByTestId('impersonation-banner')
			expect(banner).toHaveAttribute('role', 'alert')
			expect(banner).toHaveAttribute('aria-live', 'polite')
		})
	})

	describe('exit impersonation', () => {
		beforeEach(() => {
			mockStorage.equipped_impersonation_session = JSON.stringify(mockSession)
			;(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({ success: true }),
			})
		})

		/**
		 * @REQ-SA-009
		 * Scenario: Exit impersonation
		 *   When I click "Exit" in admin banner
		 *   Then I should return to admin dashboard
		 */
		it('should call API to end impersonation on exit', async () => {
			render(<ImpersonationBanner />)

			const exitButton = screen.getByTestId('exit-impersonation-button')
			fireEvent.click(exitButton)

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith('/api/admin/impersonation/end', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ accountId: mockSession.accountId }),
				})
			})
		})

		it('should clear localStorage on exit', async () => {
			render(<ImpersonationBanner />)

			const exitButton = screen.getByTestId('exit-impersonation-button')
			fireEvent.click(exitButton)

			await waitFor(() => {
				expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('equipped_impersonation_session')
			})
		})

		it('should redirect to admin dashboard on exit', async () => {
			render(<ImpersonationBanner />)

			const exitButton = screen.getByTestId('exit-impersonation-button')
			fireEvent.click(exitButton)

			await waitFor(() => {
				expect(window.location.href).toBe('/admin')
			})
		})

		it('should call onExit callback if provided', async () => {
			const onExit = vi.fn()
			render(<ImpersonationBanner onExit={onExit} />)

			const exitButton = screen.getByTestId('exit-impersonation-button')
			fireEvent.click(exitButton)

			await waitFor(() => {
				expect(onExit).toHaveBeenCalled()
			})
		})

		it('should still clear session even if API call fails', async () => {
			;(global.fetch as any).mockRejectedValue(new Error('Network error'))

			render(<ImpersonationBanner />)

			const exitButton = screen.getByTestId('exit-impersonation-button')
			fireEvent.click(exitButton)

			await waitFor(() => {
				expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('equipped_impersonation_session')
			})
		})
	})

	describe('session duration', () => {
		it('should display session duration', () => {
			// Set session started 30 minutes ago
			const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
			mockStorage.equipped_impersonation_session = JSON.stringify({
				...mockSession,
				startedAt: thirtyMinutesAgo,
			})

			render(<ImpersonationBanner />)

			expect(screen.getByText(/Duration:/)).toBeInTheDocument()
			expect(screen.getByText(/30m/)).toBeInTheDocument()
		})
	})
})
