# CloudFlare Workers

This directory contains scheduled workers (cron jobs) that run on CloudFlare's edge network.

## Invitation Expiry Worker

**File:** `invitation-expiry.ts`
**Schedule:** Daily at 2 AM UTC
**Cron:** `0 2 * * *`

### Purpose

Automatically monitors and logs expired account invitations. Invitations expire 14 days after they are sent if not accepted, declined, or revoked.

### What it does

1. **Queries database** for invitations where:
   - `expires_at < NOW()`
   - `accepted_at` is NULL
   - `declined_at` is NULL
   - `revoked_at` is NULL

2. **Logs details** for monitoring:
   - Number of expired invitations found
   - Processing duration
   - Details of each expired invitation
   - Any errors that occur

3. **Future enhancement**: Send email notifications to inviters (marked as TODO)

### Status computation

Invitation expiry is computed at read time using the `getInvitationStatus()` function from `lib/invitations.ts`. The API endpoints automatically block expired invitations from being accepted.

Status hierarchy:
1. `revoked` - Invitation was revoked by an admin
2. `declined` - Invitation was declined by recipient
3. `accepted` - Invitation was accepted
4. `expired` - Invitation passed its `expires_at` date and was not accepted
5. `pending` - Invitation is still valid

### Integration

- **Main worker**: `src/worker.ts` - Exports a `scheduled()` handler that calls this worker
- **Wrangler config**: `wrangler.toml` - Defines the cron trigger schedule
- **API routes**: `src/api/routes/invitations.ts` - Uses `getInvitationStatus()` to block expired invitations
- **Database**: Queries `account_invitations` table via Drizzle ORM

### Testing

Run tests with:
```bash
bun test src/workers/invitation-expiry.test.ts
```

Tests cover:
- @REQ-WORKER-001: Cron execution
- @REQ-WORKER-002: Finding expired invitations
- @REQ-WORKER-003: Status computation for API validation
- @REQ-WORKER-004: Logging for notifications (future)
- @REQ-WORKER-005: Error handling and logging

### Local development

CloudFlare Workers cron triggers don't run in local dev mode. To test locally:

```bash
# Run the test suite
bun run test:watch src/workers/invitation-expiry.test.ts

# Test the scheduled handler manually (requires wrangler)
wrangler dev --test-scheduled
```

### Deployment

The worker is automatically deployed as part of the main worker when you run:

```bash
bun run deploy
```

### Monitoring

In production, check CloudFlare Workers dashboard:
- **Logs**: View scheduled executions and error logs
- **Metrics**: See execution count, duration, and error rate
- **Cron Triggers**: Verify schedule is active

### Configuration

The cron schedule is defined in `wrangler.toml`:

```toml
[triggers]
crons = ["0 2 * * *"]  # Daily at 2 AM UTC
```

To change the schedule, update this configuration and redeploy.
