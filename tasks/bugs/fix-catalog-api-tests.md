# Fix Catalog API Endpoint Tests

## Description

Fix failing API endpoint tests for catalog/catalog-api. Tests are failing across brands, products, and inventory endpoints due to mock expectations not being met.

## Original Task

- **Task ID:** catalog/catalog-api
- **Commit:** 2beacaf
- **Status:** Marked incomplete due to test failures

## Failing Tests

- src/api/routes/catalog/brands.test.ts - ~5 test failures
- src/api/routes/catalog/products.test.ts - ~5 test failures
- src/api/routes/catalog/inventory.test.ts - ~5 test failures

**Total:** ~15 test failures

## Root Cause

The catalog API endpoint tests are failing because:

1. **Mock expectations not met** - Tests expect certain functions to be called but they aren't
2. **Database mocks incorrect** - Database queries may not be properly mocked
3. **Auth middleware mocks** - Authentication/authorization may not be properly mocked
4. **Response format mismatches** - API responses may not match test expectations

Common pattern:
```
AssertionError: expected "vi.fn()" to be called with arguments: [...]
Received: [nothing]
```

## Dependencies

- catalog/catalog-api - Original implementation (incomplete)
- catalog/catalog-schema - Catalog schema must be working (depends on bugs/fix-catalog-schema-tests)
- api/auth-middleware - Auth middleware must be properly mocked
- testing/fix-api-tests - General API test infrastructure fixes

## Acceptance Criteria

- [ ] All tests in brands.test.ts pass (~5 tests)
- [ ] All tests in products.test.ts pass (~5 tests)
- [ ] All tests in inventory.test.ts pass (~5 tests)
- [ ] Mock database queries properly configured
- [ ] Auth middleware properly mocked for catalog endpoints
- [ ] No regression in other passing API tests
- [ ] Original task catalog/catalog-api can be marked done: true

## Test Criteria

```gherkin
Feature: Catalog API Endpoints
	As a developer
	I want all catalog API tests to pass
	So that catalog management is verified

	@REQ-CATALOG-API-001
	Scenario: List all brands
		Given a GET request to /api/catalog/brands
		And the user is authenticated
		When the endpoint is called
		Then it should return a list of brands
		And response status should be 200

	@REQ-CATALOG-API-002
	Scenario: Create a new brand
		Given a POST request to /api/catalog/brands
		And the user has admin permissions
		And valid brand data is provided
		When the endpoint is called
		Then brand should be created in database
		And response should include brand ID

	@REQ-CATALOG-API-003
	Scenario: List products by brand
		Given a GET request to /api/catalog/products?brand_id=X
		And the user is authenticated
		When the endpoint is called
		Then it should return products for that brand
		And each product should include brand details

	@REQ-CATALOG-API-004
	Scenario: Update inventory quantity
		Given a PATCH request to /api/catalog/inventory/:id
		And the user has admin permissions
		And valid quantity data is provided
		When the endpoint is called
		Then inventory quantity should be updated
		And response should reflect new quantity
```

## Implementation

### Step 1: Review API Endpoint Implementation

Check each endpoint file:
- `src/api/routes/catalog/brands.ts`
- `src/api/routes/catalog/products.ts`
- `src/api/routes/catalog/inventory.ts`

Understand:
- What database queries are made
- What auth checks are performed
- What response format is returned

### Step 2: Review Test Files

Check each test file to understand:
- What mocks are being set up
- What the tests expect to happen
- Where mock expectations are not being met

### Step 3: Fix Database Mocks

Ensure database queries are properly mocked:
```typescript
import { vi } from 'vitest'
import * as schema from '@/db/schema'

// Mock database query
const mockDb = {
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	execute: vi.fn().mockResolvedValue([
		{ id: 1, name: 'Apple', slug: 'apple' }
	])
}

vi.mock('@/db/connection', () => ({
	db: mockDb
}))
```

### Step 4: Fix Auth Middleware Mocks

Ensure auth middleware allows test requests:
```typescript
import { vi } from 'vitest'

vi.mock('@/api/middleware/auth', () => ({
	requireAuth: (handler) => handler,
	requireRole: (role) => (handler) => handler
}))
```

### Step 5: Fix Request/Response Mocks

Ensure Hono context is properly mocked:
```typescript
import { Context } from 'hono'

const mockContext = {
	req: {
		json: vi.fn().mockResolvedValue({ name: 'Apple' }),
		param: vi.fn((key) => '1'),
		query: vi.fn((key) => 'apple')
	},
	json: vi.fn((data) => new Response(JSON.stringify(data))),
	env: { DB: mockDb }
} as unknown as Context
```

### Step 6: Run Each Test File

Test each endpoint separately:
```bash
bun run test src/api/routes/catalog/brands.test.ts
bun run test src/api/routes/catalog/products.test.ts
bun run test src/api/routes/catalog/inventory.test.ts
```

### Step 7: Run All Catalog API Tests

```bash
bun run test src/api/routes/catalog/
```

All ~15 tests should pass.

## Files to Create/Modify

**Modify:**
- src/api/routes/catalog/brands.test.ts
- src/api/routes/catalog/products.test.ts
- src/api/routes/catalog/inventory.test.ts
- Potentially: API endpoint files if implementation has bugs

**Review:**
- src/api/routes/catalog/brands.ts
- src/api/routes/catalog/products.ts
- src/api/routes/catalog/inventory.ts

## References

- test-failure-analysis-corrected.md (lines 50-55, 149, 297-311)
- Original task: tasks/catalog/catalog-api.md
- Original commit: 2beacaf
- Related: tasks/bugs/fix-catalog-schema-tests.md (must fix schema tests first)

## Dependencies Order

This task depends on `bugs/fix-catalog-schema-tests` being completed first, since API endpoints rely on the catalog schema being properly tested and working.
