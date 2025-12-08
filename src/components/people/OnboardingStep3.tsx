'use client'

import { AlertTriangle, ArrowLeft, ArrowRight, Calendar, MapPin } from 'lucide-react'
import { useState } from 'react'
import type { AddressData, ValidationError } from '@/lib/address-validation'
import { validateAddress } from '@/lib/address-validation'
import { cn } from '@/lib/utils'
import type { OnboardingDelivery } from '@/types'
import AddressForm from '../checkout/AddressForm'

interface OnboardingStep3Props {
	startDate: Date
	initialDelivery?: OnboardingDelivery
	onContinue: (delivery: OnboardingDelivery) => void
	onBack: () => void
}

export default function OnboardingStep3({ startDate, initialDelivery, onContinue, onBack }: OnboardingStep3Props) {
	// Calculate default delivery date (3 business days before start date)
	const defaultDeliveryDate = new Date(startDate)
	defaultDeliveryDate.setDate(startDate.getDate() - 3)

	const [deliveryDate, setDeliveryDate] = useState<Date>(initialDelivery?.deliveryDate || defaultDeliveryDate)
	const [address, setAddress] = useState<Partial<AddressData>>(
		initialDelivery
			? {
					firstName: '',
					lastName: '',
					addressLine1: initialDelivery.shippingAddress.addressLine1,
					addressLine2: initialDelivery.shippingAddress.addressLine2,
					city: initialDelivery.shippingAddress.city,
					state: initialDelivery.shippingAddress.state,
					zipCode: initialDelivery.shippingAddress.zipCode,
					country: initialDelivery.shippingAddress.country,
					email: '',
					phone: initialDelivery.shippingAddress.phone,
				}
			: {},
	)
	const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
	const [showValidation, setShowValidation] = useState(false)

	// Check if delivery is after start date (warning)
	const isLateDelivery = deliveryDate >= startDate

	function handleDateChange(newDate: Date) {
		setDeliveryDate(newDate)
	}

	function handleContinue() {
		const errors = validateAddress(address)
		setValidationErrors(errors)

		if (errors.length > 0) {
			setShowValidation(true)
			return
		}

		const delivery: OnboardingDelivery = {
			startDate,
			deliveryDate,
			shippingAddress: {
				addressLine1: address.addressLine1!,
				addressLine2: address.addressLine2,
				city: address.city!,
				state: address.state!,
				zipCode: address.zipCode!,
				country: address.country!,
				phone: address.phone!,
			},
		}

		onContinue(delivery)
	}

	return (
		<div className="w-full max-w-2xl mx-auto">
			<h3 className="text-xl font-semibold mb-2">Delivery Details</h3>
			<p className="text-sm text-muted-foreground mb-6">
				Schedule equipment delivery to arrive before the employee's start date
			</p>

			{/* Start Date Display */}
			<div className="mb-6 rounded-lg border border-border bg-accent/50 p-4">
				<div className="flex items-start gap-3">
					<Calendar className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
					<div className="flex-1">
						<div className="font-medium text-sm mb-1">Employee Start Date</div>
						<div className="text-sm text-muted-foreground">{startDate.toLocaleDateString('en-US', {
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}</div>
					</div>
				</div>
			</div>

			{/* Delivery Date Selector */}
			<div className="mb-6">
				<label htmlFor="deliveryDate" className="block text-sm font-medium mb-2">
					Delivery Date <span className="text-red-500">*</span>
				</label>
				<input
					id="deliveryDate"
					type="date"
					value={deliveryDate.toISOString().split('T')[0]}
					onChange={e => handleDateChange(new Date(e.target.value))}
					max={startDate.toISOString().split('T')[0]}
					className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
				/>
				<p className="text-xs text-muted-foreground mt-1">
					Recommended: 2-3 business days before start date for setup and testing
				</p>

				{/* Late Delivery Warning */}
				{isLateDelivery && (
					<div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
						<AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
						<div className="text-sm text-amber-800">
							<div className="font-medium">Delivery after start date</div>
							<div className="text-xs mt-0.5">
								Equipment may not arrive in time for the employee's first day. Consider selecting an earlier
								delivery date.
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Shipping Address */}
			<div className="mb-6">
				<div className="flex items-center gap-2 mb-4">
					<MapPin className="h-5 w-5 text-primary" />
					<h4 className="font-semibold">Shipping Address</h4>
				</div>

				<AddressForm
					address={address}
					onChange={setAddress}
					onValidate={setValidationErrors}
					showValidation={showValidation}
				/>
			</div>

			{/* Navigation Buttons */}
			<div className="flex items-center justify-between">
				<button
					type="button"
					onClick={onBack}
					className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium border border-border hover:bg-accent transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</button>

				<button
					type="button"
					onClick={handleContinue}
					className={cn(
						'inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium',
						'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
					)}
				>
					Continue
					<ArrowRight className="h-4 w-4" />
				</button>
			</div>
		</div>
	)
}
