# Fix: API Route Tests

## Priority: HIGH

## Failure Count: 41 tests

## Affected Files

| File | Failures | Description |
|------|----------|-------------|
| `src/api/routes/user.test.ts` | 9 | User API endpoint tests |
| `src/api/routes/user.regression.test.ts` | 7 | User API regression tests |
| `src/api/routes/team.test.ts` | 12 | Team management API tests |
| `src/api/routes/organization.test.ts` | 7 | Organization API tests |
| `src/api/routes/devices.test.ts` | 4 | Device CRUD API tests |
| `src/api/routes/device-assignments.test.ts` | 2 | Device assignment API tests |

## Problem

Multiple API route tests are failing. These tests verify the Hono API endpoints for user management, team management, organization management, and device operations.

## Investigation Steps

1. Run specific test files to see detailed errors:
   ```bash
   bun run test -- src/api/routes/user.test.ts
   bun run test -- src/api/routes/team.test.ts
   ```

2. Check if tests expect database responses but DB mocks are missing
3. Check if auth context is properly mocked
4. Check if response schemas have changed

## Acceptance Criteria

```gherkin
Feature: API Route Tests

  Scenario: All API tests pass
    Given the API routes are implemented
    When I run `bun run test -- src/api/routes/`
    Then all tests should pass
    And no regressions should be introduced
```

## Complexity: medium

API tests typically fail due to missing mocks or changed response shapes.
