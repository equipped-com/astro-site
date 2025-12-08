import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors({
	origin: '*', // Configure for production
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowHeaders: ['Content-Type', 'Authorization'],
}))

// Error handling
app.onError((err, c) => {
	console.error('Error:', err)
	const isDev = c.env.ENVIRONMENT === 'development'
	return c.json({
		error: err.message,
		...(isDev && { stack: err.stack }),
	}, 500)
})

// Health check endpoint
app.get('/api/health', async (c) => {
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
		// Simple check that Clerk env is configured
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

	return c.json({
		status: isHealthy ? 'healthy' : 'unhealthy',
		version: c.env.VERSION || 'unknown',
		timestamp: new Date().toISOString(),
		duration_ms: duration,
		checks,
	}, isHealthy ? 200 : 503)
})

// 404 handler for API routes
app.all('/api/*', (c) => {
	return c.json({ error: 'Not found' }, 404)
})

// Export for Cloudflare Workers
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
