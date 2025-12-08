/**
 * ApprovalButtons Component
 *
 * Approve/decline buttons for public proposal view.
 * Handles API calls for approval/decline actions.
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ApprovalButtonsProps {
	token: string
	isExpired: boolean
	status: string
	onApprove?: () => void
	onDecline?: () => void
	className?: string
}

export function ApprovalButtons({ token, isExpired, status, onApprove, onDecline, className }: ApprovalButtonsProps) {
	const [isApproving, setIsApproving] = useState(false)
	const [isDeclining, setIsDeclining] = useState(false)
	const [showDeclineReason, setShowDeclineReason] = useState(false)
	const [declineReason, setDeclineReason] = useState('')
	const [error, setError] = useState<string | null>(null)

	async function handleApprove() {
		setIsApproving(true)
		setError(null)

		try {
			const response = await fetch(`/api/proposals/public/${token}/approve`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.message || 'Failed to approve proposal')
			}

			// Success - trigger callback
			if (onApprove) {
				onApprove()
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to approve proposal')
		} finally {
			setIsApproving(false)
		}
	}

	async function handleDecline() {
		setIsDeclining(true)
		setError(null)

		try {
			const response = await fetch(`/api/proposals/public/${token}/decline`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reason: declineReason || undefined }),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.message || 'Failed to decline proposal')
			}

			// Success - trigger callback
			if (onDecline) {
				onDecline()
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to decline proposal')
		} finally {
			setIsDeclining(false)
		}
	}

	// Don't show buttons if already approved/declined
	const isActioned = status === 'approved' || status === 'declined'

	if (isActioned) {
		return (
			<div className={cn('rounded-lg border p-4 text-center', className)}>
				<p className="text-lg font-semibold">{status === 'approved' ? 'Proposal Approved' : 'Proposal Declined'}</p>
				<p className="text-sm text-muted-foreground mt-1">
					{status === 'approved'
						? 'This proposal has been approved and is being processed.'
						: 'This proposal has been declined.'}
				</p>
			</div>
		)
	}

	return (
		<div className={cn('space-y-4', className)}>
			{/* Error Message */}
			{error && (
				<div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-950/20 p-4">
					<p className="text-sm text-red-800 dark:text-red-200">{error}</p>
				</div>
			)}

			{/* Decline Reason Input */}
			{showDeclineReason && (
				<div className="space-y-2">
					<label htmlFor="decline-reason" className="block text-sm font-medium">
						Reason for declining (optional)
					</label>
					<textarea
						id="decline-reason"
						value={declineReason}
						onChange={e => setDeclineReason(e.target.value)}
						className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
						rows={3}
						placeholder="Let the sender know why you're declining..."
					/>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={handleDecline}
							disabled={isDeclining}
							className="flex-1 px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isDeclining ? 'Declining...' : 'Confirm Decline'}
						</button>
						<button
							type="button"
							onClick={() => setShowDeclineReason(false)}
							disabled={isDeclining}
							className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{/* Action Buttons */}
			{!showDeclineReason && (
				<div className="flex gap-4">
					<button
						type="button"
						onClick={handleApprove}
						disabled={isExpired || isApproving}
						className={cn(
							'flex-1 px-6 py-3 text-sm font-medium rounded-md transition-colors',
							'bg-green-600 text-white hover:bg-green-700',
							'disabled:opacity-50 disabled:cursor-not-allowed',
						)}
					>
						{isApproving ? 'Approving...' : 'Approve Proposal'}
					</button>
					<button
						type="button"
						onClick={() => setShowDeclineReason(true)}
						disabled={isExpired || isDeclining}
						className={cn(
							'flex-1 px-6 py-3 text-sm font-medium rounded-md transition-colors',
							'border hover:bg-muted',
							'disabled:opacity-50 disabled:cursor-not-allowed',
						)}
					>
						Decline
					</button>
				</div>
			)}

			{/* Expired Notice */}
			{isExpired && (
				<div className="rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
					<p className="text-sm font-medium text-amber-900 dark:text-amber-100">This proposal has expired</p>
					<p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
						Contact the sender to request a new proposal
					</p>
				</div>
			)}
		</div>
	)
}
