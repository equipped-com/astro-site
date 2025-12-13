---
epic: testing
task_id: fix-drizzle-mocking
title: Replace Manual Drizzle Mocks with In-Memory D1 Database
complexity: medium
priority: high
---

# Replace Manual Drizzle Mocks with In-Memory D1 Database

## Description

Currently 92 tests (7%) are failing because they use manual D1 mocks that don't implement Drizzle's query builder interface. These manual mocks return raw D1 statement objects instead of Drizzle query results, causing integration tests to fail.

This task replaces all manual database mocking with an in-memory D1 database using Miniflare, giving tests a real database instance with full Drizzle ORM support while remaining isolated and fast.

## Context

### Current Problems
- Tests mock `D1Database` directly with incomplete interfaces
- Mocks don't implement Drizzle's query builder methods (`.where()`, `.limit()`, etc.)
- Integration tests need real database operations, not partial mocks
- Clerk auth mocking is scattered across individual test files
- Database state isn't properly isolated between tests

### Solution
- Use Miniflare's D1 implementation with in-memory SQLite
- Create test database factory that applies migrations automatically
- Centralize Clerk mocking in test setup
- Seed common test fixtures for consistent testing
- Ensure proper test isolation

## Acceptance Criteria

- [ ] Install Miniflare D1 and better-sqlite3 dependencies
- [ ] Create test database factory (`src/test/drizzle-helpers.ts`)
- [ ] Centralize Clerk mocks in `src/test/setup.ts`
- [ ] Update all failing test files to use real database
- [ ] All 92 failing tests now pass
- [ ] Full test suite passes (1,399 tests)
- [ ] Test execution maintains or improves performance
- [ ] No manual database mocking code remains

## Test Criteria

```gherkin
Feature: Reliable Drizzle Integration Tests
  As a developer
  I want tests to use a real in-memory database
  So that Drizzle queries work without complex mocking

  @REQ-TEST-001 @Database @Helpers
  Scenario: Test database factory creates in-memory D1
    Given I am writing a test that queries the database
    When I use createTestDatabase() helper
    Then I should get a Drizzle instance with full query builder support
    And the database should be in-memory (no file I/O)
    And the database should be isolated per test

  @REQ-TEST-002 @Migrations @Schema
  Scenario: Test database applies migrations automatically
    Given I created a test database
    When the database is initialized
    Then all migrations should be applied
    And schema should match production schema
    And tables should be empty (clean state)

  @REQ-TEST-003 @Fixtures @Data
  Scenario: Seed test data with fixtures
    Given I have a test database
    When I use seedTestData() helper
    Then common test fixtures should be created
    And I should be able to query them with Drizzle
    And data should include: users, accounts, access records

  @REQ-TEST-004 @Cleanup @Isolation
  Scenario: Tests are isolated from each other
    Given I run multiple tests in parallel
    When each test creates a database
    Then databases should not interfere with each other
    And cleanup should happen automatically after each test

  @REQ-TEST-005 @Performance @Speed
  Scenario: Tests run faster with in-memory database
    Given I have 1,399 tests in the suite
    When I run the full test suite
    Then all tests should pass
    And suite should complete faster than with manual mocks
```

## Implementation Details

### Step 1: Install Dependencies

```bash
bun add -d @miniflare/d1 better-sqlite3
```

### Step 2: Create Test Database Factory

Create `src/test/drizzle-helpers.ts`:

```typescript
import { drizzle } from 'drizzle-orm/d1'
import { D1Database } from '@miniflare/d1'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as schema from '@/db/schema'

export function createTestDatabase() {
  // Create in-memory SQLite database
  const sqlite = new Database(':memory:')

  // Wrap with Miniflare D1 API
  const d1 = new D1Database(sqlite)

  // Apply migrations in order
  const migrations = [
    '0000_initial_schema.sql',
    '0001_add_audit_log.sql',
    '0002_create_product_catalog.sql',
    '0003_create_account_invitations.sql'
  ]

  for (const file of migrations) {
    try {
      const sql = readFileSync(
        join(__dirname, '../../migrations', file),
        'utf-8'
      )
      sqlite.exec(sql)
    } catch (error) {
      console.warn(`Migration ${file} not found or failed`)
    }
  }

  // Return Drizzle instance with schema
  return drizzle(d1, { schema })
}

export async function seedTestData(db: ReturnType<typeof createTestDatabase>) {
  // Insert common test fixtures
  // Returns fixture IDs for assertions
  return {
    userId: 'test-user-1',
    accountId: 'test-account-1',
    accessId: 'test-access-1'
  }
}

export function cleanupTestDatabase(db: ReturnType<typeof createTestDatabase>) {
  // Cleanup happens automatically since database is in-memory
  // Database is garbage collected when test ends
}
```

### Step 3: Centralize Clerk Mocking

Update `src/test/setup.ts`:

```typescript
import { vi } from 'vitest'

// Auto-mock Clerk in all tests
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    user: null,
    isSignedIn: false,
    isLoaded: true
  })),
  useSession: vi.fn(() => ({
    session: null,
    isLoaded: true
  })),
  SignedIn: ({ children }: { children: React.ReactNode }) =>
    children,
  SignedOut: ({ children }: { children: React.ReactNode }) =>
    children,
  UserButton: () => null,
  ClerkProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}))

vi.mock('@hono/clerk-auth', () => ({
  clerkMiddleware: () => (c: any, next: any) => next(),
  getAuth: vi.fn(() => ({
    userId: 'test-user-1',
    sessionId: 'test-session-1'
  }))
}))
```

### Step 4: Update Test Files

Replace manual mocks with test database in failing tests:

**Before (manual mock):**
```typescript
const mockDb = {
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({ all: vi.fn().mockReturnValue([]) }))
  }))
}
```

**After (real database):**
```typescript
import { createTestDatabase } from '@/test/drizzle-helpers'

let db: ReturnType<typeof createTestDatabase>

beforeEach(() => {
  db = createTestDatabase()
})

// Now Drizzle queries work naturally
it('should fetch products', async () => {
  const products = await db.select().from(schema.products)
  expect(products).toHaveLength(0) // Clean state
})
```

### Files to Modify

**Create:**
- `src/test/drizzle-helpers.ts` - Test database factory

**Update:**
- `src/test/setup.ts` - Centralize Clerk mocks
- All test files with database-related failures (92 tests):
  - `src/workers/invitation-expiry.test.ts`
  - `src/api/routes/catalog/*.test.ts`
  - `src/db/*.test.ts`
  - Any other `*.test.ts` with manual DB mocks

## Success Metrics

- ✅ All 92 failing tests now pass
- ✅ Full test suite passes (1,399 tests)
- ✅ Test execution time improves or stays the same
- ✅ No manual database mocking code remains in test files
- ✅ Coverage remains above 85%
- ✅ New tests use in-memory database by default

## Dependencies

- `testing/setup-vitest` - Vitest infrastructure already in place
- Database schema and migrations must exist

## Notes

- This is a test infrastructure improvement with no production code changes
- In-memory SQLite is faster than file I/O
- Tests become more reliable by using real Drizzle query builder
- Migration order matters - ensure migrations are applied sequentially
