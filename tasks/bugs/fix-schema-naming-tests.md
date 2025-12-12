# Fix Schema Naming Test Failures

## Description

Fix failing tests for database/fix-schema-naming. Tests are failing in both schema validation and audit log integration tests, totaling 26 test failures.

## Original Task

- **Task ID:** database/fix-schema-naming
- **Commit:** 11362b8
- **Status:** Marked incomplete due to test failures

## Failing Tests

- src/db/schema-naming.test.ts - 16 test failures
- src/db/audit-log.integration.test.ts - 10 test failures

**Total:** 26 test failures

## Root Cause

The schema naming tests fail for multiple reasons:

1. **Schema validation failing** - Tests that verify schema naming conventions are not passing
2. **Table/column naming mismatches** - Schema may not follow expected naming conventions
3. **Audit log integration issues** - Audit log functionality not working as expected in tests
4. **Database test setup issues** - Similar to catalog-schema-tests, test database may not be properly initialized

Possible issues:
- Schema naming wasn't fully fixed in commit 11362b8
- Tests expect different naming conventions than what's implemented
- Audit log integration not working correctly

## Dependencies

- database/fix-schema-naming - Original implementation (incomplete)
- database/initial-schema - Initial schema must be correct
- testing/fix-database-tests - General database test infrastructure fixes

## Acceptance Criteria

- [ ] All 16 tests in schema-naming.test.ts pass
- [ ] All 10 tests in audit-log.integration.test.ts pass
- [ ] Schema follows consistent naming conventions
- [ ] Audit log properly tracks schema changes
- [ ] No regression in other passing database tests
- [ ] Original task database/fix-schema-naming can be marked done: true

## Test Criteria

```gherkin
Feature: Schema Naming Consistency
	As a developer
	I want all schema naming tests to pass
	So that database schema follows conventions

	@REQ-SCHEMA-001
	Scenario: Validate table naming conventions
		Given a database schema
		When checking table names
		Then all tables should use snake_case
		And table names should be plural (e.g., users, devices)

	@REQ-SCHEMA-002
	Scenario: Validate column naming conventions
		Given a database schema
		When checking column names
		Then all columns should use snake_case
		And foreign keys should end with _id

	@REQ-SCHEMA-003
	Scenario: Audit log tracks schema operations
		Given an audit log system
		When a schema change occurs
		Then the change should be logged
		And log should include timestamp and user
```

## Implementation

### Step 1: Review Schema Naming Tests

Check `src/db/schema-naming.test.ts`:
- What naming conventions are being tested?
- What specific failures are occurring?
- Are tests checking table names, column names, or both?

### Step 2: Review Schema Definitions

Check `src/db/schema.ts` (or individual schema files):
```typescript
// Ensure tables follow naming conventions
export const users = pgTable('users', { // plural, snake_case
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at'), // snake_case
	accountId: integer('account_id').references(() => accounts.id) // _id suffix
})
```

### Step 3: Fix Naming Inconsistencies

Common issues to fix:
- Camel case → snake_case conversion
- Singular table names → plural
- Missing `_id` suffix on foreign keys
- Inconsistent date/time column naming

### Step 4: Review Audit Log Implementation

Check `src/db/audit-log.ts` or equivalent:
- Is audit log properly configured?
- Does it track all required operations?
- Are audit log queries working correctly?

### Step 5: Fix Audit Log Tests

Check `src/db/audit-log.integration.test.ts`:
- Are audit log operations being triggered?
- Are test mocks properly configured?
- Is test database recording audit logs?

Example fix:
```typescript
// Ensure audit log is called
const auditLogSpy = vi.spyOn(auditLog, 'log')

await createUser({ name: 'Test' })

expect(auditLogSpy).toHaveBeenCalledWith({
	action: 'user.created',
	userId: expect.any(String),
	timestamp: expect.any(Date)
})
```

### Step 6: Run Tests

Test each file separately:
```bash
bun run test src/db/schema-naming.test.ts
bun run test src/db/audit-log.integration.test.ts
```

### Step 7: Verify No Regressions

Run all database tests:
```bash
bun run test src/db/
```

## Files to Create/Modify

**Modify:**
- src/db/schema-naming.test.ts (fix test expectations or setup)
- src/db/audit-log.integration.test.ts (fix audit log tests)
- Potentially: src/db/schema.ts or schema files (if naming still inconsistent)
- Potentially: src/db/audit-log.ts (if audit log implementation broken)

**Review:**
- All schema table definitions
- Naming convention documentation

## References

- test-failure-analysis-corrected.md (lines 62-63, 87-90, 150, 287-290)
- Original task: tasks/database/fix-schema-naming.md
- Original commit: 11362b8

## Investigation Priority

**MEDIUM-HIGH PRIORITY** - 26 test failures indicate significant issues with schema consistency or test expectations. The commit 11362b8 was supposed to fix schema naming but tests still fail, suggesting either:
1. The fix was incomplete
2. Tests expect different conventions than implemented
3. Test infrastructure issues (similar to catalog-schema-tests)

Need to determine if this is a test infrastructure problem or actual schema issues.
