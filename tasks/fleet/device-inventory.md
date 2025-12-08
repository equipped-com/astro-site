# Task: Fleet Device Inventory

## Description

Display all company devices with real-time valuation, status tracking, and assignment information. Supports adding existing devices, filtering, and bulk operations.

## Acceptance Criteria

- [ ] Table view with all device columns
- [ ] Filter by status, type, assignee
- [ ] Search by name, serial, model
- [ ] Real-time trade-in values from Alchemy
- [ ] Fleet value summary card
- [ ] Add device manually or by serial lookup
- [ ] Bulk selection and actions

## Test Criteria

```gherkin
Feature: Fleet Device Inventory
  As an IT Manager
  I want to see all company devices
  So that I can track and manage our fleet

  @REQ-FLEET-001
  Scenario: View device inventory
    When I navigate to Fleet/Devices page
    Then I should see all company devices
    And each device should display:
      | Field | Required |
      | Name | Yes |
      | Type | Yes |
      | Model | Yes |
      | Serial Number | No |
      | Status | Yes |
      | Assigned To | No |
      | Trade-In Value | Yes |

  @REQ-FLEET-002
  Scenario: Fleet value summary
    Given I have devices with trade-in values
    When the page loads
    Then I should see "Total Fleet Value" card
    And I should see depreciation trend
    And I should see device count by status

  @REQ-FLEET-003
  Scenario: Add device by serial number
    When I click "Add Device"
    And I enter serial "C02XYZ123ABC"
    Then Alchemy API should populate:
      | Model | MacBook Air M1 |
      | Year | 2021 |
      | Color | Space Gray |
    And I should enter purchase date
    And device should be saved to inventory

  @REQ-FLEET-004
  Scenario: Filter devices
    When I filter by status "Deployed"
    Then I should only see deployed devices
    When I filter by type "MacBook"
    Then I should only see MacBook devices
    When I search for "Alice"
    Then I should see devices assigned to Alice

  @REQ-FLEET-005
  Scenario: Trade-in badges
    Given device has trade-in value > $0
    Then device should show "Trade-In: $450" badge
    Given device has trade-in value = $0
    Then device should show "Recycle Free" badge

  @REQ-FLEET-006
  Scenario: Empty fleet state
    Given account has no devices
    When I view fleet page
    Then I should see friendly empty state
    And I should see quick actions:
      | Action |
      | Add device by serial |
      | Order new device |
      | Import from spreadsheet |
```

## Dependencies

- database/initial-schema
- integrations/alchemy-api
- api/device-endpoints

## Files to Create

- `src/pages/dashboard/fleet/index.astro`
- `src/components/fleet/DeviceInventory.tsx`
- `src/components/fleet/DeviceTable.tsx`
- `src/components/fleet/FleetSummaryCard.tsx`
- `src/components/fleet/AddDeviceModal.tsx`

## References

- PRD.md Section 4: Fleet Management & Asset Tracking
- documentation/summary.md
