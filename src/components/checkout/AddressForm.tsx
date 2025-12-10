'use client'

import { AlertCircle, Building2 } from 'lucide-react'
import { useState } from 'react'
import type { AddressData, ValidationError } from '@/lib/address-validation'
import { formatPhoneNumber, validateAddress } from '@/lib/address-validation'
import { cn } from '@/lib/utils'

interface AddressFormProps {
	address: Partial<AddressData>
	onChange: (address: Partial<AddressData>) => void
	onValidate?: (errors: ValidationError[]) => void
	showValidation?: boolean
}

/**
 * Manual address entry form with validation
 */
export default function AddressForm({ address, onChange, onValidate, showValidation = false }: AddressFormProps) {
	const [touched, setTouched] = useState<Set<keyof AddressData>>(new Set())
	const [errors, setErrors] = useState<ValidationError[]>([])

	function handleFieldChange(field: keyof AddressData, value: string | boolean) {
		const updated = { ...address, [field]: value }
		onChange(updated)

		// Validate and trigger callback
		const validationErrors = validateAddress(updated)
		setErrors(validationErrors)
		onValidate?.(validationErrors)
	}

	function handleBlur(field: keyof AddressData) {
		setTouched(prev => new Set(prev).add(field))

		// Format phone number on blur
		if (field === 'phone' && address.phone) {
			const formatted = formatPhoneNumber(address.phone)
			handleFieldChange('phone', formatted)
		} else {
			// Run validation even if field wasn't changed
			const validationErrors = validateAddress(address)
			setErrors(validationErrors)
			onValidate?.(validationErrors)
		}
	}

	function getFieldError(field: keyof AddressData): string | undefined {
		if (!showValidation && !touched.has(field)) return undefined
		return errors.find(err => err.field === field)?.message
	}

	const inputClasses = (field: keyof AddressData) =>
		cn(
			'w-full rounded-lg border bg-background px-3 py-2.5 text-sm',
			'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
			'placeholder:text-muted-foreground',
			'transition-colors',
			getFieldError(field) ? 'border-destructive' : 'border-input',
		)

	return (
		<div className="space-y-4">
			{/* Name Fields */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label htmlFor="firstName" className="block text-sm font-medium mb-1.5">
						First name <span className="text-destructive">*</span>
					</label>
					<input
						id="firstName"
						type="text"
						value={address.firstName || ''}
						onChange={e => handleFieldChange('firstName', e.target.value)}
						onBlur={() => handleBlur('firstName')}
						placeholder="John"
						className={inputClasses('firstName')}
					/>
					{getFieldError('firstName') && (
						<p className="mt-1 text-xs text-destructive flex items-center gap-1">
							<AlertCircle className="h-3 w-3" />
							{getFieldError('firstName')}
						</p>
					)}
				</div>

				<div>
					<label htmlFor="lastName" className="block text-sm font-medium mb-1.5">
						Last name <span className="text-destructive">*</span>
					</label>
					<input
						id="lastName"
						type="text"
						value={address.lastName || ''}
						onChange={e => handleFieldChange('lastName', e.target.value)}
						onBlur={() => handleBlur('lastName')}
						placeholder="Doe"
						className={inputClasses('lastName')}
					/>
					{getFieldError('lastName') && (
						<p className="mt-1 text-xs text-destructive flex items-center gap-1">
							<AlertCircle className="h-3 w-3" />
							{getFieldError('lastName')}
						</p>
					)}
				</div>
			</div>

			{/* Address Line 1 */}
			<div>
				<label htmlFor="addressLine1" className="block text-sm font-medium mb-1.5">
					Address <span className="text-destructive">*</span>
				</label>
				<input
					id="addressLine1"
					type="text"
					value={address.addressLine1 || ''}
					onChange={e => handleFieldChange('addressLine1', e.target.value)}
					onBlur={() => handleBlur('addressLine1')}
					placeholder="1 Infinite Loop"
					className={inputClasses('addressLine1')}
				/>
				{getFieldError('addressLine1') && (
					<p className="mt-1 text-xs text-destructive flex items-center gap-1">
						<AlertCircle className="h-3 w-3" />
						{getFieldError('addressLine1')}
					</p>
				)}
			</div>

			{/* Address Line 2 (Optional) */}
			<div>
				<label htmlFor="addressLine2" className="block text-sm font-medium mb-1.5">
					Apartment, suite, etc. <span className="text-muted-foreground text-xs">(optional)</span>
				</label>
				<input
					id="addressLine2"
					type="text"
					value={address.addressLine2 || ''}
					onChange={e => handleFieldChange('addressLine2', e.target.value)}
					placeholder="Apt 123"
					className={inputClasses('addressLine2')}
				/>
			</div>

			{/* City, State, Zip */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="sm:col-span-1">
					<label htmlFor="city" className="block text-sm font-medium mb-1.5">
						City <span className="text-destructive">*</span>
					</label>
					<input
						id="city"
						type="text"
						value={address.city || ''}
						onChange={e => handleFieldChange('city', e.target.value)}
						onBlur={() => handleBlur('city')}
						placeholder="Cupertino"
						className={inputClasses('city')}
					/>
					{getFieldError('city') && (
						<p className="mt-1 text-xs text-destructive flex items-center gap-1">
							<AlertCircle className="h-3 w-3" />
							{getFieldError('city')}
						</p>
					)}
				</div>

				<div className="sm:col-span-1">
					<label htmlFor="state" className="block text-sm font-medium mb-1.5">
						State <span className="text-destructive">*</span>
					</label>
					<input
						id="state"
						type="text"
						value={address.state || ''}
						onChange={e => handleFieldChange('state', e.target.value)}
						onBlur={() => handleBlur('state')}
						placeholder="CA"
						maxLength={2}
						className={inputClasses('state')}
					/>
					{getFieldError('state') && (
						<p className="mt-1 text-xs text-destructive flex items-center gap-1">
							<AlertCircle className="h-3 w-3" />
							{getFieldError('state')}
						</p>
					)}
				</div>

				<div className="sm:col-span-1">
					<label htmlFor="zipCode" className="block text-sm font-medium mb-1.5">
						Zip code <span className="text-destructive">*</span>
					</label>
					<input
						id="zipCode"
						type="text"
						value={address.zipCode || ''}
						onChange={e => handleFieldChange('zipCode', e.target.value)}
						onBlur={() => handleBlur('zipCode')}
						placeholder="95014"
						className={inputClasses('zipCode')}
					/>
					{getFieldError('zipCode') && (
						<p className="mt-1 text-xs text-destructive flex items-center gap-1">
							<AlertCircle className="h-3 w-3" />
							{getFieldError('zipCode')}
						</p>
					)}
				</div>
			</div>

			{/* Country */}
			<div>
				<label htmlFor="country" className="block text-sm font-medium mb-1.5">
					Country <span className="text-destructive">*</span>
				</label>
				<select
					id="country"
					value={address.country || 'US'}
					onChange={e => handleFieldChange('country', e.target.value)}
					onBlur={() => handleBlur('country')}
					className={inputClasses('country')}
				>
					<option value="US">United States</option>
					<option value="CA">Canada</option>
					<option value="GB">United Kingdom</option>
					<option value="AU">Australia</option>
				</select>
				{getFieldError('country') && (
					<p className="mt-1 text-xs text-destructive flex items-center gap-1">
						<AlertCircle className="h-3 w-3" />
						{getFieldError('country')}
					</p>
				)}
			</div>

			{/* Email */}
			<div>
				<label htmlFor="email" className="block text-sm font-medium mb-1.5">
					Email <span className="text-destructive">*</span>
				</label>
				<input
					id="email"
					type="email"
					value={address.email || ''}
					onChange={e => handleFieldChange('email', e.target.value)}
					onBlur={() => handleBlur('email')}
					placeholder="john.doe@example.com"
					className={inputClasses('email')}
				/>
				{getFieldError('email') && (
					<p className="mt-1 text-xs text-destructive flex items-center gap-1">
						<AlertCircle className="h-3 w-3" />
						{getFieldError('email')}
					</p>
				)}
			</div>

			{/* Phone */}
			<div>
				<label htmlFor="phone" className="block text-sm font-medium mb-1.5">
					Phone number <span className="text-destructive">*</span>
				</label>
				<input
					id="phone"
					type="tel"
					value={address.phone || ''}
					onChange={e => handleFieldChange('phone', e.target.value)}
					onBlur={() => handleBlur('phone')}
					placeholder="(555) 123-4567"
					className={inputClasses('phone')}
				/>
				{getFieldError('phone') && (
					<p className="mt-1 text-xs text-destructive flex items-center gap-1">
						<AlertCircle className="h-3 w-3" />
						{getFieldError('phone')}
					</p>
				)}
			</div>

			{/* Business Address Checkbox */}
			<div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
				<input
					id="isBusinessAddress"
					type="checkbox"
					checked={address.isBusinessAddress || false}
					onChange={e => handleFieldChange('isBusinessAddress', e.target.checked)}
					className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
				/>
				<label htmlFor="isBusinessAddress" className="flex-1 cursor-pointer">
					<div className="flex items-center gap-2 font-medium text-sm">
						<Building2 className="h-4 w-4 text-muted-foreground" />
						This is a business address
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						Check this if shipping to a commercial location or office
					</p>
				</label>
			</div>
		</div>
	)
}
