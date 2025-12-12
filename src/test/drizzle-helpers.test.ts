/**
 * Drizzle Test Helpers Tests
 *
 * @REQ-TEST-001 @Database @Helpers
 * Test database factory creates in-memory D1
 *
 * @REQ-TEST-002 @Migrations @Schema
 * Test database applies migrations automatically
 *
 * @REQ-TEST-003 @Fixtures @Data
 * Seed test data with fixtures
 *
 * @REQ-TEST-004 @Cleanup @Isolation
 * Tests are isolated from each other
 *
 * @REQ-TEST-005 @Performance @Speed
 * Tests run faster with in-memory database
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { createTestDatabase, seedTestData, seedTestInvitation } from './drizzle-helpers'
import * as schema from '@/db/schema'

describe('@REQ-TEST-001 Test Database Factory', () => {
	test('should create in-memory D1 database with Drizzle', () => {
		const { db, d1 } = createTestDatabase()

		expect(db).toBeDefined()
		expect(d1).toBeDefined()
		expect(typeof db.select).toBe('function')
	})

	test('should provide full query builder support', async () => {
		const { db } = createTestDatabase()

		// Should be able to use Drizzle query builder
		const result = await db.select().from(schema.users).all()
		expect(Array.isArray(result)).toBe(true)
	})

	test('should be isolated per test', async () => {
		// Create two separate databases
		const { db: db1 } = createTestDatabase()
		const { db: db2 } = createTestDatabase()

		// Insert data into db1
		await db1.insert(schema.users).values({
			id: 'user_1',
			email: 'user1@example.com',
		})

		// db2 should not have the data
		const users1 = await db1.select().from(schema.users).all()
		const users2 = await db2.select().from(schema.users).all()

		expect(users1).toHaveLength(1)
		expect(users2).toHaveLength(0)
	})
})

describe('@REQ-TEST-002 Migration Application', () => {
	test('should apply all migrations in sequence', async () => {
		const { db } = createTestDatabase()

		// Check that tables exist by querying them
		const users = await db.select().from(schema.users).all()
		const accounts = await db.select().from(schema.accounts).all()
		const brands = await db.select().from(schema.brands).all()
		const products = await db.select().from(schema.products).all()

		expect(Array.isArray(users)).toBe(true)
		expect(Array.isArray(accounts)).toBe(true)
		expect(Array.isArray(brands)).toBe(true)
		expect(Array.isArray(products)).toBe(true)
	})

	test('should have empty tables after migrations', async () => {
		const { db } = createTestDatabase()

		const users = await db.select().from(schema.users).all()
		const accounts = await db.select().from(schema.accounts).all()

		expect(users).toHaveLength(0)
		expect(accounts).toHaveLength(0)
	})
})

describe('@REQ-TEST-003 Test Fixtures', () => {
	let db: ReturnType<typeof createTestDatabase>['db']

	beforeEach(() => {
		const dbResult = createTestDatabase()
		db = dbResult.db
	})

	test('should seed common test data', async () => {
		const fixtures = await seedTestData(db)

		expect(fixtures.userId).toBe('user_test_alice')
		expect(fixtures.accountId).toBe('acct_test_primary')
		expect(fixtures.brandId).toBe('brand_test_apple')
		expect(fixtures.productId).toBe('prod_test_macbook')

		// Verify data was actually inserted
		const users = await db.select().from(schema.users).all()
		const accounts = await db.select().from(schema.accounts).all()
		const brands = await db.select().from(schema.brands).all()
		const products = await db.select().from(schema.products).all()

		expect(users).toHaveLength(1)
		expect(accounts).toHaveLength(1)
		expect(brands).toHaveLength(1)
		expect(products).toHaveLength(1)
	})

	test('should seed test invitation', async () => {
		await seedTestData(db)

		const invitationId = await seedTestInvitation(db, {
			email: 'invite@example.com',
			role: 'admin',
		})

		expect(invitationId).toBe('inv_test_001')

		const invitations = await db.select().from(schema.accountInvitations).all()
		expect(invitations).toHaveLength(1)
		expect(invitations[0].email).toBe('invite@example.com')
		expect(invitations[0].role).toBe('admin')
	})

	test('should be able to query seeded data with Drizzle', async () => {
		await seedTestData(db)

		// Use Drizzle query builder
		const { eq } = await import('drizzle-orm')
		const users = await db.select().from(schema.users).where(eq(schema.users.id, 'user_test_alice')).all()

		expect(users).toHaveLength(1)
		expect(users[0].email).toBe('alice@example.com')
	})
})

describe('@REQ-TEST-004 Test Isolation', () => {
	test('should isolate databases between tests', async () => {
		const { db: db1 } = createTestDatabase()
		await seedTestData(db1)

		const { db: db2 } = createTestDatabase()
		const users = await db2.select().from(schema.users).all()

		// db2 should be empty
		expect(users).toHaveLength(0)
	})

	test('should handle concurrent database creation', () => {
		// Create multiple databases in parallel
		const databases = Array.from({ length: 5 }, () => createTestDatabase())

		// All should be independent
		expect(databases).toHaveLength(5)
		databases.forEach(({ db, d1 }) => {
			expect(db).toBeDefined()
			expect(d1).toBeDefined()
		})
	})
})

describe('@REQ-TEST-005 Performance', () => {
	test('should create database quickly', () => {
		const start = Date.now()
		const { db } = createTestDatabase()
		const duration = Date.now() - start

		expect(db).toBeDefined()
		// Should create in under 100ms
		expect(duration).toBeLessThan(100)
	})

	test('should handle multiple inserts efficiently', async () => {
		const { db } = createTestDatabase()

		const start = Date.now()

		// Insert 100 users
		for (let i = 0; i < 100; i++) {
			await db.insert(schema.users).values({
				id: `user_${i}`,
				email: `user${i}@example.com`,
			})
		}

		const duration = Date.now() - start

		const users = await db.select().from(schema.users).all()
		expect(users).toHaveLength(100)

		// Should insert 100 records in under 1 second
		expect(duration).toBeLessThan(1000)
	})
})
