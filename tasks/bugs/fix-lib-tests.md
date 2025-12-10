# Fix: Library/Core Tests

## Priority: LOW

## Failure Count: 3 tests

## Affected Files

| File | Failures | Description |
|------|----------|-------------|
| `src/lib/proposal-tokens.test.ts` | 2 | Proposal token generation |
| `src/lib/scoped-queries.test.ts` | 1 | Multi-tenant query scoping |

## Problem

Core library utility tests are failing. These are foundational utilities used across the application.

## Investigation Steps

1. Run lib tests:
   ```bash
   bun run test -- src/lib/proposal-tokens.test.ts
   bun run test -- src/lib/scoped-queries.test.ts
   ```

2. Check proposal token generation logic
3. Check scoped query helper for tenant ID handling

## Acceptance Criteria

```gherkin
Feature: Library Tests

  Scenario: Proposal tokens generate correctly
    Given valid proposal data
    When a token is generated
    Then it should be cryptographically secure

  Scenario: Scoped queries include tenant
    Given a multi-tenant context
    When a query is scoped
    Then it should include the tenant ID filter
```

## Complexity: low

Utility function fixes - straightforward logic issues.
