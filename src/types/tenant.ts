/**
 * Tenant-Related TypeScript Types
 *
 * Central type definitions for multi-tenancy features.
 */
import type { Context } from 'hono'
import type { Role, User } from '../api/middleware'

/**
 * Account (Tenant) entity
 */
export interface Account {
	id: string
	short_name: string
	name: string
	billing_email?: string
	stripe_customer_id?: string
	created_at: string
}

/**
 * Tenant context available in request handlers
 */
export interface TenantContext {
	accountId: string
	account: Account
	userId?: string
	user?: User
	role?: Role
}

/**
 * Hono context with tenant variables
 */
export interface TenantVariables {
	accountId: string | undefined
	account: Account | undefined
	subdomain: string | null
	isReservedSubdomain: boolean
}

/**
 * Extended Hono context type with tenant support
 */
export type TenantContext_Hono<E extends { Bindings: Env }> = Context<E, any, TenantVariables>
