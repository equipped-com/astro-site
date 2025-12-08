/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface Env {
	// CloudFlare bindings
	ASSETS: Fetcher
	DB?: D1Database

	// Environment variables
	ENVIRONMENT: 'development' | 'staging' | 'production'
	VERSION?: string

	// Clerk
	CLERK_SECRET_KEY?: string
	CLERK_PUBLISHABLE_KEY?: string
	CLERK_WEBHOOK_SECRET?: string

	// Feature flags
	ENABLE_DEBUG?: string
}
