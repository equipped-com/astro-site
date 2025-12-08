# Task: Install Clerk SDK

## Description

Install the Clerk React SDK for frontend authentication. This provides the authentication primitives needed for sign-in, sign-up, and session management in the Astro + React application.

## Acceptance Criteria

- [ ] `@clerk/clerk-react` installed as dependency
- [ ] `@hono/clerk-auth` installed for backend
- [ ] `svix` installed for webhook verification
- [ ] Clerk environment variables documented
- [ ] TypeScript types available

## Test Criteria

```gherkin
Feature: Clerk SDK Installation
  As a developer
  I want Clerk SDK installed and configured
  So that I can implement authentication

  @REQ-SDK-001
  Scenario: Frontend SDK installation
    When I run "npm install @clerk/clerk-react"
    Then the package should be added to package.json
    And I should be able to import ClerkProvider

  @REQ-SDK-002
  Scenario: Backend SDK installation
    When I run "npm install @hono/clerk-auth"
    Then the package should be added to package.json
    And I should be able to import clerkMiddleware

  @REQ-SDK-003
  Scenario: TypeScript types
    Given Clerk packages are installed
    When I import from "@clerk/clerk-react"
    Then TypeScript should recognize all types
    And no type errors should occur

  @REQ-SDK-004
  Scenario: Environment configuration
    Given ".env.example" documents required variables
    When developer sets up local environment
    Then they should know to set:
      | Variable | Description |
      | PUBLIC_CLERK_PUBLISHABLE_KEY | Client-side key |
      | CLERK_SECRET_KEY | Server-side key |
      | CLERK_WEBHOOK_SECRET | Webhook verification |
```

## Dependencies

None

## Commands

```bash
npm install @clerk/clerk-react @hono/clerk-auth svix
```

## Environment Variables

Add to `.env.example`:

```bash
# Clerk Authentication
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx  # Client-side (PUBLIC_ prefix for Astro)
CLERK_SECRET_KEY=sk_test_xxx              # Server-side only
CLERK_WEBHOOK_SECRET=whsec_xxx            # Webhook signature verification
```

## Files to Modify

- `package.json` - dependencies added
- `.env.example` - document required variables

## References

- PRD.md Section 5: User Authentication
- documentation/platform-authentication.md
- [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react)
- [Clerk + Astro Integration](https://clerk.com/docs/references/astro/overview)
