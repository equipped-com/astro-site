# Task: PostHog Analytics Integration

## Description

Integrate PostHog for product analytics, session replay, and feature flags.

## Acceptance Criteria

- [ ] PostHog SDK installed and initialized
- [ ] Page views and events tracked
- [ ] User identification on login
- [ ] Feature flags integration
- [ ] Session replay enabled

## Test Criteria

```gherkin
Feature: PostHog Analytics
  As the product team
  I want analytics and feature flags
  So that we can measure usage and ship safely

  @REQ-INT-PH-001
  Scenario: Track page views
    When user navigates to any page
    Then pageview event should be sent to PostHog
    And URL and referrer should be included

  @REQ-INT-PH-002
  Scenario: Identify user on login
    When user logs in
    Then posthog.identify should be called
    And user properties should include:
      | Property |
      | email |
      | account_id |
      | role |
      | is_synthetic |

  @REQ-INT-PH-003
  Scenario: Track custom events
    When user adds item to cart
    Then event "item_added_to_cart" should be sent
    And properties should include product details

  @REQ-INT-PH-004
  Scenario: Feature flags
    When checking if feature is enabled
    Then PostHog feature flags should be queried
    And flag value should be cached
    And UI should respect flag state

  @REQ-INT-PH-005
  Scenario: Exclude synthetic accounts
    Given user is in a synthetic test account
    Then events should have is_synthetic: true
    And they can be filtered in PostHog dashboard
```

## Implementation

```typescript
// src/lib/analytics.ts
import posthog from 'posthog-js'

export function initAnalytics() {
  posthog.init(import.meta.env.PUBLIC_POSTHOG_KEY, {
    api_host: 'https://app.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
  })
}

export function identifyUser(user: User, account?: Account) {
  posthog.identify(user.id, {
    email: user.email,
    name: `${user.first_name} ${user.last_name}`,
    account_id: account?.id,
    account_name: account?.name,
    is_synthetic: account?.is_synthetic || false,
  })
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  posthog.capture(event, properties)
}

export function isFeatureEnabled(flag: string): boolean {
  return posthog.isFeatureEnabled(flag) ?? false
}
```

## Environment Variables

```
PUBLIC_POSTHOG_KEY=phc_xxx
```

## Files to Create

- `src/lib/analytics.ts`
- Update layouts to init PostHog

## References

- PRD.md Section 14: Monitoring & Observability
- PRD.md: Technology Stack (PostHog)
