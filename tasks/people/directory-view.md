# Task: People Directory View

## Description

Display employee directory for the account with ability to view, add, and manage team members. Supports both platform users and non-user employees (people who can be assigned devices but don't have login access).

## Acceptance Criteria

- [ ] Table/grid view of all people in account
- [ ] Filter by status (active, onboarding, offboarding, departed)
- [ ] Filter by department
- [ ] Search by name or email
- [ ] View device count per person
- [ ] Add new person manually
- [ ] Sync from Google Workspace (if connected)
- [ ] Distinguish users vs non-users visually

## Test Criteria

```gherkin
Feature: People Directory
  As an account admin
  I want to manage my team directory
  So that I can track employees and their equipment

  @REQ-PPL-001
  Scenario: View people directory
    When I navigate to People page
    Then I should see a list of all people
    And each person should display:
      | Field | Required |
      | Name | Yes |
      | Email | Yes |
      | Department | If available |
      | Devices | Count |
      | Status | Yes |
      | Platform Access | Yes/No indicator |

  @REQ-PPL-002
  Scenario: Filter by status
    Given people exist with various statuses
    When I filter by "Active"
    Then I should only see active employees
    And count should update to reflect filter

  @REQ-PPL-003
  Scenario: Search people
    When I search for "alice"
    Then I should see people matching "alice" in name or email

  @REQ-PPL-004
  Scenario: Add person without platform access
    When I click "Add person"
    And I enter:
      | Field | Value |
      | First name | John |
      | Last name | Doe |
      | Email | john@company.com |
      | Title | Engineer |
    And I leave "Grant platform access" unchecked
    And I click "Save"
    Then a Person record should be created
    And NO User or AccountAccess should be created
    And I can still assign devices to this person

  @REQ-PPL-005
  Scenario: Sync from Google Workspace
    Given Google Workspace integration is enabled
    When I click "Sync from Google"
    Then I should see progress indicator
    And new employees should be added
    And departed employees should be marked inactive
    And I should see "Last synced: [timestamp]"

  @REQ-PPL-006
  Scenario: Distinguish platform users
    Given "Alice" has platform access
    And "Bob" does not have platform access
    Then Alice should show a "User" badge or icon
    And Bob should NOT show the badge
```

## Dependencies

- database/initial-schema
- api/people-endpoints
- integrations/google-workspace (optional)

## Files to Create

- `src/pages/dashboard/people/index.astro`
- `src/components/people/PeopleDirectory.tsx`
- `src/components/people/PersonCard.tsx`
- `src/components/people/AddPersonModal.tsx`
- `src/components/people/GoogleSyncButton.tsx`

## References

- documentation/platform-team-management.md
- PRD.md Section 7: Employee & People Management
