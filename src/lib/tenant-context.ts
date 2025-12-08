/**
 * Tenant Context Helper
 *
 * Provides utilities for extracting tenant context from Hono requests
 * and ensuring all database queries are automatically scoped to the current account.
 *
 * This prevents data leakage between tenants and simplifies query writing.
 */
import type { Context } from 'hono'
import type { Role, User } from '../api/middleware'

export interface Account {
	id: string
	short_name: string
	name: string
	billing_email?: string
	stripe_customer_id?: string
	created_at: string
}

export interface TenantContext {
	accountId: string
	account: Account
	userId?: string
	user?: User
	role?: Role
}

/**
 * Get tenant context from Hono request context
 *
 * @throws Error if tenant context is not available (no account in context)
 *
 * @example
 * ```typescript
 * app.get('/api/devices', async (c) => {
 *   const { accountId } = getTenantContext(c)
 *   // Query devices scoped to this account
 * })
 * ```
 */
export function getTenantContext(c: Context): TenantContext {
	const account = c.get('account') as Account | undefined
	const accountId = c.get('accountId') as string | undefined

	if (!account || !accountId) {
		throw new Error('Tenant context required')
	}

	return {
		accountId,
		account,
		userId: c.get('userId'),
		user: c.get('user'),
		role: c.get('role'),
	}
}

/**
 * Get tenant context from Hono request context (nullable version)
 *
 * Returns undefined if no tenant context is available instead of throwing.
 * Useful for endpoints that may optionally use tenant context.
 *
 * @example
 * ```typescript
 * app.get('/api/search', async (c) => {
 *   const tenant = tryGetTenantContext(c)
 *   if (tenant) {
 *     // Scoped search
 *   } else {
 *     // Global search (sys_admin only)
 *   }
 * })
 * ```
 */
export function tryGetTenantContext(c: Context): TenantContext | undefined {
	const account = c.get('account') as Account | undefined
	const accountId = c.get('accountId') as string | undefined

	if (!account || !accountId) {
		return undefined
	}

	return {
		accountId,
		account,
		userId: c.get('userId'),
		user: c.get('user'),
		role: c.get('role'),
	}
}
