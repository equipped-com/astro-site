# Task: Order List View

## Description

Display all orders for the current account with filtering, sorting, and status tracking. Team-scoped view showing orders from all team members.

## Acceptance Criteria

- [ ] Table view with order columns
- [ ] Filter by status (all, pending, shipped, delivered, cancelled)
- [ ] Filter by date range
- [ ] Search by order number or product name
- [ ] Sort by date, total, status
- [ ] Pagination or infinite scroll
- [ ] Quick actions (view, track, reorder)

## Test Criteria

```gherkin
Feature: Order List
  As a team member
  I want to view all team orders
  So that I can track purchases and deliveries

  Background:
    Given I am logged in with "member" or higher role
    And my team has placed orders

  @REQ-ORD-001
  Scenario: View order list
    When I navigate to Orders page
    Then I should see a table with columns:
      | Column | Sortable |
      | Order # | Yes |
      | Date | Yes |
      | Items | No |
      | Total | Yes |
      | Status | Yes |
      | Tracking | No |

  @REQ-ORD-002
  Scenario: Filter by status
    Given there are orders with various statuses
    When I filter by "Shipped"
    Then I should only see orders with status "Shipped"
    And the filter should persist in URL

  @REQ-ORD-003
  Scenario: Search orders
    When I search for "MacBook"
    Then I should see orders containing "MacBook" products
    When I search for "#EQ-2024-001"
    Then I should see that specific order

  @REQ-ORD-004
  Scenario: Order status display
    Then orders should show appropriate status badges:
      | Status | Badge Color |
      | Pending | Yellow |
      | Pending leasing approval | Orange |
      | Processing | Blue |
      | Shipped | Purple |
      | Delivered | Green |
      | Cancelled | Red |
      | Returned | Gray |

  @REQ-ORD-005
  Scenario: Team-scoped orders
    Given user "Alice" placed order #001
    And user "Bob" placed order #002
    When I view orders as team member
    Then I should see both orders
    And I should see who created each order
```

## Dependencies

- database/initial-schema
- api/order-endpoints
- dashboard/dashboard-layout

## Files to Create

- `src/pages/dashboard/orders/index.astro`
- `src/components/orders/OrderList.tsx`
- `src/components/orders/OrderFilters.tsx`
- `src/components/orders/OrderStatusBadge.tsx`

## References

- documentation/platform-orders.md
- PRD.md Section 6: Order Management
