/**
 * Stripe Client
 *
 * Handles communication with Stripe API for payment processing.
 * In production, uses real Stripe SDK. For development, uses mock data.
 *
 * @see https://stripe.com/docs/api
 * @see https://stripe.com/docs/checkout
 */

import Stripe from 'stripe'
import { mockCheckoutSessions, mockCustomers, mockPaymentIntents, mockPaymentRecords } from './mock-data'
import type {
	CheckoutLineItem,
	CheckoutSession,
	CreateCheckoutSessionParams,
	PaymentIntent,
	PaymentRecord,
	StripeApiResponse,
	StripeCustomer,
	StripeWebhookEvent,
} from './types'

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface StripeClientConfig {
	secretKey: string
	webhookSecret?: string
	useMock?: boolean
}

const STRIPE_API_VERSION = '2024-12-18.acacia' as const

// ============================================================================
// CLIENT CLASS
// ============================================================================

export class StripeClient {
	private readonly stripe: Stripe | null
	private readonly webhookSecret: string | undefined
	private readonly useMock: boolean

	constructor(config: StripeClientConfig) {
		this.webhookSecret = config.webhookSecret
		this.useMock = config.useMock ?? !config.secretKey

		if (!this.useMock && config.secretKey) {
			this.stripe = new Stripe(config.secretKey, {
				apiVersion: STRIPE_API_VERSION,
				typescript: true,
			})
		} else {
			this.stripe = null
		}
	}

	// ============================================================================
	// CHECKOUT SESSIONS
	// ============================================================================

	/**
	 * Create a Stripe Checkout Session
	 *
	 * Creates a hosted checkout page for the customer to complete payment.
	 * Supports Stripe Link for faster checkout when enabled.
	 */
	async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<StripeApiResponse<CheckoutSession>> {
		if (this.useMock) {
			return this.mockCreateCheckoutSession(params)
		}

		if (!this.stripe) {
			return { success: false, error: 'Stripe not configured' }
		}

		try {
			const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.lineItems.map(item => ({
				price_data: {
					currency: item.currency || 'usd',
					product_data: {
						name: item.name,
						description: item.description,
						images: item.images,
					},
					unit_amount: item.unitAmount,
				},
				quantity: item.quantity,
			}))

			const sessionParams: Stripe.Checkout.SessionCreateParams = {
				mode: 'payment',
				line_items: lineItems,
				success_url: params.successUrl,
				cancel_url: params.cancelUrl,
				customer_email: params.customerId ? undefined : params.customerEmail,
				customer: params.customerId,
				metadata: {
					...params.metadata,
					accountId: params.accountId,
					userId: params.userId,
					orderId: params.orderId || '',
				},
				payment_method_types: params.enableLink ? ['card', 'link'] : ['card'],
			}

			const session = await this.stripe.checkout.sessions.create(sessionParams)

			return {
				success: true,
				data: this.normalizeCheckoutSession(session),
			}
		} catch (error) {
			console.error('Stripe createCheckoutSession error:', error)
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to create checkout session',
			}
		}
	}

	/**
	 * Retrieve a Checkout Session by ID
	 */
	async getCheckoutSession(sessionId: string): Promise<StripeApiResponse<CheckoutSession>> {
		if (this.useMock) {
			return this.mockGetCheckoutSession(sessionId)
		}

		if (!this.stripe) {
			return { success: false, error: 'Stripe not configured' }
		}

		try {
			const session = await this.stripe.checkout.sessions.retrieve(sessionId)
			return {
				success: true,
				data: this.normalizeCheckoutSession(session),
			}
		} catch (error) {
			console.error('Stripe getCheckoutSession error:', error)
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to retrieve checkout session',
				statusCode: (error as Stripe.errors.StripeError)?.statusCode,
			}
		}
	}

	/**
	 * Expire a Checkout Session (cancel it)
	 */
	async expireCheckoutSession(sessionId: string): Promise<StripeApiResponse<CheckoutSession>> {
		if (this.useMock) {
			return this.mockExpireCheckoutSession(sessionId)
		}

		if (!this.stripe) {
			return { success: false, error: 'Stripe not configured' }
		}

		try {
			const session = await this.stripe.checkout.sessions.expire(sessionId)
			return {
				success: true,
				data: this.normalizeCheckoutSession(session),
			}
		} catch (error) {
			console.error('Stripe expireCheckoutSession error:', error)
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to expire checkout session',
			}
		}
	}

	// ============================================================================
	// PAYMENT INTENTS
	// ============================================================================

	/**
	 * Retrieve a Payment Intent by ID
	 */
	async getPaymentIntent(paymentIntentId: string): Promise<StripeApiResponse<PaymentIntent>> {
		if (this.useMock) {
			return this.mockGetPaymentIntent(paymentIntentId)
		}

		if (!this.stripe) {
			return { success: false, error: 'Stripe not configured' }
		}

		try {
			const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId)
			return {
				success: true,
				data: this.normalizePaymentIntent(intent),
			}
		} catch (error) {
			console.error('Stripe getPaymentIntent error:', error)
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to retrieve payment intent',
				statusCode: (error as Stripe.errors.StripeError)?.statusCode,
			}
		}
	}

	// ============================================================================
	// CUSTOMERS
	// ============================================================================

	/**
	 * Create or retrieve a Stripe Customer
	 */
	async getOrCreateCustomer(
		email: string,
		name?: string,
		metadata?: Record<string, string>,
	): Promise<StripeApiResponse<StripeCustomer>> {
		if (this.useMock) {
			return this.mockGetOrCreateCustomer(email, name, metadata)
		}

		if (!this.stripe) {
			return { success: false, error: 'Stripe not configured' }
		}

		try {
			// Search for existing customer by email
			const customers = await this.stripe.customers.list({ email, limit: 1 })

			if (customers.data.length > 0) {
				const existing = customers.data[0]
				return {
					success: true,
					data: {
						id: existing.id,
						email: existing.email || email,
						name: existing.name || undefined,
						metadata: existing.metadata as Record<string, string>,
					},
				}
			}

			// Create new customer
			const customer = await this.stripe.customers.create({
				email,
				name,
				metadata,
			})

			return {
				success: true,
				data: {
					id: customer.id,
					email: customer.email || email,
					name: customer.name || undefined,
					metadata: customer.metadata as Record<string, string>,
				},
			}
		} catch (error) {
			console.error('Stripe getOrCreateCustomer error:', error)
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to get or create customer',
			}
		}
	}

	// ============================================================================
	// WEBHOOK VERIFICATION
	// ============================================================================

	/**
	 * Verify webhook signature and parse event
	 */
	verifyWebhookSignature(payload: string | Buffer, signature: string): StripeApiResponse<StripeWebhookEvent> {
		if (this.useMock) {
			// In mock mode, just parse the payload as JSON
			try {
				const event = JSON.parse(typeof payload === 'string' ? payload : payload.toString()) as StripeWebhookEvent
				return { success: true, data: event }
			} catch (error) {
				return { success: false, error: 'Invalid webhook payload' }
			}
		}

		if (!this.stripe || !this.webhookSecret) {
			return { success: false, error: 'Webhook verification not configured' }
		}

		try {
			const event = this.stripe.webhooks.constructEvent(
				payload,
				signature,
				this.webhookSecret,
			) as unknown as StripeWebhookEvent

			return { success: true, data: event }
		} catch (error) {
			console.error('Stripe webhook verification error:', error)
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Invalid webhook signature',
			}
		}
	}

	// ============================================================================
	// NORMALIZERS
	// ============================================================================

	private normalizeCheckoutSession(session: Stripe.Checkout.Session): CheckoutSession {
		return {
			id: session.id,
			url: session.url || '',
			status: session.status as CheckoutSession['status'],
			paymentStatus: session.payment_status as CheckoutSession['paymentStatus'],
			customerEmail: session.customer_email || session.customer_details?.email || undefined,
			amountTotal: session.amount_total || 0,
			currency: session.currency || 'usd',
			createdAt: new Date(session.created * 1000).toISOString(),
			expiresAt: new Date(session.expires_at * 1000).toISOString(),
			metadata: session.metadata as Record<string, string>,
		}
	}

	private normalizePaymentIntent(intent: Stripe.PaymentIntent): PaymentIntent {
		return {
			id: intent.id,
			amount: intent.amount,
			currency: intent.currency,
			status: intent.status as PaymentIntent['status'],
			customerId: typeof intent.customer === 'string' ? intent.customer : intent.customer?.id,
			paymentMethodId: typeof intent.payment_method === 'string' ? intent.payment_method : intent.payment_method?.id,
			clientSecret: intent.client_secret || '',
			metadata: intent.metadata as Record<string, string>,
			createdAt: new Date(intent.created * 1000).toISOString(),
		}
	}

	// ============================================================================
	// MOCK IMPLEMENTATIONS
	// ============================================================================

	private mockCreateCheckoutSession(params: CreateCheckoutSessionParams): StripeApiResponse<CheckoutSession> {
		const sessionId = `cs_test_${Date.now()}`
		const totalAmount = params.lineItems.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0)

		const session: CheckoutSession = {
			id: sessionId,
			url: `https://checkout.stripe.com/test/session/${sessionId}`,
			status: 'open',
			paymentStatus: 'unpaid',
			customerEmail: params.customerEmail,
			amountTotal: totalAmount,
			currency: params.lineItems[0]?.currency || 'usd',
			createdAt: new Date().toISOString(),
			expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
			metadata: {
				...params.metadata,
				accountId: params.accountId,
				userId: params.userId,
				orderId: params.orderId || '',
			},
		}

		// Add to mock data for retrieval
		mockCheckoutSessions.push(session)

		return { success: true, data: session }
	}

	private mockGetCheckoutSession(sessionId: string): StripeApiResponse<CheckoutSession> {
		const session = mockCheckoutSessions.find(s => s.id === sessionId)
		if (!session) {
			return { success: false, error: 'Checkout session not found', statusCode: 404 }
		}
		return { success: true, data: session }
	}

	private mockExpireCheckoutSession(sessionId: string): StripeApiResponse<CheckoutSession> {
		const session = mockCheckoutSessions.find(s => s.id === sessionId)
		if (!session) {
			return { success: false, error: 'Checkout session not found', statusCode: 404 }
		}
		session.status = 'expired'
		return { success: true, data: session }
	}

	private mockGetPaymentIntent(paymentIntentId: string): StripeApiResponse<PaymentIntent> {
		const intent = mockPaymentIntents.find(i => i.id === paymentIntentId)
		if (!intent) {
			return { success: false, error: 'Payment intent not found', statusCode: 404 }
		}
		return { success: true, data: intent }
	}

	private mockGetOrCreateCustomer(
		email: string,
		name?: string,
		metadata?: Record<string, string>,
	): StripeApiResponse<StripeCustomer> {
		const existing = mockCustomers.find(c => c.email === email)
		if (existing) {
			return { success: true, data: existing }
		}

		const newCustomer: StripeCustomer = {
			id: `cus_test_${Date.now()}`,
			email,
			name,
			metadata,
		}
		mockCustomers.push(newCustomer)
		return { success: true, data: newCustomer }
	}
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Stripe client from environment variables
 */
export function createStripeClient(env: {
	STRIPE_API_KEY?: string
	STRIPE_SECRET_KEY?: string
	STRIPE_WEBHOOK_SECRET?: string
	ENVIRONMENT?: string
}): StripeClient {
	const secretKey = env.STRIPE_API_KEY || env.STRIPE_SECRET_KEY || ''
	const useMock = !secretKey || env.ENVIRONMENT === 'development'

	return new StripeClient({
		secretKey,
		webhookSecret: env.STRIPE_WEBHOOK_SECRET,
		useMock,
	})
}
