# Fix Dashboard Component Tests

## Description

Fix failing tests for dashboard/dashboard-home. Dashboard component tests are failing across multiple files including page tests and component tests.

## Original Task

- **Task ID:** dashboard/dashboard-home
- **Commit:** 183f066
- **Status:** Marked incomplete due to test failures

## Failing Tests

- src/test/pages/dashboard/index.test.tsx - multiple test failures
- src/components/dashboard/QuickStats.test.tsx - multiple test failures
- src/components/dashboard/AccountSwitcher.test.tsx - multiple test failures

## Root Cause

Dashboard tests are failing, likely due to:
1. Dashboard page not rendering expected components
2. Stats data not properly mocked
3. Account switcher not properly mocked
4. Auth context not properly provided
5. Data fetching hooks not properly mocked

## Dependencies

- dashboard/dashboard-home - Original implementation (incomplete)
- dashboard/dashboard-layout - Dashboard layout must be working
- api/device-crud - Device data API must be working
- testing/fix-component-tests - General component test infrastructure

## Acceptance Criteria

- [ ] All tests in dashboard/index.test.tsx pass
- [ ] All tests in QuickStats.test.tsx pass
- [ ] All tests in AccountSwitcher.test.tsx pass
- [ ] Dashboard renders with proper data
- [ ] Stats calculations correct
- [ ] Account switching works
- [ ] No regression in other dashboard tests
- [ ] Original task dashboard/dashboard-home can be marked done: true

## Test Criteria

```gherkin
Feature: Dashboard Components
	As a developer
	I want all dashboard tests to pass
	So that dashboard functionality is verified

	@REQ-DASHBOARD-001
	Scenario: Render dashboard home page
		Given an authenticated user
		When loading dashboard home page
		Then quick stats should be displayed
		And recent activity should be shown
		And account switcher should be visible

	@REQ-DASHBOARD-002
	Scenario: Display quick stats
		Given device and order data
		When rendering QuickStats component
		Then device count should be correct
		And order count should be correct
		And stats should update with new data

	@REQ-DASHBOARD-003
	Scenario: Switch accounts
		Given a user with multiple accounts
		When clicking account switcher
		Then account list should be displayed
		And clicking an account should switch context
```

## Implementation

1. Review dashboard test files and component files
2. Fix auth context mocks
3. Fix data fetching mocks (devices, orders, stats)
4. Fix account switcher mocks
5. Verify component rendering
6. Run tests:
   ```bash
   bun run test src/test/pages/dashboard/index.test.tsx
   bun run test src/components/dashboard/QuickStats.test.tsx
   bun run test src/components/dashboard/AccountSwitcher.test.tsx
   ```

## Files to Modify

- src/test/pages/dashboard/index.test.tsx
- src/components/dashboard/QuickStats.test.tsx
- src/components/dashboard/AccountSwitcher.test.tsx
- Potentially: component implementation files

## References

- test-failure-analysis-corrected.md (lines 43-44, 119-121, 156, 271-276)
- Original task: tasks/dashboard/dashboard-home.md
- Original commit: 183f066
