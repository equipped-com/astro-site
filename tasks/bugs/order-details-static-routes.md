# Bug: Order Details Uses Static Astro Routes for Dynamic Data

## Priority: HIGH

## Prerequisites

**READ FIRST:** `documentation/dynamic-routing-decision.md`

This task depends on the POC (`bugs/dynamic-routing-poc`) which establishes the correct pattern for dynamic routing. Follow the approach documented there.

## Problem

The order details page at `src/pages/dashboard/orders/[id].astro` incorrectly uses Astro's static site generation (`getStaticPaths`) for order data that is inherently dynamic.

### Current Implementation (Wrong)

```typescript
// src/pages/dashboard/orders/[id].astro
export function getStaticPaths() {
  const mockOrders = [
    { id: 'ord_1234567890abcdef' },
    { id: 'ord_2345678901bcdefg' },
    // ... hardcoded order IDs
  ]
  return mockOrders.map((order) => ({
    params: { id: order.id.slice(0, 8) },
  }))
}
```

### Why This Is Wrong

1. **Astro = Static**: `getStaticPaths` generates pages at **build time**. Orders are created dynamically at runtime - they don't exist at build time.

2. **Hardcoded Mock Data**: The page contains 170 lines of hardcoded mock order data that will never reflect real orders.

3. **No API Integration**: Real orders should be fetched from the API at runtime, not baked into static HTML.

4. **Breaks on New Orders**: Any order created after deployment will 404 because its route was never generated.

## Solution

Convert order details to a **React-only client-side route**:

1. Delete `src/pages/dashboard/orders/[id].astro`
2. Create a single `src/pages/dashboard/orders/index.astro` that hosts the React router
3. Use React Router or simple state management for order details
4. Fetch order data from API at runtime: `GET /api/orders/:id`

### Recommended Architecture

```
src/pages/dashboard/orders.astro     # Single Astro page
  -> <OrdersApp client:only="react" />  # React handles routing internally
      -> OrderList (default view)
      -> OrderDetails (when order selected)
```

## Files to Modify

- DELETE: `src/pages/dashboard/orders/[id].astro`
- MODIFY: `src/pages/dashboard/orders/index.astro` - Add React router
- MODIFY: `src/components/orders/OrderList.tsx` - Handle selection state
- KEEP: `src/components/orders/OrderDetails.tsx` - Already a React component

## Acceptance Criteria

```gherkin
Feature: Dynamic Order Details

  Scenario: View order details for any order
    Given I am on the orders list page
    When I click on any order row
    Then I should see the order details panel
    And the data should be fetched from the API
    And newly created orders should be viewable immediately

  Scenario: Direct link to order details
    Given I have a valid order ID
    When I navigate to /dashboard/orders?id={order_id}
    Then I should see the order details for that order
    And the data should be fetched from the API

  Scenario: Invalid order ID
    Given I navigate to /dashboard/orders?id=invalid
    When the API returns 404
    Then I should see an error message
    And I should have an option to return to the order list
```

## Test Requirements

- Remove existing tests that depend on static paths
- Add tests for API-driven order fetching
- Test loading states
- Test error handling for invalid order IDs
- Test that OrderDetails component receives data from API

## Dependencies

- `api/device-crud` (for API patterns)
- `orders/order-list` (must work alongside)

## Notes

This is an architectural fix, not just a bug fix. The same pattern issue may exist in other dynamic routes (proposals, people, devices). After fixing orders, audit other `[id].astro` routes.
