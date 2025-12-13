# Fix Trade-In Component Tests

## Description

Fix failing tests for trade-in/return-shipping. Trade-in component tests are failing across return label and value adjustment components.

## Original Task

- **Task ID:** trade-in/return-shipping
- **Commit:** 3174704
- **Status:** Marked incomplete due to test failures

## Failing Tests

- src/components/trade-in/ReturnLabel.test.tsx - multiple test failures
- src/components/trade-in/ValueAdjustmentModal.test.tsx - multiple test failures

## Root Cause

Trade-in component tests are failing, likely due to:
1. Shipping label generation not properly mocked
2. Device valuation data not properly mocked
3. Value adjustment logic not working in tests
4. External API calls (shipping) not properly mocked

## Dependencies

- trade-in/return-shipping - Original implementation (incomplete)
- trade-in/device-valuation - Valuation logic must be working
- integrations/spark-shipping - Shipping API integration
- testing/fix-component-tests - General component test infrastructure

## Acceptance Criteria

- [ ] All tests in ReturnLabel.test.tsx pass
- [ ] All tests in ValueAdjustmentModal.test.tsx pass
- [ ] Shipping label generation tested
- [ ] Value adjustment calculations correct
- [ ] External APIs properly mocked
- [ ] No regression in other trade-in tests
- [ ] Original task trade-in/return-shipping can be marked done: true

## Test Criteria

```gherkin
Feature: Trade-In Components
	As a developer
	I want all trade-in tests to pass
	So that device return functionality is verified

	@REQ-TRADE-IN-001
	Scenario: Generate return label
		Given a trade-in request
		When generating return label
		Then shipping label should be created
		And label should have correct address
		And label should be downloadable

	@REQ-TRADE-IN-002
	Scenario: Adjust device valuation
		Given a device with initial valuation
		When condition is adjusted
		Then value should recalculate
		And new value should be displayed
		And adjustment should be saved
```

## Implementation

1. Review trade-in test files and component files
2. Fix shipping API mocks (Spark or equivalent)
3. Fix device valuation mocks
4. Fix value adjustment calculation tests
5. Run tests:
   ```bash
   bun run test src/components/trade-in/ReturnLabel.test.tsx
   bun run test src/components/trade-in/ValueAdjustmentModal.test.tsx
   ```

## Files to Modify

- src/components/trade-in/ReturnLabel.test.tsx
- src/components/trade-in/ValueAdjustmentModal.test.tsx
- Potentially: component implementation files

## References

- test-failure-analysis-corrected.md (lines 47-48, 157)
- Original task: tasks/trade-in/return-shipping.md
- Original commit: 3174704
- Related: tasks/integrations/spark-shipping.md (commit: a20c247)
