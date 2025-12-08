'use client'

import { X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Person {
	id: string
	first_name: string
	last_name: string
	email: string | null
	phone: string | null
	title: string | null
	department: string | null
	location: string | null
	status: 'active' | 'onboarding' | 'offboarding' | 'departed'
	has_platform_access: number
	device_count: number
}

interface AddPersonModalProps {
	isOpen: boolean
	onClose: () => void
	onSuccess: (person: Person) => void
}

export default function AddPersonModal({ isOpen, onClose, onSuccess }: AddPersonModalProps) {
	const [formData, setFormData] = useState({
		first_name: '',
		last_name: '',
		email: '',
		phone: '',
		title: '',
		department: '',
		location: '',
		status: 'active' as const,
	})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		})
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)

		// Validate required fields
		if (!formData.first_name.trim() || !formData.last_name.trim()) {
			setError('First name and last name are required')
			return
		}

		try {
			setIsSubmitting(true)
			const response = await fetch('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					first_name: formData.first_name.trim(),
					last_name: formData.last_name.trim(),
					email: formData.email.trim() || null,
					phone: formData.phone.trim() || null,
					title: formData.title.trim() || null,
					department: formData.department.trim() || null,
					location: formData.location.trim() || null,
					status: formData.status,
				}),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to create person')
			}

			const data = await response.json()
			onSuccess(data.person)

			// Reset form
			setFormData({
				first_name: '',
				last_name: '',
				email: '',
				phone: '',
				title: '',
				department: '',
				location: '',
				status: 'active',
			})
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create person')
		} finally {
			setIsSubmitting(false)
		}
	}

	function handleClose() {
		if (!isSubmitting) {
			setFormData({
				first_name: '',
				last_name: '',
				email: '',
				phone: '',
				title: '',
				department: '',
				location: '',
				status: 'active',
			})
			setError(null)
			onClose()
		}
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-2xl rounded-lg bg-background shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-6 py-4">
					<h2 className="text-xl font-semibold">Add New Person</h2>
					<button
						type="button"
						onClick={handleClose}
						disabled={isSubmitting}
						className="rounded-md p-1 hover:bg-muted disabled:opacity-50"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6">
					{error && (
						<div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
					)}

					<div className="grid gap-4 sm:grid-cols-2">
						{/* First Name */}
						<div>
							<label htmlFor="first_name" className="block text-sm font-medium mb-1">
								First Name <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="first_name"
								name="first_name"
								value={formData.first_name}
								onChange={handleChange}
								required
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>

						{/* Last Name */}
						<div>
							<label htmlFor="last_name" className="block text-sm font-medium mb-1">
								Last Name <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="last_name"
								name="last_name"
								value={formData.last_name}
								onChange={handleChange}
								required
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>

						{/* Email */}
						<div>
							<label htmlFor="email" className="block text-sm font-medium mb-1">
								Email
							</label>
							<input
								type="email"
								id="email"
								name="email"
								value={formData.email}
								onChange={handleChange}
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>

						{/* Phone */}
						<div>
							<label htmlFor="phone" className="block text-sm font-medium mb-1">
								Phone
							</label>
							<input
								type="tel"
								id="phone"
								name="phone"
								value={formData.phone}
								onChange={handleChange}
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>

						{/* Title */}
						<div>
							<label htmlFor="title" className="block text-sm font-medium mb-1">
								Job Title
							</label>
							<input
								type="text"
								id="title"
								name="title"
								value={formData.title}
								onChange={handleChange}
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>

						{/* Department */}
						<div>
							<label htmlFor="department" className="block text-sm font-medium mb-1">
								Department
							</label>
							<input
								type="text"
								id="department"
								name="department"
								value={formData.department}
								onChange={handleChange}
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>

						{/* Location */}
						<div>
							<label htmlFor="location" className="block text-sm font-medium mb-1">
								Location
							</label>
							<input
								type="text"
								id="location"
								name="location"
								value={formData.location}
								onChange={handleChange}
								placeholder="e.g., San Francisco, CA"
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>

						{/* Status */}
						<div>
							<label htmlFor="status" className="block text-sm font-medium mb-1">
								Status
							</label>
							<select
								id="status"
								name="status"
								value={formData.status}
								onChange={handleChange}
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							>
								<option value="active">Active</option>
								<option value="onboarding">Onboarding</option>
								<option value="offboarding">Offboarding</option>
								<option value="departed">Departed</option>
							</select>
						</div>
					</div>

					{/* Note about platform access */}
					<div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
						<p className="font-medium">Platform Access</p>
						<p className="mt-1 text-xs">
							This person will be added to the directory without platform login access. You can grant access later by
							inviting them as a user.
						</p>
					</div>

					{/* Actions */}
					<div className="mt-6 flex justify-end gap-3">
						<button
							type="button"
							onClick={handleClose}
							disabled={isSubmitting}
							className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className={cn(
								'rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90',
								'disabled:opacity-50 disabled:cursor-not-allowed',
							)}
						>
							{isSubmitting ? 'Adding...' : 'Add Person'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
