# Task: Auth Middleware

## Description

Create Hono middleware to verify Clerk JWT tokens on protected API routes.

## Acceptance Criteria

- [ ] `@hono/clerk-auth` installed
- [ ] Auth middleware created
- [ ] Middleware verifies JWT from Authorization header
- [ ] User ID available in route handlers via context
- [ ] Unauthenticated requests return 401

## Test Criteria

- [ ] Request without token returns 401
- [ ] Request with invalid token returns 401
- [ ] Request with valid token passes through
- [ ] User ID accessible: `c.get('clerkAuth').userId`
- [ ] Works with Clerk session tokens

## Dependencies

- infrastructure/setup-hono-worker
- auth/create-clerk-app

## Files to Create

- `src/api/middleware/auth.ts`

## Implementation

```typescript
// src/api/middleware/auth.ts
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import type { Context, Next } from 'hono'

export const authMiddleware = clerkMiddleware()

export function requireAuth() {
  return async (c: Context, next: Next) => {
    const auth = getAuth(c)
    if (!auth?.userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    await next()
  }
}
```

## Usage in Worker

```typescript
import { authMiddleware, requireAuth } from './api/middleware/auth'

app.use('/api/*', authMiddleware)
app.use('/api/devices/*', requireAuth())
```

## Environment Variables

```toml
# wrangler.toml
[vars]
CLERK_SECRET_KEY = ""  # Set in dashboard
CLERK_PUBLISHABLE_KEY = ""
```

## References

- [Hono Clerk Auth](https://github.com/honojs/middleware/tree/main/packages/clerk-auth)
- [Clerk JWT Verification](https://clerk.com/docs/backend-requests/handling/manual-jwt)
- PLAN.md Phase 4.1
