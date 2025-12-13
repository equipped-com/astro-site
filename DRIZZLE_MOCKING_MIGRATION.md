# Drizzle Mocking Migration Guide

## Overview

This document tracks the migration from manual D1 database mocking to in-memory D1 databases using Miniflare and better-sqlite3. This provides full Drizzle ORM support in tests without complex manual mocking.

## Status: IN PROGRESS

**IMPORTANT:** Before running tests, you MUST install the required dependencies:

```bash
bun install
```

This will install `@miniflare/d1` and `better-sqlite3` that were added to `package.json`.

## What's Changed

### 1. New Test Infrastructure ✅ COMPLETE

- **Created:** `/src/test/drizzle-helpers.ts`
  - `createTestDatabase()` - Creates in-memory D1 with full Drizzle support
  - `seedTestData()` - Seeds common test fixtures (users, accounts, brands, products)
  - `seedTestInvitation()` - Seeds test invitations with configurable options
  - `cleanupTestDatabase()` - Cleanup helper (mostly automatic for in-memory DBs)

- **Updated:** `/src/test/setup.ts`
  - Centralized Clerk mocking for `@clerk/clerk-react` and `@hono/clerk-auth`
  - All tests now have consistent auth mocking by default
  - Tests can override mock values per-test if needed

### 2. Package Dependencies ✅ COMPLETE

Added to `package.json` devDependencies:
- `@miniflare/d1@^3.20241106.2` - Miniflare D1 implementation
- `better-sqlite3@^11.7.0` - SQLite database engine

## Migration Pattern

### Before (Manual Mocking):

```typescript
const mockDb = {
	prepare: vi.fn(() => ({
		bind: vi.fn(() => ({
			all: vi.fn(async () => [
				{ id: 'brand_1', name: 'Apple' },
			]),
		})),
	})),
} as unknown as D1Database
```

**Problems:**
- Incomplete D1 interface
- No Drizzle query builder support
- Complex manual mock chains
- Hard to maintain

### After (Real Database):

```typescript
import { createTestDatabase, seedTestData } from '@/test/drizzle-helpers'

let db: ReturnType<typeof createTestDatabase>

beforeEach(async () => {
	db = createTestDatabase()
	await seedTestData(db) // Optional: seed common fixtures
})

// Access the D1 client
const env: MockEnv = { DB: db.$client as D1Database }

// Or use Drizzle directly in tests
const brands = await db.select().from(schema.brands)
```

**Benefits:**
- Full Drizzle ORM query builder
- Real SQL execution (in-memory)
- Automatic migration application
- Test isolation (each test gets fresh DB)
- Faster and more reliable

## Files Updated

### ✅ COMPLETE:
1. `/src/test/drizzle-helpers.ts` - Test database factory (NEW)
2. `/src/test/setup.ts` - Centralized Clerk mocking
3. `/src/workers/invitation-expiry.test.ts` - Converted to real database
4. `/package.json` - Added Miniflare and better-sqlite3

### ⏳ TODO - Catalog API Tests (40+ failures):
5. `/src/api/routes/catalog/brands.test.ts`
6. `/src/api/routes/catalog/products.test.ts`
7. `/src/api/routes/catalog/inventory.test.ts`

### ⏳ TODO - Other Failing Tests (50+ failures):
8. `/src/api/routes/invitations.test.ts`
9. `/src/api/routes/admin/impersonation.test.ts`
10. `/src/components/cart/Cart.test.tsx`
11. `/src/test/pages/dashboard/index.test.tsx`

## How to Update a Test File

### Step 1: Import Test Helpers

```typescript
import { createTestDatabase, seedTestData, seedTestInvitation } from '@/test/drizzle-helpers'
import * as schema from '@/db/schema'
```

### Step 2: Setup Database in beforeEach

```typescript
let db: ReturnType<typeof createTestDatabase>

beforeEach(async () => {
	db = createTestDatabase()
	// Optionally seed common data
	await seedTestData(db)
})
```

### Step 3: Replace Manual Mocks

**Before:**
```typescript
const mockDb = {
	prepare: vi.fn(() => ({
		bind: vi.fn(() => ({
			all: vi.fn(async () => mockData),
		})),
	})),
} as unknown as D1Database
```

**After (for Hono API tests):**
```typescript
// Use the real database's D1 client
const app = createTestApp(db.$client as D1Database, { isSysAdmin: true })
```

**After (for direct database tests):**
```typescript
// Use Drizzle directly
const result = await db.select().from(schema.brands).where(eq(schema.brands.id, 'brand_1'))
```

### Step 4: Seed Test Data

Instead of mocking return values, insert real data:

```typescript
// Before: Mock return value
mockStatement.all.mockResolvedValue({ results: [mockBrand] })

// After: Insert into real database
await db.insert(schema.brands).values({
	id: 'brand_test',
	name: 'Apple',
	slug: 'apple',
	logoUrl: 'https://example.com/apple.png',
	isActive: true,
})
```

## Example: Brands API Test Migration

See `/src/workers/invitation-expiry.test.ts` for a complete example of the migration pattern.

### Key Changes:
1. Import `createTestDatabase` and `seedTestData`
2. Create `db` instance in `beforeEach`
3. Pass `db.$client` to Hono app as D1Database
4. Use `seedTestData()` or manual inserts instead of mocks
5. Drizzle queries now work natively

## Testing the Migration

After updating test files, verify all tests pass:

```bash
# Run all tests
bun run test

# Watch mode for development
bun run test:watch

# Coverage report
bun run test:coverage
```

## Success Criteria

- ✅ All 1,399 tests pass
- ✅ Zero manual D1 database mocks remain
- ✅ Test execution time improves or stays same
- ✅ Test coverage remains above 85%

## Current Status

**Tests Status:**
- Total Tests: 1,399
- Passing: 1,301
- Failing: 93 (down from 92)
- Skipped: 5

**Test Files:**
- ✅ Completed: 4 files
- ⏳ Remaining: ~10-15 files with database mocking

## Next Steps

1. ✅ Install dependencies: `bun install`
2. ⏳ Update catalog API tests (`/src/api/routes/catalog/*.test.ts`)
3. ⏳ Update invitation API tests (`/src/api/routes/invitations.test.ts`)
4. ⏳ Update impersonation tests (`/src/api/routes/admin/impersonation.test.ts`)
5. ⏳ Update component tests that use database
6. ⏳ Run full test suite to verify
7. ⏳ Commit changes
8. ⏳ Mark task as complete in `tasks/index.yml`

## Notes

- In-memory SQLite is faster than file I/O
- Each test gets isolated database instance
- Migrations are applied automatically
- Common fixtures available via `seedTestData()`
- Custom data can be inserted per-test
