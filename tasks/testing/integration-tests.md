---
epic: testing
task_id: integration-tests
title: Write Integration Tests for API & Components
complexity: high
priority: high
---

# Write Integration Tests for API & Components

## Description

Create integration tests that verify multiple components working together:
- API endpoints with database interactions
- Checkout flow (assignment → shipping → delivery → payment)
- Multi-tenant data isolation
- Auth + API integration
- Form submission workflows

Integration tests verify that pieces fit together correctly (higher level than unit tests).

## Acceptance Criteria

- [ ] API endpoint tests (device-crud, user-endpoints, etc.)
- [ ] Database interaction tests
- [ ] Checkout flow end-to-end
- [ ] Multi-tenant isolation verified
- [ ] Form validation + submission
- [ ] Error handling paths tested
- [ ] Coverage: **85%+ on critical paths**

## Test Criteria

```gherkin
Feature: API Integration Tests
  Scenario: Create device for account
    Given authenticated user with account access
    When creating a device
    Then device is scoped to account_id
    And response contains device ID
    And device is retrievable via GET

  Scenario: Multi-tenant isolation
    Given two different accounts
    When user from account A queries devices
    Then only account A devices are returned
    And account B devices are never visible

  Scenario: Checkout flow integration
    Given a user in checkout
    When completing all stages (assignment → shipping → delivery → payment)
    Then order is created in database
    And inventory is updated
    And leasing application is submitted

  Scenario: Auth + API integration
    Given middleware and device-crud endpoint
    When unauthenticated request hits endpoint
    Then 401 is returned
    When request includes valid token
    Then endpoint processes normally
```

## Implementation Details

Test files:
- `src/api/device-crud.test.ts` - Device endpoints
- `src/api/user-endpoints.test.ts` - User profile endpoints
- `src/checkout/checkout-flow.test.ts` - Checkout stages
- `src/lib/tenant.test.ts` - Multi-tenant isolation
- `src/components/checkout/checkout-integration.test.tsx` - UI flow

## Dependencies

- `testing/setup-vitest` - Vitest infrastructure
- `api/device-crud` - Implementation
- `api/auth-middleware` - Auth layer
- `database/run-migrations` - DB schema
