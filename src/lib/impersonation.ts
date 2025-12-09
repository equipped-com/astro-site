/**
 * Impersonation Library
 *
 * Provides utilities for sys admins to impersonate customer accounts.
 * All impersonation actions are logged for audit purposes.
 *
 * SECURITY: Only sys_admin users can enter impersonation mode.
 * AUDIT: All actions during impersonation are logged with admin context.
 */

export interface ImpersonationSession {
	adminUserId: string
	adminEmail: string
	adminName: string
	accountId: string
	accountName: string
	accountShortName: string
	startedAt: string
}

export interface ImpersonationAuditLog {
	id: string
	admin_user_id: string
	account_id: string
	action: string
	details?: Record<string, unknown>
	is_impersonation: true
	created_at: string
}

/**
 * Actions that are restricted while impersonating a customer.
 * These actions are too dangerous to perform on behalf of a customer.
 */
export const RESTRICTED_ACTIONS = [
	'delete_account',
	'change_billing',
	'change_payment_method',
	'remove_owner',
	'transfer_ownership',
	'delete_all_devices',
] as const

export type RestrictedAction = (typeof RESTRICTED_ACTIONS)[number]

/**
 * Human-readable names for restricted actions
 */
export const RESTRICTED_ACTION_NAMES: Record<RestrictedAction, string> = {
	delete_account: 'Delete the account',
	change_billing: 'Change billing/payment',
	change_payment_method: 'Change payment method',
	remove_owner: 'Remove the owner',
	transfer_ownership: 'Transfer ownership',
	delete_all_devices: 'Delete all devices',
}

/**
 * Storage key for impersonation session in localStorage
 */
const IMPERSONATION_STORAGE_KEY = 'equipped_impersonation_session'

/**
 * Get the current impersonation session from localStorage
 */
export function getImpersonationSession(): ImpersonationSession | null {
	if (typeof window === 'undefined') return null

	try {
		const stored = localStorage.getItem(IMPERSONATION_STORAGE_KEY)
		if (!stored) return null

		const session = JSON.parse(stored) as ImpersonationSession

		// Validate session has required fields
		if (!session.adminUserId || !session.accountId) {
			return null
		}

		return session
	} catch {
		return null
	}
}

/**
 * Start an impersonation session
 */
export function startImpersonationSession(session: ImpersonationSession): void {
	if (typeof window === 'undefined') return

	localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(session))

	// Dispatch custom event for React components to detect
	window.dispatchEvent(new CustomEvent('impersonation-started', { detail: session }))
}

/**
 * End the current impersonation session
 */
export function endImpersonationSession(): void {
	if (typeof window === 'undefined') return

	const session = getImpersonationSession()
	localStorage.removeItem(IMPERSONATION_STORAGE_KEY)

	// Dispatch custom event for React components to detect
	window.dispatchEvent(new CustomEvent('impersonation-ended', { detail: session }))
}

/**
 * Check if currently in impersonation mode
 */
export function isImpersonating(): boolean {
	return getImpersonationSession() !== null
}

/**
 * Check if an action is restricted during impersonation
 */
export function isActionRestricted(action: string): boolean {
	return RESTRICTED_ACTIONS.includes(action as RestrictedAction)
}

/**
 * Get the URL for entering impersonation mode
 */
export function getImpersonationUrl(accountShortName: string): string {
	return `https://${accountShortName}.tryequipped.com/dashboard?impersonate=true`
}

/**
 * Get the admin dashboard URL
 */
export function getAdminDashboardUrl(): string {
	// In production this would be the admin subdomain or path
	return '/admin'
}

/**
 * Format impersonation session for display
 */
export function formatSessionDuration(startedAt: string): string {
	const start = new Date(startedAt)
	const now = new Date()
	const diffMs = now.getTime() - start.getTime()

	const minutes = Math.floor(diffMs / 60000)
	const hours = Math.floor(minutes / 60)

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m`
	}
	return `${minutes}m`
}
