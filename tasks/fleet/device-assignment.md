# Task: Device Assignment

## Description

Assign devices to people, track assignment history, and handle device returns from departing employees.

## Acceptance Criteria

- [ ] Assign device to person from directory
- [ ] Assignment recorded in history table
- [ ] Device status updates to "Deployed"
- [ ] Unassign device (return)
- [ ] Assignment audit trail
- [ ] Schedule collection for returns

## Test Criteria

```gherkin
Feature: Device Assignment
  As an IT Manager
  I want to assign devices to employees
  So that I can track who has what equipment

  @REQ-FLEET-ASSIGN-001
  Scenario: Assign device to employee
    Given device "MacBook Pro 16" is available
    And employee "Alice Smith" exists in directory
    When I select the device
    And I click "Assign"
    And I select "Alice Smith" from dropdown
    And I click "Confirm"
    Then assignment should be recorded in device_assignments
    And device status should change to "Deployed"
    And device card should show "Assigned to: Alice Smith"

  @REQ-FLEET-ASSIGN-002
  Scenario: View assignment history
    Given device has been assigned multiple times
    When I view device details
    Then I should see assignment history:
      | Person | Assigned | Returned |
      | Alice Smith | Jan 1, 2024 | Mar 15, 2024 |
      | Bob Jones | Mar 16, 2024 | - |

  @REQ-FLEET-ASSIGN-003
  Scenario: Unassign device (return)
    Given device is assigned to "Bob Jones"
    And Bob is departing the company
    When I select the device
    And I click "Unassign"
    Then assignment should get returned_at timestamp
    And device status should change to "Available"
    And I should see option to schedule collection

  @REQ-FLEET-ASSIGN-004
  Scenario: Schedule device collection
    When I unassign a device
    Then I should see collection options:
      | Option |
      | Ship return label to employee |
      | Schedule pickup at their address |
      | Mark as returned in person |

  @REQ-FLEET-ASSIGN-005
  Scenario: Assignment audit log
    When any assignment change occurs
    Then an audit_log entry should be created
    And entry should include:
      | Field |
      | user_id (who made change) |
      | action (assign/unassign) |
      | device_id |
      | person_id |
      | timestamp |
```

## Dependencies

- fleet/device-inventory
- people/directory-view

## Files to Create

- `src/components/fleet/AssignDeviceModal.tsx`
- `src/components/fleet/AssignmentHistory.tsx`
- `src/components/fleet/UnassignDeviceModal.tsx`
- `src/components/fleet/CollectionScheduler.tsx`

## References

- PRD.md Section 4: Fleet Management & Asset Tracking
