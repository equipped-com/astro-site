# Fix Cart Management Tests

## Description

Fix failing tests for commerce/cart-management. Cart component tests are failing due to mock configuration or component rendering issues.

## Original Task

- **Task ID:** commerce/cart-management
- **Commit:** cb0bb8d
- **Status:** Marked incomplete due to test failures

## Failing Tests

- src/components/cart/Cart.test.tsx - multiple test failures

## Root Cause

Cart component tests are failing, likely due to:
1. Cart state management not properly mocked
2. Product data not properly mocked
3. Add/remove cart actions not working in tests
4. Component not rendering expected elements

## Dependencies

- commerce/cart-management - Original implementation (incomplete)
- testing/fix-component-tests - General component test infrastructure

## Acceptance Criteria

- [ ] All tests in Cart.test.tsx pass
- [ ] Cart operations (add, remove, update) tested
- [ ] Cart state properly mocked
- [ ] No regression in other commerce tests
- [ ] Original task commerce/cart-management can be marked done: true

## Test Criteria

```gherkin
Feature: Cart Management
	As a developer
	I want all cart tests to pass
	So that shopping cart functionality is verified

	@REQ-CART-001
	Scenario: Add item to cart
		Given an empty cart
		When adding a product
		Then cart should contain the product
		And cart count should increase

	@REQ-CART-002
	Scenario: Remove item from cart
		Given a cart with items
		When removing an item
		Then item should be removed
		And cart count should decrease
```

## Implementation

1. Review `src/components/cart/Cart.test.tsx` and `src/components/cart/Cart.tsx`
2. Fix cart context/state mocks
3. Fix product data mocks
4. Verify component rendering
5. Run tests: `bun run test src/components/cart/Cart.test.tsx`

## Files to Modify

- src/components/cart/Cart.test.tsx
- Potentially: src/components/cart/Cart.tsx

## References

- test-failure-analysis-corrected.md (lines 42, 154)
- Original task: tasks/commerce/cart-management.md
- Original commit: cb0bb8d
