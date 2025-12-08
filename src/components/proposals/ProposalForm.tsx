/**
 * ProposalForm Component
 *
 * Form for creating B2B proposals from cart items.
 * Collects recipient details, expiration date, and optional notes.
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface ProposalFormData {
	title: string
	recipient_name: string
	recipient_email: string
	expires_at?: string
	notes?: string
}

interface ProposalFormProps {
	onSubmit: (data: ProposalFormData) => void
	onCancel: () => void
	isSubmitting?: boolean
	className?: string
}

export function ProposalForm({ onSubmit, onCancel, isSubmitting = false, className }: ProposalFormProps) {
	const [formData, setFormData] = useState<ProposalFormData>({
		title: '',
		recipient_name: '',
		recipient_email: '',
		expires_at: '',
		notes: '',
	})

	const [errors, setErrors] = useState<Partial<Record<keyof ProposalFormData, string>>>({})

	function validateForm(): boolean {
		const newErrors: Partial<Record<keyof ProposalFormData, string>> = {}

		if (!formData.title.trim()) {
			newErrors.title = 'Title is required'
		}

		if (!formData.recipient_name.trim()) {
			newErrors.recipient_name = 'Recipient name is required'
		}

		if (!formData.recipient_email.trim()) {
			newErrors.recipient_email = 'Recipient email is required'
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipient_email)) {
			newErrors.recipient_email = 'Invalid email address'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()

		if (!validateForm()) {
			return
		}

		// Calculate default expiration (30 days from now) if not set
		const expiresAt = formData.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

		onSubmit({
			...formData,
			expires_at: expiresAt,
		})
	}

	function handleChange(field: keyof ProposalFormData, value: string) {
		setFormData(prev => ({ ...prev, [field]: value }))
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: undefined }))
		}
	}

	return (
		<form onSubmit={handleSubmit} noValidate className={cn('space-y-6', className)}>
			{/* Title */}
			<div className="space-y-2">
				<label htmlFor="title" className="block text-sm font-medium">
					Proposal Title <span className="text-red-500">*</span>
				</label>
				<input
					id="title"
					type="text"
					value={formData.title}
					onChange={e => handleChange('title', e.target.value)}
					placeholder="e.g., Q4 2025 Device Refresh"
					disabled={isSubmitting}
					className={cn(
						'w-full rounded-md border bg-background px-3 py-2 text-sm',
						'focus:outline-none focus:ring-2 focus:ring-primary',
						errors.title && 'border-red-500',
						isSubmitting && 'opacity-50 cursor-not-allowed',
					)}
				/>
				{errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
			</div>

			{/* Recipient Name */}
			<div className="space-y-2">
				<label htmlFor="recipient_name" className="block text-sm font-medium">
					Recipient Name <span className="text-red-500">*</span>
				</label>
				<input
					id="recipient_name"
					type="text"
					value={formData.recipient_name}
					onChange={e => handleChange('recipient_name', e.target.value)}
					placeholder="e.g., Sarah Johnson"
					disabled={isSubmitting}
					className={cn(
						'w-full rounded-md border bg-background px-3 py-2 text-sm',
						'focus:outline-none focus:ring-2 focus:ring-primary',
						errors.recipient_name && 'border-red-500',
						isSubmitting && 'opacity-50 cursor-not-allowed',
					)}
				/>
				{errors.recipient_name && <p className="text-xs text-red-500">{errors.recipient_name}</p>}
			</div>

			{/* Recipient Email */}
			<div className="space-y-2">
				<label htmlFor="recipient_email" className="block text-sm font-medium">
					Recipient Email <span className="text-red-500">*</span>
				</label>
				<input
					id="recipient_email"
					type="email"
					value={formData.recipient_email}
					onChange={e => handleChange('recipient_email', e.target.value)}
					placeholder="sarah@example.com"
					disabled={isSubmitting}
					className={cn(
						'w-full rounded-md border bg-background px-3 py-2 text-sm',
						'focus:outline-none focus:ring-2 focus:ring-primary',
						errors.recipient_email && 'border-red-500',
						isSubmitting && 'opacity-50 cursor-not-allowed',
					)}
				/>
				{errors.recipient_email && <p className="text-xs text-red-500">{errors.recipient_email}</p>}
			</div>

			{/* Expiration Date */}
			<div className="space-y-2">
				<label htmlFor="expires_at" className="block text-sm font-medium">
					Expiration Date
				</label>
				<input
					id="expires_at"
					type="date"
					value={formData.expires_at ? formData.expires_at.split('T')[0] : ''}
					onChange={e => {
						// Convert to ISO string with time
						const date = e.target.value ? new Date(e.target.value).toISOString() : ''
						handleChange('expires_at', date)
					}}
					min={new Date().toISOString().split('T')[0]}
					disabled={isSubmitting}
					className={cn(
						'w-full rounded-md border bg-background px-3 py-2 text-sm',
						'focus:outline-none focus:ring-2 focus:ring-primary',
						isSubmitting && 'opacity-50 cursor-not-allowed',
					)}
				/>
				<p className="text-xs text-muted-foreground">Defaults to 30 days if not set</p>
			</div>

			{/* Notes */}
			<div className="space-y-2">
				<label htmlFor="notes" className="block text-sm font-medium">
					Notes (Optional)
				</label>
				<textarea
					id="notes"
					value={formData.notes}
					onChange={e => handleChange('notes', e.target.value)}
					placeholder="Additional context or instructions for the recipient..."
					rows={4}
					disabled={isSubmitting}
					className={cn(
						'w-full rounded-md border bg-background px-3 py-2 text-sm',
						'focus:outline-none focus:ring-2 focus:ring-primary',
						'resize-y',
						isSubmitting && 'opacity-50 cursor-not-allowed',
					)}
				/>
			</div>

			{/* Actions */}
			<div className="flex justify-end gap-3 border-t pt-4">
				<button
					type="button"
					onClick={onCancel}
					disabled={isSubmitting}
					className={cn(
						'px-4 py-2 text-sm font-medium rounded-md',
						'border bg-background hover:bg-muted',
						'transition-colors',
						isSubmitting && 'opacity-50 cursor-not-allowed',
					)}
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isSubmitting}
					className={cn(
						'px-4 py-2 text-sm font-medium rounded-md',
						'bg-primary text-primary-foreground hover:bg-primary/90',
						'transition-colors',
						isSubmitting && 'opacity-50 cursor-not-allowed',
					)}
				>
					{isSubmitting ? 'Creating...' : 'Create Proposal'}
				</button>
			</div>
		</form>
	)
}
