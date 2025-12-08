# Task: Checkout Stage 2 - Shipping Details

## Description

Implement the second stage of checkout: "Where should we send the order?" Capture delivery recipient and address with autocomplete support.

## Acceptance Criteria

- [ ] "To [assignee]'s address" option (pre-populated if available)
- [ ] "To another address" option with manual entry
- [ ] Google Places autocomplete for address
- [ ] "Enter address manually" fallback
- [ ] Phone number with international format
- [ ] "This is a business address" checkbox
- [ ] Dual email notification option
- [ ] Address validation before proceeding

## Test Criteria

```gherkin
Feature: Checkout Stage 2 - Shipping Details
  As a buyer
  I want to specify where to ship the equipment
  So that it arrives at the correct location

  Background:
    Given I have completed Stage 1 (Assignment)
    And I am on the Shipping Details stage

  @REQ-COM-SHIP-001
  Scenario: Use assignee's existing address
    Given I assigned equipment to "Nicole Haley"
    And Nicole has address "1 Infinite Loop, Cupertino, CA" on file
    When I select "To Nicole's address"
    Then the address should be pre-populated
    And phone number should be pre-populated
    And I should see "Continue" button enabled

  @REQ-COM-SHIP-002
  Scenario: Enter different shipping address
    When I select "To another address"
    Then I should see the address form
    And the form should include:
      | Field | Required |
      | First name | Yes |
      | Last name | Yes |
      | Address | Yes |
      | Apt/Suite | No |
      | City | Yes |
      | State | Yes |
      | Zip code | Yes |
      | Country | Yes |
      | Email | Yes |
      | Phone | Yes |

  @REQ-COM-SHIP-003
  Scenario: Address autocomplete
    When I start typing "1 Infinite" in the address field
    Then I should see Google Places suggestions
    When I select "1 Infinite Loop, Cupertino, CA, USA"
    Then all address fields should auto-populate
    And City should be "Cupertino"
    And State should be "CA"
    And Zip should be "95014"

  @REQ-COM-SHIP-004
  Scenario: Manual address entry fallback
    Given autocomplete returns no results
    When I click "Enter address manually"
    Then I should see all individual address fields
    And I should be able to type in each field

  @REQ-COM-SHIP-005
  Scenario: Request missing contact info via email
    Given assignee has no address on file
    When I click "Ask Nicole to add info"
    Then an email should be sent with profile completion link
    And I should see confirmation "Email sent to nicole@company.com"

  @REQ-COM-SHIP-006
  Scenario: Dual email notification
    Given I am shipping to someone else's address
    Then I should see "Order updates will also be sent to [my email]"
    And both recipient and buyer should receive notifications

  @REQ-COM-SHIP-007
  Scenario: Validate address before continuing
    When I click "Continue" with incomplete address
    Then I should see validation errors on missing fields
    And I should NOT proceed to Stage 3
```

## Dependencies

- commerce/checkout-assignment
- integrations/google-places-api

## Files to Create

- `src/components/checkout/ShippingStage.tsx`
- `src/components/checkout/AddressForm.tsx`
- `src/components/checkout/AddressAutocomplete.tsx`
- `src/lib/address-validation.ts`

## References

- documentation/platform-checkout.md Stage 2: Shipping Details
- PRD.md Section 2: Commerce & Purchasing
