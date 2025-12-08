# Task: Checkout Stage 1 - Assignment

## Description

Implement the first stage of checkout: "Who will use this equipment?" Users can assign equipment to a team member or leave it unassigned for later assignment.

## Acceptance Criteria

- [ ] "Assign to someone" option with team member dropdown
- [ ] "Leave unassigned" option for shared/later assignment
- [ ] Search/filter team members by name
- [ ] "Ask [person] to add info" email trigger for missing contact details
- [ ] Assignment saved to order context
- [ ] Progress to Stage 2 on completion

## Test Criteria

```gherkin
Feature: Checkout Stage 1 - Equipment Assignment
  As a buyer
  I want to assign equipment to a team member
  So that we can track who uses each device

  Background:
    Given I am logged in as a user with "buyer" or higher role
    And I have items in my cart
    And I have initiated checkout

  @REQ-COM-ASSIGN-001
  Scenario: Assign equipment to team member
    Given my team has members "Alice Smith" and "Bob Jones"
    When I select "Assign it to someone"
    And I search for "Alice"
    And I select "Alice Smith" from the dropdown
    Then the assignment should be saved as "Alice Smith"
    And I should see "Continue" button enabled

  @REQ-COM-ASSIGN-002
  Scenario: Leave equipment unassigned
    When I select "Leave it unassigned"
    Then the assignment should be saved as null
    And I should see "Continue" button enabled
    And I should see a note about assigning later

  @REQ-COM-ASSIGN-003
  Scenario: Search team members
    Given my team has 50 members
    When I type "mar" in the search field
    Then I should see filtered results matching "mar"
    And results should show name and email

  @REQ-COM-ASSIGN-004
  Scenario: Request missing contact info
    Given team member "Nicole" has no address on file
    When I select "Nicole"
    Then I should see "Don't have Nicole's address?"
    And I should see "Ask Nicole to add info" link
    When I click "Ask Nicole to add info"
    Then an email should be sent to Nicole's email
    And the email should contain a profile completion link

  @REQ-COM-ASSIGN-005
  Scenario: Add new person during checkout
    When I click "Add person"
    Then a modal should open to add a new team member
    When I complete the form and save
    Then the new person should appear in the dropdown
    And should be automatically selected
```

## Dependencies

- commerce/cart-management
- people/directory-view
- api/people-endpoints

## UI Components

```
┌─────────────────────────────────────────┐
│ 1. Assignment                           │
│ ─────────────────────────────────────── │
│ Who will use this equipment?            │
│                                         │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Assign it to    │ │ Leave it        │ │
│ │ someone         │ │ unassigned      │ │
│ │     [PRIMARY]   │ │   [SECONDARY]   │ │
│ └─────────────────┘ └─────────────────┘ │
│                                         │
│ [Search team members...          ▼]     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 Alice Smith                      │ │
│ │    alice@company.com                │ │
│ ├─────────────────────────────────────┤ │
│ │ 👤 Bob Jones                        │ │
│ │    bob@company.com                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│                        [Continue →]     │
└─────────────────────────────────────────┘
```

## Files to Create

- `src/components/checkout/AssignmentStage.tsx`
- `src/components/checkout/PersonSelector.tsx`
- `src/components/checkout/RequestInfoEmail.tsx`

## References

- documentation/platform-checkout.md Stage 1: Assignment
- PRD.md Section 2: Commerce & Purchasing
