/**
 * Sys Admin Middleware
 *
 * Verifies that the current user is a system administrator (Equipped staff).
 * Sys admins are identified by email domain: @tryequipped.com, @getupgraded.com, @cogzero.com
 */
import { getAuth } from '@hono/clerk-auth'
import type { Context, MiddlewareHandler, Next } from 'hono'

/**
 * Middleware that requires sys_admin privileges
 * Returns 403 if user is not a system administrator
 */
export function requireSysAdmin(): MiddlewareHandler {
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

		const clerkClient = c.get('clerk')
		if (!clerkClient) {
			console.error('Clerk client not configured')
			return c.json({ error: 'Service unavailable' }, 503)
		}

		try {
			const user = await clerkClient.users.getUser(auth.userId)
			const email = user.emailAddresses[0]?.emailAddress || ''
			const domain = email.split('@')[1]?.toLowerCase()

			const ADMIN_DOMAINS = ['tryequipped.com', 'getupgraded.com', 'cogzero.com']

			if (!ADMIN_DOMAINS.includes(domain)) {
				return c.json(
					{
						error: 'Forbidden',
						message: 'System administrator access required',
					},
					403,
				)
			}

			// Store user info in context for downstream handlers
			c.set('userId', auth.userId)
			c.set('sessionId', auth.sessionId)
			c.set('sysAdmin', true)
			c.set('user', {
				id: auth.userId,
				email,
				first_name: user.firstName,
				last_name: user.lastName,
			})

			return next()
		} catch (error) {
			console.error('Error verifying sys admin:', error)
			return c.json(
				{
					error: 'Authentication failed',
					message: 'Unable to verify administrator privileges',
				},
				500,
			)
		}
	}
}

/**
 * Check if the current user is a sys_admin without blocking the request
 * Useful for conditional logic in handlers
 */
export async function checkSysAdmin(c: Context): Promise<boolean> {
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
