import { useState } from 'react'
import type { OrderWithItems } from '@/lib/scoped-queries'

interface OrderActionsProps {
	order: OrderWithItems
	onCancel?: (orderId: string) => Promise<void>
	onReturn?: (orderId: string) => Promise<void>
	onReorder?: (orderId: string) => Promise<void>
	onDownloadInvoice?: (orderId: string) => Promise<void>
}

export function OrderActions({ order, onCancel, onReturn, onReorder, onDownloadInvoice }: OrderActionsProps) {
	const [showCancelConfirm, setShowCancelConfirm] = useState(false)
	const [showReturnForm, setShowReturnForm] = useState(false)
	const [returnReason, setReturnReason] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	// Determine which actions are available
	const canCancel = order.status === 'pending' || order.status === 'processing' || order.status === 'pending_leasing_approval'
	const canReturn = order.status === 'delivered' && isWithinReturnWindow()
	const canReorder = true // Reorder is always available
	const canDownloadInvoice = order.status !== 'cancelled'

	function isWithinReturnWindow(): boolean {
		if (!order.delivered_at) return false

		const deliveredDate = new Date(order.delivered_at)
		const today = new Date()
		const daysSinceDelivery = Math.floor((today.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24))

		// 30-day return window
		return daysSinceDelivery <= 30
	}

	async function handleCancel() {
		if (!onCancel) return

		setIsLoading(true)
		try {
			await onCancel(order.id)
			setShowCancelConfirm(false)
		} catch (error) {
			console.error('Failed to cancel order:', error)
			alert('Failed to cancel order. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	async function handleReturn() {
		if (!onReturn || !returnReason) return

		setIsLoading(true)
		try {
			await onReturn(order.id)
			setShowReturnForm(false)
			setReturnReason('')
		} catch (error) {
			console.error('Failed to request return:', error)
			alert('Failed to request return. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	async function handleReorder() {
		if (!onReorder) return

		setIsLoading(true)
		try {
			await onReorder(order.id)
		} catch (error) {
			console.error('Failed to reorder:', error)
			alert('Failed to reorder. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	async function handleDownloadInvoice() {
		if (!onDownloadInvoice) return

		setIsLoading(true)
		try {
			await onDownloadInvoice(order.id)
		} catch (error) {
			console.error('Failed to download invoice:', error)
			alert('Failed to download invoice. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="bg-card rounded-lg border border-border p-6">
			<h2 className="text-xl font-semibold text-foreground mb-4">Actions</h2>

			<div className="flex flex-wrap gap-3">
				{/* Download Invoice */}
				{canDownloadInvoice && (
					<button
						type="button"
						onClick={handleDownloadInvoice}
						disabled={isLoading}
						className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						Download invoice
					</button>
				)}

				{/* Reorder */}
				{canReorder && (
					<button
						type="button"
						onClick={handleReorder}
						disabled={isLoading}
						className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						Reorder
					</button>
				)}

				{/* Cancel Order */}
				{canCancel && (
					<button
						type="button"
						onClick={() => setShowCancelConfirm(true)}
						disabled={isLoading}
						className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
						Cancel order
					</button>
				)}

				{/* Request Return */}
				{canReturn && (
					<button
						type="button"
						onClick={() => setShowReturnForm(true)}
						disabled={isLoading}
						className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
							/>
						</svg>
						Request return
					</button>
				)}
			</div>

			{/* Cancel Confirmation Modal */}
			{showCancelConfirm && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-card rounded-lg border border-border p-6 max-w-md w-full mx-4">
						<h3 className="text-lg font-semibold text-foreground mb-2">Cancel Order?</h3>
						<p className="text-muted-foreground mb-6">
							Are you sure you want to cancel this order? This action cannot be undone.
							{order.payment_method === 'card' && ' A refund will be initiated if payment was already processed.'}
						</p>
						<div className="flex gap-3 justify-end">
							<button
								type="button"
								onClick={() => setShowCancelConfirm(false)}
								disabled={isLoading}
								className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50"
							>
								Keep order
							</button>
							<button
								type="button"
								onClick={handleCancel}
								disabled={isLoading}
								className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
							>
								{isLoading ? 'Cancelling...' : 'Cancel order'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Return Form Modal */}
			{showReturnForm && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-card rounded-lg border border-border p-6 max-w-md w-full mx-4">
						<h3 className="text-lg font-semibold text-foreground mb-2">Request Return</h3>
						<p className="text-muted-foreground mb-4">
							Please select a reason for returning this order. We'll provide a prepaid return shipping label.
						</p>

						<div className="space-y-3 mb-6">
							{[
								'Defective or damaged item',
								'Wrong item received',
								'No longer needed',
								'Item not as described',
								'Changed my mind',
								'Other',
							].map((reason) => (
								<label key={reason} className="flex items-center gap-3 cursor-pointer">
									<input
										type="radio"
										name="return-reason"
										value={reason}
										checked={returnReason === reason}
										onChange={(e) => setReturnReason(e.target.value)}
										className="w-4 h-4 text-primary focus:ring-primary"
									/>
									<span className="text-sm text-foreground">{reason}</span>
								</label>
							))}
						</div>

						<div className="flex gap-3 justify-end">
							<button
								type="button"
								onClick={() => {
									setShowReturnForm(false)
									setReturnReason('')
								}}
								disabled={isLoading}
								className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleReturn}
								disabled={isLoading || !returnReason}
								className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? 'Submitting...' : 'Submit return request'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
