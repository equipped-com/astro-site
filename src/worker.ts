export default {
	async fetch(request: Request, env: { ASSETS: Fetcher }): Promise<Response> {
		const url = new URL(request.url)
		const response = await env.ASSETS.fetch(request)

		// Clone response to modify headers
		const newHeaders = new Headers(response.headers)

		// Security headers for all responses
		newHeaders.set('X-Content-Type-Options', 'nosniff')
		newHeaders.set('X-Frame-Options', 'DENY')
		newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
		newHeaders.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

		// Cache headers based on path
		const path = url.pathname

		if (path.startsWith('/lib/')) {
			// Hashed assets - immutable forever
			newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable')
		} else if (path.endsWith('.webp') || path.endsWith('.woff2')) {
			// Images and fonts - long cache
			newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable')
		} else if (path.endsWith('.svg')) {
			// SVGs - 1 day cache
			newHeaders.set('Cache-Control', 'public, max-age=86400')
		} else if (path.endsWith('.html') || path === '/') {
			// HTML - always revalidate
			newHeaders.set('Cache-Control', 'public, max-age=0, must-revalidate')
		}

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: newHeaders
		})
	}
}
