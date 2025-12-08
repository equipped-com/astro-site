# Task: Clerk Webhook Handler

## Description

Create webhook handler to sync Clerk user events to D1 database. This is the primary mechanism for keeping our users table in sync with Clerk's identity system. Handles user creation, updates, and deletion.

## Acceptance Criteria

- [ ] Webhook endpoint at `/api/webhooks/clerk`
- [ ] Webhook signature verification using Svix
- [ ] Handle `user.created` event - create user in D1
- [ ] Handle `user.updated` event - update user in D1
- [ ] Handle `user.deleted` event - soft delete user
- [ ] Handle `organization.membership.created` - create account_access
- [ ] Idempotent operations (safe to replay)

## Test Criteria

```gherkin
Feature: Clerk Webhook Handler
  As the platform
  I want to sync user data from Clerk
  So that user identity is consistent across systems

  @REQ-HOOK-001
  Scenario: Verify webhook signature
    Given a webhook payload with invalid signature
    When POST to "/api/webhooks/clerk"
    Then response status should be 400
    And response body should contain "Invalid signature"

  @REQ-HOOK-002
  Scenario: Create user on signup
    Given a valid "user.created" webhook event:
      | Field | Value |
      | id | user_abc123 |
      | email_addresses[0].email_address | alice@company.com |
      | first_name | Alice |
      | last_name | Smith |
    When POST to "/api/webhooks/clerk"
    Then response status should be 200
    And users table should contain:
      | id | email | first_name | last_name |
      | user_abc123 | alice@company.com | Alice | Smith |

  @REQ-HOOK-003
  Scenario: Handle duplicate user creation (idempotent)
    Given user "user_abc123" already exists
    And a valid "user.created" webhook event for "user_abc123"
    When POST to "/api/webhooks/clerk"
    Then response status should be 200
    And no duplicate user should be created

  @REQ-HOOK-004
  Scenario: Update user on profile change
    Given user "user_abc123" exists with name "Alice Smith"
    And a valid "user.updated" webhook event:
      | Field | Value |
      | id | user_abc123 |
      | first_name | Alicia |
    When POST to "/api/webhooks/clerk"
    Then response status should be 200
    And user "user_abc123" first_name should be "Alicia"

  @REQ-HOOK-005
  Scenario: Soft delete user on account deletion
    Given user "user_abc123" exists
    And a valid "user.deleted" webhook event for "user_abc123"
    When POST to "/api/webhooks/clerk"
    Then response status should be 200
    And user "user_abc123" should have deleted_at timestamp
    And user "user_abc123" should not appear in active user queries

  @REQ-HOOK-006
  Scenario: Create account access on org membership
    Given user "user_abc123" exists
    And account "acc_456" exists
    And a valid "organization.membership.created" webhook event:
      | Field | Value |
      | organization.id | acc_456 |
      | public_user_data.user_id | user_abc123 |
      | role | admin |
    When POST to "/api/webhooks/clerk"
    Then response status should be 200
    And account_access should exist:
      | user_id | account_id | role |
      | user_abc123 | acc_456 | admin |
```

## Dependencies

- infrastructure/setup-hono-worker
- database/run-migrations
- auth/create-clerk-app

## Files to Create

- `src/api/routes/webhooks/clerk.ts`

## Implementation

```typescript
// src/api/routes/webhooks/clerk.ts
import { Hono } from 'hono'
import { Webhook } from 'svix'

interface WebhookEvent {
  type: string
  data: Record<string, unknown>
}

const webhook = new Hono<{ Bindings: Env }>()

webhook.post('/', async (c) => {
  const webhookSecret = c.env.CLERK_WEBHOOK_SECRET
  const payload = await c.req.text()
  const headers = {
    'svix-id': c.req.header('svix-id') ?? '',
    'svix-timestamp': c.req.header('svix-timestamp') ?? '',
    'svix-signature': c.req.header('svix-signature') ?? '',
  }

  const wh = new Webhook(webhookSecret)
  let evt: WebhookEvent

  try {
    evt = wh.verify(payload, headers) as WebhookEvent
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return c.json({ error: 'Invalid signature' }, 400)
  }

  const { type, data } = evt

  switch (type) {
    case 'user.created':
      await handleUserCreated(c.env.DB, data)
      break

    case 'user.updated':
      await handleUserUpdated(c.env.DB, data)
      break

    case 'user.deleted':
      await handleUserDeleted(c.env.DB, data)
      break

    case 'organization.membership.created':
      await handleOrgMembershipCreated(c.env.DB, data)
      break

    default:
      console.log(`Unhandled webhook type: ${type}`)
  }

  return c.json({ success: true })
})

async function handleUserCreated(db: D1Database, data: Record<string, unknown>) {
  const emails = data.email_addresses as Array<{ email_address: string }>
  const email = emails?.[0]?.email_address

  // Upsert to handle idempotency
  await db.prepare(`
    INSERT INTO users (id, email, first_name, last_name)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    data.id,
    email,
    data.first_name,
    data.last_name
  ).run()
}

async function handleUserUpdated(db: D1Database, data: Record<string, unknown>) {
  const emails = data.email_addresses as Array<{ email_address: string }>
  const email = emails?.[0]?.email_address

  await db.prepare(`
    UPDATE users SET
      email = ?,
      first_name = ?,
      last_name = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(email, data.first_name, data.last_name, data.id).run()
}

async function handleUserDeleted(db: D1Database, data: Record<string, unknown>) {
  await db.prepare(`
    UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(data.id).run()
}

async function handleOrgMembershipCreated(db: D1Database, data: Record<string, unknown>) {
  const org = data.organization as { id: string }
  const userData = data.public_user_data as { user_id: string }
  const role = data.role as string

  await db.prepare(`
    INSERT INTO account_access (id, user_id, account_id, role)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, account_id) DO UPDATE SET
      role = excluded.role,
      updated_at = CURRENT_TIMESTAMP
  `).bind(crypto.randomUUID(), userData.user_id, org.id, role).run()
}

export default webhook
```

## Clerk Dashboard Setup

1. Go to Webhooks in Clerk dashboard
2. Add endpoint: `https://{your-domain}/api/webhooks/clerk`
3. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `organization.membership.created`
   - `organization.membership.deleted`
   - `organization.membership.updated`
4. Copy webhook secret to `CLERK_WEBHOOK_SECRET`

## Environment Variables

```
CLERK_WEBHOOK_SECRET=whsec_xxx
```

## References

- PRD.md Section 5: User Authentication
- documentation/platform-authentication.md
- [Clerk Webhooks](https://clerk.com/docs/webhooks/overview)
- [Svix Webhook Verification](https://docs.svix.com/receiving/verifying-payloads/how)
