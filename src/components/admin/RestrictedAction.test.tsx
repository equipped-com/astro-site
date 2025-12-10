/**
 * RestrictedAction Component Tests
 *
 * @REQ-SA-010 Restricted actions while impersonating
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RestrictedAction, useRestrictedAction } from './RestrictedAction'

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

// Mock alert
global.alert = vi.fn()

beforeEach(() => {
	vi.clearAllMocks()
	mockLocalStorage.clear()
	Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })
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
			mockStorage.equipped_impersonation_session = JSON.stringify(mockSession)
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
		it('should disable restricted actions', () => {
			render(
				<RestrictedAction action="delete_account">
					<button type="button">Delete Account</button>
				</RestrictedAction>,
			)

			const wrapper = screen.getByText('Delete Account').closest('div')
			expect(wrapper).toHaveClass('pointer-events-none')
			expect(wrapper).toHaveClass('opacity-50')
		})

		it('should show restriction message for restricted actions', () => {
			render(
				<RestrictedAction action="delete_account" showMessage={true}>
					<button type="button">Delete Account</button>
				</RestrictedAction>,
			)

			expect(screen.getByText(/Action restricted in admin mode/)).toBeInTheDocument()
		})

		it('should allow non-restricted actions', () => {
			render(
				<RestrictedAction action="view_devices">
					<button type="button">View Devices</button>
				</RestrictedAction>,
			)

			const button = screen.getByText('View Devices')
			expect(button.closest('div')).not.toHaveClass('pointer-events-none')
		})
	})

	describe('custom render prop', () => {
		beforeEach(() => {
			mockStorage.equipped_impersonation_session = JSON.stringify(mockSession)
		})

		it('should support custom render function', () => {
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

			const button = screen.getByText('Restricted')
			expect(button).toBeDisabled()
			expect(button).toHaveAttribute('title', expect.stringContaining('Action restricted'))
		})

		it('should pass isRestricted=false for allowed actions', () => {
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

			const button = screen.getByText('View Devices')
			expect(button).not.toBeDisabled()
		})
	})

	describe('showMessage prop', () => {
		beforeEach(() => {
			mockStorage.equipped_impersonation_session = JSON.stringify(mockSession)
		})

		it('should show message when showMessage=true (default)', () => {
			render(
				<RestrictedAction action="delete_account">
					<button type="button">Delete</button>
				</RestrictedAction>,
			)

			expect(screen.getByRole('alert')).toBeInTheDocument()
		})

		it('should hide message when showMessage=false', () => {
			render(
				<RestrictedAction action="delete_account" showMessage={false}>
					<button type="button">Delete</button>
				</RestrictedAction>,
			)

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
