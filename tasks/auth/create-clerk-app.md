# Task: Create Clerk Application

## Description

Create a new Clerk application in the Clerk dashboard and configure sign-in methods, redirect URLs, and obtain API keys. This is a dashboard configuration task that sets up the identity provider.

## Acceptance Criteria

- [ ] Clerk account created (if not exists)
- [ ] New application created in Clerk dashboard
- [ ] Sign-in methods configured (email + Google OAuth)
- [ ] Publishable key obtained
- [ ] Secret key obtained
- [ ] Webhook endpoint configured
- [ ] Redirect URLs set for all environments

## Test Criteria

```gherkin
Feature: Clerk Application Setup
  As the platform
  I want Clerk properly configured
  So that users can authenticate securely

  @REQ-CLERK-001
  Scenario: Application created
    Given I have a Clerk account
    When I access the Clerk dashboard
    Then I should see "Equipped" application
    And it should be in "Development" or "Production" mode

  @REQ-CLERK-002
  Scenario: Authentication methods enabled
    Given the Equipped application exists
    When I view authentication settings
    Then email authentication should be enabled
    And Google OAuth should be enabled (optional)
    And magic link should be available as fallback

  @REQ-CLERK-003
  Scenario: API keys available
    Given the Equipped application exists
    When I view API keys section
    Then publishable key should start with "pk_"
    And secret key should start with "sk_"
    And both keys should be copyable

  @REQ-CLERK-004
  Scenario: Redirect URLs configured
    Given the Equipped application exists
    Then these URLs should be allowed:
      | Environment | URL Pattern |
      | Local | http://localhost:4321/* |
      | Preview | https://*.preview.frst.dev/* |
      | Production | https://*.tryequipped.com/* |
      | Production | https://tryequipped.com/* |

  @REQ-CLERK-005
  Scenario: Webhook endpoint configured
    Given the Equipped application exists
    When I view webhook settings
    Then endpoint should be configured for user events
    And webhook secret should be available
```

## Dependencies

None (dashboard task)

## Configuration Steps

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com/)
2. Create new application named "Equipped"
3. Configure Authentication:
   - Enable **Email** (required)
   - Enable **Google OAuth** (recommended)
   - Enable **Magic Links** (recommended)
4. Get API keys from "API Keys" section
5. Configure Paths:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`
6. Configure Webhooks:
   - Endpoint: `https://{domain}/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Events: `organization.membership.created`, `organization.membership.updated`, `organization.membership.deleted`

## Redirect URL Configuration

```
# Development
http://localhost:4321/*
http://localhost:8787/*

# Preview
https://tryequipped.preview.frst.dev/*
https://*.tryequipped.preview.frst.dev/*

# Production
https://tryequipped.com/*
https://*.tryequipped.com/*
```

## Environment Variables to Set

Add to `.env` (local) and CloudFlare dashboard (production):

```
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
```

## References

- PRD.md Section 5: User Authentication
- documentation/platform-authentication.md
- [Clerk Dashboard](https://dashboard.clerk.com/)
- [Clerk Sign-in Methods](https://clerk.com/docs/authentication/configuration/sign-up-sign-in-options)
