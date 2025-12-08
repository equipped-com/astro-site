# Task: Trade-In Return Shipping

## Description

Generate return shipping labels, track return shipments, and process trade-in credit after device inspection.

## Acceptance Criteria

- [ ] Generate prepaid return label
- [ ] Email label to customer
- [ ] Track return shipment status
- [ ] Record device receipt at warehouse
- [ ] Inspection status updates
- [ ] Credit application after inspection

## Test Criteria

```gherkin
Feature: Trade-In Return Process
  As a customer
  I want to return my trade-in device
  So that I can receive my credit

  @REQ-TRADE-007
  Scenario: Generate return label
    Given I have accepted trade-in quote
    When I click "Get return label"
    Then a prepaid shipping label should be generated
    And label should be emailed to me
    And label should be downloadable as PDF

  @REQ-TRADE-008
  Scenario: Track return shipment
    Given I have shipped my trade-in device
    When I view trade-in status
    Then I should see tracking information
    And status should progress through:
      | Status |
      | Label sent |
      | In transit |
      | Received |
      | Inspecting |
      | Credited |

  @REQ-TRADE-009
  Scenario: Device inspection
    Given warehouse receives my device
    When inspection is completed
    Then final_value may be adjusted based on actual condition
    And I should be notified of any value changes
    And I should approve/dispute if value changed

  @REQ-TRADE-010
  Scenario: Credit applied
    Given inspection is complete
    And final value matches estimate
    When credit is processed
    Then trade-in status should be "Credited"
    And credit should be applied to my order
    And I should receive confirmation email

  @REQ-TRADE-011
  Scenario: Value adjustment
    Given estimated value was $450
    And inspection finds issues not disclosed
    When final value is $350
    Then I should be notified of adjustment
    And I should have option to:
      | Option |
      | Accept new value |
      | Request device return (pay shipping) |
```

## Dependencies

- trade-in/device-valuation
- integrations/spark-shipping

## Files to Create

- `src/components/trade-in/ReturnLabel.tsx`
- `src/components/trade-in/TradeInStatus.tsx`
- `src/components/trade-in/ValueAdjustmentModal.tsx`
- `src/api/trade-in-status.ts`

## References

- documentation/platform-trade-in.md
- PRD.md Section 5: Device Lifecycle Services
