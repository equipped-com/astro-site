# Task: Device CRUD Endpoints

## Description

Create CRUD API endpoints for device management.

## Acceptance Criteria

- [ ] `GET /api/devices` - List user's devices
- [ ] `POST /api/devices` - Create new device
- [ ] `GET /api/devices/:id` - Get device by ID
- [ ] `PUT /api/devices/:id` - Update device
- [ ] `DELETE /api/devices/:id` - Delete device
- [ ] All routes require authentication
- [ ] Users can only access their own devices

## Test Criteria

- [ ] List returns only current user's devices
- [ ] Create generates UUID and stores device
- [ ] Get returns 404 for non-existent/unauthorized device
- [ ] Update modifies only specified fields
- [ ] Delete removes device (or soft deletes)
- [ ] All operations update `updated_at` timestamp

## Dependencies

- api/auth-middleware
- database/run-migrations

## Files to Create

- `src/api/routes/devices.ts`

## API Specification

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/devices` | - | `{ devices: Device[] }` |
| POST | `/api/devices` | `{ name, type, model?, serial_number? }` | `{ device: Device }` |
| GET | `/api/devices/:id` | - | `{ device: Device }` |
| PUT | `/api/devices/:id` | `{ name?, type?, model?, status? }` | `{ device: Device }` |
| DELETE | `/api/devices/:id` | - | `{ success: true }` |

## Implementation

```typescript
// src/api/routes/devices.ts
import { Hono } from 'hono'
import { getAuth } from '@hono/clerk-auth'

const devices = new Hono<{ Bindings: Env }>()

devices.get('/', async (c) => {
  const auth = getAuth(c)
  const result = await c.env.DB.prepare(
    'SELECT * FROM devices WHERE user_id = ?'
  ).bind(auth!.userId).all()
  return c.json({ devices: result.results })
})

devices.post('/', async (c) => {
  const auth = getAuth(c)
  const body = await c.req.json()
  const id = crypto.randomUUID()

  await c.env.DB.prepare(
    'INSERT INTO devices (id, user_id, name, type, model, serial_number) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, auth!.userId, body.name, body.type, body.model, body.serial_number).run()

  return c.json({ device: { id, ...body, user_id: auth!.userId } }, 201)
})

// ... other routes

export default devices
```

## References

- [Hono Routing](https://hono.dev/docs/api/routing)
- [D1 Query API](https://developers.cloudflare.com/d1/platform/client-api/)
- PLAN.md Phase 4.2
