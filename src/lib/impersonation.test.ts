/**
 * Impersonation Library Tests
 *
 * @REQ-SA-006 Enter impersonation mode
 * @REQ-SA-007 Admin mode banner
 * @REQ-SA-009 Exit impersonation
 * @REQ-SA-010 Restricted actions
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	endImpersonationSession,
	formatSessionDuration,
	getAdminDashboardUrl,
	getImpersonationSession,
	getImpersonationUrl,
	isActionRestricted,
	isImpersonating,
	RESTRICTED_ACTION_NAMES,
	RESTRICTED_ACTIONS,
	startImpersonationSession,
	type ImpersonationSession,
} from './impersonation'

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
		Object.keys(mockStorage).forEach(key => delete mockStorage[key])
	}),
}

// Mock window
const mockDispatchEvent = vi.fn()

beforeEach(() => {
	vi.stubGlobal('localStorage', mockLocalStorage)
	vi.stubGlobal('window', {
		localStorage: mockLocalStorage,
		dispatchEvent: mockDispatchEvent,
	})
	mockLocalStorage.clear()
	mockDispatchEvent.mockClear()
})

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('Impersonation Library', () => {
	const mockSession: ImpersonationSession = {
		adminUserId: 'user_admin123',
		adminEmail: 'admin@tryequipped.com',
		adminName: 'John Admin',
		accountId: 'acc_customer456',
		accountName: 'Acme Corp',
		accountShortName: 'acme',
		startedAt: '2024-01-15T10:30:00Z',
	}

	describe('getImpersonationSession()', () => {
		/**
		 * @REQ-SA-007
		 * Scenario: Admin mode banner
		 *   When I am impersonating a customer
		 *   Then I should be able to get the session details
		 */
		it('should return null when no session exists', () => {
			const session = getImpersonationSession()
			expect(session).toBeNull()
		})

		it('should return session when it exists', () => {
			mockStorage['equipped_impersonation_session'] = JSON.stringify(mockSession)

			const session = getImpersonationSession()

			expect(session).toEqual(mockSession)
		})

		it('should return null for invalid JSON', () => {
			mockStorage['equipped_impersonation_session'] = 'invalid json'

			const session = getImpersonationSession()

			expect(session).toBeNull()
		})

		it('should return null for session without required fields', () => {
			mockStorage['equipped_impersonation_session'] = JSON.stringify({
				adminEmail: 'admin@test.com',
				// Missing adminUserId and accountId
			})

			const session = getImpersonationSession()

			expect(session).toBeNull()
		})
	})

	describe('startImpersonationSession()', () => {
		/**
		 * @REQ-SA-006
		 * Scenario: Enter impersonation mode
		 *   When I click "View as Customer"
		 *   Then session should be stored
		 */
		it('should store session in localStorage', () => {
			startImpersonationSession(mockSession)

			expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
				'equipped_impersonation_session',
				JSON.stringify(mockSession),
			)
		})

		it('should dispatch custom event', () => {
			startImpersonationSession(mockSession)

			expect(mockDispatchEvent).toHaveBeenCalled()
			const event = mockDispatchEvent.mock.calls[0][0]
			expect(event.type).toBe('impersonation-started')
			expect(event.detail).toEqual(mockSession)
		})
	})

	describe('endImpersonationSession()', () => {
		/**
		 * @REQ-SA-009
		 * Scenario: Exit impersonation
		 *   When I click "Exit" in admin banner
		 *   Then customer session should be cleared
		 */
		it('should remove session from localStorage', () => {
			mockStorage['equipped_impersonation_session'] = JSON.stringify(mockSession)

			endImpersonationSession()

			expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('equipped_impersonation_session')
		})

		it('should dispatch custom event with previous session', () => {
			mockStorage['equipped_impersonation_session'] = JSON.stringify(mockSession)

			endImpersonationSession()

			expect(mockDispatchEvent).toHaveBeenCalled()
			const event = mockDispatchEvent.mock.calls[0][0]
			expect(event.type).toBe('impersonation-ended')
			expect(event.detail).toEqual(mockSession)
		})
	})

	describe('isImpersonating()', () => {
		it('should return false when no session exists', () => {
			expect(isImpersonating()).toBe(false)
		})

		it('should return true when session exists', () => {
			mockStorage['equipped_impersonation_session'] = JSON.stringify(mockSession)

			expect(isImpersonating()).toBe(true)
		})
	})

	describe('isActionRestricted()', () => {
		/**
		 * @REQ-SA-010
		 * Scenario: Restricted actions while impersonating
		 *   Then I should NOT be able to:
		 *     | Action                |
		 *     | Delete the account    |
		 *     | Change billing/payment|
		 *     | Remove the owner      |
		 */
		it('should return true for delete_account', () => {
			expect(isActionRestricted('delete_account')).toBe(true)
		})

		it('should return true for change_billing', () => {
			expect(isActionRestricted('change_billing')).toBe(true)
		})

		it('should return true for change_payment_method', () => {
			expect(isActionRestricted('change_payment_method')).toBe(true)
		})

		it('should return true for remove_owner', () => {
			expect(isActionRestricted('remove_owner')).toBe(true)
		})

		it('should return true for transfer_ownership', () => {
			expect(isActionRestricted('transfer_ownership')).toBe(true)
		})

		it('should return true for delete_all_devices', () => {
			expect(isActionRestricted('delete_all_devices')).toBe(true)
		})

		it('should return false for non-restricted actions', () => {
			expect(isActionRestricted('view_devices')).toBe(false)
			expect(isActionRestricted('add_device')).toBe(false)
			expect(isActionRestricted('edit_profile')).toBe(false)
		})
	})

	describe('RESTRICTED_ACTIONS', () => {
		it('should have all expected restricted actions', () => {
			expect(RESTRICTED_ACTIONS).toContain('delete_account')
			expect(RESTRICTED_ACTIONS).toContain('change_billing')
			expect(RESTRICTED_ACTIONS).toContain('change_payment_method')
			expect(RESTRICTED_ACTIONS).toContain('remove_owner')
			expect(RESTRICTED_ACTIONS).toContain('transfer_ownership')
			expect(RESTRICTED_ACTIONS).toContain('delete_all_devices')
		})
	})

	describe('RESTRICTED_ACTION_NAMES', () => {
		it('should have human-readable names for all restricted actions', () => {
			for (const action of RESTRICTED_ACTIONS) {
				expect(RESTRICTED_ACTION_NAMES[action]).toBeDefined()
				expect(typeof RESTRICTED_ACTION_NAMES[action]).toBe('string')
			}
		})
	})

	describe('getImpersonationUrl()', () => {
		/**
		 * @REQ-SA-006
		 * Scenario: Enter impersonation mode
		 *   Then URL should indicate impersonation mode
		 */
		it('should return correct impersonation URL', () => {
			const url = getImpersonationUrl('acme')

			expect(url).toBe('https://acme.tryequipped.com/dashboard?impersonate=true')
		})

		it('should handle different account short names', () => {
			expect(getImpersonationUrl('techcorp')).toBe('https://techcorp.tryequipped.com/dashboard?impersonate=true')
			expect(getImpersonationUrl('startup-xyz')).toBe(
				'https://startup-xyz.tryequipped.com/dashboard?impersonate=true',
			)
		})
	})

	describe('getAdminDashboardUrl()', () => {
		/**
		 * @REQ-SA-009
		 * Scenario: Exit impersonation
		 *   Then I should return to admin dashboard
		 */
		it('should return admin dashboard URL', () => {
			const url = getAdminDashboardUrl()

			expect(url).toBe('/admin')
		})
	})

	describe('formatSessionDuration()', () => {
		it('should format duration in minutes when under an hour', () => {
			const now = new Date()
			const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString()

			const duration = formatSessionDuration(thirtyMinutesAgo)

			expect(duration).toBe('30m')
		})

		it('should format duration in hours and minutes when over an hour', () => {
			const now = new Date()
			const ninetyMinutesAgo = new Date(now.getTime() - 90 * 60 * 1000).toISOString()

			const duration = formatSessionDuration(ninetyMinutesAgo)

			expect(duration).toBe('1h 30m')
		})

		it('should handle just started sessions', () => {
			const now = new Date().toISOString()

			const duration = formatSessionDuration(now)

			expect(duration).toBe('0m')
		})
	})
})
