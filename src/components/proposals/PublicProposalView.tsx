/**
 * PublicProposalView Component
 *
 * Public-facing view for proposal recipients to review and approve/decline proposals.
 * Fetches proposal data via share token and displays items, pricing, and action buttons.
 */

import { useEffect, useState } from 'react'
import type { PublicProposalView as PublicProposal } from '@/types/proposal'
import { ApprovalButtons } from './ApprovalButtons'
import { ProposalItems } from './ProposalItems'

interface PublicProposalViewProps {
	token?: string
	className?: string
}

export function PublicProposalView({ token: propToken, className }: PublicProposalViewProps) {
	const [proposal, setProposal] = useState<PublicProposal | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isApproved, setIsApproved] = useState(false)
	const [isDeclined, setIsDeclined] = useState(false)
	const [token, setToken] = useState<string | null>(propToken || null)

	// Listen for token from URL (when client:only is used)
	useEffect(() => {
		function handleToken(event: CustomEvent<{ token: string | null }>) {
			setToken(event.detail.token)
		}

		window.addEventListener('proposal-token', handleToken as EventListener)

		// Also try to extract from URL directly
		const urlParams = new URLSearchParams(window.location.search)
		const urlToken = urlParams.get('token')
		if (urlToken) {
			setToken(urlToken)
		}

		return () => {
			window.removeEventListener('proposal-token', handleToken as EventListener)
		}
	}, [])

	useEffect(() => {
		async function fetchProposal() {
			if (!token) {
				setError('No proposal token provided')
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			setError(null)

			try {
				const response = await fetch(`/api/proposals/public/${token}`)

				if (!response.ok) {
					const data = await response.json()
					throw new Error(data.message || 'Failed to load proposal')
				}

				const data = await response.json()
				setProposal(data.proposal)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load proposal')
			} finally {
				setIsLoading(false)
			}
		}

		fetchProposal()
	}, [token])

	function handleApprove() {
		setIsApproved(true)
		// Optionally reload proposal to get updated status
		if (proposal) {
			setProposal({ ...proposal, status: 'approved' })
		}
	}

	function handleDecline() {
		setIsDeclined(true)
		// Optionally reload proposal to get updated status
		if (proposal) {
			setProposal({ ...proposal, status: 'declined' })
		}
	}

	if (isLoading) {
		return (
			<div className={className}>
				<div className="flex items-center justify-center py-12">
					<div className="text-center">
						<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
						<p className="mt-4 text-sm text-muted-foreground">Loading proposal...</p>
					</div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className={className}>
				<div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-950/20 p-6 text-center">
					<h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">Error Loading Proposal</h2>
					<p className="text-sm text-red-800 dark:text-red-200">{error}</p>
				</div>
			</div>
		)
	}

	if (!proposal) {
		return (
			<div className={className}>
				<div className="rounded-lg border p-6 text-center">
					<p className="text-muted-foreground">Proposal not found</p>
				</div>
			</div>
		)
	}

	const expiresAt = proposal.expires_at ? new Date(proposal.expires_at) : null
	const createdAt = new Date(proposal.created_at)

	return (
		<div className={className}>
			{/* Success Messages */}
			{isApproved && (
				<div className="mb-6 rounded-lg border border-green-500 bg-green-50 dark:bg-green-950/20 p-6 text-center">
					<h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">Proposal Approved!</h2>
					<p className="text-sm text-green-800 dark:text-green-200">
						The sender has been notified. You'll be redirected to checkout shortly.
					</p>
				</div>
			)}

			{isDeclined && (
				<div className="mb-6 rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-6 text-center">
					<h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-2">Proposal Declined</h2>
					<p className="text-sm text-amber-800 dark:text-amber-200">The sender has been notified of your decision.</p>
				</div>
			)}

			{/* Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-foreground mb-2">{proposal.title}</h1>
				{proposal.recipient_name && <p className="text-lg text-muted-foreground">For: {proposal.recipient_name}</p>}
				<div className="flex gap-4 mt-4 text-sm text-muted-foreground">
					<div>
						<span className="font-medium">Created:</span> {createdAt.toLocaleDateString()}
					</div>
					{expiresAt && (
						<div>
							<span className="font-medium">Expires:</span> {expiresAt.toLocaleDateString()}
						</div>
					)}
				</div>
			</div>

			{/* Notes */}
			{proposal.notes && (
				<div className="mb-8 rounded-lg border bg-muted/50 p-4">
					<h2 className="text-sm font-semibold text-muted-foreground mb-2">Notes from sender</h2>
					<p className="text-sm whitespace-pre-wrap">{proposal.notes}</p>
				</div>
			)}

			{/* Items */}
			<div className="mb-8">
				<h2 className="text-xl font-semibold mb-4">Proposal Items</h2>
				<ProposalItems items={proposal.items} subtotal={proposal.subtotal} />
			</div>

			{/* Approval Buttons */}
			<ApprovalButtons
				token={token}
				isExpired={proposal.is_expired}
				status={proposal.status}
				onApprove={handleApprove}
				onDecline={handleDecline}
			/>
		</div>
	)
}
