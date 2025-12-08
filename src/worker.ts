import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { Role, User } from './api/middleware'
import { authMiddleware, requireAccountAccess, requireAdmin, requireAuth, tenantMiddleware } from './api/middleware'

// Define custom context variables
interface Variables {
	// Tenant context
	accountId: string | undefined
	account: Record<string, unknown> | undefined
	subdomain: string | null
	isReservedSubdomain: boolean

	// Auth context
	userId: string | undefined
	sessionId: string | undefined
	user: User | undefined
	role: Role | undefined
	accessId: string | undefined
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// Global middleware
app.use('*', logger())

// CORS for API routes
app.use(
	'/api/*',
	cors({
		origin: '*', // Configure for production
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
	}),
)

// Error handling
app.onError((err, c) => {
	console.error('Error:', err)
	const isDev = c.env.ENVIRONMENT === 'development'
	return c.json(
		{
			error: err.message,
			...(isDev && { stack: err.stack }),
		},
		500,
	)
})

// ============================================================================
// PUBLIC ROUTES (no auth required)
// ============================================================================

// Health check endpoint - public
app.get('/api/health', async c => {
	const startTime = Date.now()
	const checks: Record<string, string> = {}

	// Check database
	try {
		if (c.env.DB) {
			await c.env.DB.prepare('SELECT 1').first()
			checks.database = 'ok'
		} else {
			checks.database = 'error: not configured'
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Unknown error'
		checks.database = `error: ${message}`
	}

	// Check auth (Clerk)
	try {
		if (c.env.CLERK_SECRET_KEY) {
			checks.auth = 'ok'
		} else {
			checks.auth = 'error: not configured'
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Unknown error'
		checks.auth = `error: ${message}`
	}

	const isHealthy = Object.values(checks).every(v => v === 'ok')
	const duration = Date.now() - startTime

	return c.json(
		{
			status: isHealthy ? 'healthy' : 'unhealthy',
			version: c.env.VERSION || 'unknown',
			timestamp: new Date().toISOString(),
			duration_ms: duration,
			checks,
		},
		isHealthy ? 200 : 503,
	)
})

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

// Apply Clerk auth middleware to all /api routes (except health which is above)
// This populates auth context but doesn't require authentication
app.use('/api/*', authMiddleware)

// Apply tenant middleware to resolve account from subdomain
app.use('/api/*', tenantMiddleware())

// ============================================================================
// USER ROUTES - requires auth only, no account context needed
// ============================================================================

// Routes requiring authentication only (no account context)
app.use('/api/user/*', requireAuth())

// Example: Get current user info
app.get('/api/user', c => {
	const userId = c.get('userId')
	return c.json({
		userId,
		message: 'User authenticated successfully',
	})
})

// ============================================================================
// ACCOUNT-SCOPED ROUTES - requires auth + account access
// ============================================================================

// Routes requiring account access
app.use('/api/devices/*', requireAccountAccess())
app.use('/api/orders/*', requireAccountAccess())
app.use('/api/people/*', requireAccountAccess())

// Example: Get devices for account
app.get('/api/devices', c => {
	const accountId = c.get('accountId')
	const userId = c.get('userId')
	const role = c.get('role')

	return c.json({
		message: 'Devices endpoint - account access verified',
		accountId,
		userId,
		role,
	})
})

// ============================================================================
// ADMIN ROUTES - requires auth + account access + admin role
// ============================================================================

// Settings routes require admin role
app.use('/api/settings/billing/*', requireAccountAccess(), requireAdmin())
app.use('/api/settings/team/*', requireAccountAccess(), requireAdmin())

// Example: Billing settings
app.get('/api/settings/billing', c => {
	const accountId = c.get('accountId')
	const role = c.get('role')

	return c.json({
		message: 'Billing settings - admin access verified',
		accountId,
		role,
	})
})

// ============================================================================
// 404 HANDLER
// ============================================================================

// 404 handler for API routes (must be last)
app.all('/api/*', c => {
	return c.json({ error: 'Not found' }, 404)
})

// ============================================================================
// EXPORT
// ============================================================================

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url)

		// Handle API routes with Hono
		if (url.pathname.startsWith('/api/')) {
			return app.fetch(request, env, ctx)
		}

		// Serve static assets for non-API routes
		return env.ASSETS.fetch(request)
	},
}
