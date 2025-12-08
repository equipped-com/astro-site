# Task: Tenant Context Provider

## Description

Create a tenant context system that ensures all database queries are automatically scoped to the current account. This prevents data leakage between tenants and simplifies query writing.

## Acceptance Criteria

- [ ] Tenant context available in all API routes
- [ ] Helper functions for scoped queries
- [ ] TypeScript types for tenant-aware requests
- [ ] Automatic `account_id` injection for inserts
- [ ] Query builder with tenant scoping

## Test Criteria

```gherkin
Feature: Tenant Data Isolation
  As a developer
  I want automatic tenant scoping
  So that I cannot accidentally leak data between accounts

  @REQ-MT-006
  Scenario: All queries scoped to current tenant
    Given I am authenticated as user in Account "acme"
    When I query the devices table
    Then all queries should include "WHERE account_id = 'acme_id'"
    And I should NOT see devices from other accounts

  @REQ-MT-007
  Scenario: Inserts automatically include account_id
    Given I am in tenant context for Account "acme"
    When I insert a new device
    Then the device should automatically have account_id set to "acme_id"

  @REQ-MT-008
  Scenario: Cross-tenant query blocked
    Given I am in tenant context for Account "acme"
    When I attempt to query devices with account_id "other_account"
    Then the query should be rejected or return empty

  @REQ-MT-009
  Scenario: Global queries require sys_admin
    Given I am NOT a sys_admin
    When I attempt a query without tenant scoping
    Then the query should fail with "Tenant context required"
```

## Dependencies

- multi-tenancy/subdomain-routing
- auth/clerk-provider

## Implementation

```typescript
// src/lib/tenant-context.ts
import { Context } from 'hono'

export interface TenantContext {
  accountId: string
  account: Account
  userId: string
  role: AccountRole
}

export function getTenantContext(c: Context): TenantContext {
  const account = c.get('account')
  const user = c.get('user')

  if (!account) {
    throw new Error('Tenant context required')
  }

  return {
    accountId: account.id,
    account,
    userId: user?.id,
    role: c.get('role')
  }
}

// Scoped query helpers
export function scopedQuery(c: Context) {
  const { accountId } = getTenantContext(c)
  const db = c.env.DB

  return {
    devices: {
      list: () => db.prepare(
        'SELECT * FROM devices WHERE account_id = ?'
      ).bind(accountId),

      get: (id: string) => db.prepare(
        'SELECT * FROM devices WHERE id = ? AND account_id = ?'
      ).bind(id, accountId),

      insert: (data: Partial<Device>) => db.prepare(`
        INSERT INTO devices (id, account_id, name, type, model, serial_number, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(generateId(), accountId, data.name, data.type, data.model, data.serial_number, 'available')
    },

    people: {
      list: () => db.prepare(
        'SELECT * FROM people WHERE account_id = ?'
      ).bind(accountId),
      // ... more helpers
    },

    orders: {
      list: () => db.prepare(
        'SELECT * FROM orders WHERE account_id = ?'
      ).bind(accountId),
      // ... more helpers
    }
  }
}
```

## Files to Create

- `src/lib/tenant-context.ts` - Tenant context utilities
- `src/lib/scoped-queries.ts` - Tenant-scoped query helpers
- `src/types/tenant.ts` - TypeScript types

## References

- PRD.md Section 16: Multi-Tenancy Architecture
- PRD.md Section: Database Schema (account_id on all tables)
