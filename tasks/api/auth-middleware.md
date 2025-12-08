# Task: Auth Middleware

## Description

Create Hono middleware to verify Clerk JWT tokens on protected API routes. This middleware authenticates requests and populates the request context with user and account information for downstream handlers.

## Acceptance Criteria

- [x] `@hono/clerk-auth` installed
- [x] Auth middleware created for JWT verification
- [x] User ID available in route handlers via context
- [x] Account context resolved from subdomain or cookie
- [x] Role-based access control helpers
- [x] Unauthenticated requests return 401
- [x] Unauthorized requests return 403

## Test Criteria

```gherkin
Feature: Authentication Middleware
  As the API
  I want to verify user identity and permissions
  So that only authorized users can access protected resources

  @REQ-AUTH-001
  Scenario: Reject request without token
    Given no Authorization header
    When I GET "/api/devices"
    Then response status should be 401
    And response body should contain "Unauthorized"

  @REQ-AUTH-002
  Scenario: Reject invalid token
    Given Authorization header with invalid JWT
    When I GET "/api/devices"
    Then response status should be 401
    And response body should contain "Invalid token"

  @REQ-AUTH-003
  Scenario: Accept valid token
    Given valid Clerk session token for user "user_123"
    When I GET "/api/user"
    Then response status should be 200
    And handler should have access to userId "user_123"

  @REQ-AUTH-004
  Scenario: Resolve account from subdomain
    Given valid token for user "user_123"
    And request Host header is "acme.tryequipped.com"
    And user "user_123" has access to account "acme"
    When I GET "/api/devices"
    Then response status should be 200
    And handler should have accountId from "acme" account

  @REQ-AUTH-005
  Scenario: Reject if no account access
    Given valid token for user "user_123"
    And request Host header is "secret-corp.tryequipped.com"
    And user "user_123" does NOT have access to "secret-corp"
    When I GET "/api/devices"
    Then response status should be 403
    And response body should contain "No access to this account"

  @REQ-AUTH-006
  Scenario: Role-based access control
    Given valid token for user "user_123"
    And user has "member" role in current account
    When I POST to "/api/settings/billing" (requires admin)
    Then response status should be 403
    And response body should contain "Admin access required"

  @REQ-AUTH-007
  Scenario: Allow public routes
    When I GET "/api/health"
    Then response status should be 200
    And no authentication should be required
```

## Dependencies

- infrastructure/setup-hono-worker
- auth/create-clerk-app
- multi-tenancy/subdomain-routing

## Files to Create

- `src/api/middleware/auth.ts`
- `src/api/middleware/require-role.ts`

## Implementation

```typescript
// src/api/middleware/auth.ts
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import type { Context, Next, MiddlewareHandler } from 'hono'

export const authMiddleware = clerkMiddleware()

export function requireAuth(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const auth = getAuth(c)
    if (!auth?.userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    await next()
  }
}

export function requireAccountAccess(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const auth = getAuth(c)
    if (!auth?.userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const accountId = c.get('accountId')
    if (!accountId) {
      return c.json({ error: 'Account context required' }, 400)
    }

    // Verify user has access to this account
    const access = await c.env.DB.prepare(`
      SELECT role FROM account_access
      WHERE user_id = ? AND account_id = ?
    `).bind(auth.userId, accountId).first()

    if (!access) {
      return c.json({ error: 'No access to this account' }, 403)
    }

    c.set('user', { id: auth.userId })
    c.set('role', access.role)

    await next()
  }
}
```

```typescript
// src/api/middleware/require-role.ts
import type { Context, Next, MiddlewareHandler } from 'hono'

type Role = 'owner' | 'admin' | 'member' | 'viewer'

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
}

export function requireRole(minimumRole: Role): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const userRole = c.get('role') as Role | undefined

    if (!userRole) {
      return c.json({ error: 'Role not determined' }, 403)
    }

    const userLevel = ROLE_HIERARCHY[userRole] ?? 0
    const requiredLevel = ROLE_HIERARCHY[minimumRole]

    if (userLevel < requiredLevel) {
      return c.json({
        error: `${minimumRole} access required`,
        your_role: userRole,
      }, 403)
    }

    await next()
  }
}

// Convenience exports
export const requireOwner = () => requireRole('owner')
export const requireAdmin = () => requireRole('admin')
export const requireMember = () => requireRole('member')
```

## Usage in Worker

```typescript
// src/worker.ts
import { Hono } from 'hono'
import { authMiddleware, requireAuth, requireAccountAccess } from './api/middleware/auth'
import { requireAdmin } from './api/middleware/require-role'
import { tenantMiddleware } from './api/middleware/tenant'

const app = new Hono<{ Bindings: Env }>()

// Public routes (no auth required)
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// Apply auth middleware to all /api routes except health
app.use('/api/*', authMiddleware)

// Apply tenant context resolution
app.use('/api/*', tenantMiddleware())

// Routes requiring authentication only
app.use('/api/user/*', requireAuth())

// Routes requiring account access
app.use('/api/devices/*', requireAccountAccess())
app.use('/api/orders/*', requireAccountAccess())

// Routes requiring specific roles
app.use('/api/settings/billing/*', requireAccountAccess(), requireAdmin())
app.use('/api/settings/team/*', requireAccountAccess(), requireAdmin())

// Mount route handlers
app.route('/api/user', userRoutes)
app.route('/api/devices', deviceRoutes)
app.route('/api/orders', orderRoutes)
app.route('/api/settings', settingsRoutes)
```

## Environment Variables

```toml
# wrangler.toml
[vars]
CLERK_SECRET_KEY = ""  # Set in dashboard
CLERK_PUBLISHABLE_KEY = ""
```

## References

- PRD.md Section 5: User Authentication
- PRD.md Section 5.2: Role-Based Access Control
- documentation/platform-authentication.md
- [Hono Clerk Auth](https://github.com/honojs/middleware/tree/main/packages/clerk-auth)
- [Clerk JWT Verification](https://clerk.com/docs/backend-requests/handling/manual-jwt)
