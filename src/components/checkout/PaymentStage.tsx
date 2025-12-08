import { Building2, ChevronRight, CreditCard } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { CardPaymentForm } from './CardPaymentForm'
import { LeasingForm } from './LeasingForm'
import type { CardPaymentData, LeaseApplication, LeaseTerm, PaymentMethod, PaymentStageProps } from './types'
import { calculateBuyoutAmount, calculateMonthlyPayment, formatCurrency } from './types'

/**
 * PaymentStage Component
 *
 * The fourth and final stage of checkout: "Apply for leasing & place your order"
 *
 * This component handles:
 * - Payment method selection (leasing vs card)
 * - Lease term selection (24 or 36 months)
 * - Company information collection for leasing
 * - Bank verification (Plaid or document upload)
 * - Card payment form for direct purchase
 *
 * Test scenarios from commerce/checkout-payment.md:
 * - @REQ-COM-PAY-001: Leasing selected by default
 * - @REQ-COM-PAY-002: Leasing guarantee messages
 * - @REQ-COM-PAY-003: Complete leasing application with Plaid
 * - @REQ-COM-PAY-004: Complete leasing application with bank statements
 * - @REQ-COM-PAY-005: Company information form validation
 * - @REQ-COM-PAY-006: Switch to card payment
 * - @REQ-COM-PAY-007: 36-month lease option
 */
export function PaymentStage({
	cartTotal,
	onSubmit,
	onPaymentMethodChange,
	initialPaymentMethod = 'leasing',
	initialLeaseTerm = 24,
}: PaymentStageProps) {
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialPaymentMethod)
	const [leaseTerm, setLeaseTerm] = useState<LeaseTerm>(initialLeaseTerm)

	// Calculate current lease details for display
	const monthlyPayment = useMemo(() => calculateMonthlyPayment(cartTotal, leaseTerm), [cartTotal, leaseTerm])

	const buyoutAmount = useMemo(() => calculateBuyoutAmount(cartTotal, leaseTerm), [cartTotal, leaseTerm])

	// Payment method change handler
	const handlePaymentMethodChange = useCallback(
		(method: PaymentMethod) => {
			setPaymentMethod(method)
			onPaymentMethodChange?.(method)
		},
		[onPaymentMethodChange],
	)

	// Leasing form submission
	const handleLeasingSubmit = useCallback(
		async (application: LeaseApplication) => {
			await onSubmit(application)
		},
		[onSubmit],
	)

	// Card payment success
	const handleCardSuccess = useCallback(
		async (data: CardPaymentData) => {
			await onSubmit(data)
		},
		[onSubmit],
	)

	// Card payment error
	const handleCardError = useCallback((error: Error) => {
		console.error('Card payment error:', error)
		// Error handling is done within CardPaymentForm
	}, [])

	return (
		<div className="space-y-6">
			{/* Stage Header */}
			<div>
				<h2 className="text-lg font-semibold text-foreground mb-1">4. Payment</h2>
				<p className="text-sm text-muted-foreground">Apply for leasing & place your order</p>
			</div>

			{/* Payment Method Selection */}
			<div className="grid grid-cols-2 gap-3">
				<PaymentMethodOption
					method="leasing"
					title={`${leaseTerm}-Month Leasing`}
					subtitle={`${formatCurrency(monthlyPayment)}/mo`}
					description={`Return or buy for ${formatCurrency(buyoutAmount)} after ${leaseTerm} mo`}
					icon={<Building2 className="h-5 w-5" />}
					isSelected={paymentMethod === 'leasing'}
					onSelect={() => handlePaymentMethodChange('leasing')}
				/>
				<PaymentMethodOption
					method="card"
					title="Pay with card"
					subtitle={formatCurrency(cartTotal)}
					description="One-time payment"
					icon={<CreditCard className="h-5 w-5" />}
					isSelected={paymentMethod === 'card'}
					onSelect={() => handlePaymentMethodChange('card')}
				/>
			</div>

			{/* Divider */}
			<hr className="border-border" />

			{/* Payment Form based on selection */}
			{paymentMethod === 'leasing' ? (
				<LeasingForm
					cartTotal={cartTotal}
					leaseTerm={leaseTerm}
					onLeaseTermChange={setLeaseTerm}
					onSubmit={handleLeasingSubmit}
				/>
			) : (
				<div className="space-y-4">
					<h3 className="text-base font-semibold text-foreground">Card Payment</h3>
					<CardPaymentForm amount={cartTotal} onSuccess={handleCardSuccess} onError={handleCardError} />
				</div>
			)}
		</div>
	)
}

// Sub-component for payment method option
interface PaymentMethodOptionProps {
	method: PaymentMethod
	title: string
	subtitle: string
	description: string
	icon: React.ReactNode
	isSelected: boolean
	onSelect: () => void
}

function PaymentMethodOption({ title, subtitle, description, icon, isSelected, onSelect }: PaymentMethodOptionProps) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				'relative rounded-lg border p-4 text-left transition-all',
				isSelected
					? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
					: 'border-border hover:border-muted-foreground/50 hover:bg-muted/30',
				'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
			)}
		>
			{/* Selection Indicator */}
			<div
				className={cn(
					'absolute top-3 right-3 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors',
					isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30',
				)}
			>
				{isSelected && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
			</div>

			{/* Content */}
			<div className="pr-8">
				<div
					className={cn(
						'inline-flex items-center justify-center h-10 w-10 rounded-lg mb-3',
						isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
					)}
				>
					{icon}
				</div>

				<p className="font-semibold text-foreground">{title}</p>
				<p className={cn('text-lg font-bold mt-1', isSelected ? 'text-primary' : 'text-foreground')}>{subtitle}</p>
				<p className="text-xs text-muted-foreground mt-1">{description}</p>
			</div>

			{/* Arrow indicator when selected */}
			{isSelected && (
				<div className="absolute bottom-3 right-3">
					<ChevronRight className="h-4 w-4 text-primary" />
				</div>
			)}
		</button>
	)
}

export { CardPaymentForm } from './CardPaymentForm'
// Also export a simpler version for embedding
export { LeasingForm } from './LeasingForm'
