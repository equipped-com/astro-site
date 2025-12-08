# Task: Error Tracking with Sentry

## Description

Integrate Sentry for error tracking, performance monitoring, and alerting on production errors.

## Acceptance Criteria

- [ ] Sentry SDK installed and configured
- [ ] Errors captured with full context
- [ ] User context attached to errors
- [ ] Performance transactions tracked
- [ ] Alerts configured for new errors

## Test Criteria

```gherkin
Feature: Error Tracking
  As a developer
  I want errors to be tracked in Sentry
  So that I can quickly identify and fix issues

  @REQ-MON-005
  Scenario: Capture unhandled error
    Given an unhandled exception occurs
    Then the error should be sent to Sentry
    And it should include:
      | Context |
      | Stack trace |
      | Request URL |
      | User ID (if authenticated) |
      | Account ID (if in tenant context) |

  @REQ-MON-006
  Scenario: User context attached
    Given user "alice@company.com" is logged in
    When an error occurs
    Then Sentry should show user context:
      | Field | Value |
      | id | User's Clerk ID |
      | email | alice@company.com |
      | account | Account short_name |

  @REQ-MON-007
  Scenario: Performance monitoring
    When an API request is made
    Then a performance transaction should be created
    And it should track:
      | Metric |
      | Total request duration |
      | Database query time |
      | External API calls |

  @REQ-MON-008
  Scenario: Alert on new errors
    Given a new error type occurs
    Then Sentry should:
      | Action |
      | Group the error |
      | Send Slack notification |
      | Email the on-call team |
```

## Implementation

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/browser'

export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.PUBLIC_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1, // 10% of transactions
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
  })
}

export function setUserContext(user: { id: string; email: string }, account?: { id: string; name: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  })

  if (account) {
    Sentry.setTag('account_id', account.id)
    Sentry.setTag('account_name', account.name)
  }
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  })
}
```

## Files to Create

- `src/lib/sentry.ts`
- Update `src/layouts/BaseLayout.astro` to init Sentry

## Environment Variables

```
PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

## References

- PRD.md Section 14: Monitoring & Observability
