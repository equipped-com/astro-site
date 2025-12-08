'use client'

import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { EmployeeInfo } from '@/types'

interface OnboardingStep1Props {
	initialData: EmployeeInfo
	onContinue: (data: EmployeeInfo) => void
}

export default function OnboardingStep1({ initialData, onContinue }: OnboardingStep1Props) {
	const [formData, setFormData] = useState<EmployeeInfo>(initialData)
	const [errors, setErrors] = useState<Partial<Record<keyof EmployeeInfo, string>>>({})

	function handleChange(field: keyof EmployeeInfo, value: string | Date) {
		setFormData({ ...formData, [field]: value })
		// Clear error when user types
		if (errors[field]) {
			setErrors({ ...errors, [field]: undefined })
		}
	}

	function validateForm(): boolean {
		const newErrors: Partial<Record<keyof EmployeeInfo, string>> = {}

		if (!formData.firstName.trim()) {
			newErrors.firstName = 'First name is required'
		}
		if (!formData.lastName.trim()) {
			newErrors.lastName = 'Last name is required'
		}
		if (!formData.email.trim()) {
			newErrors.email = 'Email is required'
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = 'Invalid email address'
		}
		if (!formData.role.trim()) {
			newErrors.role = 'Role is required'
		}
		if (!formData.department.trim()) {
			newErrors.department = 'Department is required'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	function handleContinue() {
		if (validateForm()) {
			onContinue(formData)
		}
	}

	return (
		<div className="w-full max-w-2xl mx-auto">
			<h3 className="text-xl font-semibold mb-6">Employee Information</h3>

			<div className="space-y-4">
				{/* Name fields */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label htmlFor="firstName" className="block text-sm font-medium mb-2">
							First Name <span className="text-red-500">*</span>
						</label>
						<input
							id="firstName"
							type="text"
							value={formData.firstName}
							onChange={e => handleChange('firstName', e.target.value)}
							className={cn(
								'w-full rounded-md border px-3 py-2 text-sm',
								'focus:outline-none focus:ring-2 focus:ring-primary',
								errors.firstName ? 'border-red-500' : 'border-border',
							)}
							placeholder="Alice"
						/>
						{errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
					</div>

					<div>
						<label htmlFor="lastName" className="block text-sm font-medium mb-2">
							Last Name <span className="text-red-500">*</span>
						</label>
						<input
							id="lastName"
							type="text"
							value={formData.lastName}
							onChange={e => handleChange('lastName', e.target.value)}
							className={cn(
								'w-full rounded-md border px-3 py-2 text-sm',
								'focus:outline-none focus:ring-2 focus:ring-primary',
								errors.lastName ? 'border-red-500' : 'border-border',
							)}
							placeholder="Smith"
						/>
						{errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
					</div>
				</div>

				{/* Email */}
				<div>
					<label htmlFor="email" className="block text-sm font-medium mb-2">
						Email <span className="text-red-500">*</span>
					</label>
					<input
						id="email"
						type="email"
						value={formData.email}
						onChange={e => handleChange('email', e.target.value)}
						className={cn(
							'w-full rounded-md border px-3 py-2 text-sm',
							'focus:outline-none focus:ring-2 focus:ring-primary',
							errors.email ? 'border-red-500' : 'border-border',
						)}
						placeholder="alice@company.com"
					/>
					{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
				</div>

				{/* Phone (optional) */}
				<div>
					<label htmlFor="phone" className="block text-sm font-medium mb-2">
						Phone
					</label>
					<input
						id="phone"
						type="tel"
						value={formData.phone || ''}
						onChange={e => handleChange('phone', e.target.value)}
						className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						placeholder="+1 (555) 123-4567"
					/>
				</div>

				{/* Start Date */}
				<div>
					<label htmlFor="startDate" className="block text-sm font-medium mb-2">
						Start Date <span className="text-red-500">*</span>
					</label>
					<input
						id="startDate"
						type="date"
						value={formData.startDate instanceof Date ? formData.startDate.toISOString().split('T')[0] : ''}
						onChange={e => handleChange('startDate', new Date(e.target.value))}
						className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					/>
					<p className="text-xs text-muted-foreground mt-1">
						Equipment will be scheduled for delivery before this date
					</p>
				</div>

				{/* Role and Department */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label htmlFor="role" className="block text-sm font-medium mb-2">
							Role <span className="text-red-500">*</span>
						</label>
						<input
							id="role"
							type="text"
							value={formData.role}
							onChange={e => handleChange('role', e.target.value)}
							className={cn(
								'w-full rounded-md border px-3 py-2 text-sm',
								'focus:outline-none focus:ring-2 focus:ring-primary',
								errors.role ? 'border-red-500' : 'border-border',
							)}
							placeholder="Software Engineer"
						/>
						{errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
					</div>

					<div>
						<label htmlFor="department" className="block text-sm font-medium mb-2">
							Department <span className="text-red-500">*</span>
						</label>
						<input
							id="department"
							type="text"
							value={formData.department}
							onChange={e => handleChange('department', e.target.value)}
							className={cn(
								'w-full rounded-md border px-3 py-2 text-sm',
								'focus:outline-none focus:ring-2 focus:ring-primary',
								errors.department ? 'border-red-500' : 'border-border',
							)}
							placeholder="Engineering"
						/>
						{errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
					</div>
				</div>

				{/* Title (optional) */}
				<div>
					<label htmlFor="title" className="block text-sm font-medium mb-2">
						Job Title
					</label>
					<input
						id="title"
						type="text"
						value={formData.title || ''}
						onChange={e => handleChange('title', e.target.value)}
						className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						placeholder="Senior Software Engineer"
					/>
				</div>
			</div>

			{/* Continue Button */}
			<div className="flex justify-end mt-6">
				<button
					type="button"
					onClick={handleContinue}
					className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
				>
					Continue
					<ArrowRight className="h-4 w-4" />
				</button>
			</div>
		</div>
	)
}
