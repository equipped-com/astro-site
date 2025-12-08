import { Building2, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PlaidConnectProps, PlaidLinkResult } from './types'

/**
 * PlaidConnect Component
 *
 * Handles the Plaid Link integration for bank account verification.
 * In production, this would use the react-plaid-link SDK after fetching
 * a link token from /api/plaid/link-token.
 *
 * For now, this is a UI implementation that simulates the Plaid flow.
 * The actual Plaid integration requires:
 * 1. Backend endpoint to create link token
 * 2. react-plaid-link package
 * 3. Exchange endpoint for public token -> access token
 */
export function PlaidConnect({ onSuccess, onError, disabled = false, result }: PlaidConnectProps) {
	const [isConnecting, setIsConnecting] = useState(false)
	const [showModal, setShowModal] = useState(false)

	const handleConnect = useCallback(async () => {
		if (disabled || isConnecting) return

		setIsConnecting(true)
		setShowModal(true)

		try {
			// In production, this would:
			// 1. Fetch link token from backend: GET /api/plaid/link-token
			// 2. Open Plaid Link with the token
			// 3. On success, exchange public token: POST /api/plaid/exchange
			// 4. Return the verification result

			// Simulated delay for Plaid flow
			await new Promise(resolve => setTimeout(resolve, 1500))

			// Simulate successful connection
			// In production, this comes from Plaid Link onSuccess callback
			const mockResult: PlaidLinkResult = {
				publicToken: `public-${Date.now()}-xxx`,
				accountId: `account-${Date.now()}`,
				institutionName: 'Chase Bank',
				verified: true,
			}

			setShowModal(false)
			onSuccess(mockResult)
		} catch (error) {
			setShowModal(false)
			onError(error instanceof Error ? error : new Error('Failed to connect bank'))
		} finally {
			setIsConnecting(false)
		}
	}, [disabled, isConnecting, onSuccess, onError])

	const handleDisconnect = useCallback(() => {
		// In production, this would revoke the access token
		// For now, we just reset the state
		onSuccess({
			publicToken: '',
			accountId: '',
			institutionName: '',
			verified: false,
		})
	}, [onSuccess])

	// Already connected state
	if (result?.verified) {
		return (
			<div className="rounded-lg border border-accent bg-accent/10 p-4">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
						<CheckCircle2 className="h-5 w-5 text-accent-foreground" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-foreground">Bank connected</p>
						<p className="text-sm text-muted-foreground">{result.institutionName}</p>
					</div>
					<button
						type="button"
						onClick={handleDisconnect}
						disabled={disabled}
						className={cn(
							'text-sm text-muted-foreground hover:text-foreground',
							'underline-offset-4 hover:underline',
							'disabled:opacity-50 disabled:cursor-not-allowed',
						)}
					>
						Disconnect
					</button>
				</div>
			</div>
		)
	}

	return (
		<>
			{/* Connect Button */}
			<div className="rounded-lg border border-border bg-card p-4">
				<div className="flex items-start gap-3 mb-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
						<Building2 className="h-5 w-5 text-muted-foreground" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-foreground">Secure bank connection</p>
						<p className="text-sm text-muted-foreground">
							Your data will be shared securely through Plaid. It'll only take a minute to connect.
						</p>
					</div>
				</div>

				<button
					type="button"
					onClick={handleConnect}
					disabled={disabled || isConnecting}
					className={cn(
						'w-full flex items-center justify-center gap-2',
						'rounded-md px-4 py-2.5 text-sm font-medium',
						'bg-primary text-primary-foreground',
						'hover:bg-primary/90',
						'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
						'disabled:opacity-50 disabled:cursor-not-allowed',
						'transition-colors',
					)}
				>
					{isConnecting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Connecting...
						</>
					) : (
						<>
							<ExternalLink className="h-4 w-4" />
							Connect with Plaid
						</>
					)}
				</button>

				<p className="mt-3 text-xs text-muted-foreground text-center">
					Plaid uses bank-level encryption to securely share your data
				</p>
			</div>

			{/* Simulated Plaid Modal */}
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					{/* Backdrop */}
					<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

					{/* Modal */}
					<div className="relative w-full max-w-sm rounded-lg bg-card p-6 shadow-xl">
						<div className="flex flex-col items-center text-center">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
								<Loader2 className="h-6 w-6 animate-spin text-primary" />
							</div>
							<h3 className="mb-2 text-lg font-semibold text-foreground">Connecting to Plaid</h3>
							<p className="text-sm text-muted-foreground">Please wait while we securely connect to your bank...</p>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
