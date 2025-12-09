/**
 * Impersonation Hook
 *
 * React hook for managing impersonation state and checking restricted actions.
 *
 * @REQ-SA-007 Admin mode banner detection
 * @REQ-SA-010 Restricted actions while impersonating
 */
import { useCallback, useEffect, useState } from 'react'
import {
	endImpersonationSession,
	getAdminDashboardUrl,
	getImpersonationSession,
	isActionRestricted,
	RESTRICTED_ACTION_NAMES,
	type ImpersonationSession,
	type RestrictedAction,
} from '@/lib/impersonation'

interface UseImpersonationResult {
	/**
	 * Whether currently in impersonation mode
	 */
	isImpersonating: boolean

	/**
	 * Current impersonation session details
	 */
	session: ImpersonationSession | null

	/**
	 * Check if an action is restricted during impersonation
	 */
	checkRestricted: (action: string) => boolean

	/**
	 * Get the restriction message for an action
	 */
	getRestrictionMessage: (action: string) => string | null

	/**
	 * Exit impersonation mode and redirect to admin dashboard
	 */
	exitImpersonation: () => Promise<void>

	/**
	 * Log an action performed during impersonation
	 */
	logAction: (action: string, details?: Record<string, unknown>) => Promise<void>
}

/**
 * Hook for managing impersonation state
 *
 * @example
 * ```tsx
 * function DangerousButton() {
 *   const { isImpersonating, checkRestricted, getRestrictionMessage } = useImpersonation()
 *
 *   const handleDelete = () => {
 *     if (checkRestricted('delete_account')) {
 *       alert(getRestrictionMessage('delete_account'))
 *       return
 *     }
 *     // Proceed with delete
 *   }
 *
 *   return (
 *     <button onClick={handleDelete} disabled={isImpersonating && checkRestricted('delete_account')}>
 *       Delete Account
 *     </button>
 *   )
 * }
 * ```
 */
export function useImpersonation(): UseImpersonationResult {
	const [session, setSession] = useState<ImpersonationSession | null>(null)

	// Load session on mount and listen for changes
	useEffect(() => {
		function loadSession() {
			setSession(getImpersonationSession())
		}

		loadSession()

		// Listen for impersonation events
		window.addEventListener('impersonation-started', loadSession)
		window.addEventListener('impersonation-ended', loadSession)
		window.addEventListener('storage', loadSession)

		return () => {
			window.removeEventListener('impersonation-started', loadSession)
			window.removeEventListener('impersonation-ended', loadSession)
			window.removeEventListener('storage', loadSession)
		}
	}, [])

	const checkRestricted = useCallback(
		(action: string): boolean => {
			if (!session) return false
			return isActionRestricted(action)
		},
		[session],
	)

	const getRestrictionMessage = useCallback(
		(action: string): string | null => {
			if (!session) return null
			if (!isActionRestricted(action)) return null

			const actionName = RESTRICTED_ACTION_NAMES[action as RestrictedAction] || action
			return `Action restricted in admin mode: ${actionName}`
		},
		[session],
	)

	const exitImpersonation = useCallback(async () => {
		if (!session) return

		try {
			// Log the end of impersonation session via API
			await fetch('/api/admin/impersonation/end', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					accountId: session.accountId,
				}),
			})
		} catch (error) {
			console.error('Failed to log impersonation end:', error)
		}

		// Clear session from localStorage
		endImpersonationSession()

		// Redirect to admin dashboard
		window.location.href = getAdminDashboardUrl()
	}, [session])

	const logAction = useCallback(
		async (action: string, details?: Record<string, unknown>) => {
			if (!session) return

			try {
				await fetch('/api/admin/impersonation/log', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						accountId: session.accountId,
						action,
						details,
					}),
				})
			} catch (error) {
				console.error('Failed to log impersonation action:', error)
			}
		},
		[session],
	)

	return {
		isImpersonating: session !== null,
		session,
		checkRestricted,
		getRestrictionMessage,
		exitImpersonation,
		logAction,
	}
}
