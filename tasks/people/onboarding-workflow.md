# Task: Employee Onboarding Workflow

## Description

Implement streamlined onboarding flow for new hires: add employee details, select device package, configure shipping for day-one delivery.

## Acceptance Criteria

- [ ] "Onboard new hire" CTA on People page
- [ ] Multi-step wizard: Info → Device → Delivery
- [ ] Pre-configured device packages per role/department
- [ ] Schedule delivery for start date
- [ ] Welcome email to new hire with tracking
- [ ] Assignment auto-created when order placed

## Test Criteria

```gherkin
Feature: Employee Onboarding
  As HR/IT admin
  I want to onboard new hires with equipment
  So that they have everything ready on day one

  @REQ-PPL-ONBOARD-001
  Scenario: Start onboarding flow
    When I click "Onboard new hire"
    Then I should see a wizard with steps:
      | Step | Title |
      | 1 | Employee Info |
      | 2 | Select Equipment |
      | 3 | Delivery Details |
      | 4 | Review & Submit |

  @REQ-PPL-ONBOARD-002
  Scenario: Enter employee information
    When I am on Step 1
    And I enter:
      | Field | Value |
      | First name | Alice |
      | Last name | Smith |
      | Email | alice@company.com |
      | Start date | Next Monday |
      | Role | Software Engineer |
      | Department | Engineering |
    And I click "Continue"
    Then I should advance to Step 2

  @REQ-PPL-ONBOARD-003
  Scenario: Select device package
    When I am on Step 2
    Then I should see pre-configured packages:
      | Package | Contents |
      | Engineering Standard | MacBook Pro 14", Magic Keyboard, Magic Mouse |
      | Sales Standard | MacBook Air, iPad Pro |
      | Executive | MacBook Pro 16", Studio Display |
    When I select "Engineering Standard"
    Then I should see total cost and monthly if leasing

  @REQ-PPL-ONBOARD-004
  Scenario: Configure delivery for start date
    When I am on Step 3
    Given employee start date is "Monday, Dec 15"
    Then delivery date should default to "Friday, Dec 12" (before start)
    And I should enter shipping address
    And I should see warning if delivery after start date

  @REQ-PPL-ONBOARD-005
  Scenario: Complete onboarding
    When I review and submit
    Then:
      | Action | Result |
      | Person created | In people table |
      | Order created | With assignment to new person |
      | Welcome email | Sent to new hire with tracking |
      | Notification | Sent to me confirming order |
```

## Dependencies

- people/directory-view
- commerce/checkout-flow
- orders/order-creation

## Files to Create

- `src/components/people/OnboardingWizard.tsx`
- `src/components/people/OnboardingStep1.tsx`
- `src/components/people/OnboardingStep2.tsx`
- `src/components/people/OnboardingStep3.tsx`
- `src/components/people/DevicePackageSelector.tsx`

## References

- documentation/platform-team-management.md
- PRD.md Section 7: Employee & People Management
