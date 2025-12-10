# Task: MDM Device Sync Worker

## Description

Create a scheduled CloudFlare Worker that syncs devices from the connected MDM platform (Addigy or Black Glove) to the `devices` table. Runs daily to keep the fleet up-to-date with MDM data.

## Acceptance Criteria

- [ ] Scheduled cron worker (daily at 4 AM UTC)
- [ ] Detect MDM type from `accounts.device_source`
- [ ] Fetch devices from MDM API
- [ ] Create new device records for new devices
- [ ] Update existing device records (matched by serial number)
- [ ] Store raw MDM response in audit table
- [ ] Handle MDM API errors and retries
- [ ] Log sync results (created, updated, errors)
- [ ] Manual sync trigger in UI

## Test Criteria

```gherkin
Feature: MDM Device Sync Worker
  As a system administrator
  I want devices to sync automatically from MDM
  So that the fleet is always up-to-date

  @REQ-WORKER-001 @Cron
  Scenario: Daily scheduled sync
    Given an account has Addigy connected
    And device_source is "addigy"
    When the cron trigger fires (daily at 4 AM)
    Then the worker should execute
    And it should fetch devices from Addigy API

  @REQ-WORKER-002 @Detection
  Scenario: Detect MDM type
    Given account A has device_source "addigy"
    And account B has device_source "database"
    When the worker runs
    Then it should sync account A from Addigy
    And it should skip account B

  @REQ-WORKER-003 @Fetch
  Scenario: Fetch devices from Addigy
    Given Addigy credentials are stored
    When the worker fetches devices
    Then it should call Addigy API with credentials
    And it should receive all devices for the policy
    And it should parse device data:
      | Field        | MDM Source          |
      | name         | device.name         |
      | model        | device.model        |
      | serial       | device.serial_number|
      | assigned_to  | device.user         |

  @REQ-WORKER-004 @Create
  Scenario: Create new device records
    Given Addigy has device with serial "C02XYZ123ABC"
    And no device with that serial exists
    When the worker syncs
    Then a new device should be created with:
      | Field         | Value           |
      | serial_number | C02XYZ123ABC    |
      | name          | From MDM        |
      | model         | From MDM        |
      | type          | From MDM        |
      | status        | active          |

  @REQ-WORKER-005 @Update
  Scenario: Update existing device records
    Given device with serial "C02ABC123XYZ" exists
    And the device name changed in MDM
    When the worker syncs
    Then the device record should be updated
    And updated_at should be refreshed

  @REQ-WORKER-006 @Audit
  Scenario: Store raw MDM response
    Given the worker syncs devices
    Then the raw API response should be stored
    And it should include:
      | Field         | Stored |
      | account_id    | Yes    |
      | sync_type     | Yes    |
      | raw_response  | Yes    |
      | created_at    | Yes    |

  @REQ-WORKER-007 @Error
  Scenario: Handle MDM API errors
    Given the Addigy API returns 500 error
    When the worker attempts sync
    Then it should retry up to 3 times
    And if still failing, log the error
    And send notification to account admins

  @REQ-WORKER-008 @Manual
  Scenario: Manual sync trigger
    Given I am on Settings > Integrations
    And Addigy is connected
    When I click "Sync Devices Now"
    Then a manual sync should be triggered
    And I should see "Sync in progress"
    And when complete, I should see "25 devices synced"
```

## Dependencies

- integrations/addigy-integration (MDM credentials must be stored)
- database/run-migrations (devices table must exist)

## Cron Configuration

```toml
# wrangler.toml
[triggers]
crons = ["0 4 * * *"]  # Daily at 4 AM UTC
```

## Worker Logic

```typescript
// src/workers/mdm-device-sync.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    // Find all accounts with MDM connected
    const accounts = await db
      .select()
      .from(accounts)
      .where(inArray(accounts.device_source, ['addigy', 'blackglove']));

    for (const account of accounts) {
      try {
        await syncMDMDevices(account);
      } catch (error) {
        console.error(`Failed to sync devices for ${account.id}:`, error);
        // Continue with next account
      }
    }
  }
};

async function syncMDMDevices(account: Account) {
  // Get MDM credentials
  const integration = await db
    .select()
    .from(account_integrations)
    .where(
      and(
        eq(account_integrations.account_id, account.id),
        eq(account_integrations.integration_type, account.device_source)
      )
    )
    .get();

  // Fetch devices from MDM
  const devices = await fetchMDMDevices(account.device_source, integration);

  let created = 0, updated = 0;

  for (const mdmDevice of devices) {
    const existing = await db
      .select()
      .from(devices)
      .where(eq(devices.serial_number, mdmDevice.serial))
      .get();

    if (existing) {
      // Update
      await db.update(devices)
        .set({
          name: mdmDevice.name,
          model: mdmDevice.model,
          updated_at: new Date()
        })
        .where(eq(devices.id, existing.id));
      updated++;
    } else {
      // Create
      await db.insert(devices).values({
        account_id: account.id,
        serial_number: mdmDevice.serial,
        name: mdmDevice.name,
        model: mdmDevice.model,
        type: inferDeviceType(mdmDevice.model),
        status: 'active'
      });
      created++;
    }
  }

  // Store audit record
  await db.insert(mdm_sync_logs).values({
    account_id: account.id,
    sync_type: account.device_source,
    raw_response: JSON.stringify(devices),
    created_count: created,
    updated_count: updated
  });

  console.log(`Synced ${account.id}: ${created} created, ${updated} updated`);
}
```

## MDM API Clients

### Addigy
```typescript
async function fetchAddigyDevices(integration: Integration) {
  const credentials = await decryptCredentials(integration);
  const response = await fetch(
    `https://prod.addigy.com/api/policies/${integration.metadata.policy_id}/devices`,
    {
      headers: {
        'client-id': credentials.client_id,
        'client-secret': credentials.client_secret
      }
    }
  );
  return await response.json();
}
```

### Black Glove (placeholder)
```typescript
async function fetchBlackGloveDevices(integration: Integration) {
  // Similar structure for Black Glove API
}
```

## Database Schema (Audit)

```sql
CREATE TABLE mdm_sync_logs (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    sync_type TEXT NOT NULL,
    raw_response TEXT,
    created_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### POST /api/integrations/mdm/sync
```typescript
// Manual sync trigger
Response: { status: 'in_progress', job_id }
```

### GET /api/integrations/mdm/sync-status
```typescript
// Get last sync status
Response: {
  last_sync_at: string,
  status: 'success' | 'error',
  created: number,
  updated: number
}
```

## Files to Create

- `src/workers/mdm-device-sync.ts` - Scheduled worker
- `src/api/integrations/mdm/sync.ts` - Manual sync endpoint
- `src/lib/mdm/addigy.ts` - Addigy API client
- `src/lib/mdm/blackglove.ts` - Black Glove API client (placeholder)

## Files to Modify

- `src/pages/dashboard/settings/integrations.astro` - Add manual sync button

## References

- PRD.md Section 3: Identity & Onboarding (REQ-ID-015)
- PRD.md Section 4: Fleet Management (REQ-FLEET-002)
- Addigy API documentation
