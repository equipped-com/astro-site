# Test Database Migration Guide

This guide explains how to migrate tests from manual D1 mocking to using the in-memory D1 database with Drizzle ORM.

## Overview

**Problem:** Tests were using manual D1 mocks that don't implement Drizzle's query builder interface, causing 92+ tests to fail.

**Solution:** Use `createTestDatabase()` which provides a real in-memory D1 database with full Drizzle ORM support via Miniflare.

## Benefits

1. **Real Drizzle Queries** - Full query builder support (`.where()`, `.limit()`, joins, etc.)
2. **Faster Tests** - In-memory SQLite is faster than file I/O
3. **Better Reliability** - Tests use real database operations, not partial mocks
4. **Automatic Migrations** - Schema is applied automatically
5. **Test Isolation** - Each test gets a fresh database instance

## Migration Pattern

### Before (Manual Mocking)

```typescript
import { vi } from 'vitest'

const mockDb = {
	prepare: vi.fn(() => ({
		bind: vi.fn(() => ({
			all: vi.fn(async () => [{ id: '1', name: 'Test' }]),
		})),
	})),
} as unknown as D1Database

const app = createTestApp(mockDb)
```

**Problems:**
- Complex mock setup
- Doesn't support Drizzle query builder
- Brittle - breaks when queries change
- No type safety

### After (Real Database)

```typescript
import { createTestDatabase, seedTestData } from '@/test/drizzle-helpers'
import * as schema from '@/db/schema'

let db: ReturnType<typeof createTestDatabase>['db']
let dbBinding: D1Database

beforeEach(async () => {
	const dbResult = createTestDatabase()
	db = dbResult.db
	dbBinding = dbResult.d1

	// Seed test data
	await seedTestData(db)

	// Add test-specific data
	await db.insert(schema.products).values({
		id: 'prod_test_1',
		name: 'Test Product',
		// ... other fields
	})
})

const app = createTestApp({ isSysAdmin: true })
```

**Benefits:**
- Simple setup
- Full Drizzle support
- Type-safe
- Real database operations

## Step-by-Step Migration

### 1. Update Imports

```typescript
// Add these imports
import { createTestDatabase, seedTestData } from '@/test/drizzle-helpers'
import * as schema from '@/db/schema'
import type { D1Database } from '@miniflare/d1'

// Remove vi import if only used for database mocking
// Keep vi if used for other mocks (Clerk, etc.)
```

### 2. Declare Test Database Variables

```typescript
let db: ReturnType<typeof createTestDatabase>['db']
let dbBinding: D1Database
```

### 3. Update beforeEach Hook

```typescript
beforeEach(async () => {
	// Create fresh database with migrations
	const dbResult = createTestDatabase()
	db = dbResult.db
	dbBinding = dbResult.d1

	// Seed common test data (user, account, brand, product)
	await seedTestData(db)

	// Add test-specific data
	await db.insert(schema.tableName).values({
		// your test data
	})
})
```

### 4. Update Test App Creation

Remove the `mockDb` parameter and use `dbBinding`:

```typescript
// Before
function createTestApp(mockDb: D1Database, options: {...}) {
	// ...
	c.env = { DB: mockDb, ... }
}

const app = createTestApp(mockDb, { isSysAdmin: true })

// After
function createTestApp(options: {...}) {
	// ...
	c.env = { DB: dbBinding, ... }
}

const app = createTestApp({ isSysAdmin: true })
```

### 5. Update Test Assertions

Use real IDs from seedTestData():

```typescript
// Before
expect(data.items[0].productId).toBe('prod_macbook')

// After
expect(data.items[0].productId).toBe('prod_test_macbook')
```

## Available Test Helpers

### `createTestDatabase()`

Creates an in-memory D1 database with all migrations applied.

```typescript
const { db, d1 } = createTestDatabase()
// db: Drizzle ORM instance with full query builder
// d1: Raw D1Database binding for Hono environment
```

### `seedTestData(db)`

Seeds common test fixtures:

```typescript
const fixtures = await seedTestData(db)

// Returns:
{
	userId: 'user_test_alice',
	accountId: 'acct_test_primary',
	accessId: 'access_test_alice',
	brandId: 'brand_test_apple',
	productId: 'prod_test_macbook'
}
```

**Creates:**
- User: alice@example.com (owner)
- Account: "Test Account" (short_name: "test")
- Account Access: Alice as owner
- Brand: Apple
- Product: MacBook Pro 16"

### `seedTestInvitation(db, options)`

Seeds an account invitation:

```typescript
const invitationId = await seedTestInvitation(db, {
	email: 'invitee@example.com',
	role: 'admin',
	expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
})
```

## Common Patterns

### Pattern 1: API Route Tests

```typescript
describe('My API Route', () => {
	let db: ReturnType<typeof createTestDatabase>['db']
	let dbBinding: D1Database

	beforeEach(async () => {
		const dbResult = createTestDatabase()
		db = dbResult.db
		dbBinding = dbResult.d1
		await seedTestData(db)
	})

	test('should list items', async () => {
		// Insert test data
		await db.insert(schema.items).values({ id: 'item_1', name: 'Test' })

		// Create app with real database
		const app = createTestApp({ isSysAdmin: true })

		// Test the endpoint
		const res = await app.request('/')
		expect(res.status).toBe(200)
	})
})
```

### Pattern 2: Schema Integration Tests

```typescript
describe('Schema Integration', () => {
	let db: ReturnType<typeof createTestDatabase>['db']

	beforeEach(() => {
		const dbResult = createTestDatabase()
		db = dbResult.db
	})

	test('should enforce unique constraints', async () => {
		await db.insert(schema.brands).values({
			id: 'brand_1',
			name: 'Apple',
			slug: 'apple',
		})

		// Duplicate insert should fail
		await expect(
			db.insert(schema.brands).values({
				id: 'brand_2',
				name: 'Apple', // Duplicate name
				slug: 'apple-2',
			})
		).rejects.toThrow()
	})
})
```

### Pattern 3: Worker/Cron Tests

```typescript
describe('Invitation Expiry Worker', () => {
	let db: ReturnType<typeof createTestDatabase>['db']
	let dbBinding: D1Database

	beforeEach(async () => {
		const dbResult = createTestDatabase()
		db = dbResult.db
		dbBinding = dbResult.d1
		await seedTestData(db)
	})

	test('should expire old invitations', async () => {
		// Create expired invitation
		await seedTestInvitation(db, {
			email: 'expired@example.com',
			expiresAt: new Date(Date.now() - 1000).toISOString(),
		})

		// Run worker logic
		await expireInvitations(dbBinding)

		// Verify expiration
		const invitations = await db.select().from(schema.accountInvitations).all()
		expect(invitations[0].revokedAt).toBeDefined()
	})
})
```

## Files That Need Migration

Based on test failures, these files need updating:

### High Priority (Catalog API)
- ✅ `src/api/routes/catalog/inventory.test.ts` - DONE
- ✅ `src/api/routes/catalog/products.test.ts` - DONE
- ⬜ `src/api/routes/catalog/brands.test.ts`

### Integration Tests
- ⬜ `src/api/device-crud.integration.test.ts`
- ⬜ `src/db/account-invitations-schema.test.ts`
- ⬜ `src/lib/tenant.integration.test.ts`
- ⬜ `src/workers/invitation-expiry.test.ts`
- ⬜ `src/db/audit-log.integration.test.ts`
- ⬜ `src/db/catalog-schema.test.ts`

### Other API Routes
- ⬜ `src/api/routes/user.test.ts`
- ⬜ `src/api/routes/team.test.ts`
- ⬜ `src/api/routes/admin/impersonation.test.ts`

### Component Tests with API Integration
- ⬜ `src/components/dashboard/QuickStats.test.tsx`
- ⬜ `src/components/admin/catalog/BrandTable.test.tsx`

## Troubleshooting

### Issue: "Cannot read properties of undefined (reading 'client')"

**Cause:** Trying to access internal Drizzle properties

**Fix:** Use the new API that returns both `db` and `d1`:

```typescript
const { db, d1 } = createTestDatabase()
dbBinding = d1  // Use d1 directly
```

### Issue: "The URL must be of scheme file"

**Cause:** Using `import.meta.url` in test environment

**Fix:** Already fixed in drizzle-helpers.ts by using `findProjectRoot()`

### Issue: Migration not found

**Cause:** Migration files in wrong location

**Fix:** Ensure migrations are in `/migrations/` directory at project root

### Issue: Type errors with schema fields

**Cause:** Schema changed but test data hasn't been updated

**Fix:** Check schema.ts for current field names (e.g., `shortName` not `subdomain`)

## Performance Notes

- Database creation: ~50ms
- Migration application: ~20ms
- Seed data: ~10ms
- **Total setup time: ~80ms per test**

This is faster than manual mocking because:
1. No complex mock function setup
2. In-memory SQLite is highly optimized
3. Reuses schema definitions

## Best Practices

1. **Always use beforeEach** - Creates fresh database for isolation
2. **Seed common data** - Use `seedTestData()` for consistency
3. **Use real IDs** - Reference fixture IDs from seedTestData()
4. **Test actual queries** - Don't mock what you can test
5. **Keep tests focused** - One database operation per test when possible

## Questions?

See:
- `src/test/drizzle-helpers.ts` - Implementation
- `src/test/drizzle-helpers.test.ts` - Usage examples
- `src/api/routes/catalog/inventory.test.ts` - Full migration example
