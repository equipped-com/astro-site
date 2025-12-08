# Task: User Profile Endpoints

## Description

Create API endpoints for user profile management.

## Acceptance Criteria

- [ ] `GET /api/user` - Get current user profile
- [ ] `PUT /api/user` - Update user profile (company_name, etc.)
- [ ] Returns user data from D1 (synced via webhook)
- [ ] Requires authentication

## Test Criteria

- [ ] Get returns current user's profile
- [ ] Put updates allowed fields
- [ ] Cannot update protected fields (id, email)
- [ ] Returns 404 if user not in DB (webhook not received yet)

## Dependencies

- api/auth-middleware
- api/clerk-webhook
- database/run-migrations

## Files to Create

- `src/api/routes/user.ts`

## API Specification

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/user` | - | `{ user: User }` |
| PUT | `/api/user` | `{ company_name?, first_name?, last_name? }` | `{ user: User }` |

## Implementation

```typescript
// src/api/routes/user.ts
import { Hono } from 'hono'
import { getAuth } from '@hono/clerk-auth'

const user = new Hono<{ Bindings: Env }>()

user.get('/', async (c) => {
  const auth = getAuth(c)
  const result = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(auth!.userId).first()

  if (!result) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ user: result })
})

user.put('/', async (c) => {
  const auth = getAuth(c)
  const body = await c.req.json()

  await c.env.DB.prepare(
    'UPDATE users SET company_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(body.company_name, auth!.userId).run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(auth!.userId).first()

  return c.json({ user: updated })
})

export default user
```

## References

- [Clerk User Object](https://clerk.com/docs/references/javascript/user/user)
- PLAN.md Phase 4
