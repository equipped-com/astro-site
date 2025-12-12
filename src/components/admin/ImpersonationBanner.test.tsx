/**
 * Impersonation Banner Component Tests
 *
 * @REQ-SA-007 Admin mode banner with customer name, exit button, and audit warning
 * @REQ-SA-009 Exit impersonation
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as impersonationLib from '@/lib/impersonation'
import ImpersonationBanner from './ImpersonationBanner'

// Mock fetch
global.fetch = vi.fn()

// Mock the impersonation library
vi.mock('@/lib/impersonation', async importOriginal => {
	const original = await importOriginal<typeof impersonationLib>()
	return {
		...original,
		getImpersonationSession: vi.fn(() => null),
		endImpersonationSession: vi.fn(),
		getAdminDashboardUrl: vi.fn(() => '/admin'),
		formatSessionDuration: vi.fn(() => '30m'),
	}
})

// Store original location
const originalLocation = window.location

beforeEach(() => {
	vi.clearAllMocks()

	// Reset the mock to default behavior (return null)
	vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(null)

	// Mock window.location
	Object.defineProperty(window, 'location', {
		value: { href: '' },
		writable: true,
		configurable: true,
	})
})

afterEach(() => {
	Object.defineProperty(window, 'location', {
		value: originalLocation,
		writable: true,
		configurable: true,
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
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(mockSession)
		})

		/**
		 * @REQ-SA-007
		 * Scenario: Admin mode banner
		 *   When I am impersonating a customer
		 *   Then I should see persistent banner with:
		 *     | Element |
		 *     | "Viewing as: Acme Corp" |
		 */
		it('should display the impersonation banner', async () => {
			render(<ImpersonationBanner />)

			await waitFor(() => {
				expect(screen.getByTestId('impersonation-banner')).toBeInTheDocument()
			})
		})

		it('should show "Admin Mode" label', async () => {
			render(<ImpersonationBanner />)

			await waitFor(() => {
				expect(screen.getByText('Admin Mode')).toBeInTheDocument()
			})
		})

		it('should display the customer name', async () => {
			render(<ImpersonationBanner />)

			await waitFor(() => {
				expect(screen.getByText('Acme Corp')).toBeInTheDocument()
			})
			expect(screen.getByText(/Viewing as:/)).toBeInTheDocument()
		})

		/**
		 * @REQ-SA-007
		 * Scenario: Admin mode banner
		 *   Then I should see persistent banner with:
		 *     | Warning about audit logging |
		 */
		it('should show audit warning', async () => {
			render(<ImpersonationBanner />)

			await waitFor(() => {
				// Text appears twice (desktop and mobile versions)
				expect(screen.getAllByText('All actions are logged for audit purposes')).toHaveLength(2)
			})
		})

		/**
		 * @REQ-SA-007
		 * Scenario: Admin mode banner
		 *   Then I should see persistent banner with:
		 *     | "Exit" button |
		 */
		it('should show exit button', async () => {
			render(<ImpersonationBanner />)

			await waitFor(() => {
				expect(screen.getByTestId('exit-impersonation-button')).toBeInTheDocument()
			})
			expect(screen.getByText('Exit Impersonation')).toBeInTheDocument()
		})

		it('should have proper accessibility attributes', async () => {
			render(<ImpersonationBanner />)

			await waitFor(() => {
				const banner = screen.getByTestId('impersonation-banner')
				expect(banner).toHaveAttribute('role', 'alert')
				expect(banner).toHaveAttribute('aria-live', 'polite')
			})
		})
	})

	describe('exit impersonation', () => {
		beforeEach(() => {
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(mockSession)
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

			await waitFor(() => {
				expect(screen.getByTestId('exit-impersonation-button')).toBeInTheDocument()
			})

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

			await waitFor(() => {
				expect(screen.getByTestId('exit-impersonation-button')).toBeInTheDocument()
			})

			const exitButton = screen.getByTestId('exit-impersonation-button')
			fireEvent.click(exitButton)

			await waitFor(() => {
				expect(impersonationLib.endImpersonationSession).toHaveBeenCalled()
			})
		})

		it('should redirect to admin dashboard on exit', async () => {
			render(<ImpersonationBanner />)

			await waitFor(() => {
				expect(screen.getByTestId('exit-impersonation-button')).toBeInTheDocument()
			})

			const exitButton = screen.getByTestId('exit-impersonation-button')
			fireEvent.click(exitButton)

			await waitFor(() => {
				expect(window.location.href).toBe('/admin')
			})
		})

		it('should call onExit callback if provided', async () => {
			const onExit = vi.fn()
			render(<ImpersonationBanner onExit={onExit} />)

			await waitFor(() => {
				expect(screen.getByTestId('exit-impersonation-button')).toBeInTheDocument()
			})

			const exitButton = screen.getByTestId('exit-impersonation-button')
			fireEvent.click(exitButton)

			await waitFor(() => {
				expect(onExit).toHaveBeenCalled()
			})
		})

		it('should still clear session even if API call fails', async () => {
			;(global.fetch as any).mockRejectedValue(new Error('Network error'))

			render(<ImpersonationBanner />)

			await waitFor(() => {
				expect(screen.getByTestId('exit-impersonation-button')).toBeInTheDocument()
			})

			const exitButton = screen.getByTestId('exit-impersonation-button')
			fireEvent.click(exitButton)

			await waitFor(() => {
				expect(impersonationLib.endImpersonationSession).toHaveBeenCalled()
			})
		})
	})

	describe('session duration', () => {
		it('should display session duration', async () => {
			// Set session started 30 minutes ago
			const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue({
				...mockSession,
				startedAt: thirtyMinutesAgo,
			})
			vi.mocked(impersonationLib.formatSessionDuration).mockReturnValue('30m')

			render(<ImpersonationBanner />)

			await waitFor(() => {
				expect(screen.getByText(/Duration:/)).toBeInTheDocument()
			})
			expect(screen.getByText(/30m/)).toBeInTheDocument()
		})
	})
})
