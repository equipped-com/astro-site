/**
 * Tenant Middleware
 *
 * Extracts subdomain from Host header and resolves tenant context.
 * Reserved subdomains (admin, www, webhooks) are handled specially.
 * Unknown tenants return 404.
 */
import type { Context, MiddlewareHandler, Next } from 'hono'

const RESERVED_SUBDOMAINS = new Set([
	'www',
	'admin',
	'webhooks',
	'api',
	'app',
	'billing',
	'cdn',
	'help',
	'shop',
	'store',
	'support',
])

// Subdomains that redirect to root domain
const REDIRECT_SUBDOMAINS = new Set(['www'])

// Base domain for the platform
const BASE_DOMAINS = ['tryequipped.com', 'frst.dev', 'localhost']

interface Account {
	id: string
	short_name: string
	name: string
	billing_email?: string
	stripe_customer_id?: string
	created_at: string
}

/**
 * Extract subdomain from host header
 */
function extractSubdomain(host: string): string | null {
	// Remove port number if present (for local dev)
	const hostWithoutPort = host.split(':')[0]
	const parts = hostWithoutPort.split('.')

	// Check if this is a known base domain
	// For "acme.tryequipped.com" -> parts = ["acme", "tryequipped", "com"]
	// For "tryequipped.com" -> parts = ["tryequipped", "com"]
	// For "localhost" -> parts = ["localhost"]
	// For "acme.tryequipped.preview.frst.dev" -> parts = ["acme", "tryequipped", "preview", "frst", "dev"]

	// Handle local development (localhost)
	if (parts[0] === 'localhost' || parts.length <= 2) {
		return null
	}

	// Handle preview domain: *.tryequipped.preview.frst.dev
	if (parts.length >= 5 && parts.slice(-4).join('.') === 'tryequipped.preview.frst.dev') {
		return parts[0]
	}

	// Handle production domain: *.tryequipped.com
	if (parts.length >= 3 && parts.slice(-2).join('.') === 'tryequipped.com') {
		return parts[0]
	}

	// Generic subdomain extraction for other domains
	if (parts.length > 2) {
		return parts[0]
	}

	return null
}

/**
 * Middleware to resolve tenant from subdomain
 *
 * Sets in context:
 * - accountId: string | undefined - The account ID if resolved
 * - account: Account | undefined - Full account object if resolved
 * - subdomain: string | undefined - The extracted subdomain
 * - isReservedSubdomain: boolean - True if subdomain is reserved
 */
export function tenantMiddleware(): MiddlewareHandler {
	return async (c: Context, next: Next) => {
		const host = c.req.header('host') || ''
		const subdomain = extractSubdomain(host)

		// Root domain - no subdomain, serve marketing site
		if (!subdomain) {
			c.set('subdomain', null)
			c.set('isReservedSubdomain', false)
			return next()
		}

		c.set('subdomain', subdomain)

		// Handle redirect subdomains (www -> root)
		if (REDIRECT_SUBDOMAINS.has(subdomain)) {
			const url = new URL(c.req.url)
			// Remove subdomain from host
			const newHost = url.host.replace(`${subdomain}.`, '')
			url.host = newHost
			return c.redirect(url.toString(), 301)
		}

		// Reserved subdomains - special handling, no tenant lookup
		if (RESERVED_SUBDOMAINS.has(subdomain)) {
			c.set('isReservedSubdomain', true)
			return next()
		}

		c.set('isReservedSubdomain', false)

		// Tenant lookup from database
		const db = c.env.DB
		if (!db) {
			console.error('Database not configured')
			return c.json({ error: 'Service unavailable' }, 503)
		}

		const account = await db.prepare('SELECT * FROM accounts WHERE short_name = ?').bind(subdomain).first<Account>()

		if (!account) {
			return c.json(
				{
					error: 'Account not found',
					message: `No account exists with subdomain "${subdomain}"`,
				},
				404,
			)
		}

		// Set tenant context for downstream handlers
		c.set('account', account)
		c.set('accountId', account.id)

		return next()
	}
}

/**
 * Helper to require tenant context in a route
 * Returns 400 if no account context is set
 */
export function requireTenant(): MiddlewareHandler {
	return async (c: Context, next: Next) => {
		const accountId = c.get('accountId')
		if (!accountId) {
			return c.json(
				{
					error: 'Account context required',
					message: 'This endpoint requires an account context from subdomain',
				},
				400,
			)
		}
		return next()
	}
}

export { extractSubdomain, RESERVED_SUBDOMAINS }
