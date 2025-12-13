/**
 * RestrictedAction Component Tests
 *
 * @REQ-SA-010 Restricted actions while impersonating
 */
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as impersonationLib from '@/lib/impersonation'
import { RestrictedAction, useRestrictedAction } from './RestrictedAction'

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
	}
})

// Mock alert
global.alert = vi.fn()

beforeEach(() => {
	vi.clearAllMocks()
	// Reset the mock to default behavior (return null)
	vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(null)
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

describe('RestrictedAction Component', () => {
	describe('when not impersonating', () => {
		it('should render children normally', () => {
			render(
				<RestrictedAction action="delete_account">
					<button type="button">Delete Account</button>
				</RestrictedAction>,
			)

			const button = screen.getByText('Delete Account')
			expect(button).toBeInTheDocument()
			expect(button).not.toHaveAttribute('aria-disabled')
		})

		it('should not show restriction message', () => {
			render(
				<RestrictedAction action="delete_account">
					<button type="button">Delete Account</button>
				</RestrictedAction>,
			)

			expect(screen.queryByText(/Action restricted/)).not.toBeInTheDocument()
		})
	})

	describe('when impersonating', () => {
		beforeEach(() => {
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(mockSession)
		})

		/**
		 * @REQ-SA-010
		 * Scenario: Restricted actions while impersonating
		 *   Then I should NOT be able to:
		 *     | Delete the account |
		 *     | Change billing/payment |
		 *     | Remove the owner |
		 *   And these should show "Action restricted in admin mode"
		 */
		it('should disable restricted actions', async () => {
			render(
				<RestrictedAction action="delete_account">
					<button type="button">Delete Account</button>
				</RestrictedAction>,
			)

			await waitFor(() => {
				const wrapper = screen.getByText('Delete Account').closest('div')
				expect(wrapper).toHaveClass('pointer-events-none')
				expect(wrapper).toHaveClass('opacity-50')
			})
		})

		it('should show restriction message for restricted actions', async () => {
			render(
				<RestrictedAction action="delete_account" showMessage={true}>
					<button type="button">Delete Account</button>
				</RestrictedAction>,
			)

			await waitFor(() => {
				expect(screen.getByText(/Action restricted in admin mode/)).toBeInTheDocument()
			})
		})

		it('should allow non-restricted actions', async () => {
			render(
				<RestrictedAction action="view_devices">
					<button type="button">View Devices</button>
				</RestrictedAction>,
			)

			await waitFor(() => {
				const button = screen.getByText('View Devices')
				// Non-restricted actions should be rendered directly without wrapper
				expect(button.closest('div.pointer-events-none')).toBeNull()
			})
		})
	})

	describe('custom render prop', () => {
		beforeEach(() => {
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(mockSession)
		})

		it('should support custom render function', async () => {
			render(
				<RestrictedAction
					action="change_billing"
					render={(isRestricted, message) => (
						<button type="button" disabled={isRestricted} title={message || undefined}>
							{isRestricted ? 'Restricted' : 'Change Payment'}
						</button>
					)}
				/>,
			)

			await waitFor(() => {
				const button = screen.getByText('Restricted')
				expect(button).toBeDisabled()
				expect(button).toHaveAttribute('title', expect.stringContaining('Action restricted'))
			})
		})

		it('should pass isRestricted=false for allowed actions', async () => {
			render(
				<RestrictedAction
					action="view_devices"
					render={(isRestricted, _message) => (
						<button type="button" disabled={isRestricted}>
							{isRestricted ? 'Restricted' : 'View Devices'}
						</button>
					)}
				/>,
			)

			await waitFor(() => {
				const button = screen.getByText('View Devices')
				expect(button).not.toBeDisabled()
			})
		})
	})

	describe('showMessage prop', () => {
		beforeEach(() => {
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(mockSession)
		})

		it('should show message when showMessage=true (default)', async () => {
			render(
				<RestrictedAction action="delete_account">
					<button type="button">Delete</button>
				</RestrictedAction>,
			)

			await waitFor(() => {
				expect(screen.getByRole('alert')).toBeInTheDocument()
			})
		})

		it('should hide message when showMessage=false', async () => {
			render(
				<RestrictedAction action="delete_account" showMessage={false}>
					<button type="button">Delete</button>
				</RestrictedAction>,
			)

			await waitFor(() => {
				// Wait for session to be loaded (indicated by the disabled class)
				const wrapper = screen.getByText('Delete').closest('div')
				expect(wrapper).toHaveClass('pointer-events-none')
			})

			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		})
	})
})

describe('useRestrictedAction Hook', () => {
	beforeEach(() => {
		;(global.fetch as any).mockResolvedValue({
			ok: true,
			json: async () => ({ success: true }),
		})
	})

	// Note: This hook is tightly coupled with useImpersonation
	// More comprehensive tests would require a test component wrapper
	it('should export the hook function', () => {
		expect(useRestrictedAction).toBeDefined()
		expect(typeof useRestrictedAction).toBe('function')
	})
})
