# Task: Checkout Stage 3 - Delivery Options

## Description

Implement the third stage of checkout: "When would you like to get your order?" Users select delivery speed with real-time price updates.

## Acceptance Criteria

- [ ] Standard delivery option (free, ~5 days)
- [ ] Express delivery option ($9, ~2 days faster)
- [ ] Custom date picker for specific dates
- [ ] Real-time cart total update with shipping costs
- [ ] Tax recalculation based on delivery selection
- [ ] Calendar with available dates highlighted

## Test Criteria

```gherkin
Feature: Checkout Stage 3 - Delivery Options
  As a buyer
  I want to choose when my order arrives
  So that it fits my schedule and budget

  Background:
    Given I have completed Stage 2 (Shipping)
    And I am on the Delivery Options stage

  @REQ-COM-DEL-001
  Scenario: Select standard delivery
    When I select "Standard Delivery"
    Then I should see estimated date "By Thursday, May 18"
    And shipping cost should show "Free"
    And cart total should NOT change

  @REQ-COM-DEL-002
  Scenario: Select express delivery
    When I select "Express Delivery"
    Then I should see estimated date "By Wednesday, May 17"
    And shipping cost should show "$9.00"
    And cart total should increase by $9.00
    And taxes should recalculate

  @REQ-COM-DEL-003
  Scenario: Select custom delivery date
    When I click "Select a date"
    Then a calendar picker should open
    And past dates should be disabled
    And dates before standard delivery should be disabled
    When I select "May 30"
    Then the delivery option should show "Select a date: May 30"
    And I should see helper text about selecting later dates

  @REQ-COM-DEL-004
  Scenario: Real-time cart updates
    Given cart subtotal is "$1,199.00"
    When I toggle between delivery options
    Then the sidebar cart should update in real-time:
      | Option | Shipping | Taxes | Total |
      | Standard | $0.00 | $95.92 | $1,294.92 |
      | Express | $9.00 | $96.64 | $1,304.64 |

  @REQ-COM-DEL-005
  Scenario: Calendar navigation
    When the calendar is open
    Then I should see the current month
    And I should be able to navigate to next month
    And available dates should be visually distinct
    And selected date should be highlighted
```

## Dependencies

- commerce/checkout-shipping
- api/shipping-calculation

## UI Components

```
┌─────────────────────────────────────────┐
│ 3. Delivery                             │
│ ─────────────────────────────────────── │
│ When would you like to get your order?  │
│                                         │
│ ○ By Thursday, May 18                   │
│   Standard Delivery          Free       │
│                                         │
│ ○ By Wednesday, May 17                  │
│   Express Delivery           $9.00      │
│                                         │
│ ○ Select a date                         │
│   ┌─────────────────────────────────┐   │
│   │ ◄  May 2024  ►                  │   │
│   │ Su Mo Tu We Th Fr Sa            │   │
│   │     1  2  3  4  5  6            │   │
│   │  7  8  9 10 11 12 13            │   │
│   │ 14 15 16 17 18 19 20            │   │
│   │ 21 22 23 24 25 26 27            │   │
│   │ 28 29 30 [31]                   │   │
│   └─────────────────────────────────┘   │
│                                         │
│                        [Continue →]     │
└─────────────────────────────────────────┘
```

## Files to Create

- `src/components/checkout/DeliveryStage.tsx`
- `src/components/checkout/DeliveryOption.tsx`
- `src/components/checkout/DeliveryCalendar.tsx`
- `src/lib/delivery-dates.ts`

## References

- documentation/platform-checkout.md Stage 3: Delivery Options
- PRD.md Section 2: Commerce & Purchasing
