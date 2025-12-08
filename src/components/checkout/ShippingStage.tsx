'use client'

import { ArrowRight, Mail, MapPin } from 'lucide-react'
import { useState } from 'react'
import type { AddressData, ValidationError } from '@/lib/address-validation'
import { isAddressComplete } from '@/lib/address-validation'
import { cn } from '@/lib/utils'
import type { ShippingData, TeamMember } from '@/types'
import AddressAutocomplete from './AddressAutocomplete'
import AddressForm from './AddressForm'
import RequestInfoEmail from './RequestInfoEmail'

interface ShippingStageProps {
	assignedPerson?: TeamMember | null
	initialShipping?: ShippingData
	onContinue: (shipping: ShippingData) => void
	onSendEmailRequest?: (personId: string) => Promise<void>
	buyerEmail?: string
}

type ShippingMode = 'none' | 'assignee' | 'other'

export default function ShippingStage({
	assignedPerson,
	initialShipping,
	onContinue,
	onSendEmailRequest,
	buyerEmail,
}: ShippingStageProps) {
	const [mode, setMode] = useState<ShippingMode>(
		initialShipping?.useAssigneeAddress ? 'assignee' : initialShipping?.address ? 'other' : 'none',
	)
	const [useAutocomplete, setUseAutocomplete] = useState(true)
	const [autocompleteValue, setAutocompleteValue] = useState('')
	const [address, setAddress] = useState<Partial<AddressData>>(initialShipping?.address || {})
	const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
	const [showValidation, setShowValidation] = useState(false)

	// Determine if assignee address option is available
	const hasAssigneeAddress = assignedPerson?.hasAddress && assignedPerson?.hasPhone

	function handleModeChange(newMode: ShippingMode) {
		setMode(newMode)
		setShowValidation(false)

		if (newMode === 'assignee' && assignedPerson) {
			// Pre-populate from assignee (mock data for now)
			const assigneeAddress: Partial<AddressData> = {
				firstName: assignedPerson.name.split(' ')[0] || '',
				lastName: assignedPerson.name.split(' ').slice(1).join(' ') || '',
				email: assignedPerson.email,
				// In real app, would fetch full address from backend
			}
			setAddress(assigneeAddress)
		} else if (newMode === 'other') {
			// Clear address for manual entry
			setAddress({})
		}
	}

	function handleAddressSelect(selectedAddress: Partial<AddressData>) {
		setAddress(prev => ({ ...prev, ...selectedAddress }))
		setAutocompleteValue('')
		setUseAutocomplete(false) // Switch to form view after selection
	}

	function handleContinue() {
		// Validate if using custom address
		if (mode === 'other') {
			if (!isAddressComplete(address)) {
				setShowValidation(true)
				return
			}
		}

		// Prepare shipping data
		const shipping: ShippingData = {
			useAssigneeAddress: mode === 'assignee',
			address: mode === 'other' ? (address as AddressData) : undefined,
		}

		onContinue(shipping)
	}

	// Check if can continue
	const canContinue = mode === 'assignee' ? hasAssigneeAddress : mode === 'other' ? isAddressComplete(address) : false

	return (
		<div className="w-full max-w-2xl mx-auto">
			{/* Stage Header */}
			<div className="mb-6">
				<div className="flex items-center gap-3 mb-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
						2
					</div>
					<h2 className="text-lg font-semibold">Shipping Details</h2>
				</div>
				<div className="border-b border-border" />
			</div>

			{/* Question */}
			<h3 className="text-xl font-semibold mb-6">Where should we send the order?</h3>

			{/* Shipping Options */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
				{/* To Assignee's Address */}
				{assignedPerson && (
					<button
						type="button"
						onClick={() => handleModeChange('assignee')}
						disabled={!hasAssigneeAddress}
						className={cn(
							'flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all',
							'hover:border-primary hover:bg-accent',
							mode === 'assignee' ? 'border-primary bg-accent' : 'border-border',
							!hasAssigneeAddress && 'opacity-50 cursor-not-allowed',
						)}
					>
						<MapPin className="h-8 w-8 text-primary" />
						<span className="font-medium">To {assignedPerson.name.split(' ')[0]}'s address</span>
						{!hasAssigneeAddress && (
							<span className="text-xs text-muted-foreground text-center">Address info needed</span>
						)}
					</button>
				)}

				{/* To Another Address */}
				<button
					type="button"
					onClick={() => handleModeChange('other')}
					className={cn(
						'flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all',
						'hover:border-primary hover:bg-accent',
						mode === 'other' ? 'border-primary bg-accent' : 'border-border',
					)}
				>
					<MapPin className="h-8 w-8 text-muted-foreground" />
					<span className="font-medium">To another address</span>
				</button>
			</div>

			{/* Request Info Email (if assignee has missing info) */}
			{mode === 'assignee' && assignedPerson && !hasAssigneeAddress && onSendEmailRequest && (
				<div className="mb-6">
					<RequestInfoEmail person={assignedPerson} onSendEmail={onSendEmailRequest} />
				</div>
			)}

			{/* Assignee Address Display */}
			{mode === 'assignee' && hasAssigneeAddress && assignedPerson && (
				<div className="mb-6 rounded-lg border border-border bg-accent/50 p-4">
					<div className="flex items-start gap-3">
						<MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
						<div className="flex-1">
							<div className="font-medium text-sm">{assignedPerson.name}</div>
							<div className="text-xs text-muted-foreground">{assignedPerson.email}</div>
							<div className="text-xs text-muted-foreground mt-1">Address on file will be used</div>
						</div>
					</div>
				</div>
			)}

			{/* Address Entry (Another Address Mode) */}
			{mode === 'other' && (
				<div className="mb-6">
					{useAutocomplete ? (
						<>
							<AddressAutocomplete
								value={autocompleteValue}
								onChange={setAutocompleteValue}
								onAddressSelect={handleAddressSelect}
								onManualEntry={() => setUseAutocomplete(false)}
								placeholder="Start typing an address..."
							/>
						</>
					) : (
						<>
							<div className="flex items-center justify-between mb-4">
								<h4 className="text-sm font-medium">Enter shipping details</h4>
								<button
									type="button"
									onClick={() => setUseAutocomplete(true)}
									className="text-xs text-primary hover:underline"
								>
									Use address lookup
								</button>
							</div>
							<AddressForm
								address={address}
								onChange={setAddress}
								onValidate={setValidationErrors}
								showValidation={showValidation}
							/>
						</>
					)}
				</div>
			)}

			{/* Dual Email Notification Notice */}
			{mode === 'other' && buyerEmail && address.email && address.email !== buyerEmail && (
				<div className="mb-6 rounded-lg border border-border bg-muted p-4">
					<div className="flex items-start gap-3">
						<Mail className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
						<div className="flex-1">
							<p className="text-sm">
								Order updates will be sent to <strong>{address.email}</strong>
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								You'll also receive updates at <strong>{buyerEmail}</strong>
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Validation Error Summary */}
			{showValidation && validationErrors.length > 0 && (
				<div className="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4">
					<p className="text-sm text-destructive font-medium mb-2">Please fix the following errors:</p>
					<ul className="text-xs text-destructive space-y-1">
						{validationErrors.map(error => (
							<li key={error.field}>• {error.message}</li>
						))}
					</ul>
				</div>
			)}

			{/* Continue Button */}
			<div className="flex justify-end">
				<button
					type="button"
					onClick={handleContinue}
					disabled={!canContinue}
					className={cn(
						'inline-flex items-center gap-2 rounded-lg px-6 py-3',
						'text-sm font-medium transition-colors',
						'bg-primary text-primary-foreground hover:bg-primary/90',
						'disabled:opacity-50 disabled:cursor-not-allowed',
					)}
				>
					Continue
					<ArrowRight className="h-4 w-4" />
				</button>
			</div>
		</div>
	)
}
