# Task: Subdomain Routing

## Description

Implement subdomain-based tenant resolution for the Equipped platform. Each account gets a subdomain (`{short_name}.tryequipped.com`) that routes to their dashboard. Reserved subdomains route to special handlers.

## Acceptance Criteria

- [ ] Worker extracts subdomain from Host header
- [ ] Tenant lookup by `accounts.short_name`
- [ ] Reserved subdomains handled specially (admin, www, webhooks)
- [ ] Invalid/unknown subdomains return 404
- [ ] Tenant context passed to all API routes

## Test Criteria

```gherkin
Feature: Subdomain-Based Tenant Resolution
  As a platform user
  I want to access my account via subdomain
  So that I have a dedicated URL for my organization

  Background:
    Given the platform domain is "tryequipped.com"

  @REQ-MT-001
  Scenario: Resolve tenant from subdomain
    Given an Account exists with short_name "acme"
    When a request comes to "acme.tryequipped.com"
    Then the system should extract subdomain "acme"
    And lookup account by short_name
    And set tenant context for all subsequent queries

  @REQ-MT-002
  Scenario: Handle reserved subdomains
    When a request comes to "admin.tryequipped.com"
    Then the request should route to admin dashboard
    And NOT attempt tenant lookup

  @REQ-MT-003
  Scenario: Reserved subdomain list
    Then the following subdomains should be reserved:
      | Subdomain | Behavior |
      | www       | Redirect to root |
      | admin     | Admin dashboard |
      | webhooks  | Webhook handlers |
      | api       | 404 (reserved) |
      | app       | 404 (reserved) |
      | billing   | 404 (reserved) |
      | cdn       | 404 (reserved) |
      | help      | 404 (reserved) |
      | shop      | 404 (reserved) |
      | store     | 404 (reserved) |
      | support   | 404 (reserved) |

  @REQ-MT-004
  Scenario: Unknown tenant returns 404
    Given no Account exists with short_name "unknown"
    When a request comes to "unknown.tryequipped.com"
    Then the system should return 404 Not Found
    And display a friendly "Account not found" page

  @REQ-MT-005
  Scenario: Root domain shows marketing site
    When a request comes to "tryequipped.com" (no subdomain)
    Then the marketing landing page should be served
```

## Dependencies

- infrastructure/setup-hono-worker
- database/initial-schema

## Implementation

```typescript
// src/middleware/tenant.ts
import { Context, Next } from 'hono'

const RESERVED_SUBDOMAINS = new Set([
  'www', 'admin', 'webhooks', 'api', 'app',
  'billing', 'cdn', 'help', 'shop', 'store', 'support'
])

export async function tenantMiddleware(c: Context, next: Next) {
  const host = c.req.header('host') || ''
  const subdomain = extractSubdomain(host)

  // Root domain - serve marketing site
  if (!subdomain) {
    return next()
  }

  // Reserved subdomains - special handling
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    c.set('isReserved', true)
    c.set('subdomain', subdomain)
    return next()
  }

  // Tenant lookup
  const account = await c.env.DB
    .prepare('SELECT * FROM accounts WHERE short_name = ?')
    .bind(subdomain)
    .first()

  if (!account) {
    return c.html(renderNotFound(), 404)
  }

  c.set('account', account)
  c.set('accountId', account.id)
  return next()
}

function extractSubdomain(host: string): string | null {
  const parts = host.replace(':8787', '').split('.')
  if (parts.length > 2) {
    return parts[0]
  }
  return null
}
```

## Files to Create

- `src/middleware/tenant.ts` - Tenant resolution middleware
- `src/lib/reserved-subdomains.ts` - Reserved subdomain list
- `src/pages/404-tenant.astro` - Tenant not found page

## References

- PRD.md Section 16: Multi-Tenancy Architecture
- PRD.md Section 13: Infrastructure & DNS
