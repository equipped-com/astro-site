# Fix: Admin Component Tests

## Priority: MEDIUM

## Failure Count: 10 tests

## Affected Files

| File | Failures | Description |
|------|----------|-------------|
| `src/components/admin/GlobalDeviceView.test.tsx` | 9 | Cross-tenant device view |
| `src/components/admin/FeatureFlagManager.test.tsx` | 1 | Feature flag management |

## Problem

Admin panel component tests are failing. The GlobalDeviceView has multiple failures suggesting structural issues with the component or test setup.

## Investigation Steps

1. Run admin tests:
   ```bash
   bun run test -- src/components/admin/
   ```

2. Check GlobalDeviceView component structure
3. Check if mock data format matches expected
4. Check FeatureFlagManager async handling

## Known Issues

GlobalDeviceView has 9/11 tests failing - likely a systemic issue with:
- Component structure changes
- Mock data shape
- Query/filter functionality

## Acceptance Criteria

```gherkin
Feature: Admin Tests

  Scenario: Global device view renders
    Given an admin user
    When they view the global device list
    Then devices from all tenants should display

  Scenario: Feature flags can be toggled
    Given a feature flag exists
    When admin toggles the flag
    Then the change should persist
```

## Complexity: medium

May require component refactoring or test updates.
