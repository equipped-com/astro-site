---
epic: testing
task_id: auth-tests
title: Write Tests for Auth System
complexity: high
priority: high
---

# Write Tests for Auth System

## Description

Create comprehensive test suite for authentication and authorization system:
- Clerk integration tests
- Auth middleware validation
- Token verification and JWT parsing
- Role-based access control (RBAC)
- Session management
- Auth edge cases and security scenarios

Auth is critical security-sensitive code - high test coverage required.

## Acceptance Criteria

- [ ] Auth middleware tests (100% coverage)
- [ ] Clerk integration tests
- [ ] JWT token validation tests
- [ ] RBAC permission tests
- [ ] Session edge cases handled
- [ ] Security vulnerabilities prevented
- [ ] All Gherkin scenarios from task files converted to tests
- [ ] Coverage: **90%+ minimum**

## Test Criteria

```gherkin
Feature: Authentication Tests
  Scenario: Valid JWT token is accepted
    Given a valid JWT token
    When middleware verifies it
    Then request proceeds with user context
    And userId is extracted correctly

  Scenario: Invalid token is rejected
    Given an invalid/expired token
    When middleware processes it
    Then 401 Unauthorized is returned
    And user context is not set

  Scenario: RBAC prevents unauthorized access
    Given a user with employee role
    When accessing admin endpoint
    Then 403 Forbidden is returned

  Scenario: Multi-account access works correctly
    Given a user with access to multiple accounts
    When switching accounts
    Then resources are scoped correctly

  Scenario: Sys admin bypass works
    Given a Clerk user with @tryequipped.com email
    When accessing any account
    Then access is granted (sys_admin role)
```

## Implementation Details

See `tasks/testing/setup-vitest.md` for test infrastructure setup.

Auth test files:
- `src/api/middleware/auth.test.ts` - Auth middleware
- `src/lib/token.test.ts` - Token utilities
- `src/lib/rbac.test.ts` - Role-based access control
- `src/lib/session.test.ts` - Session management

## Dependencies

- `testing/setup-vitest` - Vitest infrastructure must be ready
- `api/auth-middleware` - Implementation being tested
