# Task: Trade-In Device Valuation

## Description

Allow users to get instant trade-in quotes for existing devices. Uses Alchemy API for valuation based on model and condition assessment.

## Acceptance Criteria

- [ ] "Trade in" entry point on product pages and dashboard
- [ ] Device model selection/lookup by serial
- [ ] Condition assessment questionnaire
- [ ] Real-time valuation from Alchemy API
- [ ] Apply credit to cart/checkout
- [ ] Track trade-in status

## Test Criteria

```gherkin
Feature: Trade-In Device Valuation
  As a customer
  I want to trade in my existing device
  So that I can get credit toward a new purchase

  @REQ-TRADE-001
  Scenario: Start trade-in from dashboard
    When I click "Trade In" in navigation
    Then I should see trade-in flow
    And I should be able to enter device details

  @REQ-TRADE-002
  Scenario: Look up device by serial number
    When I enter serial number "C02XYZ123ABC"
    Then the system should call Alchemy Model Lookup API
    And device details should auto-populate:
      | Field | Value |
      | Model | MacBook Air M1 |
      | Year | 2021 |
      | Color | Space Gray |

  @REQ-TRADE-003
  Scenario: Condition assessment
    After model is identified
    Then I should answer condition questions:
      | Question |
      | Does the device power on? |
      | Is the screen in good condition? |
      | Are there any cosmetic damages? |
      | Is the keyboard/trackpad functional? |
    And each answer affects valuation

  @REQ-TRADE-004
  Scenario: Get trade-in quote
    Given device is "MacBook Air M1" in "Good" condition
    When valuation is calculated
    Then I should see estimated value (e.g., "$450")
    And I should see "Get this value as credit"
    And I should see "Start trade-in" CTA

  @REQ-TRADE-005
  Scenario: Zero value device
    Given device is very old or damaged
    When valuation returns $0
    Then I should see "Recycle for Free" option
    And I should see eco-friendly recycling messaging
    And I should be able to schedule pickup

  @REQ-TRADE-006
  Scenario: Apply trade-in to cart
    Given trade-in value is $450
    When I click "Apply to cart"
    Then trade-in should be added to cart
    And cart total should show discount
    And checkout should reflect credit
```

## Dependencies

- integrations/alchemy-api
- commerce/cart-management

## Files to Create

- `src/pages/dashboard/trade-in/index.astro`
- `src/components/trade-in/TradeInFlow.tsx`
- `src/components/trade-in/DeviceLookup.tsx`
- `src/components/trade-in/ConditionAssessment.tsx`
- `src/components/trade-in/ValuationResult.tsx`

## References

- documentation/platform-trade-in.md
- PRD.md Section 5: Device Lifecycle Services
