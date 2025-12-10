# Task: Invitation Expiry Worker

## Description

Create a CloudFlare Worker (scheduled cron job) that automatically marks invitations as expired after 14 days. Runs daily to check for invitations past their expiry date and updates their status.

## Acceptance Criteria

- [ ] Cron worker scheduled to run daily
- [ ] Query invitations where `expires_at < NOW()` and status is still pending
- [ ] Mark expired invitations (set a computed status, not a column)
- [ ] Optional: Send expiry notification to inviter
- [ ] Logging for monitoring
- [ ] Handle timezone correctly (UTC)

## Test Criteria

```gherkin
Feature: Invitation Expiry Worker
  As a system administrator
  I want invitations to expire automatically
  So that stale invitations don't remain valid indefinitely

  @REQ-WORKER-001 @Cron
  Scenario: Daily cron execution
    Given the expiry worker is configured
    When the scheduled time arrives (daily at 2 AM UTC)
    Then the worker should execute
    And it should query for expired invitations

  @REQ-WORKER-002 @Query
  Scenario: Find expired invitations
    Given an invitation was sent 15 days ago
    And it has not been accepted, declined, or revoked
    When the expiry worker runs
    Then it should identify the invitation as expired
    And `expires_at` should be in the past

  @REQ-WORKER-003 @Status
  Scenario: Expired invitation cannot be accepted
    Given an invitation expired yesterday
    When someone tries to accept it
    Then they should see "This invitation has expired"
    And no Account::Access should be created

  @REQ-WORKER-004 @Notification
  Scenario: Notify inviter of expiry (optional)
    Given an invitation expired today
    And the inviter has expiry notifications enabled
    When the worker processes the invitation
    Then the inviter should receive an email
    And the email should suggest resending the invitation

  @REQ-WORKER-005 @Logging
  Scenario: Log expiry processing
    Given the worker runs successfully
    Then it should log:
      | Metric                  | Logged |
      | Number of expired found | Yes    |
      | Processing duration     | Yes    |
      | Any errors              | Yes    |
```

## Dependencies

- invitations/invitations-schema (table must exist)

## Implementation

### Cron Configuration
```toml
# wrangler.toml
[triggers]
crons = ["0 2 * * *"]  # Daily at 2 AM UTC
```

### Worker Logic
```typescript
// src/workers/invitation-expiry.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    // Find invitations where expires_at < NOW()
    // and accepted_at IS NULL
    // and declined_at IS NULL
    // and revoked_at IS NULL

    const expiredInvitations = await db
      .select()
      .from(account_invitations)
      .where(
        and(
          lt(account_invitations.expires_at, new Date()),
          isNull(account_invitations.accepted_at),
          isNull(account_invitations.declined_at),
          isNull(account_invitations.revoked_at)
        )
      );

    // Log count
    console.log(`Found ${expiredInvitations.length} expired invitations`);

    // Optional: Send notification to inviters
  }
};
```

### Alternative: No Worker Needed
Instead of a worker, compute expiry status at read time:
```typescript
// In API endpoint
const isExpired = invitation.expires_at < new Date()
  && !invitation.accepted_at
  && !invitation.declined_at
  && !invitation.revoked_at;

return {
  ...invitation,
  status: isExpired ? 'expired' : 'pending'
};
```

## Files to Create

Option A (Worker):
- `src/workers/invitation-expiry.ts` - Cron worker
- Update `wrangler.toml` with cron schedule

Option B (Computed):
- Add computed `status` field in API responses

## References

- PRD.md Section 3: Identity & Onboarding (REQ-ID-008)
- CloudFlare Workers Cron Triggers documentation
