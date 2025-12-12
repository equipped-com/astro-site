# Fix Catalog Schema Test Database Setup

## Description

Fix failing database tests for catalog/catalog-schema. Tests are failing because test database setup is broken - `createTestDb()` returns undefined, causing all 20 tests to fail.

## Original Task

- **Task ID:** catalog/catalog-schema
- **Commit:** 0b87d74
- **Status:** Marked incomplete due to test failures

## Failing Tests

- src/db/catalog-schema.test.ts - 20 test failures

## Root Cause

The catalog schema tests fail because the test database helper `createTestDb()` (or equivalent) is returning `undefined` instead of a valid database instance. This causes all subsequent tests to fail with:

```
TypeError: Cannot read properties of undefined (reading 'duration')
```

The issue is in the test setup (`beforeEach` hooks), not in the catalog schema itself. Potential causes:

1. Test database initialization failing silently
2. Database helper function not properly initialized
3. Migrations not running in test environment
4. D1 database mock configuration incorrect

## Dependencies

- catalog/catalog-schema - Original implementation (incomplete)
- testing/fix-drizzle-mocking - Drizzle ORM test mocking (done: true, commit: 7fd2d30)
- testing/fix-database-tests - General database test infrastructure fixes

## Acceptance Criteria

- [ ] All 20 tests in catalog-schema.test.ts pass
- [ ] `createTestDb()` or equivalent returns valid database instance
- [ ] Test database properly initializes before tests run
- [ ] Catalog schema migrations run successfully in test environment
- [ ] No regression in other passing database tests
- [ ] Original task catalog/catalog-schema can be marked done: true

## Test Criteria

```gherkin
Feature: Catalog Schema Tests
	As a developer
	I want all catalog schema tests to pass
	So that product catalog structure is verified

	@REQ-CATALOG-001
	Scenario: Initialize test database
		Given a catalog schema test
		When test setup runs
		Then createTestDb() should return valid database instance
		And database should have all required tables

	@REQ-CATALOG-002
	Scenario: Insert brand into catalog
		Given a test database
		When inserting a brand record
		Then brand should be inserted successfully
		And brand should be retrievable by ID

	@REQ-CATALOG-003
	Scenario: Insert product with brand reference
		Given a test database with a brand
		When inserting a product
		Then product should reference the brand
		And product should be retrievable with brand details
```

## Implementation

### Step 1: Analyze Test Database Setup

Review `src/db/catalog-schema.test.ts` to understand:
```typescript
// Look for test setup
beforeEach(async () => {
	const { db, cleanup } = await createTestDb() // Returns undefined?
	// ...
})
```

### Step 2: Debug Database Helper

Check `src/test/drizzle-helpers.ts` or equivalent:
```typescript
export async function createTestDb() {
	// Is this returning undefined?
	// Check for:
	// 1. Missing return statement
	// 2. Async initialization not awaited
	// 3. D1 mock not properly configured
}
```

### Step 3: Verify D1 Mock Configuration

Ensure D1Database mock is properly set up:
```typescript
import { vi } from 'vitest'

// Mock D1Database with proper methods
const mockD1 = {
	prepare: vi.fn(() => ({
		bind: vi.fn().mockReturnThis(),
		all: vi.fn().mockResolvedValue({ results: [] }),
		run: vi.fn().mockResolvedValue({ success: true })
	})),
	batch: vi.fn().mockResolvedValue([]),
	exec: vi.fn().mockResolvedValue({ success: true })
}
```

### Step 4: Fix createTestDb Implementation

Ensure helper returns proper database instance:
```typescript
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '@/db/schema'

export async function createTestDb() {
	const mockD1 = createMockD1Database()
	const db = drizzle(mockD1, { schema })

	// Run migrations if needed
	await runMigrations(db)

	return {
		db,
		cleanup: async () => {
			// Cleanup logic
		}
	}
}
```

### Step 5: Add Better Error Handling

Add debugging to catch initialization failures:
```typescript
beforeEach(async () => {
	const result = await createTestDb()
	if (!result || !result.db) {
		throw new Error('Test database initialization failed')
	}
	db = result.db
	cleanup = result.cleanup
})
```

### Step 6: Run Tests and Verify

```bash
bun run test src/db/catalog-schema.test.ts
```

All 20 tests should pass.

## Files to Create/Modify

**Modify:**
- src/test/drizzle-helpers.ts (or equivalent database helper)
- src/db/catalog-schema.test.ts (add error handling if needed)

**Debug:**
- Check if createTestDb() is actually returning a value
- Verify D1Database mock configuration
- Ensure migrations run before tests

## References

- test-failure-analysis-corrected.md (lines 103-114, 186-204, 279-294)
- Original task: tasks/catalog/catalog-schema.md
- Original commit: 0b87d74
- Related fix: tasks/testing/fix-drizzle-mocking.md (commit: 7fd2d30)

## Investigation Priority

**HIGH PRIORITY** - This blocks 20 tests and affects other database tests. The fix in testing/fix-drizzle-mocking (commit 7fd2d30) should have resolved this, but tests are still failing. Need to investigate why the fix didn't work for catalog schema tests specifically.
