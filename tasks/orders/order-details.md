# Task: Order Details View

## Description

Display complete order information including line items, shipping status, timeline, and available actions (cancel, return, reorder).

## Acceptance Criteria

- [ ] Order header with number, date, status
- [ ] Line items with product details and specs
- [ ] Shipping information with tracking
- [ ] Order timeline (placed → shipped → delivered)
- [ ] Payment method display
- [ ] Actions: cancel (if eligible), return (if eligible), reorder
- [ ] Invoice download (PDF)

## Test Criteria

```gherkin
Feature: Order Details
  As a buyer
  I want to view complete order details
  So that I can track my purchase and take actions

  @REQ-ORD-006
  Scenario: View order details
    Given I have order #EQ-2024-001
    When I click on the order
    Then I should see:
      | Section | Content |
      | Header | Order #, date, status badge |
      | Items | Product name, specs, quantity, price |
      | Summary | Subtotal, shipping, tax, total |
      | Shipping | Address, recipient, tracking |
      | Timeline | Order placed, shipped, delivered dates |
      | Payment | Method (card/leasing), monthly if applicable |

  @REQ-ORD-007
  Scenario: Order timeline for leasing order
    Given order was placed with leasing
    Then timeline should show:
      | Step | Status |
      | Order placed | Completed |
      | Pending leasing approval | Completed or Current |
      | Pending payment | Pending |
      | Preparing to ship | Pending |
      | Shipped | Pending |
      | Delivered | Pending |

  @REQ-ORD-008
  Scenario: Track shipment
    Given order status is "Shipped"
    And tracking number exists
    When I click "Track shipment"
    Then I should see carrier information
    And I should see tracking details
    And I should see estimated delivery date

  @REQ-ORD-009
  Scenario: Download invoice
    When I click "Download invoice"
    Then a PDF should be generated
    And it should include all order details
    And it should include company billing info

  @REQ-ORD-010
  Scenario: Cancel order
    Given order status is "Pending" or "Processing"
    When I click "Cancel order"
    And I confirm cancellation
    Then order status should change to "Cancelled"
    And refund should be initiated (if paid)
    And I should see cancellation confirmation

  @REQ-ORD-011
  Scenario: Request return
    Given order status is "Delivered"
    And return window has not expired
    When I click "Request return"
    Then I should see return form
    And I should select reason for return
    And I should receive return shipping label
```

## Dependencies

- orders/order-list
- integrations/spark-shipping

## Files to Create

- `src/pages/dashboard/orders/[id].astro`
- `src/components/orders/OrderDetails.tsx`
- `src/components/orders/OrderTimeline.tsx`
- `src/components/orders/OrderActions.tsx`
- `src/components/orders/ShipmentTracker.tsx`

## References

- documentation/platform-orders.md
- PRD.md Section 6: Order Management
