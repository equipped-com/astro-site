/**
 * CreateProposalModal Component
 *
 * Modal dialog for creating B2B proposals from cart items.
 * Handles API submission and displays success with share link.
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Cart } from '@/types/cart'
import type { CreateProposalRequest, CreateProposalResponse } from '@/types/proposal'
import { ProposalForm, type ProposalFormData } from './ProposalForm'

interface CreateProposalModalProps {
	cart: Cart
	isOpen: boolean
	onClose: () => void
	onSuccess?: (shareUrl: string) => void
	className?: string
}

export function CreateProposalModal({ cart, isOpen, onClose, onSuccess, className }: CreateProposalModalProps) {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [shareUrl, setShareUrl] = useState<string | null>(null)
	const [copied, setCopied] = useState(false)

	async function handleSubmit(formData: ProposalFormData) {
		setIsSubmitting(true)
		setError(null)

		try {
			// Convert cart items to proposal items
			const items = cart.items.map(item => ({
				product_name: item.productName,
				product_sku: item.productSku,
				quantity: item.quantity,
				unit_price: item.unitPrice,
				monthly_price:
					cart.paymentMethod === '24-month'
						? item.monthlyPrice24
						: cart.paymentMethod === '36-month'
							? item.monthlyPrice36
							: undefined,
				specs: item.specs,
			}))

			const payload: CreateProposalRequest = {
				...formData,
				items,
			}

			const response = await fetch(`/api/proposals`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.message || 'Failed to create proposal')
			}

			const data: CreateProposalResponse = await response.json()

			// Show success state with share URL
			setShareUrl(data.share_url)

			// Call success callback
			if (onSuccess) {
				onSuccess(data.share_url)
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create proposal')
		} finally {
			setIsSubmitting(false)
		}
	}

	function handleCopyLink() {
		if (shareUrl) {
			navigator.clipboard.writeText(shareUrl)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		}
	}

	function handleClose() {
		setShareUrl(null)
		setError(null)
		setCopied(false)
		onClose()
	}

	if (!isOpen) {
		return null
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<button
				type="button"
				className="fixed inset-0 bg-black/50 backdrop-blur-sm"
				onClick={handleClose}
				aria-label="Close modal"
			/>

			{/* Modal */}
			<div
				className={cn(
					'relative z-50 w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg',
					'max-h-[90vh] overflow-y-auto',
					className,
				)}
			>
				{/* Header */}
				<div className="mb-6">
					<h2 className="text-xl font-semibold">Create Proposal</h2>
					<p className="text-sm text-muted-foreground mt-1">Share your cart with stakeholders for approval</p>
				</div>

				{/* Success State */}
				{shareUrl ? (
					<div className="space-y-6">
						<div className="rounded-lg border border-green-500 bg-green-50 dark:bg-green-950/20 p-4">
							<h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Proposal Created Successfully!</h3>
							<p className="text-sm text-green-800 dark:text-green-200">
								Your proposal has been created. Share the link below with your recipient.
							</p>
						</div>

						{/* Share Link */}
						<div className="space-y-2">
							<label htmlFor="share-link" className="block text-sm font-medium">
								Share Link
							</label>
							<div className="flex gap-2">
								<input
									id="share-link"
									type="text"
									value={shareUrl}
									readOnly
									className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm"
								/>
								<button
									type="button"
									onClick={handleCopyLink}
									className={cn(
										'px-4 py-2 text-sm font-medium rounded-md transition-colors',
										copied ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90',
									)}
								>
									{copied ? 'Copied!' : 'Copy'}
								</button>
							</div>
						</div>

						{/* Item Summary */}
						<div className="space-y-2">
							<h4 className="text-sm font-medium">Proposal Items</h4>
							<div className="rounded-lg border p-4 space-y-2">
								{cart.items.map(item => (
									<div key={item.id} className="flex justify-between text-sm">
										<span>
											{item.productName} x {item.quantity}
										</span>
										<span className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
									</div>
								))}
								<div className="border-t pt-2 flex justify-between font-semibold">
									<span>Total</span>
									<span>${cart.subtotal.toFixed(2)}</span>
								</div>
							</div>
						</div>

						{/* Actions */}
						<div className="flex justify-end">
							<button
								type="button"
								onClick={handleClose}
								className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
							>
								Done
							</button>
						</div>
					</div>
				) : (
					/* Form State */
					<>
						{/* Error Message */}
						{error && (
							<div className="mb-4 rounded-lg border border-red-500 bg-red-50 dark:bg-red-950/20 p-4">
								<p className="text-sm text-red-800 dark:text-red-200">{error}</p>
							</div>
						)}

						{/* Cart Items Preview */}
						<div className="mb-6 rounded-lg border p-4">
							<h4 className="text-sm font-medium mb-3">Items in Proposal</h4>
							<div className="space-y-2">
								{cart.items.map(item => (
									<div key={item.id} className="flex justify-between text-sm">
										<span className="text-muted-foreground">
											{item.productName} x {item.quantity}
										</span>
										<span className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
									</div>
								))}
								<div className="border-t pt-2 flex justify-between font-semibold">
									<span>Total</span>
									<span>${cart.subtotal.toFixed(2)}</span>
								</div>
							</div>
						</div>

						{/* Proposal Form */}
						<ProposalForm onSubmit={handleSubmit} onCancel={handleClose} isSubmitting={isSubmitting} />
					</>
				)}
			</div>
		</div>
	)
}
