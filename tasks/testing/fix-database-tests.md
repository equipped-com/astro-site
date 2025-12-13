# Fix Failing Database Tests

## Description

Fix 4 failing database test files (48 total tests) where schema validation and database operations fail. Root cause is test database setup issues - the `createTestDb()` helper or migration application is failing, causing all database tests to receive undefined values.

## Dependencies

- `testing/setup-vitest` - Test infrastructure must be working
- `testing/fix-drizzle-mocking` - Drizzle mocking should be set up (but currently broken)

## Acceptance Criteria

- [ ] Test database setup works reliably
- [ ] All catalog-schema tests pass (20 tests)
- [ ] All audit-log integration tests pass (10 tests)
- [ ] All schema-naming tests pass (16 tests)
- [ ] All account-invitations-schema tests pass
- [ ] Database migrations run in test environment
- [ ] Test database is isolated per test

## Test Criteria

```gherkin
Feature: Database Test Fixes
	As a developer
	I want all database tests to pass
	So that I can verify schema and data integrity

	@REQ-DB-TEST-001
	Scenario: Test database is created successfully
		Given a test case that needs a database
		When calling createTestDb()
		Then it should return a valid db instance
		And db.query should be a function
		And migrations should be applied

	@REQ-DB-TEST-002
	Scenario: Catalog schema tests pass
		Given a test database
		When inserting a brand with required fields
		Then it should be inserted successfully
		And it should enforce unique constraints
		And it should set default values

	@REQ-DB-TEST-003
	Scenario: Schema naming tests pass
		Given the database schema
		When checking column names
		Then account_id should exist (not organization_id)
		And idx_audit_account should exist (not idx_audit_org)

	@REQ-DB-TEST-004
	Scenario: Tests are isolated
		Given two test cases
		When each creates a test database
		Then they should not interfere with each other
		And data from one test should not appear in another
```

## Implementation

### Failing Database Test Files (4 total)

1. **src/db/catalog-schema.test.ts** - 20 failures
   - Error: `Cannot read properties of undefined (reading 'duration')`
   - Cause: Test database setup failing in beforeEach

2. **src/db/audit-log.integration.test.ts** - 10 failures
   - Tests fail to query audit log table
   - Schema validation failing

3. **src/db/schema-naming.test.ts** - 16 failures
   - Column name checks failing
   - Index checks failing

4. **src/db/account-invitations-schema.test.ts** - failures
   - Schema validation failing

### Root Cause Investigation

**Step 1: Check test database setup**

```typescript
// In catalog-schema.test.ts
beforeEach(async () => {
  const result = await createTestDb()
  console.log('DB result:', result)  // Check what's returned
  console.log('DB instance:', result?.db)  // Is db defined?
  console.log('DB type:', typeof result?.db)
})
```

**Expected:**
```typescript
{
  db: DrizzleD1Database,
  cleanup: () => Promise<void>
}
```

**If undefined:** createTestDb() is failing

### Step 2: Debug createTestDb()

Check `src/test/drizzle-helpers.ts` or equivalent:

```typescript
export async function createTestDb() {
  try {
    // Create in-memory database
    const d1 = await createD1Database()

    // Apply migrations
    await applyMigrations(d1)

    // Create Drizzle instance
    const db = drizzle(d1)

    return {
      db,
      cleanup: async () => {
        // Cleanup logic
      }
    }
  } catch (error) {
    console.error('createTestDb failed:', error)
    throw error
  }
}
```

**Common issues:**
- Migrations not found
- D1 miniflare not initialized
- Drizzle not configured correctly

### Step 3: Check Migration Files

Ensure migrations are accessible in test environment:

```bash
ls -la migrations/
# Should show:
# 0001_initial.sql
# 0002_create_product_catalog.sql
# 0003_create_account_invitations.sql
# 0004_add_synthetic_flags.sql
```

### Step 4: Fix Database Setup

**Option A: Use @miniflare/d1 (recommended)**

```typescript
import { D1Database, D1DatabaseAPI } from '@miniflare/d1'
import { createSQLiteDB } from '@miniflare/shared'
import Database from 'better-sqlite3'

export async function createTestDb() {
  // Create in-memory SQLite
  const sqliteDb = new Database(':memory:')

  // Wrap with D1 API
  const d1 = new D1Database(new D1DatabaseAPI(sqliteDb))

  // Apply migrations
  for (const migration of getMigrations()) {
    await d1.exec(migration)
  }

  // Create Drizzle instance
  const db = drizzle(d1)

  return {
    db,
    cleanup: async () => {
      sqliteDb.close()
    }
  }
}
```

**Option B: Mock D1Database**

```typescript
export function createMockD1() {
  const storage = new Map()

  return {
    prepare: (sql: string) => ({
      bind: (...params: any[]) => ({
        run: async () => ({ success: true, meta: {} }),
        all: async () => ({ results: [], success: true }),
        first: async () => ({}),
      }),
    }),
    exec: async (sql: string) => ({ count: 0, duration: 0 }),
  }
}
```

### Step 5: Ensure Migrations Run

**Create migration loader:**

```typescript
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function getMigrations(): string[] {
  const migrationsDir = join(process.cwd(), 'migrations')

  return [
    '0001_initial.sql',
    '0002_create_product_catalog.sql',
    '0003_create_account_invitations.sql',
    '0004_add_synthetic_flags.sql',
  ].map(file => readFileSync(join(migrationsDir, file), 'utf-8'))
}

export async function applyMigrations(db: D1Database) {
  for (const migration of getMigrations()) {
    await db.exec(migration)
  }
}
```

### Step 6: Update Test Files

**Pattern for all database tests:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDb } from '@/test/drizzle-helpers'
import type { DrizzleD1Database } from 'drizzle-orm/d1'

describe('Catalog Schema', () => {
  let db: DrizzleD1Database
  let cleanup: () => Promise<void>

  beforeEach(async () => {
    const result = await createTestDb()
    db = result.db
    cleanup = result.cleanup
  })

  afterEach(async () => {
    await cleanup()
  })

  it('should create a brand', async () => {
    const [brand] = await db.insert(brands).values({
      name: 'Apple',
      slug: 'apple',
    }).returning()

    expect(brand.name).toBe('Apple')
  })
})
```

### Verification

After fixing, run each test file:

```bash
bun run test src/db/catalog-schema.test.ts
bun run test src/db/audit-log.integration.test.ts
bun run test src/db/schema-naming.test.ts
bun run test src/db/account-invitations-schema.test.ts
```

All should pass.

## Files to Create/Modify

**Modify:**
- `src/test/drizzle-helpers.ts` - Fix createTestDb()
- All 4 database test files (ensure proper setup/teardown)

**Create:**
- `src/test/migrations-loader.ts` - Load migration files
- `src/test/fixtures/database.ts` - Shared database fixtures

## Notes

- Database tests are critical for data integrity
- Fix the helper function first, then all tests should pass
- Consider using @miniflare/d1 for D1-compatible testing
- Ensure migrations run in correct order
- Tests should be isolated (no shared state)

## References

- test-failure-analysis-corrected.md (Pattern 3: Database Test Setup)
- src/test/drizzle-helpers.ts (likely broken)
- tasks/testing/fix-drizzle-mocking.md (original implementation)
- @miniflare/d1 docs: https://miniflare.dev/
