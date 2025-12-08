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

	// Shopify
	SHOPIFY_STORE_DOMAIN?: string
	SHOPIFY_ACCESS_TOKEN?: string
	SHOPIFY_API_VERSION?: string
}

// Hono context variables for auth and tenant middleware
interface HonoVariables {
	// Tenant context (from tenant middleware)
	accountId: string | undefined
	account: Account | undefined
	subdomain: string | null
	isReservedSubdomain: boolean

	// Auth context (from auth middleware)
	userId: string | undefined
	sessionId: string | undefined
	user: AuthUser | undefined
	role: AccountRole | undefined
	accessId: string | undefined
}

// Account entity from database
interface Account {
	id: string
	short_name: string
	name: string
	billing_email?: string
	address?: string
	logo_url?: string
	stripe_customer_id?: string
	upgraded_store_id?: string
	upgraded_customer_id?: string
	device_source?: 'database' | 'addigy' | 'blackglove'
	is_synthetic?: boolean
	acn_profile_id?: string
	acn_profile_verified?: boolean
	created_at: string
	updated_at: string
}

// User information in auth context
interface AuthUser {
	id: string
	email: string
	first_name?: string
	last_name?: string
}

// Account roles - ordered by permission level (highest to lowest)
type AccountRole = 'owner' | 'admin' | 'member' | 'buyer' | 'viewer' | 'noaccess'
