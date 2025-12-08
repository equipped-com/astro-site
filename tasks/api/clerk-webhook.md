# Task: Clerk Webhook Handler

## Description

Create webhook handler to sync Clerk user events to D1 database.

## Acceptance Criteria

- [ ] Webhook endpoint at `/api/auth/webhook`
- [ ] Webhook signature verification
- [ ] Handle `user.created` event - create user in D1
- [ ] Handle `user.updated` event - update user in D1
- [ ] Handle `user.deleted` event - soft delete or remove user

## Test Criteria

- [ ] Invalid signature returns 400
- [ ] Valid `user.created` creates DB record
- [ ] Valid `user.updated` updates DB record
- [ ] Duplicate user creation is idempotent
- [ ] Webhook responds within 30s (Clerk timeout)

## Dependencies

- infrastructure/setup-hono-worker
- database/run-migrations
- auth/create-clerk-app

## Files to Create

- `src/api/routes/auth.ts`

## Implementation

```typescript
// src/api/routes/auth.ts
import { Hono } from 'hono'
import { Webhook } from 'svix'

const auth = new Hono<{ Bindings: Env }>()

auth.post('/webhook', async (c) => {
  const webhookSecret = c.env.CLERK_WEBHOOK_SECRET
  const payload = await c.req.text()
  const headers = {
    'svix-id': c.req.header('svix-id') ?? '',
    'svix-timestamp': c.req.header('svix-timestamp') ?? '',
    'svix-signature': c.req.header('svix-signature') ?? '',
  }

  const wh = new Webhook(webhookSecret)
  let evt

  try {
    evt = wh.verify(payload, headers)
  } catch (err) {
    return c.json({ error: 'Invalid signature' }, 400)
  }

  switch (evt.type) {
    case 'user.created':
      await c.env.DB.prepare(
        'INSERT INTO users (id, email, first_name, last_name) VALUES (?, ?, ?, ?)'
      ).bind(
        evt.data.id,
        evt.data.email_addresses[0]?.email_address,
        evt.data.first_name,
        evt.data.last_name
      ).run()
      break
    // Handle other events...
  }

  return c.json({ success: true })
})

export default auth
```

## Clerk Dashboard Setup

1. Go to Webhooks in Clerk dashboard
2. Add endpoint: `https://tryequipped.preview.frst.dev/api/auth/webhook`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy webhook secret to `CLERK_WEBHOOK_SECRET`

## References

- [Clerk Webhooks](https://clerk.com/docs/webhooks/overview)
- [Svix Webhook Verification](https://docs.svix.com/receiving/verifying-payloads/how)
- PLAN.md Phase 4.3
