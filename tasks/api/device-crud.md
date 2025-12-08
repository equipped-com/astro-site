# Task: Device CRUD Endpoints

## Description

Create CRUD API endpoints for device management. Devices are scoped to the current account (tenant), not individual users. Only users with appropriate account access can manage devices.

## Acceptance Criteria

- [ ] `GET /api/devices` - List account's devices with pagination
- [ ] `POST /api/devices` - Create new device in account
- [ ] `GET /api/devices/:id` - Get device by ID
- [ ] `PUT /api/devices/:id` - Update device
- [ ] `DELETE /api/devices/:id` - Soft delete device
- [ ] All routes require authentication
- [ ] All routes verify user has account access
- [ ] Devices scoped to account_id (multi-tenant)

## Test Criteria

```gherkin
Feature: Device CRUD API
  As an IT admin
  I want to manage my organization's devices via API
  So that I can track and organize equipment

  Background:
    Given I am authenticated as "alice@acme.com"
    And I have "admin" role in account "Acme Corp"
    And account "Acme Corp" has account_id "acc_123"

  @REQ-API-DEV-001
  Scenario: List devices for account
    Given account "Acme Corp" has devices:
      | name | type | status |
      | MacBook Pro 14" | laptop | active |
      | iPhone 15 Pro | phone | active |
    When I GET "/api/devices"
    Then response status should be 200
    And response should contain 2 devices
    And all devices should have account_id "acc_123"

  @REQ-API-DEV-002
  Scenario: Create new device
    When I POST to "/api/devices" with:
      | Field | Value |
      | name | Dell XPS 15 |
      | type | laptop |
      | serial_number | SN123456 |
    Then response status should be 201
    And device should have a UUID
    And device account_id should be "acc_123"

  @REQ-API-DEV-003
  Scenario: Cannot access other account's devices
    Given account "Other Corp" has device "Secret Device"
    When I GET "/api/devices/device_other"
    Then response status should be 404

  @REQ-API-DEV-004
  Scenario: Update device
    Given device "MacBook Pro" exists with id "dev_123"
    When I PUT to "/api/devices/dev_123" with:
      | Field | Value |
      | status | assigned |
      | assigned_to | person_456 |
    Then response status should be 200
    And device status should be "assigned"
    And updated_at should be current timestamp

  @REQ-API-DEV-005
  Scenario: Soft delete device
    Given device "Old iPhone" exists with id "dev_old"
    When I DELETE "/api/devices/dev_old"
    Then response status should be 200
    And device should have deleted_at timestamp
    And device should not appear in list results
```

## Dependencies

- api/auth-middleware
- multi-tenancy/tenant-context
- database/run-migrations

## Files to Create

- `src/api/routes/devices.ts`

## API Specification

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/devices` | - | `{ devices: Device[], total: number }` |
| GET | `/api/devices?status=active` | - | `{ devices: Device[], total: number }` |
| POST | `/api/devices` | `{ name, type, serial_number?, model? }` | `{ device: Device }` |
| GET | `/api/devices/:id` | - | `{ device: Device }` |
| PUT | `/api/devices/:id` | `{ name?, type?, status?, assigned_to? }` | `{ device: Device }` |
| DELETE | `/api/devices/:id` | - | `{ success: true }` |

## Implementation

```typescript
// src/api/routes/devices.ts
import { Hono } from 'hono'
import { getTenantContext } from '@/lib/tenant-context'

const devices = new Hono<{ Bindings: Env }>()

devices.get('/', async (c) => {
  const { accountId } = getTenantContext(c)
  const status = c.req.query('status')

  let query = 'SELECT * FROM devices WHERE account_id = ? AND deleted_at IS NULL'
  const params = [accountId]

  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }

  const result = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ devices: result.results, total: result.results.length })
})

devices.post('/', async (c) => {
  const { accountId, userId } = getTenantContext(c)
  const body = await c.req.json()
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO devices (id, account_id, name, type, model, serial_number, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, accountId, body.name, body.type, body.model, body.serial_number, userId).run()

  const device = await c.env.DB.prepare('SELECT * FROM devices WHERE id = ?').bind(id).first()
  return c.json({ device }, 201)
})

devices.get('/:id', async (c) => {
  const { accountId } = getTenantContext(c)
  const id = c.req.param('id')

  const device = await c.env.DB.prepare(
    'SELECT * FROM devices WHERE id = ? AND account_id = ? AND deleted_at IS NULL'
  ).bind(id, accountId).first()

  if (!device) {
    return c.json({ error: 'Device not found' }, 404)
  }

  return c.json({ device })
})

devices.put('/:id', async (c) => {
  const { accountId } = getTenantContext(c)
  const id = c.req.param('id')
  const body = await c.req.json()

  // Verify device belongs to account
  const existing = await c.env.DB.prepare(
    'SELECT id FROM devices WHERE id = ? AND account_id = ?'
  ).bind(id, accountId).first()

  if (!existing) {
    return c.json({ error: 'Device not found' }, 404)
  }

  // Build dynamic update
  const updates: string[] = ['updated_at = CURRENT_TIMESTAMP']
  const params: unknown[] = []

  for (const [key, value] of Object.entries(body)) {
    if (['name', 'type', 'model', 'status', 'assigned_to'].includes(key)) {
      updates.push(`${key} = ?`)
      params.push(value)
    }
  }

  await c.env.DB.prepare(
    `UPDATE devices SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...params, id).run()

  const device = await c.env.DB.prepare('SELECT * FROM devices WHERE id = ?').bind(id).first()
  return c.json({ device })
})

devices.delete('/:id', async (c) => {
  const { accountId } = getTenantContext(c)
  const id = c.req.param('id')

  const result = await c.env.DB.prepare(
    'UPDATE devices SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND account_id = ?'
  ).bind(id, accountId).run()

  if (result.meta.changes === 0) {
    return c.json({ error: 'Device not found' }, 404)
  }

  return c.json({ success: true })
})

export default devices
```

## References

- PRD.md Section 3: Fleet Management
- documentation/platform-dashboard.md (Device tab)
- [Hono Routing](https://hono.dev/docs/api/routing)
- [D1 Query API](https://developers.cloudflare.com/d1/platform/client-api/)
