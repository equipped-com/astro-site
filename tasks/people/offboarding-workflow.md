# Task: Employee Offboarding Workflow

## Description

Implement offboarding flow for departing employees: view assigned devices, schedule collection, request secure data wipe, revoke access.

## Acceptance Criteria

- [ ] "Offboard employee" action on person detail
- [ ] List all devices assigned to employee
- [ ] Schedule device collection via logistics
- [ ] Request secure data wipe options
- [ ] Revoke platform access on last day
- [ ] Update employee status to "departed"

## Test Criteria

```gherkin
Feature: Employee Offboarding
  As HR/IT admin
  I want to offboard departing employees
  So that devices are recovered and data is secured

  @REQ-PPL-OFFBOARD-001
  Scenario: Initiate offboarding
    Given employee "Bob Jones" has assigned devices
    When I click "Offboard employee" on Bob's profile
    Then I should see offboarding workflow
    And I should see all devices assigned to Bob

  @REQ-PPL-OFFBOARD-002
  Scenario: View assigned devices
    When I am in offboarding flow
    Then I should see:
      | Device | Status |
      | MacBook Pro 14" (Serial: XYZ) | Deployed |
      | Magic Keyboard | Deployed |
    And I should see total device count

  @REQ-PPL-OFFBOARD-003
  Scenario: Schedule device collection
    When I click "Schedule collection"
    Then I should be able to:
      | Option |
      | Ship return label to employee |
      | Schedule pickup at address |
      | Mark as returned in person |

  @REQ-PPL-OFFBOARD-004
  Scenario: Request secure wipe
    When I request data wipe
    Then I should see wipe options:
      | Option | Description |
      | Standard wipe | Factory reset |
      | Secure wipe | DoD 5220.22-M compliant |
      | Certified wipe | With destruction certificate |
    And wipe status should be tracked

  @REQ-PPL-OFFBOARD-005
  Scenario: Complete offboarding
    When I complete offboarding with last day "Dec 31"
    Then:
      | Action | Timing |
      | Platform access revoked | On Dec 31 |
      | Status updated to "departed" | On Dec 31 |
      | Devices unassigned | When returned |
      | End date set | Dec 31 |
```

## Dependencies

- people/directory-view
- fleet/device-assignment
- integrations/spark-shipping

## Files to Create

- `src/components/people/OffboardingWizard.tsx`
- `src/components/people/DeviceCollectionScheduler.tsx`
- `src/components/people/DataWipeRequest.tsx`

## References

- documentation/platform-team-management.md
- PRD.md Section 7: Employee & People Management
