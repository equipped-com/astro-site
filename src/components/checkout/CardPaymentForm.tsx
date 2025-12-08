import { CreditCard, Loader2, Lock } from 'lucide-react'
import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import type { CardPaymentData, CardPaymentFormProps } from './types'
import { formatCurrency } from './types'

/**
 * CardPaymentForm Component
 *
 * Displays a card payment interface for checkout.
 * In production, this would integrate with Stripe Elements:
 * - Load Stripe.js
 * - Create PaymentIntent on backend
 * - Mount CardElement or PaymentElement
 * - Handle payment confirmation
 *
 * For now, this is a UI implementation that simulates the payment flow.
 * The actual Stripe integration requires:
 * 1. @stripe/stripe-js and @stripe/react-stripe-js packages
 * 2. Backend endpoint to create PaymentIntent
 * 3. Stripe publishable key in environment
 */
export function CardPaymentForm({ amount, onSuccess, onError, disabled = false }: CardPaymentFormProps) {
	const [isProcessing, setIsProcessing] = useState(false)
	const [cardNumber, setCardNumber] = useState('')
	const [expiry, setExpiry] = useState('')
	const [cvc, setCvc] = useState('')
	const [cardError, setCardError] = useState<string | null>(null)

	// Format card number with spaces (XXXX XXXX XXXX XXXX)
	const handleCardNumberChange = useCallback((value: string) => {
		const digits = value.replace(/\D/g, '')
		const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19)
		setCardNumber(formatted)
		setCardError(null)
	}, [])

	// Format expiry (MM/YY)
	const handleExpiryChange = useCallback((value: string) => {
		const digits = value.replace(/\D/g, '')
		let formatted = digits
		if (digits.length >= 2) {
			formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
		}
		setExpiry(formatted)
		setCardError(null)
	}, [])

	// CVC - just digits, max 4
	const handleCvcChange = useCallback((value: string) => {
		const digits = value.replace(/\D/g, '').slice(0, 4)
		setCvc(digits)
		setCardError(null)
	}, [])

	const validateCard = useCallback((): boolean => {
		const cardDigits = cardNumber.replace(/\s/g, '')

		if (cardDigits.length < 13 || cardDigits.length > 19) {
			setCardError('Please enter a valid card number')
			return false
		}

		const [month, year] = expiry.split('/')
		if (!month || !year || month.length !== 2 || year.length !== 2) {
			setCardError('Please enter a valid expiry date (MM/YY)')
			return false
		}

		const monthNum = parseInt(month, 10)
		if (monthNum < 1 || monthNum > 12) {
			setCardError('Invalid expiry month')
			return false
		}

		if (cvc.length < 3) {
			setCardError('Please enter a valid CVC')
			return false
		}

		return true
	}, [cardNumber, expiry, cvc])

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()

			if (disabled || isProcessing) return

			if (!validateCard()) return

			setIsProcessing(true)
			setCardError(null)

			try {
				// In production, this would:
				// 1. Create PaymentIntent on backend: POST /api/payments/create-intent
				// 2. Confirm payment with Stripe: stripe.confirmCardPayment()
				// 3. Handle 3D Secure if required
				// 4. Return payment result

				// Simulated processing delay
				await new Promise(resolve => setTimeout(resolve, 2000))

				// Simulate successful payment
				const mockResult: CardPaymentData = {
					paymentIntentId: `pi_${Date.now()}_xxx`,
					paymentMethodId: `pm_${Date.now()}_xxx`,
				}

				onSuccess(mockResult)
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Payment failed'
				setCardError(errorMessage)
				onError(error instanceof Error ? error : new Error(errorMessage))
			} finally {
				setIsProcessing(false)
			}
		},
		[disabled, isProcessing, validateCard, onSuccess, onError],
	)

	const inputClasses = cn(
		'w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm',
		'placeholder:text-muted-foreground',
		'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
		'disabled:cursor-not-allowed disabled:opacity-50',
		'transition-colors',
	)

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{/* Amount Display */}
			<div className="rounded-lg border border-border bg-card p-4">
				<div className="flex items-center justify-between">
					<span className="text-sm text-muted-foreground">Amount to pay</span>
					<span className="text-lg font-semibold text-foreground">{formatCurrency(amount)}</span>
				</div>
			</div>

			{/* Card Form */}
			<div className="space-y-3">
				{/* Card Number */}
				<div>
					<label htmlFor="card-number" className="block text-sm font-medium text-foreground mb-1.5">
						Card number
					</label>
					<div className="relative">
						<CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<input
							id="card-number"
							type="text"
							inputMode="numeric"
							autoComplete="cc-number"
							value={cardNumber}
							onChange={e => handleCardNumberChange(e.target.value)}
							placeholder="4242 4242 4242 4242"
							disabled={disabled || isProcessing}
							className={cn(inputClasses, 'pl-10')}
						/>
					</div>
				</div>

				{/* Expiry and CVC */}
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label htmlFor="expiry" className="block text-sm font-medium text-foreground mb-1.5">
							Expiry date
						</label>
						<input
							id="expiry"
							type="text"
							inputMode="numeric"
							autoComplete="cc-exp"
							value={expiry}
							onChange={e => handleExpiryChange(e.target.value)}
							placeholder="MM/YY"
							disabled={disabled || isProcessing}
							className={inputClasses}
						/>
					</div>
					<div>
						<label htmlFor="cvc" className="block text-sm font-medium text-foreground mb-1.5">
							CVC
						</label>
						<input
							id="cvc"
							type="text"
							inputMode="numeric"
							autoComplete="cc-csc"
							value={cvc}
							onChange={e => handleCvcChange(e.target.value)}
							placeholder="123"
							disabled={disabled || isProcessing}
							className={inputClasses}
						/>
					</div>
				</div>
			</div>

			{/* Error Message */}
			{cardError && (
				<p className="text-sm text-destructive" role="alert">
					{cardError}
				</p>
			)}

			{/* Submit Button */}
			<button
				type="submit"
				disabled={disabled || isProcessing}
				className={cn(
					'w-full flex items-center justify-center gap-2',
					'rounded-md px-4 py-3 text-sm font-medium',
					'bg-primary text-primary-foreground',
					'hover:bg-primary/90',
					'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
					'disabled:opacity-50 disabled:cursor-not-allowed',
					'transition-colors',
				)}
			>
				{isProcessing ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						Processing...
					</>
				) : (
					<>
						<Lock className="h-4 w-4" />
						Place order
					</>
				)}
			</button>

			{/* Security Notice */}
			<div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
				<Lock className="h-3 w-3" />
				<span>Secured by Stripe. Your payment info is encrypted.</span>
			</div>

			{/* Test Card Hint (dev only) */}
			{process.env.NODE_ENV !== 'production' && (
				<p className="text-xs text-muted-foreground text-center border-t border-border pt-3">
					Test mode: Use card 4242 4242 4242 4242, any future expiry, any CVC
				</p>
			)}
		</form>
	)
}
