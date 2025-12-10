# Fix: Settings Component Tests

## Priority: MEDIUM

## Failure Count: 5 tests

## Affected Files

| File | Failures | Description |
|------|----------|-------------|
| `src/components/settings/TeamAccessManager.test.tsx` | 4 | Team member management |
| `src/components/settings/OrganizationForm.test.tsx` | 1 | Organization form |

## Problem

Settings component tests are failing. Issues include:
- OrganizationForm loading state not rendering as expected
- TeamAccessManager role/permission display issues

## Investigation Steps

1. Run settings tests:
   ```bash
   bun run test -- src/components/settings/
   ```

2. Check OrganizationForm loading spinner/skeleton
3. Check TeamAccessManager for role badge rendering

## Known Issues

From test output:
- `should render loading state initially` - OrganizationForm
- TeamAccessManager role display tests

## Acceptance Criteria

```gherkin
Feature: Settings Tests

  Scenario: Organization form shows loading
    Given the organization data is loading
    When the form is rendered
    Then a loading indicator should be visible

  Scenario: Team members display correctly
    Given a team has members with roles
    When the team access manager is rendered
    Then all members should show with correct roles
```

## Complexity: low

UI component fixes - loading states and display logic.
