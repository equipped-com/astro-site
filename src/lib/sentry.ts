import * as Sentry from '@sentry/browser'
import { browserTracingIntegration } from '@sentry/browser'

interface SentryUser {
	id: string
	email: string
}

interface SentryAccount {
	id: string
	name: string
}

/**
 * Initialize Sentry error tracking and performance monitoring
 * Should be called once at application startup
 */
export function initSentry(): void {
	const dsn = import.meta.env.PUBLIC_SENTRY_DSN

	// Don't initialize in test environment or if DSN is missing/undefined
	if (import.meta.env.MODE === 'test' || !dsn || dsn === 'undefined') {
		return
	}

	Sentry.init({
		dsn,
		environment: import.meta.env.MODE,
		// 10% of transactions for performance monitoring
		tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
		integrations: [browserTracingIntegration()],
		// Add release tracking if available
		release: import.meta.env.PUBLIC_APP_VERSION,
		// Breadcrumbs for better debugging
		beforeBreadcrumb(breadcrumb) {
			// Filter out noisy breadcrumbs
			if (breadcrumb.category === 'console' && breadcrumb.level !== 'error') {
				return null
			}
			return breadcrumb
		},
	})
}

/**
 * Set user context for error tracking
 * Attach user and account information to all subsequent error reports
 */
export function setUserContext(user: SentryUser, account?: SentryAccount): void {
	Sentry.setUser({
		id: user.id,
		email: user.email,
	})

	if (account) {
		Sentry.setTag('account_id', account.id)
		Sentry.setTag('account_name', account.name)
	}
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext(): void {
	Sentry.setUser(null)
	Sentry.setTag('account_id', undefined)
	Sentry.setTag('account_name', undefined)
}

/**
 * Manually capture an error with additional context
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
	Sentry.captureException(error, {
		extra: context,
	})
}

/**
 * Capture a message (for non-error events)
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
	Sentry.captureMessage(message, level)
}

/**
 * Add breadcrumb for debugging context
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>): void {
	Sentry.addBreadcrumb({
		message,
		data,
		level: 'info',
	})
}

/**
 * Start a performance span (transaction)
 * @deprecated Use Sentry.startSpan() directly for newer Sentry SDK versions
 */
export function startTransaction(name: string, op: string) {
	// Note: startTransaction is deprecated in newer Sentry versions
	// For newer versions (v8+), use Sentry.startSpan() instead
	// This is a compatibility wrapper for the current SDK version
	return Sentry.startSpan(
		{
			name,
			op,
		},
		span => span,
	)
}
