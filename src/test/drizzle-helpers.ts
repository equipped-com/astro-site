/**
 * Test Database Helpers
 *
 * Provides in-memory D1 database for testing with full Drizzle ORM support.
 * Replaces manual database mocking with real SQLite instances.
 *
 * @REQ-TEST-001 @Database @Helpers
 * Test database factory creates in-memory D1 with full query builder support
 *
 * @REQ-TEST-002 @Migrations @Schema
 * Test database applies migrations automatically on initialization
 *
 * @REQ-TEST-003 @Fixtures @Data
 * Seed test data with fixtures for consistent testing
 *
 * @REQ-TEST-004 @Cleanup @Isolation
 * Tests are isolated from each other with automatic cleanup
 */
import { drizzle } from 'drizzle-orm/d1'
import { D1Database } from '@miniflare/d1'
import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as schema from '@/db/schema'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/**
 * Create an in-memory test database with migrations applied
 *
 * @REQ-TEST-001 - Creates in-memory D1 with full Drizzle query builder
 * @REQ-TEST-002 - Applies all migrations in sequence
 * @REQ-TEST-004 - Returns isolated database instance per test
 *
 * @returns Drizzle database instance with full schema
 */
export function createTestDatabase() {
	// Create in-memory SQLite database
	const sqlite = new Database(':memory:')

	// Wrap with Miniflare D1 API
	const d1 = new D1Database(sqlite)

	// Apply migrations in order
	const migrations = [
		'0001_initial.sql',
		'0002_create_product_catalog.sql',
		'0003_create_account_invitations.sql',
	]

	for (const file of migrations) {
		try {
			const sql = readFileSync(join(__dirname, '../../migrations', file), 'utf-8')
			// Execute migration SQL
			sqlite.exec(sql)
		} catch (error) {
			// Warn but don't fail - some migrations may not exist in all environments
			console.warn(`[Test DB] Migration ${file} not found or failed:`, error instanceof Error ? error.message : error)
		}
	}

	// Return Drizzle instance with schema
	return drizzle(d1, { schema })
}

/**
 * Seed common test data fixtures
 *
 * @REQ-TEST-003 - Seeds test data with common fixtures
 *
 * @param db - Drizzle database instance
 * @returns Object with fixture IDs for test assertions
 */
export async function seedTestData(db: ReturnType<typeof createTestDatabase>) {
	// Insert test user
	await db.insert(schema.users).values({
		id: 'user_test_alice',
		email: 'alice@example.com',
		firstName: 'Alice',
		lastName: 'Smith',
		primaryAccountId: 'acct_test_primary',
	})

	// Insert test account
	await db.insert(schema.accounts).values({
		id: 'acct_test_primary',
		name: 'Test Account',
		subdomain: 'test',
		ownerId: 'user_test_alice',
		subscriptionStatus: 'active',
	})

	// Insert test account access
	await db.insert(schema.accountAccess).values({
		id: 'access_test_alice',
		accountId: 'acct_test_primary',
		userId: 'user_test_alice',
		role: 'owner',
	})

	// Insert test brand
	await db.insert(schema.brands).values({
		id: 'brand_test_apple',
		name: 'Apple',
		slug: 'apple',
		logoUrl: 'https://example.com/apple.png',
		isActive: true,
	})

	// Insert test product
	await db.insert(schema.products).values({
		id: 'prod_test_macbook',
		brandId: 'brand_test_apple',
		name: 'MacBook Pro 16"',
		modelIdentifier: 'MacBookPro18,1',
		sku: 'MBP-16-M1-2021',
		productType: 'laptop',
		description: 'Test MacBook Pro',
		msrp: 2499.0,
		isActive: true,
	})

	return {
		userId: 'user_test_alice',
		accountId: 'acct_test_primary',
		accessId: 'access_test_alice',
		brandId: 'brand_test_apple',
		productId: 'prod_test_macbook',
	}
}

/**
 * Seed test invitation data
 *
 * @param db - Drizzle database instance
 * @param options - Invitation configuration
 * @returns Invitation ID
 */
export async function seedTestInvitation(
	db: ReturnType<typeof createTestDatabase>,
	options: {
		id?: string
		accountId?: string
		email?: string
		role?: 'owner' | 'admin' | 'member' | 'buyer'
		invitedByUserId?: string
		expiresAt?: string
		acceptedAt?: string | null
		declinedAt?: string | null
		revokedAt?: string | null
	} = {},
) {
	const invitation = {
		id: options.id ?? 'inv_test_001',
		accountId: options.accountId ?? 'acct_test_primary',
		email: options.email ?? 'invitee@example.com',
		role: options.role ?? 'member',
		invitedByUserId: options.invitedByUserId ?? 'user_test_alice',
		sentAt: new Date().toISOString(),
		expiresAt: options.expiresAt ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
		acceptedAt: options.acceptedAt ?? null,
		declinedAt: options.declinedAt ?? null,
		revokedAt: options.revokedAt ?? null,
	}

	await db.insert(schema.accountInvitations).values(invitation)
	return invitation.id
}

/**
 * Cleanup test database
 *
 * @REQ-TEST-004 - Automatic cleanup (in-memory DB is garbage collected)
 *
 * Note: Since the database is in-memory, it's automatically cleaned up
 * when the reference is lost. This function is provided for explicit cleanup
 * if needed, but is generally not required.
 *
 * @param db - Drizzle database instance (unused, kept for API consistency)
 */
export function cleanupTestDatabase(db: ReturnType<typeof createTestDatabase>) {
	// In-memory database is automatically garbage collected
	// No explicit cleanup needed
}
