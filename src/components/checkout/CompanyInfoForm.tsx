import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { CompanyInfo, CompanyInfoFormProps } from './types'
import { validateCompanyInfo, validateEIN, validateEmail } from './types'

interface FieldError {
	[key: string]: string | undefined
}

export function CompanyInfoForm({ initialData, onChange, disabled = false }: CompanyInfoFormProps) {
	const [formData, setFormData] = useState<Partial<CompanyInfo>>({
		legalName: initialData?.legalName ?? '',
		ein: initialData?.ein ?? '',
		contactName: initialData?.contactName ?? '',
		contactEmail: initialData?.contactEmail ?? '',
		address: {
			street: initialData?.address?.street ?? '',
			apartment: initialData?.address?.apartment ?? '',
			city: initialData?.address?.city ?? '',
			state: initialData?.address?.state ?? '',
			zipCode: initialData?.address?.zipCode ?? '',
			country: initialData?.address?.country ?? 'USA',
		},
	})

	const [errors, setErrors] = useState<FieldError>({})
	const [touched, setTouched] = useState<Set<string>>(new Set())

	const validateField = useCallback((name: string, value: string): string | undefined => {
		switch (name) {
			case 'legalName':
				return !value.trim() ? 'Company legal name is required' : undefined
			case 'ein':
				if (!value.trim()) return 'EIN is required'
				if (!validateEIN(value)) return 'EIN must be in format XX-XXXXXXX'
				return undefined
			case 'contactName':
				return !value.trim() ? 'Contact name is required' : undefined
			case 'contactEmail':
				if (!value.trim()) return 'Contact email is required'
				if (!validateEmail(value)) return 'Invalid email format'
				return undefined
			case 'address.street':
				return !value.trim() ? 'Registered business address is required' : undefined
			case 'address.city':
				return !value.trim() ? 'City is required' : undefined
			case 'address.state':
				return !value.trim() ? 'State is required' : undefined
			case 'address.zipCode':
				return !value.trim() ? 'ZIP code is required' : undefined
			case 'address.country':
				return !value.trim() ? 'Country is required' : undefined
			default:
				return undefined
		}
	}, [])

	const handleChange = useCallback(
		(name: string, value: string) => {
			setFormData(prev => {
				if (name.startsWith('address.')) {
					const addressField = name.replace('address.', '')
					return {
						...prev,
						address: {
							...prev.address,
							street: prev.address?.street ?? '',
							city: prev.address?.city ?? '',
							state: prev.address?.state ?? '',
							zipCode: prev.address?.zipCode ?? '',
							country: prev.address?.country ?? 'USA',
							[addressField]: value,
						},
					}
				}
				return { ...prev, [name]: value }
			})

			// Clear error when user starts typing
			if (touched.has(name)) {
				const error = validateField(name, value)
				setErrors(prev => ({ ...prev, [name]: error }))
			}
		},
		[touched, validateField],
	)

	const handleBlur = useCallback(
		(name: string) => {
			setTouched(prev => new Set([...prev, name]))

			const value = name.startsWith('address.')
				? (formData.address?.[name.replace('address.', '') as keyof CompanyInfo['address']] ?? '')
				: ((formData[name as keyof CompanyInfo] as string) ?? '')

			const error = validateField(name, value)
			setErrors(prev => ({ ...prev, [name]: error }))
		},
		[formData, validateField],
	)

	// Format EIN as user types (XX-XXXXXXX)
	const handleEINChange = useCallback(
		(value: string) => {
			// Remove non-digits
			const digits = value.replace(/\D/g, '')

			// Format with hyphen after first 2 digits
			let formatted = digits
			if (digits.length > 2) {
				formatted = `${digits.slice(0, 2)}-${digits.slice(2, 9)}`
			}

			handleChange('ein', formatted)
		},
		[handleChange],
	)

	// Notify parent of changes
	useEffect(() => {
		const validationErrors = validateCompanyInfo(formData)
		const isValid = validationErrors.length === 0

		// Only call onChange if we have complete data structure
		if (formData.address) {
			const completeData: CompanyInfo = {
				legalName: formData.legalName ?? '',
				ein: formData.ein ?? '',
				contactName: formData.contactName ?? '',
				contactEmail: formData.contactEmail ?? '',
				address: {
					street: formData.address.street ?? '',
					apartment: formData.address.apartment,
					city: formData.address.city ?? '',
					state: formData.address.state ?? '',
					zipCode: formData.address.zipCode ?? '',
					country: formData.address.country ?? 'USA',
				},
			}
			onChange(completeData, isValid)
		}
	}, [formData, onChange])

	const inputClasses = cn(
		'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
		'placeholder:text-muted-foreground',
		'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
		'disabled:cursor-not-allowed disabled:opacity-50',
		'transition-colors',
	)

	const labelClasses = 'block text-sm font-medium text-foreground mb-1.5'

	const errorClasses = 'text-xs text-destructive mt-1'

	return (
		<div className="space-y-4">
			{/* Company Legal Name */}
			<div>
				<label htmlFor="legalName" className={labelClasses}>
					Company legal name <span className="text-destructive">*</span>
				</label>
				<input
					id="legalName"
					type="text"
					value={formData.legalName ?? ''}
					onChange={e => handleChange('legalName', e.target.value)}
					onBlur={() => handleBlur('legalName')}
					placeholder="Acme Corporation"
					disabled={disabled}
					className={cn(inputClasses, errors.legalName && touched.has('legalName') && 'border-destructive')}
					aria-invalid={!!errors.legalName}
					aria-describedby={errors.legalName ? 'legalName-error' : undefined}
				/>
				{errors.legalName && touched.has('legalName') && (
					<p id="legalName-error" className={errorClasses}>
						{errors.legalName}
					</p>
				)}
			</div>

			{/* EIN */}
			<div>
				<label htmlFor="ein" className={labelClasses}>
					EIN <span className="text-destructive">*</span>
				</label>
				<input
					id="ein"
					type="text"
					value={formData.ein ?? ''}
					onChange={e => handleEINChange(e.target.value)}
					onBlur={() => handleBlur('ein')}
					placeholder="12-3456789"
					disabled={disabled}
					maxLength={10}
					className={cn(inputClasses, errors.ein && touched.has('ein') && 'border-destructive')}
					aria-invalid={!!errors.ein}
					aria-describedby={errors.ein ? 'ein-error' : undefined}
				/>
				{errors.ein && touched.has('ein') && (
					<p id="ein-error" className={errorClasses}>
						{errors.ein}
					</p>
				)}
			</div>

			{/* Contact Name */}
			<div>
				<label htmlFor="contactName" className={labelClasses}>
					Contact name <span className="text-destructive">*</span>
				</label>
				<input
					id="contactName"
					type="text"
					value={formData.contactName ?? ''}
					onChange={e => handleChange('contactName', e.target.value)}
					onBlur={() => handleBlur('contactName')}
					placeholder="John Smith"
					disabled={disabled}
					className={cn(inputClasses, errors.contactName && touched.has('contactName') && 'border-destructive')}
					aria-invalid={!!errors.contactName}
					aria-describedby={errors.contactName ? 'contactName-error' : undefined}
				/>
				{errors.contactName && touched.has('contactName') && (
					<p id="contactName-error" className={errorClasses}>
						{errors.contactName}
					</p>
				)}
			</div>

			{/* Contact Email */}
			<div>
				<label htmlFor="contactEmail" className={labelClasses}>
					Contact email <span className="text-destructive">*</span>
				</label>
				<input
					id="contactEmail"
					type="email"
					value={formData.contactEmail ?? ''}
					onChange={e => handleChange('contactEmail', e.target.value)}
					onBlur={() => handleBlur('contactEmail')}
					placeholder="john@acme.com"
					disabled={disabled}
					className={cn(inputClasses, errors.contactEmail && touched.has('contactEmail') && 'border-destructive')}
					aria-invalid={!!errors.contactEmail}
					aria-describedby={errors.contactEmail ? 'contactEmail-error' : undefined}
				/>
				{errors.contactEmail && touched.has('contactEmail') && (
					<p id="contactEmail-error" className={errorClasses}>
						{errors.contactEmail}
					</p>
				)}
			</div>

			{/* Address Section */}
			<div className="pt-2">
				<h4 className="text-sm font-medium text-foreground mb-3">
					Registered business address <span className="text-destructive">*</span>
				</h4>

				{/* Street Address */}
				<div className="mb-3">
					<input
						id="address.street"
						type="text"
						value={formData.address?.street ?? ''}
						onChange={e => handleChange('address.street', e.target.value)}
						onBlur={() => handleBlur('address.street')}
						placeholder="123 Main St, Suite 100"
						disabled={disabled}
						className={cn(
							inputClasses,
							errors['address.street'] && touched.has('address.street') && 'border-destructive',
						)}
						aria-label="Street address"
						aria-invalid={!!errors['address.street']}
					/>
					{errors['address.street'] && touched.has('address.street') && (
						<p className={errorClasses}>{errors['address.street']}</p>
					)}
				</div>

				{/* Apartment/Suite */}
				<div className="mb-3">
					<input
						id="address.apartment"
						type="text"
						value={formData.address?.apartment ?? ''}
						onChange={e => handleChange('address.apartment', e.target.value)}
						placeholder="Apartment, suite, etc. (optional)"
						disabled={disabled}
						className={inputClasses}
						aria-label="Apartment or suite number"
					/>
				</div>

				{/* City and State */}
				<div className="grid grid-cols-2 gap-3 mb-3">
					<div>
						<input
							id="address.city"
							type="text"
							value={formData.address?.city ?? ''}
							onChange={e => handleChange('address.city', e.target.value)}
							onBlur={() => handleBlur('address.city')}
							placeholder="City"
							disabled={disabled}
							className={cn(
								inputClasses,
								errors['address.city'] && touched.has('address.city') && 'border-destructive',
							)}
							aria-label="City"
							aria-invalid={!!errors['address.city']}
						/>
						{errors['address.city'] && touched.has('address.city') && (
							<p className={errorClasses}>{errors['address.city']}</p>
						)}
					</div>
					<div>
						<input
							id="address.state"
							type="text"
							value={formData.address?.state ?? ''}
							onChange={e => handleChange('address.state', e.target.value)}
							onBlur={() => handleBlur('address.state')}
							placeholder="State"
							disabled={disabled}
							className={cn(
								inputClasses,
								errors['address.state'] && touched.has('address.state') && 'border-destructive',
							)}
							aria-label="State"
							aria-invalid={!!errors['address.state']}
						/>
						{errors['address.state'] && touched.has('address.state') && (
							<p className={errorClasses}>{errors['address.state']}</p>
						)}
					</div>
				</div>

				{/* ZIP and Country */}
				<div className="grid grid-cols-2 gap-3">
					<div>
						<input
							id="address.zipCode"
							type="text"
							value={formData.address?.zipCode ?? ''}
							onChange={e => handleChange('address.zipCode', e.target.value)}
							onBlur={() => handleBlur('address.zipCode')}
							placeholder="ZIP code"
							disabled={disabled}
							className={cn(
								inputClasses,
								errors['address.zipCode'] && touched.has('address.zipCode') && 'border-destructive',
							)}
							aria-label="ZIP code"
							aria-invalid={!!errors['address.zipCode']}
						/>
						{errors['address.zipCode'] && touched.has('address.zipCode') && (
							<p className={errorClasses}>{errors['address.zipCode']}</p>
						)}
					</div>
					<div>
						<input
							id="address.country"
							type="text"
							value={formData.address?.country ?? ''}
							onChange={e => handleChange('address.country', e.target.value)}
							onBlur={() => handleBlur('address.country')}
							placeholder="Country"
							disabled={disabled}
							className={cn(
								inputClasses,
								errors['address.country'] && touched.has('address.country') && 'border-destructive',
							)}
							aria-label="Country"
							aria-invalid={!!errors['address.country']}
						/>
						{errors['address.country'] && touched.has('address.country') && (
							<p className={errorClasses}>{errors['address.country']}</p>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
