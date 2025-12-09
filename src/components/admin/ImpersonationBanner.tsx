/**
 * Impersonation Banner Component
 *
 * Displays a persistent banner when a sys admin is viewing a customer account.
 * Shows customer name, warning about audit logging, and exit button.
 *
 * @REQ-SA-007 Admin mode banner with customer name, exit button, and audit warning
 */
import { AlertTriangle, Eye, LogOut, Shield } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
	endImpersonationSession,
	formatSessionDuration,
	getAdminDashboardUrl,
	getImpersonationSession,
	type ImpersonationSession,
} from '@/lib/impersonation'

interface ImpersonationBannerProps {
	/**
	 * Callback when exiting impersonation mode
	 */
	onExit?: () => void
}

export default function ImpersonationBanner({ onExit }: ImpersonationBannerProps) {
	const [session, setSession] = useState<ImpersonationSession | null>(null)
	const [duration, setDuration] = useState<string>('')

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

	// Update duration every minute
	useEffect(() => {
		if (!session) return

		function updateDuration() {
			if (session) {
				setDuration(formatSessionDuration(session.startedAt))
			}
		}

		updateDuration()
		const interval = setInterval(updateDuration, 60000)

		return () => clearInterval(interval)
	}, [session])

	const handleExit = useCallback(async () => {
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

		// Call callback or redirect to admin dashboard
		if (onExit) {
			onExit()
		} else {
			window.location.href = getAdminDashboardUrl()
		}
	}, [session, onExit])

	// Don't render if not impersonating
	if (!session) return null

	return (
		<div
			className="bg-amber-500 text-amber-950 px-4 py-3 shadow-lg"
			role="alert"
			aria-live="polite"
			data-testid="impersonation-banner"
		>
			<div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
				{/* Left side - viewing info */}
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						<Eye className="h-5 w-5" aria-hidden="true" />
						<span className="font-semibold">Admin Mode</span>
					</div>
					<span className="text-amber-900/70">|</span>
					<div className="flex items-center gap-2">
						<Shield className="h-4 w-4" aria-hidden="true" />
						<span>
							Viewing as: <strong>{session.accountName}</strong>
						</span>
					</div>
					{duration && (
						<>
							<span className="text-amber-900/70">|</span>
							<span className="text-sm text-amber-900/80">Duration: {duration}</span>
						</>
					)}
				</div>

				{/* Center - audit warning */}
				<div className="hidden md:flex items-center gap-2 text-sm">
					<AlertTriangle className="h-4 w-4" aria-hidden="true" />
					<span>All actions are logged for audit purposes</span>
				</div>

				{/* Right side - exit button */}
				<button
					type="button"
					onClick={handleExit}
					className="inline-flex items-center gap-2 rounded-md bg-amber-950 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-950 focus:ring-offset-2 focus:ring-offset-amber-500 transition-colors"
					data-testid="exit-impersonation-button"
				>
					<LogOut className="h-4 w-4" aria-hidden="true" />
					<span>Exit Impersonation</span>
				</button>
			</div>

			{/* Mobile audit warning */}
			<div className="mt-2 flex items-center gap-2 text-sm md:hidden">
				<AlertTriangle className="h-4 w-4" aria-hidden="true" />
				<span>All actions are logged for audit purposes</span>
			</div>
		</div>
	)
}
