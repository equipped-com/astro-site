/**
 * Database connection and exports for Equipped Platform
 *
 * Usage in Hono worker:
 *   import { getDb } from '@/db';
 *   const db = getDb(c.env.DB);
 */
import { type DrizzleD1Database, drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// Re-export all schema tables and types
export * from './schema'

/**
 * Create a Drizzle database instance from D1 binding
 *
 * @param d1 - CloudFlare D1 database binding from worker environment
 * @returns Drizzle database instance with schema
 */
export function getDb(d1: D1Database): DrizzleD1Database<typeof schema> {
	return drizzle(d1, { schema })
}

/**
 * Type for the database instance
 */
export type Database = DrizzleD1Database<typeof schema>

/**
 * Helper to generate a unique ID
 * Uses crypto.randomUUID() which is available in CloudFlare Workers
 */
export function generateId(): string {
	return crypto.randomUUID()
}

/**
 * Helper to generate a shorter unique ID (useful for URLs)
 * First 8 characters of UUID
 */
export function generateShortId(): string {
	return crypto.randomUUID().slice(0, 8)
}

/**
 * Current timestamp in ISO format
 */
export function now(): string {
	return new Date().toISOString()
}
