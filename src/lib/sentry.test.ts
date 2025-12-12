import * as Sentry from '@sentry/browser'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import {
	addBreadcrumb,
	captureError,
	captureMessage,
	clearUserContext,
	initSentry,
	setUserContext,
	startTransaction,
} from './sentry'

// Mock Sentry
vi.mock('@sentry/browser', () => ({
	init: vi.fn(),
	setUser: vi.fn(),
	setTag: vi.fn(),
	captureException: vi.fn(),
	captureMessage: vi.fn(),
	addBreadcrumb: vi.fn(),
	startSpan: vi.fn((_options, callback) => callback({})),
	browserTracingIntegration: vi.fn(() => 'browserTracingIntegration'),
}))

describe('Sentry Error Tracking', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Reset environment variables
		import.meta.env.MODE = 'development'
		import.meta.env.PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123'
		import.meta.env.PUBLIC_APP_VERSION = '1.0.0'
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * @REQ-MON-005
	 * Scenario: Capture unhandled error
	 */
	describe('@REQ-MON-005: Capture unhandled error', () => {
		it('should initialize Sentry with correct configuration', () => {
			initSentry()

			expect(Sentry.init).toHaveBeenCalledWith(
				expect.objectContaining({
					dsn: 'https://test@sentry.io/123',
					environment: 'development',
					tracesSampleRate: 1.0,
					release: '1.0.0',
					integrations: expect.arrayContaining(['browserTracingIntegration']),
				}),
			)
		})

		it('should not initialize Sentry in test environment', () => {
			import.meta.env.MODE = 'test'

			initSentry()

			expect(Sentry.init).not.toHaveBeenCalled()
		})

		it('should not initialize Sentry if DSN is missing', () => {
			import.meta.env.PUBLIC_SENTRY_DSN = undefined

			initSentry()

			expect(Sentry.init).not.toHaveBeenCalled()
		})

		it('should use 10% trace sample rate in production', () => {
			import.meta.env.MODE = 'production'

			initSentry()

			expect(Sentry.init).toHaveBeenCalledWith(
				expect.objectContaining({
					tracesSampleRate: 0.1,
				}),
			)
		})

		it('should send error to Sentry with full context', () => {
			const error = new Error('Test error')
			const context = {
				stackTrace: 'Error: Test error\n  at test.js:10:5',
				requestUrl: '/api/devices',
				userId: 'user_123',
				accountId: 'acct_456',
			}

			captureError(error, context)

			expect(Sentry.captureException).toHaveBeenCalledWith(error, {
				extra: context,
			})
		})

		it('should capture error without context', () => {
			const error = new Error('Simple error')

			captureError(error)

			expect(Sentry.captureException).toHaveBeenCalledWith(error, {
				extra: undefined,
			})
		})
	})

	/**
	 * @REQ-MON-006
	 * Scenario: User context attached
	 */
	describe('@REQ-MON-006: User context attached', () => {
		it('should attach user context with user ID and email', () => {
			const user = {
				id: 'user_clerkId123',
				email: 'alice@company.com',
			}

			setUserContext(user)

			expect(Sentry.setUser).toHaveBeenCalledWith({
				id: 'user_clerkId123',
				email: 'alice@company.com',
			})
		})

		it('should attach account context when provided', () => {
			const user = {
				id: 'user_clerkId123',
				email: 'alice@company.com',
			}
			const account = {
				id: 'acct_456',
				name: 'acme-corp',
			}

			setUserContext(user, account)

			expect(Sentry.setUser).toHaveBeenCalledWith({
				id: user.id,
				email: user.email,
			})
			expect(Sentry.setTag).toHaveBeenCalledWith('account_id', account.id)
			expect(Sentry.setTag).toHaveBeenCalledWith('account_name', account.name)
		})

		it('should attach user context without account', () => {
			const user = {
				id: 'user_clerkId789',
				email: 'bob@example.com',
			}

			setUserContext(user)

			expect(Sentry.setUser).toHaveBeenCalledWith({
				id: user.id,
				email: user.email,
			})
			expect(Sentry.setTag).not.toHaveBeenCalled()
		})

		it('should clear user context on logout', () => {
			clearUserContext()

			expect(Sentry.setUser).toHaveBeenCalledWith(null)
			expect(Sentry.setTag).toHaveBeenCalledWith('account_id', undefined)
			expect(Sentry.setTag).toHaveBeenCalledWith('account_name', undefined)
		})
	})

	/**
	 * @REQ-MON-007
	 * Scenario: Performance monitoring
	 */
	describe('@REQ-MON-007: Performance monitoring', () => {
		it('should create performance transaction for API request', () => {
			const mockSpan = { finish: vi.fn() }
			(Sentry.startSpan as Mock).mockImplementation((_options, callback) => callback(mockSpan as never))

			const result = startTransaction('GET /api/devices', 'http.server')

			expect(Sentry.startSpan).toHaveBeenCalledWith(
				{
					name: 'GET /api/devices',
					op: 'http.server',
				},
				expect.any(Function),
			)
			expect(result).toBe(mockSpan)
		})

		it('should track database query performance', () => {
			const transaction = startTransaction('SELECT * FROM devices', 'db.query')

			expect(Sentry.startSpan).toHaveBeenCalledWith(
				{
					name: 'SELECT * FROM devices',
					op: 'db.query',
				},
				expect.any(Function),
			)
			expect(transaction).toBeDefined()
		})

		it('should track external API calls', () => {
			const transaction = startTransaction('POST /external-api', 'http.client')

			expect(Sentry.startSpan).toHaveBeenCalledWith(
				{
					name: 'POST /external-api',
					op: 'http.client',
				},
				expect.any(Function),
			)
			expect(transaction).toBeDefined()
		})
	})

	/**
	 * @REQ-MON-008
	 * Scenario: Alert on new errors (integration test note)
	 *
	 * NOTE: Alerting is configured in Sentry dashboard, not in code.
	 * This test verifies that errors are properly sent to Sentry,
	 * which is a prerequisite for alerting to work.
	 */
	describe('@REQ-MON-008: Alert on new errors', () => {
		it('should send errors to Sentry for grouping and alerting', () => {
			const error = new Error('New error type')

			captureError(error)

			expect(Sentry.captureException).toHaveBeenCalledWith(error, {
				extra: undefined,
			})
		})

		it('should capture messages for non-error events', () => {
			captureMessage('Payment processing started', 'info')

			expect(Sentry.captureMessage).toHaveBeenCalledWith('Payment processing started', 'info')
		})

		it('should capture warning messages', () => {
			captureMessage('Rate limit approaching', 'warning')

			expect(Sentry.captureMessage).toHaveBeenCalledWith('Rate limit approaching', 'warning')
		})

		it('should add breadcrumbs for debugging context', () => {
			addBreadcrumb('User clicked checkout button', {
				cartValue: 1299.99,
				itemCount: 3,
			})

			expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
				message: 'User clicked checkout button',
				data: {
					cartValue: 1299.99,
					itemCount: 3,
				},
				level: 'info',
			})
		})
	})

	/**
	 * Additional integration scenarios
	 */
	describe('Integration scenarios', () => {
		it('should handle errors during checkout flow', () => {
			// Simulate checkout flow with user context
			const user = { id: 'user_123', email: 'customer@example.com' }
			const account = { id: 'acct_abc', name: 'customer-corp' }

			setUserContext(user, account)
			addBreadcrumb('Started checkout', { stage: 'assignment' })
			addBreadcrumb('Added shipping address', { stage: 'shipping' })

			const error = new Error('Payment processing failed')
			captureError(error, {
				stage: 'payment',
				amount: 2499.99,
				paymentMethod: 'lease',
			})

			expect(Sentry.setUser).toHaveBeenCalledWith({
				id: user.id,
				email: user.email,
			})
			expect(Sentry.setTag).toHaveBeenCalledWith('account_id', account.id)
			expect(Sentry.captureException).toHaveBeenCalledWith(error, {
				extra: expect.objectContaining({
					stage: 'payment',
					amount: 2499.99,
				}),
			})
		})

		it('should filter out noisy console breadcrumbs', () => {
			initSentry()

			const initCall = (Sentry.init as Mock).mock.calls[0][0]
			const beforeBreadcrumb = initCall?.beforeBreadcrumb

			expect(beforeBreadcrumb).toBeDefined()

			// Should filter out non-error console messages
			const consoleBreadcrumb = {
				category: 'console',
				level: 'info',
				message: 'Debug log',
			}
			expect(beforeBreadcrumb?.(consoleBreadcrumb as never)).toBeNull()

			// Should keep error console messages
			const errorBreadcrumb = {
				category: 'console',
				level: 'error',
				message: 'Error log',
			}
			expect(beforeBreadcrumb?.(errorBreadcrumb as never)).toBe(errorBreadcrumb)

			// Should keep other breadcrumbs
			const clickBreadcrumb = {
				category: 'ui.click',
				level: 'info',
				message: 'User clicked button',
			}
			expect(beforeBreadcrumb?.(clickBreadcrumb as never)).toBe(clickBreadcrumb)
		})
	})
})
