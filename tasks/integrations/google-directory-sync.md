# Task: Google Directory Sync

## Description

Implement automated synchronization of employee data from Google Workspace Directory to the `people` table. Runs on-demand and on a schedule (daily). Creates and updates Person records based on Google Workspace users.

## Acceptance Criteria

- [ ] Manual sync trigger in Settings UI
- [ ] Scheduled sync worker (daily cron)
- [ ] Fetch users from Google Workspace Admin SDK
- [ ] Map Google fields to Person fields (email, name, department, phone)
- [ ] Create new Person records for new employees
- [ ] Update existing Person records (matched by email)
- [ ] Handle deleted Google users (mark as departed)
- [ ] Display last sync timestamp and status
- [ ] Error handling and retry logic
- [ ] Sync audit logging

## Test Criteria

```gherkin
Feature: Google Directory Sync
  As an account admin
  I want to automatically sync employees from Google Workspace
  So that my employee directory is always up-to-date

  @REQ-SYNC-001 @Manual
  Scenario: Manually trigger directory sync
    Given Google Workspace is connected
    And I am on Settings > Integrations
    When I click "Sync Now"
    Then a sync job should be triggered
    And I should see "Sync in progress" status
    And when complete, I should see "Last synced: just now"

  @REQ-SYNC-002 @Fetch
  Scenario: Fetch users from Google Workspace
    Given the sync job is running
    When the worker calls Google Directory API
    Then it should fetch all active users
    And it should include:
      | Field             | Google API Path    |
      | primaryEmail      | primaryEmail       |
      | name.givenName    | name.givenName     |
      | name.familyName   | name.familyName    |
      | orgUnitPath       | orgUnitPath        |
      | phones[0].value   | phones[0].value    |

  @REQ-SYNC-003 @Create
  Scenario: Create new Person records
    Given Google Workspace has user "alice@company.com"
    And no Person record exists for that email
    When the sync runs
    Then a new Person should be created with:
      | Field      | Value               |
      | email      | alice@company.com   |
      | first_name | Alice               |
      | last_name  | Smith               |
      | department | Engineering         |
      | status     | active              |

  @REQ-SYNC-004 @Update
  Scenario: Update existing Person records
    Given Person "bob@company.com" exists with department "Sales"
    And Google Workspace shows department "Marketing"
    When the sync runs
    Then the Person record should be updated
    And department should change to "Marketing"
    And updated_at should be refreshed

  @REQ-SYNC-005 @Departed
  Scenario: Handle deleted Google users
    Given Person "charlie@company.com" exists
    And the user no longer exists in Google Workspace
    When the sync runs
    Then the Person should be marked with:
      | Field    | Value    |
      | status   | departed |
      | end_date | today    |

  @REQ-SYNC-006 @Schedule
  Scenario: Scheduled daily sync
    Given Google Workspace is connected
    And scheduled sync is enabled
    When the cron trigger fires (daily at 3 AM)
    Then the sync should run automatically
    And results should be logged

  @REQ-SYNC-007 @Audit
  Scenario: Sync audit logging
    Given a sync completes
    Then an audit log should be created with:
      | Field           | Logged |
      | Sync start time | Yes    |
      | Sync end time   | Yes    |
      | Users fetched   | Yes    |
      | Created count   | Yes    |
      | Updated count   | Yes    |
      | Errors          | Yes    |
```

## Dependencies

- integrations/google-workspace-oauth (OAuth tokens must be available)
- people/directory-view (people table must exist)

## Google Directory API

### List Users
```typescript
import { google } from 'googleapis';

async function fetchGoogleUsers(accessToken: string) {
  const admin = google.admin({ version: 'directory_v1', auth: accessToken });

  const response = await admin.users.list({
    customer: 'my_customer',
    maxResults: 500,
    orderBy: 'email'
  });

  return response.data.users || [];
}
```

### Field Mapping
```typescript
const personData = {
  email: googleUser.primaryEmail,
  first_name: googleUser.name?.givenName,
  last_name: googleUser.name?.familyName,
  department: googleUser.orgUnitPath?.split('/').pop(),
  phone: googleUser.phones?.[0]?.value,
  status: googleUser.suspended ? 'departed' : 'active'
};
```

## Sync Logic

```typescript
async function syncGoogleDirectory(accountId: string) {
  // 1. Get OAuth tokens
  const integration = await getGoogleIntegration(accountId);
  const accessToken = await decryptToken(integration.access_token_encrypted);

  // 2. Fetch Google users
  const googleUsers = await fetchGoogleUsers(accessToken);

  let created = 0, updated = 0;

  for (const googleUser of googleUsers) {
    // 3. Find or create Person
    const existing = await db.select().from(people).where(
      eq(people.email, googleUser.primaryEmail)
    ).get();

    if (existing) {
      // Update
      await db.update(people)
        .set(mapGoogleUser(googleUser))
        .where(eq(people.id, existing.id));
      updated++;
    } else {
      // Create
      await db.insert(people).values({
        account_id: accountId,
        ...mapGoogleUser(googleUser)
      });
      created++;
    }
  }

  // 4. Mark departed users
  const googleEmails = googleUsers.map(u => u.primaryEmail);
  await db.update(people)
    .set({ status: 'departed', end_date: new Date() })
    .where(
      and(
        eq(people.account_id, accountId),
        notIn(people.email, googleEmails)
      )
    );

  // 5. Log results
  console.log(`Sync complete: ${created} created, ${updated} updated`);
}
```

## Cron Configuration

```toml
# wrangler.toml
[triggers]
crons = ["0 3 * * *"]  # Daily at 3 AM UTC
```

## API Endpoints

### POST /api/integrations/google/sync
```typescript
// Manually trigger sync
Response: { status: 'in_progress', job_id: string }
```

### GET /api/integrations/google/sync-status
```typescript
// Get last sync status
Response: {
  last_sync_at: string,
  status: 'success' | 'error',
  created: number,
  updated: number,
  errors: string[]
}
```

## Files to Create

- `src/api/integrations/google/sync.ts` - Manual sync endpoint
- `src/workers/google-directory-sync.ts` - Scheduled cron worker
- `src/lib/google/directory.ts` - Google Directory API client

## Files to Modify

- `src/pages/dashboard/settings/integrations.astro` - Add sync trigger button

## References

- PRD.md Section 3: Identity & Onboarding (REQ-ID-013)
- PRD.md Section 7: Employee & People Management (REQ-PPL-001)
- Google Workspace Admin SDK Directory API documentation
