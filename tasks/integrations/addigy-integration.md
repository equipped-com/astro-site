# Task: Addigy MDM Integration

## Description

Create setup wizard for connecting Addigy MDM to sync devices into the fleet. Includes credential validation, policy selection, device preview, and initial sync. Stores Addigy API credentials securely.

## Acceptance Criteria

- [ ] Addigy setup wizard UI (multi-step form)
- [ ] Step 1: Enter API credentials (Client ID, Client Secret)
- [ ] Step 2: Validate credentials and fetch available policies
- [ ] Step 3: Select policy to sync devices from
- [ ] Step 4: Preview devices that will be imported (first 10)
- [ ] Step 5: Confirm and start initial sync
- [ ] Store credentials encrypted in account_integrations table
- [ ] Set `accounts.device_source = 'addigy'`
- [ ] Success message with device count imported

## Test Criteria

```gherkin
Feature: Addigy MDM Integration Setup
  As an account owner or admin
  I want to connect Addigy MDM
  So that I can automatically sync my fleet

  @REQ-WIZARD-001 @Start
  Scenario: Start Addigy setup wizard
    Given I am an account owner
    And I am on Settings > Integrations
    When I click "Connect Addigy MDM"
    Then I should see the Addigy setup wizard
    And I should see "Step 1 of 4: Enter Credentials"

  @REQ-WIZARD-002 @Credentials
  Scenario: Enter and validate credentials
    Given I am on Step 1 of the wizard
    When I enter:
      | Field         | Value           |
      | Client ID     | addigy_client   |
      | Client Secret | addigy_secret   |
    And I click "Next"
    Then the credentials should be validated via Addigy API
    And I should proceed to Step 2 if valid
    Or see error "Invalid credentials" if invalid

  @REQ-WIZARD-003 @Policies
  Scenario: Select policy to sync from
    Given I am on Step 2 of the wizard
    And my Addigy account has 3 policies
    When the page loads
    Then I should see all 3 policies listed
    And each policy should show device count
    When I select "Engineering Policy"
    And I click "Next"
    Then I should proceed to Step 3

  @REQ-WIZARD-004 @Preview
  Scenario: Preview devices to be imported
    Given I am on Step 3 of the wizard
    And I selected "Engineering Policy" with 25 devices
    When the page loads
    Then I should see "25 devices will be imported"
    And I should see a preview of the first 10 devices with:
      | Field        | Visible |
      | Device name  | Yes     |
      | Model        | Yes     |
      | Serial       | Yes     |
      | Assigned to  | Yes     |
    When I click "Next"
    Then I should proceed to Step 4

  @REQ-WIZARD-005 @Confirm
  Scenario: Confirm and start sync
    Given I am on Step 4 of the wizard
    When I click "Start Import"
    Then the Addigy credentials should be stored encrypted
    And accounts.device_source should be set to "addigy"
    And the initial device sync should be triggered
    And I should see "Importing devices..." progress
    When sync completes
    Then I should see "25 devices imported successfully"
    And the wizard should close
    And I should see devices in my fleet

  @REQ-WIZARD-006 @Cancel
  Scenario: Cancel wizard without saving
    Given I am on any step of the wizard
    When I click "Cancel"
    Then no credentials should be stored
    And accounts.device_source should remain "database"
    And the wizard should close

  @REQ-WIZARD-007 @Error
  Scenario: Handle API errors gracefully
    Given I am on Step 2 fetching policies
    And the Addigy API returns 500 error
    Then I should see "Unable to fetch policies. Please try again."
    And I should be able to retry
```

## Dependencies

- fleet/device-inventory (devices table must exist)

## Setup Wizard Steps

### Step 1: Credentials
```tsx
<WizardStep title="Enter Addigy Credentials">
  <Input label="Client ID" name="client_id" required />
  <Input label="Client Secret" name="client_secret" type="password" required />
  <Button onClick={validateCredentials}>Next</Button>
</WizardStep>
```

### Step 2: Policy Selection
```tsx
<WizardStep title="Select Policy">
  <RadioGroup label="Which policy should we sync devices from?">
    {policies.map(policy => (
      <Radio value={policy.id}>
        {policy.name} ({policy.device_count} devices)
      </Radio>
    ))}
  </RadioGroup>
  <Button onClick={fetchDevicePreview}>Next</Button>
</WizardStep>
```

### Step 3: Device Preview
```tsx
<WizardStep title="Preview Devices">
  <p>{deviceCount} devices will be imported</p>
  <DataTable data={previewDevices.slice(0, 10)} />
  <Button onClick={confirmImport}>Next</Button>
</WizardStep>
```

### Step 4: Confirmation
```tsx
<WizardStep title="Confirm Import">
  <Alert>
    Ready to import {deviceCount} devices from Addigy.
    This will replace your current device source.
  </Alert>
  <Button onClick={startImport}>Start Import</Button>
</WizardStep>
```

## Addigy API Integration

### Validate Credentials
```typescript
async function validateAddigyCredentials(clientId: string, clientSecret: string) {
  const response = await fetch('https://prod.addigy.com/api/policies', {
    headers: {
      'client-id': clientId,
      'client-secret': clientSecret
    }
  });
  return response.ok;
}
```

### Fetch Policies
```typescript
async function fetchAddigyPolicies(clientId: string, clientSecret: string) {
  const response = await fetch('https://prod.addigy.com/api/policies', {
    headers: {
      'client-id': clientId,
      'client-secret': clientSecret
    }
  });
  return await response.json();
}
```

### Fetch Devices by Policy
```typescript
async function fetchAddigyDevices(clientId: string, clientSecret: string, policyId: string) {
  const response = await fetch(`https://prod.addigy.com/api/policies/${policyId}/devices`, {
    headers: {
      'client-id': clientId,
      'client-secret': clientSecret
    }
  });
  return await response.json();
}
```

## Database Updates

```sql
-- Store credentials
INSERT INTO account_integrations (account_id, integration_type, access_token_encrypted, metadata)
VALUES (?, 'addigy', encrypt(?), json_object('policy_id', ?));

-- Update device source
UPDATE accounts SET device_source = 'addigy' WHERE id = ?;
```

## API Endpoints

### POST /api/integrations/addigy/validate
```typescript
// Validate credentials
Request: { client_id, client_secret }
Response: { valid: boolean }
```

### GET /api/integrations/addigy/policies
```typescript
// Fetch policies
Headers: { client_id, client_secret }
Response: Array<{ id, name, device_count }>
```

### GET /api/integrations/addigy/devices/preview
```typescript
// Preview devices for policy
Query: { policy_id }
Response: Array<{ name, model, serial, assigned_to }>
```

### POST /api/integrations/addigy/setup
```typescript
// Complete setup and start sync
Request: { client_id, client_secret, policy_id }
Response: { status: 'syncing', job_id }
```

## Files to Create

- `src/components/settings/AddigyWizard.tsx` - Setup wizard
- `src/api/integrations/addigy/setup.ts` - Setup endpoints
- `src/lib/addigy/api.ts` - Addigy API client

## Files to Modify

- `src/pages/dashboard/settings/integrations.astro` - Add Addigy setup button

## References

- PRD.md Section 3: Identity & Onboarding (REQ-ID-014)
- Addigy API documentation
