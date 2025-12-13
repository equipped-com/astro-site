'use client'

import { AlertCircle, ArrowLeft, Check, DollarSign, X } from 'lucide-react'
import { useState } from 'react'
import type { TradeInItem, ValueAdjustment } from '@/lib/alchemy/types'
import { cn } from '@/lib/utils'

interface ValueAdjustmentModalProps {
	tradeIn: TradeInItem
	adjustment: ValueAdjustment
	isOpen: boolean
	onClose: () => void
	onAccept?: (adjustmentId: string) => void
	onDispute?: (adjustmentId: string, reason: string) => void
	className?: string
}

export function ValueAdjustmentModal({
	tradeIn,
	adjustment,
	isOpen,
	onClose,
	onAccept,
	onDispute,
	className,
}: ValueAdjustmentModalProps) {
	const [isAccepting, setIsAccepting] = useState(false)
	const [isDisputing, setIsDisputing] = useState(false)
	const [showDisputeForm, setShowDisputeForm] = useState(false)
	const [disputeReason, setDisputeReason] = useState('')

	if (!isOpen) return null

	const valueDifference = adjustment.originalValue - adjustment.newValue
	const percentageChange = ((valueDifference / adjustment.originalValue) * 100).toFixed(1)

	async function handleAccept() {
		setIsAccepting(true)
		try {
			const response = await fetch('/api/trade-in/adjustment/accept', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tradeInId: tradeIn.id,
					adjustmentId: adjustment.adjustmentId,
				}),
			})

			if (!response.ok) {
				throw new Error('Failed to accept adjustment')
			}

			onAccept?.(adjustment.adjustmentId)
			onClose()
		} catch (error) {
			console.error('Error accepting adjustment:', error)
			alert('Failed to accept adjustment. Please try again.')
		} finally {
			setIsAccepting(false)
		}
	}

	async function handleDispute() {
		if (!disputeReason.trim()) {
			alert('Please provide a reason for your dispute.')
			return
		}

		setIsDisputing(true)
		try {
			const response = await fetch('/api/trade-in/adjustment/dispute', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tradeInId: tradeIn.id,
					adjustmentId: adjustment.adjustmentId,
					reason: disputeReason,
				}),
			})

			if (!response.ok) {
				throw new Error('Failed to dispute adjustment')
			}

			onDispute?.(adjustment.adjustmentId, disputeReason)
			onClose()
		} catch (error) {
			console.error('Error disputing adjustment:', error)
			alert('Failed to submit dispute. Please try again.')
		} finally {
			setIsDisputing(false)
		}
	}

	function handleRequestReturn() {
		// In real implementation, this would initiate return shipping
		if (
			window.confirm(
				'Are you sure you want to request device return? You will be responsible for return shipping costs.',
			)
		) {
			window.alert('Return request submitted. We will contact you with shipping instructions.')
			onClose()
		}
	}

	return (
		<>
			{/* Overlay */}
			<div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={onClose} />

			{/* Modal */}
			<div
				className={cn(
					'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
					'w-full max-w-lg max-h-[90vh] overflow-y-auto',
					'bg-card border border-border rounded-xl shadow-2xl',
					'animate-slide-up',
					className,
				)}
			>
				{/* Header */}
				<div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
					<h3 className="text-lg font-semibold text-foreground">Trade-In Value Adjustment</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1 hover:bg-muted rounded-lg transition-colors"
						aria-label="Close modal"
					>
						<X className="h-5 w-5 text-muted-foreground" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* Alert */}
					<div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
						<div className="flex items-start gap-3">
							<AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
							<div>
								<p className="font-medium text-amber-900">Inspection found issues not disclosed</p>
								<p className="text-sm text-amber-700 mt-1">
									Our inspection team found differences between the reported condition and the actual device condition.
								</p>
							</div>
						</div>
					</div>

					{/* Device Info */}
					<div className="rounded-lg border border-border p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-foreground">{tradeIn.model}</p>
								<p className="text-xs text-muted-foreground mt-1">
									{tradeIn.year} - {tradeIn.color}
								</p>
								<p className="text-xs text-muted-foreground font-mono mt-1">{tradeIn.serial}</p>
							</div>
						</div>
					</div>

					{/* Value Comparison */}
					<div className="space-y-4">
						<div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
							<div>
								<p className="text-sm text-muted-foreground">Original Estimate</p>
								<p className="text-2xl font-bold text-muted-foreground line-through">
									${adjustment.originalValue.toLocaleString()}
								</p>
							</div>
							<div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
								<ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180" />
							</div>
							<div className="text-right">
								<p className="text-sm text-muted-foreground">New Value</p>
								<p className="text-2xl font-bold text-primary">${adjustment.newValue.toLocaleString()}</p>
							</div>
						</div>

						<div className="rounded-lg bg-red-50 border border-red-200 p-4">
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium text-red-900">Value Reduction</p>
								<div className="text-right">
									<p className="text-lg font-bold text-red-900">-${valueDifference.toLocaleString()}</p>
									<p className="text-xs text-red-700">({percentageChange}% reduction)</p>
								</div>
							</div>
						</div>
					</div>

					{/* Adjustment Reason */}
					<div className="rounded-lg border border-border p-4">
						<p className="text-sm font-medium text-foreground mb-2">Reason for Adjustment</p>
						<p className="text-sm text-muted-foreground">{adjustment.reason}</p>
						<p className="text-xs text-muted-foreground mt-3">
							Adjusted on{' '}
							{new Date(adjustment.createdAt).toLocaleDateString('en-US', {
								month: 'long',
								day: 'numeric',
								year: 'numeric',
							})}
						</p>
					</div>

					{/* Dispute Form */}
					{showDisputeForm ? (
						<div className="rounded-lg border border-border p-4 space-y-4">
							<div>
								<label htmlFor="dispute-reason" className="text-sm font-medium text-foreground block mb-2">
									Reason for Dispute
								</label>
								<textarea
									id="dispute-reason"
									value={disputeReason}
									onChange={e => setDisputeReason(e.target.value)}
									placeholder="Please explain why you believe the adjustment is incorrect..."
									rows={4}
									className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
								/>
								<p className="text-xs text-muted-foreground mt-2">
									Our team will review your dispute and contact you within 1-2 business days.
								</p>
							</div>

							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => setShowDisputeForm(false)}
									className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-muted transition-colors"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleDispute}
									disabled={isDisputing || !disputeReason.trim()}
									className={cn(
										'flex-1 px-4 py-2 rounded-lg font-medium transition-colors',
										'bg-amber-600 text-white hover:bg-amber-700',
										'disabled:opacity-50 disabled:cursor-not-allowed',
									)}
								>
									{isDisputing ? 'Submitting...' : 'Submit Dispute'}
								</button>
							</div>
						</div>
					) : (
						<>
							{/* Action Options */}
							<div className="space-y-3">
								<p className="text-sm font-medium text-foreground">What would you like to do?</p>

								{/* Accept New Value */}
								<button
									type="button"
									onClick={handleAccept}
									disabled={isAccepting}
									className={cn(
										'w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors',
										'border-primary bg-primary/5 hover:bg-primary/10',
										'disabled:opacity-50 disabled:cursor-not-allowed',
									)}
								>
									<div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
										<Check className="h-5 w-5 text-primary" />
									</div>
									<div className="flex-1 text-left">
										<p className="font-medium text-foreground">Accept New Value</p>
										<p className="text-sm text-muted-foreground">
											Proceed with ${adjustment.newValue.toLocaleString()}
										</p>
									</div>
									{isAccepting && (
										<div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
									)}
								</button>

								{/* Dispute Adjustment */}
								<button
									type="button"
									onClick={() => setShowDisputeForm(true)}
									className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-border hover:border-amber-600 hover:bg-amber-50 transition-colors"
								>
									<div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 shrink-0">
										<AlertCircle className="h-5 w-5 text-amber-600" />
									</div>
									<div className="flex-1 text-left">
										<p className="font-medium text-foreground">Dispute Adjustment</p>
										<p className="text-sm text-muted-foreground">Challenge the inspection results</p>
									</div>
								</button>

								{/* Request Return */}
								<button
									type="button"
									onClick={handleRequestReturn}
									className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-border hover:border-muted-foreground hover:bg-muted transition-colors"
								>
									<div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted shrink-0">
										<DollarSign className="h-5 w-5 text-muted-foreground" />
									</div>
									<div className="flex-1 text-left">
										<p className="font-medium text-foreground">Request Device Return</p>
										<p className="text-sm text-muted-foreground">Get your device back (you pay shipping)</p>
									</div>
								</button>
							</div>

							{/* Help Text */}
							<div className="rounded-lg bg-muted/30 p-4">
								<p className="text-xs text-muted-foreground">
									<strong>Note:</strong> If you accept the new value, the trade-in credit will be processed within 5-7
									business days. If you dispute or request a return, the process will be paused until resolved.
								</p>
							</div>
						</>
					)}
				</div>
			</div>
		</>
	)
}
