/**
 * Auth Middleware
 *
 * Verifies Clerk JWT tokens and populates request context with user/account info.
 * Uses @hono/clerk-auth for JWT verification.
 */
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import type { Context, MiddlewareHandler, Next } from 'hono'

interface AccountAccess {
	id: string
	account_id: string
	user_id: string
	role: Role
	created_at: string
}

interface User {
	id: string
	email: string
	first_name?: string
	last_name?: string
	primary_account_id?: string
}

type Role = 'owner' | 'admin' | 'member' | 'buyer' | 'viewer' | 'noaccess'

/**
 * Base Clerk middleware - applies JWT verification to all routes
 * Must be applied before other auth middleware
 */
export const authMiddleware = clerkMiddleware()

/**
 * Middleware that requires authentication
 * Returns 401 if no valid session exists
 */
export function requireAuth(): MiddlewareHandler {
	return async (c: Context, next: Next) => {
		const auth = getAuth(c)

		if (!auth?.userId) {
			return c.json(
				{
					error: 'Unauthorized',
					message: 'Authentication required',
				},
				401,
			)
		}

		// Store userId in context for downstream handlers
		c.set('userId', auth.userId)
		c.set('sessionId', auth.sessionId)

		return next()
	}
}

/**
 * Middleware that requires authentication AND account access
 * Verifies the authenticated user has access to the current tenant
 * Returns 401 if not authenticated, 403 if no account access
 */
export function requireAccountAccess(): MiddlewareHandler {
	return async (c: Context, next: Next) => {
		const auth = getAuth(c)

		// Check authentication first
		if (!auth?.userId) {
			return c.json(
				{
					error: 'Unauthorized',
					message: 'Authentication required',
				},
				401,
			)
		}

		const accountId = c.get('accountId') as string | undefined
		if (!accountId) {
			return c.json(
				{
					error: 'Account context required',
					message: 'This endpoint requires an account context',
				},
				400,
			)
		}

		const db = c.env.DB
		if (!db) {
			console.error('Database not configured')
			return c.json({ error: 'Service unavailable' }, 503)
		}

		// Verify user has access to this account
		const access = await db
			.prepare(
				`SELECT aa.*, u.email, u.first_name, u.last_name
				FROM account_access aa
				JOIN users u ON u.id = aa.user_id
				WHERE aa.user_id = ? AND aa.account_id = ?`,
			)
			.bind(auth.userId, accountId)
			.first<AccountAccess & User>()

		if (!access) {
			return c.json(
				{
					error: 'No access to this account',
					message: 'You do not have permission to access this account',
				},
				403,
			)
		}

		// Check if role is 'noaccess' - explicit denial
		if (access.role === 'noaccess') {
			return c.json(
				{
					error: 'No access to this account',
					message: 'Your access to this account has been revoked',
				},
				403,
			)
		}

		// Store user info and role in context
		c.set('userId', auth.userId)
		c.set('sessionId', auth.sessionId)
		c.set('user', {
			id: auth.userId,
			email: access.email,
			first_name: access.first_name,
			last_name: access.last_name,
		})
		c.set('role', access.role)
		c.set('accessId', access.id)

		return next()
	}
}

/**
 * Helper to get current user from context
 */
export function getUser(c: Context): User | undefined {
	return c.get('user')
}

/**
 * Helper to get current role from context
 */
export function getRole(c: Context): Role | undefined {
	return c.get('role')
}

/**
 * Helper to get current account ID from context
 */
export function getAccountId(c: Context): string | undefined {
	return c.get('accountId')
}

/**
 * Check if the current user is a sys_admin (Equipped staff)
 * Sys admins have email domains: @tryequipped.com, @getupgraded.com, @cogzero.com
 */
export async function isSysAdmin(c: Context): Promise<boolean> {
	const auth = getAuth(c)
	if (!auth?.userId) return false

	const clerkClient = c.get('clerk')
	if (!clerkClient) return false

	try {
		const user = await clerkClient.users.getUser(auth.userId)
		const email = user.emailAddresses[0]?.emailAddress || ''
		const domain = email.split('@')[1]?.toLowerCase()

		return ['tryequipped.com', 'getupgraded.com', 'cogzero.com'].includes(domain)
	} catch {
		return false
	}
}

export type { AccountAccess, User, Role }
