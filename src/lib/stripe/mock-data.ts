/**
 * Stripe Mock Data
 *
 * Mock data for testing Stripe integration without real API calls.
 * Used in development/test environments.
 */

import type { CheckoutSession, PaymentIntent, PaymentRecord, StripeCustomer } from './types'

// ============================================================================
// MOCK CHECKOUT SESSIONS
// ============================================================================

export const mockCheckoutSessions: CheckoutSession[] = [
	{
		id: 'cs_test_a1b2c3d4e5f6g7h8i9j0',
		url: 'https://checkout.stripe.com/test/session/cs_test_a1b2c3d4e5f6g7h8i9j0',
		status: 'complete',
		paymentStatus: 'paid',
		customerEmail: 'john@example.com',
		amountTotal: 199900, // $1,999.00
		currency: 'usd',
		createdAt: '2024-01-15T10:00:00Z',
		expiresAt: '2024-01-15T11:00:00Z',
		metadata: {
			accountId: 'acc_test_001',
			orderId: 'ord_test_001',
		},
	},
	{
		id: 'cs_test_b2c3d4e5f6g7h8i9j0k1',
		url: 'https://checkout.stripe.com/test/session/cs_test_b2c3d4e5f6g7h8i9j0k1',
		status: 'open',
		paymentStatus: 'unpaid',
		customerEmail: 'jane@example.com',
		amountTotal: 299900, // $2,999.00
		currency: 'usd',
		createdAt: '2024-01-16T14:30:00Z',
		expiresAt: '2024-01-16T15:30:00Z',
		metadata: {
			accountId: 'acc_test_002',
			orderId: 'ord_test_002',
		},
	},
	{
		id: 'cs_test_c3d4e5f6g7h8i9j0k1l2',
		url: 'https://checkout.stripe.com/test/session/cs_test_c3d4e5f6g7h8i9j0k1l2',
		status: 'expired',
		paymentStatus: 'unpaid',
		customerEmail: 'bob@example.com',
		amountTotal: 159900, // $1,599.00
		currency: 'usd',
		createdAt: '2024-01-14T09:00:00Z',
		expiresAt: '2024-01-14T10:00:00Z',
		metadata: {
			accountId: 'acc_test_001',
			orderId: 'ord_test_003',
		},
	},
]

// ============================================================================
// MOCK PAYMENT INTENTS
// ============================================================================

export const mockPaymentIntents: PaymentIntent[] = [
	{
		id: 'pi_test_a1b2c3d4e5f6g7h8i9j0',
		amount: 199900,
		currency: 'usd',
		status: 'succeeded',
		customerId: 'cus_test_001',
		paymentMethodId: 'pm_test_001',
		clientSecret: 'pi_test_a1b2c3d4e5f6g7h8i9j0_secret_xxx',
		metadata: {
			accountId: 'acc_test_001',
			orderId: 'ord_test_001',
		},
		createdAt: '2024-01-15T10:00:00Z',
	},
	{
		id: 'pi_test_b2c3d4e5f6g7h8i9j0k1',
		amount: 299900,
		currency: 'usd',
		status: 'requires_payment_method',
		clientSecret: 'pi_test_b2c3d4e5f6g7h8i9j0k1_secret_xxx',
		metadata: {
			accountId: 'acc_test_002',
			orderId: 'ord_test_002',
		},
		createdAt: '2024-01-16T14:30:00Z',
	},
]

// ============================================================================
// MOCK CUSTOMERS
// ============================================================================

export const mockCustomers: StripeCustomer[] = [
	{
		id: 'cus_test_001',
		email: 'john@example.com',
		name: 'John Doe',
		metadata: {
			accountId: 'acc_test_001',
		},
	},
	{
		id: 'cus_test_002',
		email: 'jane@example.com',
		name: 'Jane Smith',
		metadata: {
			accountId: 'acc_test_002',
		},
	},
]

// ============================================================================
// MOCK PAYMENT RECORDS
// ============================================================================

export const mockPaymentRecords: PaymentRecord[] = [
	{
		id: 'pay_001',
		accountId: 'acc_test_001',
		orderId: 'ord_test_001',
		stripeSessionId: 'cs_test_a1b2c3d4e5f6g7h8i9j0',
		stripePaymentIntentId: 'pi_test_a1b2c3d4e5f6g7h8i9j0',
		status: 'succeeded',
		amount: 199900,
		currency: 'usd',
		customerEmail: 'john@example.com',
		stripeCustomerId: 'cus_test_001',
		createdAt: '2024-01-15T10:00:00Z',
		updatedAt: '2024-01-15T10:05:00Z',
	},
	{
		id: 'pay_002',
		accountId: 'acc_test_002',
		orderId: 'ord_test_002',
		stripeSessionId: 'cs_test_b2c3d4e5f6g7h8i9j0k1',
		status: 'pending',
		amount: 299900,
		currency: 'usd',
		customerEmail: 'jane@example.com',
		createdAt: '2024-01-16T14:30:00Z',
		updatedAt: '2024-01-16T14:30:00Z',
	},
	{
		id: 'pay_003',
		accountId: 'acc_test_001',
		orderId: 'ord_test_003',
		stripeSessionId: 'cs_test_c3d4e5f6g7h8i9j0k1l2',
		status: 'canceled',
		amount: 159900,
		currency: 'usd',
		customerEmail: 'bob@example.com',
		failureReason: 'Session expired',
		createdAt: '2024-01-14T09:00:00Z',
		updatedAt: '2024-01-14T10:00:00Z',
	},
]

// ============================================================================
// MOCK WEBHOOK EVENTS
// ============================================================================

export function createMockWebhookEvent(
	type: string,
	data: Record<string, unknown>,
): {
	id: string
	type: string
	data: { object: Record<string, unknown> }
	created: number
	apiVersion: string
	livemode: boolean
} {
	return {
		id: `evt_test_${Date.now()}`,
		type,
		data: { object: data },
		created: Math.floor(Date.now() / 1000),
		apiVersion: '2024-12-18.acacia',
		livemode: false,
	}
}

export const mockCheckoutCompletedEvent = createMockWebhookEvent('checkout.session.completed', {
	id: 'cs_test_a1b2c3d4e5f6g7h8i9j0',
	object: 'checkout.session',
	payment_status: 'paid',
	status: 'complete',
	amount_total: 199900,
	currency: 'usd',
	customer_email: 'john@example.com',
	metadata: {
		accountId: 'acc_test_001',
		orderId: 'ord_test_001',
	},
	payment_intent: 'pi_test_a1b2c3d4e5f6g7h8i9j0',
})

export const mockPaymentIntentSucceededEvent = createMockWebhookEvent('payment_intent.succeeded', {
	id: 'pi_test_a1b2c3d4e5f6g7h8i9j0',
	object: 'payment_intent',
	amount: 199900,
	currency: 'usd',
	status: 'succeeded',
	metadata: {
		accountId: 'acc_test_001',
		orderId: 'ord_test_001',
	},
})

export const mockPaymentIntentFailedEvent = createMockWebhookEvent('payment_intent.payment_failed', {
	id: 'pi_test_failed_001',
	object: 'payment_intent',
	amount: 149900,
	currency: 'usd',
	status: 'requires_payment_method',
	last_payment_error: {
		message: 'Your card was declined.',
		code: 'card_declined',
	},
	metadata: {
		accountId: 'acc_test_003',
		orderId: 'ord_test_004',
	},
})
