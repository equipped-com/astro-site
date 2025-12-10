# Task: Fix Schema Naming Consistency

## Description

Update the database schema to use consistent naming: `account_id` instead of `organization_id`. This affects the `audit_log` table and any code that references the old column name.

## Acceptance Criteria

- [ ] Migration created to rename `audit_log.organization_id` to `audit_log.account_id`
- [ ] Migration updates index from `idx_audit_org` to `idx_audit_account`
- [ ] All TypeScript code updated to use `account_id`
- [ ] All queries updated to reference new column name
- [ ] Schema definitions updated in Drizzle ORM
- [ ] No references to `organization_id` remain

## Test Criteria

```gherkin
Feature: Schema Naming Consistency
  As a developer
  I want consistent naming across the schema
  So that the codebase is easier to understand

  @REQ-SCHEMA-001 @Migration
  Scenario: Rename audit_log column
    Given the migration has been run
    When I query the audit_log table structure
    Then I should see column "account_id"
    And I should NOT see column "organization_id"

  @REQ-SCHEMA-002 @Index
  Scenario: Index renamed
    Given the migration has been run
    When I query database indexes
    Then I should see index "idx_audit_account"
    And I should NOT see index "idx_audit_org"

  @REQ-SCHEMA-003 @Code
  Scenario: Code references updated
    Given all TypeScript files
    When I search for "organization_id"
    Then I should find zero references in database queries
    And I should find zero references in schema definitions
    And any references should be in comments/documentation only

  @REQ-SCHEMA-004 @Query
  Scenario: Queries work with new column name
    Given I insert an audit log entry
    When I query by account_id
    Then the query should succeed
    And I should retrieve the correct record
```

## Dependencies

- database/initial-schema (initial schema must exist)

## Migration SQL

```sql
-- Migration: Rename organization_id to account_id in audit_log
-- File: src/db/migrations/XXXX_rename_organization_to_account.sql

-- Drop old index
DROP INDEX IF EXISTS idx_audit_org;

-- Rename column (SQLite doesn't support direct column rename)
-- We need to recreate the table
CREATE TABLE audit_log_new (
    id TEXT PRIMARY KEY,
    account_id TEXT REFERENCES accounts(id),
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data
INSERT INTO audit_log_new (id, account_id, user_id, action, entity_type, entity_id, details, created_at)
SELECT id, organization_id, user_id, action, entity_type, entity_id, details, created_at
FROM audit_log;

-- Drop old table
DROP TABLE audit_log;

-- Rename new table
ALTER TABLE audit_log_new RENAME TO audit_log;

-- Recreate index with new name
CREATE INDEX idx_audit_account ON audit_log(account_id);
```

## Code Changes

### Drizzle Schema
```typescript
// src/db/schema.ts
export const audit_log = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  account_id: text('account_id').references(() => accounts.id), // Changed from organization_id
  user_id: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  entity_type: text('entity_type').notNull(),
  entity_id: text('entity_id').notNull(),
  details: text('details'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  accountIdx: index('idx_audit_account').on(table.account_id) // Changed from idx_audit_org
}));
```

### Audit Logging Code
```typescript
// src/lib/audit.ts
export async function logAudit(data: {
  account_id: string;  // Changed from organization_id
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: object;
}) {
  await db.insert(audit_log).values({
    id: generateId(),
    account_id: data.account_id,  // Changed
    user_id: data.user_id,
    action: data.action,
    entity_type: data.entity_type,
    entity_id: data.entity_id,
    details: JSON.stringify(data.details)
  });
}
```

## Search and Replace

Run these searches to find all references:
```bash
# Find all references to organization_id
grep -r "organization_id" src/

# Find all references to idx_audit_org
grep -r "idx_audit_org" src/
```

Expected files to update:
- `src/db/schema.ts` - Schema definition
- `src/lib/audit.ts` - Audit logging helpers
- Any API routes that create audit logs

## Files to Create

- `src/db/migrations/XXXX_rename_organization_to_account.sql`

## Files to Modify

- `src/db/schema.ts` - Update audit_log schema
- `src/lib/audit.ts` - Update audit logging code
- Any files with `organization_id` references (search results)

## Verification

After migration:
```sql
-- Verify column exists
PRAGMA table_info(audit_log);
-- Should show account_id, not organization_id

-- Verify index exists
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='audit_log';
-- Should show idx_audit_account, not idx_audit_org

-- Verify data preserved
SELECT COUNT(*) FROM audit_log;
-- Should match count before migration
```

## References

- PRD.md Database Schema section (shows account_id naming)
- PRD.md Section 16: Multi-Tenancy Architecture
