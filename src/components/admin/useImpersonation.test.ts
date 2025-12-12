/**
 * useImpersonation Hook Tests
 *
 * @REQ-SA-007 Admin mode banner detection
 * @REQ-SA-010 Restricted actions while impersonating
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as impersonationLib from '@/lib/impersonation'
import { useImpersonation } from './useImpersonation'

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

	// Mock addEventListener and removeEventListener
	vi.spyOn(window, 'addEventListener')
	vi.spyOn(window, 'removeEventListener')
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

describe('useImpersonation Hook', () => {
	describe('initial state', () => {
		it('should return isImpersonating=false when no session exists', () => {
			const { result } = renderHook(() => useImpersonation())

			expect(result.current.isImpersonating).toBe(false)
			expect(result.current.session).toBeNull()
		})

		it('should return isImpersonating=true when session exists', async () => {
			// Mock the lib function to return a session
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(mockSession)

			const { result } = renderHook(() => useImpersonation())

			// Wait for useEffect to load session from localStorage
			await waitFor(() => {
				expect(result.current.isImpersonating).toBe(true)
			})
			expect(result.current.session).toEqual(mockSession)
		})
	})

	describe('checkRestricted()', () => {
		/**
		 * @REQ-SA-010
		 * Scenario: Restricted actions while impersonating
		 */
		it('should return false when not impersonating', () => {
			const { result } = renderHook(() => useImpersonation())

			expect(result.current.checkRestricted('delete_account')).toBe(false)
		})

		it('should return true for restricted actions when impersonating', async () => {
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(mockSession)

			const { result } = renderHook(() => useImpersonation())

			// Wait for useEffect to load session from localStorage
			await waitFor(() => {
				expect(result.current.isImpersonating).toBe(true)
			})

			expect(result.current.checkRestricted('delete_account')).toBe(true)
			expect(result.current.checkRestricted('change_billing')).toBe(true)
			expect(result.current.checkRestricted('remove_owner')).toBe(true)
		})

		it('should return false for allowed actions when impersonating', async () => {
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(mockSession)

			const { result } = renderHook(() => useImpersonation())

			// Wait for session to load
			await waitFor(() => {
				expect(result.current.isImpersonating).toBe(true)
			})

			expect(result.current.checkRestricted('view_devices')).toBe(false)
			expect(result.current.checkRestricted('add_device')).toBe(false)
		})
	})

	describe('getRestrictionMessage()', () => {
		it('should return null when not impersonating', () => {
			const { result } = renderHook(() => useImpersonation())

			expect(result.current.getRestrictionMessage('delete_account')).toBeNull()
		})

		it('should return message for restricted actions when impersonating', async () => {
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(mockSession)

			const { result } = renderHook(() => useImpersonation())

			// Wait for useEffect to load session from localStorage
			await waitFor(() => {
				expect(result.current.isImpersonating).toBe(true)
			})

			const message = result.current.getRestrictionMessage('delete_account')
			expect(message).toContain('Action restricted in admin mode')
			expect(message).toContain('Delete the account')
		})

		it('should return null for allowed actions when impersonating', async () => {
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(mockSession)

			const { result } = renderHook(() => useImpersonation())

			// Wait for session to load
			await waitFor(() => {
				expect(result.current.isImpersonating).toBe(true)
			})

			expect(result.current.getRestrictionMessage('view_devices')).toBeNull()
		})
	})

	describe('exitImpersonation()', () => {
		beforeEach(() => {
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(mockSession)
			;(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({ success: true }),
			})
		})

		it('should call API to end impersonation', async () => {
			const { result } = renderHook(() => useImpersonation())

			// Wait for useEffect to load session from localStorage
			await waitFor(() => {
				expect(result.current.isImpersonating).toBe(true)
			})

			await act(async () => {
				await result.current.exitImpersonation()
			})

			expect(global.fetch).toHaveBeenCalledWith('/api/admin/impersonation/end', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ accountId: mockSession.accountId }),
			})
		})

		it('should clear localStorage', async () => {
			const { result } = renderHook(() => useImpersonation())

			// Wait for useEffect to load session from localStorage
			await waitFor(() => {
				expect(result.current.isImpersonating).toBe(true)
			})

			await act(async () => {
				await result.current.exitImpersonation()
			})

			expect(impersonationLib.endImpersonationSession).toHaveBeenCalled()
		})

		it('should redirect to admin dashboard', async () => {
			const { result } = renderHook(() => useImpersonation())

			// Wait for useEffect to load session from localStorage
			await waitFor(() => {
				expect(result.current.isImpersonating).toBe(true)
			})

			await act(async () => {
				await result.current.exitImpersonation()
			})

			expect(window.location.href).toBe('/admin')
		})

		it('should do nothing when not impersonating', async () => {
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(null)

			const { result } = renderHook(() => useImpersonation())

			await act(async () => {
				await result.current.exitImpersonation()
			})

			expect(global.fetch).not.toHaveBeenCalled()
		})
	})

	describe('logAction()', () => {
		beforeEach(() => {
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(mockSession)
			;(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({ success: true }),
			})
		})

		it('should call API to log action', async () => {
			const { result } = renderHook(() => useImpersonation())

			// Wait for useEffect to load session from localStorage
			await waitFor(() => {
				expect(result.current.isImpersonating).toBe(true)
			})

			await act(async () => {
				await result.current.logAction('view_devices', { count: 10 })
			})

			expect(global.fetch).toHaveBeenCalledWith('/api/admin/impersonation/log', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					accountId: mockSession.accountId,
					action: 'view_devices',
					details: { count: 10 },
				}),
			})
		})

		it('should do nothing when not impersonating', async () => {
			vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(null)

			const { result } = renderHook(() => useImpersonation())

			await act(async () => {
				await result.current.logAction('view_devices')
			})

			expect(global.fetch).not.toHaveBeenCalled()
		})
	})

	describe('event listeners', () => {
		it('should set up event listeners on mount', () => {
			renderHook(() => useImpersonation())

			expect(window.addEventListener).toHaveBeenCalledWith('impersonation-started', expect.any(Function))
			expect(window.addEventListener).toHaveBeenCalledWith('impersonation-ended', expect.any(Function))
			expect(window.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
		})

		it('should clean up event listeners on unmount', () => {
			const { unmount } = renderHook(() => useImpersonation())

			unmount()

			expect(window.removeEventListener).toHaveBeenCalledWith('impersonation-started', expect.any(Function))
			expect(window.removeEventListener).toHaveBeenCalledWith('impersonation-ended', expect.any(Function))
			expect(window.removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
		})
	})
})
