/**
 * Stripe Integration Types
 *
 * Type definitions for Stripe payment processing integration.
 * Follows the same pattern as Shopify integration types.
 */

// ============================================================================
// CHECKOUT SESSION TYPES
// ============================================================================

export interface CreateCheckoutSessionParams {
	/** Account ID for tenant scoping */
	accountId: string
	/** User ID who initiated the checkout */
	userId: string
	/** Order ID this payment is for */
	orderId?: string
	/** Line items for the checkout */
	lineItems: CheckoutLineItem[]
	/** Customer email for receipts */
	customerEmail?: string
	/** Stripe customer ID if exists */
	customerId?: string
	/** Enable Stripe Link for faster checkout */
	enableLink?: boolean
	/** URL to redirect on success */
	successUrl: string
	/** URL to redirect on cancellation */
	cancelUrl: string
	/** Additional metadata to attach to the session */
	metadata?: Record<string, string>
}

export interface CheckoutLineItem {
	/** Product name */
	name: string
	/** Product description */
	description?: string
	/** Unit amount in cents */
	unitAmount: number
	/** Quantity */
	quantity: number
	/** Currency code (default: USD) */
	currency?: string
	/** Product image URLs */
	images?: string[]
}

export interface CheckoutSession {
	/** Stripe checkout session ID */
	id: string
	/** URL to redirect customer to Stripe Checkout */
	url: string
	/** Session status */
	status: 'open' | 'complete' | 'expired'
	/** Payment status */
	paymentStatus: 'unpaid' | 'paid' | 'no_payment_required'
	/** Customer email */
	customerEmail?: string
	/** Amount total in cents */
	amountTotal: number
	/** Currency */
	currency: string
	/** Created timestamp */
	createdAt: string
	/** Expires at timestamp */
	expiresAt: string
	/** Metadata */
	metadata?: Record<string, string>
}

// ============================================================================
// PAYMENT INTENT TYPES
// ============================================================================

export interface PaymentIntent {
	/** Stripe payment intent ID */
	id: string
	/** Amount in cents */
	amount: number
	/** Currency */
	currency: string
	/** Status */
	status: PaymentIntentStatus
	/** Customer ID */
	customerId?: string
	/** Payment method ID */
	paymentMethodId?: string
	/** Client secret for frontend confirmation */
	clientSecret: string
	/** Metadata */
	metadata?: Record<string, string>
	/** Created timestamp */
	createdAt: string
}

export type PaymentIntentStatus =
	| 'requires_payment_method'
	| 'requires_confirmation'
	| 'requires_action'
	| 'processing'
	| 'requires_capture'
	| 'canceled'
	| 'succeeded'

// ============================================================================
// WEBHOOK EVENT TYPES
// ============================================================================

export interface StripeWebhookEvent {
	/** Event ID */
	id: string
	/** Event type */
	type: StripeEventType
	/** Event data */
	data: {
		object: Record<string, unknown>
	}
	/** Created timestamp (Unix) */
	created: number
	/** API version */
	apiVersion: string
	/** Livemode flag */
	livemode: boolean
}

export type StripeEventType =
	| 'checkout.session.completed'
	| 'checkout.session.expired'
	| 'payment_intent.succeeded'
	| 'payment_intent.payment_failed'
	| 'payment_intent.canceled'
	| 'charge.succeeded'
	| 'charge.failed'
	| 'charge.refunded'

// ============================================================================
// PAYMENT RECORD TYPES (Database)
// ============================================================================

export interface PaymentRecord {
	/** Internal payment ID */
	id: string
	/** Account ID (tenant) */
	accountId: string
	/** Order ID this payment is for */
	orderId?: string
	/** Stripe checkout session ID */
	stripeSessionId?: string
	/** Stripe payment intent ID */
	stripePaymentIntentId?: string
	/** Payment status */
	status: PaymentStatus
	/** Amount in cents */
	amount: number
	/** Currency */
	currency: string
	/** Customer email */
	customerEmail?: string
	/** Stripe customer ID */
	stripeCustomerId?: string
	/** Failure reason if applicable */
	failureReason?: string
	/** Created timestamp */
	createdAt: string
	/** Updated timestamp */
	updatedAt: string
}

export type PaymentStatus =
	| 'pending'
	| 'processing'
	| 'succeeded'
	| 'failed'
	| 'canceled'
	| 'refunded'
	| 'partially_refunded'

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface StripeApiResponse<T> {
	success: boolean
	data?: T
	error?: string
	statusCode?: number
	details?: Record<string, unknown>
}

// ============================================================================
// CUSTOMER TYPES
// ============================================================================

export interface StripeCustomer {
	/** Stripe customer ID */
	id: string
	/** Customer email */
	email: string
	/** Customer name */
	name?: string
	/** Metadata */
	metadata?: Record<string, string>
}

// ============================================================================
// PAYMENT STATUS RESPONSE
// ============================================================================

export interface PaymentStatusResponse {
	/** Payment record */
	payment: PaymentRecord
	/** Related checkout session if applicable */
	checkoutSession?: CheckoutSession
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
	return cents / 100
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
	return Math.round(dollars * 100)
}

/**
 * Format amount in cents as currency string
 */
export function formatAmount(amountCents: number, currency = 'USD'): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
	}).format(centsToDollars(amountCents))
}

/**
 * Map Stripe payment intent status to internal payment status
 */
export function mapStripeStatusToPaymentStatus(stripeStatus: PaymentIntentStatus): PaymentStatus {
	switch (stripeStatus) {
		case 'succeeded':
			return 'succeeded'
		case 'canceled':
			return 'canceled'
		case 'processing':
			return 'processing'
		case 'requires_payment_method':
		case 'requires_confirmation':
		case 'requires_action':
		case 'requires_capture':
		default:
			return 'pending'
	}
}

/**
 * Map checkout session payment status to internal payment status
 */
export function mapCheckoutStatusToPaymentStatus(
	sessionStatus: CheckoutSession['status'],
	paymentStatus: CheckoutSession['paymentStatus'],
): PaymentStatus {
	if (paymentStatus === 'paid') return 'succeeded'
	if (sessionStatus === 'expired') return 'canceled'
	return 'pending'
}
