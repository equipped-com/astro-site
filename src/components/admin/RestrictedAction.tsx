/**
 * Restricted Action Component
 *
 * Wraps actions that should be disabled during impersonation mode.
 * Shows a tooltip/message explaining why the action is restricted.
 *
 * @REQ-SA-010 Restricted actions while impersonating
 */
import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useImpersonation } from './useImpersonation'

interface RestrictedActionProps {
	/**
	 * The action identifier to check
	 */
	action: string

	/**
	 * Children to render (usually a button or link)
	 */
	children: ReactNode

	/**
	 * Render prop for custom rendering
	 * Called with (isRestricted, message)
	 */
	render?: (isRestricted: boolean, message: string | null) => ReactNode

	/**
	 * Whether to show the restriction message inline
	 */
	showMessage?: boolean
}

/**
 * Wrapper component for actions that should be restricted during impersonation
 *
 * @example
 * ```tsx
 * <RestrictedAction action="delete_account">
 *   <button onClick={handleDelete}>Delete Account</button>
 * </RestrictedAction>
 * ```
 *
 * With custom render:
 * ```tsx
 * <RestrictedAction
 *   action="change_billing"
 *   render={(isRestricted, message) => (
 *     <button disabled={isRestricted} title={message || undefined}>
 *       Change Payment
 *     </button>
 *   )}
 * />
 * ```
 */
export function RestrictedAction({ action, children, render, showMessage = true }: RestrictedActionProps) {
	const { isImpersonating, checkRestricted, getRestrictionMessage } = useImpersonation()

	const isRestricted = isImpersonating && checkRestricted(action)
	const message = getRestrictionMessage(action)

	// Custom render function
	if (render) {
		return <>{render(isRestricted, message)}</>
	}

	// Default rendering
	if (isRestricted) {
		return (
			<div className="relative group">
				{/* Disabled overlay on children - pointer-events-none blocks all interactions */}
				<div className="opacity-50 pointer-events-none" aria-disabled="true">
					{children}
				</div>

				{/* Restriction message */}
				{showMessage && (
					<div className="mt-2 flex items-center gap-2 text-sm text-amber-600" role="alert">
						<AlertCircle className="h-4 w-4 flex-shrink-0" />
						<span>{message}</span>
					</div>
				)}
			</div>
		)
	}

	return <>{children}</>
}

/**
 * Hook-based helper for restricted actions
 * Returns a function to check and handle restricted actions
 *
 * @example
 * ```tsx
 * function DeleteButton() {
 *   const guardAction = useRestrictedAction()
 *
 *   const handleDelete = () => {
 *     const blocked = guardAction('delete_account', () => {
 *       // Proceed with delete if not blocked
 *       deleteAccount()
 *     })
 *
 *     if (blocked) {
 *       // Action was blocked, already handled
 *     }
 *   }
 * }
 * ```
 */
export function useRestrictedAction() {
	const { checkRestricted, getRestrictionMessage, logAction } = useImpersonation()

	return async function guardAction(action: string, onAllowed: () => void | Promise<void>): Promise<boolean> {
		if (checkRestricted(action)) {
			const message = getRestrictionMessage(action)
			alert(message || 'Action restricted in admin mode')
			return true // Was blocked
		}

		// Log the action and execute
		await logAction(action)
		await onAllowed()
		return false // Was not blocked
	}
}
