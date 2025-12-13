# Task: Invitation API Endpoints

## Description

Implement API endpoints for the complete invitation lifecycle: create (send), accept, decline, revoke, and list invitations. Includes proper RBAC checks and email notification triggers.

## Acceptance Criteria

- [ ] `POST /api/invitations` - Create and send invitation (owner/admin only)
- [ ] `GET /api/invitations` - List all invitations for account (owner/admin only)
- [ ] `POST /api/invitations/:id/accept` - Accept invitation (public with token)
- [ ] `POST /api/invitations/:id/decline` - Decline invitation (public with token)
- [ ] `POST /api/invitations/:id/revoke` - Revoke invitation (owner/admin only)
- [ ] Email notification sent on invitation creation
- [ ] Validation: cannot invite existing team member
- [ ] Validation: invitation must not be expired
- [ ] Automatic creation of Account::Access on accept

## Test Criteria

```gherkin
Feature: Invitation API Endpoints
  As an account owner or admin
  I want to manage team invitations via API
  So that I can control access to my account

  @REQ-API-001 @RBAC
  Scenario: Create invitation (owner/admin only)
    Given I am logged in as "Owner" of "Acme Corp"
    When I POST to "/api/invitations" with:
      | email | role   |
      | alice@example.com | admin |
    Then the response status should be 201
    And an invitation record should be created
    And expires_at should be 14 days from now
    And an invitation email should be queued

  @REQ-API-002 @RBAC
  Scenario: Member cannot create invitations
    Given I am logged in as "Member" of "Acme Corp"
    When I POST to "/api/invitations" with email "bob@example.com"
    Then the response status should be 403
    And the error should be "Insufficient permissions"

  @REQ-API-003 @Validation
  Scenario: Cannot invite existing team member
    Given "alice@example.com" already has access to "Acme Corp"
    When I POST to "/api/invitations" with email "alice@example.com"
    Then the response status should be 400
    And the error should be "User already has access to this account"

  @REQ-API-004 @Accept
  Scenario: Accept invitation
    Given an invitation exists for "alice@example.com" to "Acme Corp"
    And the invitation is not expired
    When I POST to "/api/invitations/:id/accept"
    Then the response status should be 200
    And accepted_at should be set to current timestamp
    And an Account::Access record should be created with role "admin"
    And I should be redirected to "Acme Corp" dashboard

  @REQ-API-005 @Decline
  Scenario: Decline invitation
    Given an invitation exists for "bob@example.com" to "Acme Corp"
    When I POST to "/api/invitations/:id/decline"
    Then the response status should be 200
    And declined_at should be set to current timestamp
    And no Account::Access should be created

  @REQ-API-006 @Revoke
  Scenario: Revoke pending invitation
    Given I am an admin of "Acme Corp"
    And an invitation was sent to "pending@example.com"
    When I POST to "/api/invitations/:id/revoke"
    Then the response status should be 200
    And revoked_at should be set to current timestamp
    And the invitation link should no longer be valid

  @REQ-API-007 @Expiry
  Scenario: Cannot accept expired invitation
    Given an invitation was sent 15 days ago
    When I try to accept the invitation
    Then the response status should be 400
    And the error should be "This invitation has expired"

  @REQ-API-008 @List
  Scenario: List all invitations for account
    Given I am an owner of "Acme Corp"
    And there are 3 pending invitations
    When I GET "/api/invitations"
    Then the response status should be 200
    And I should see all 3 invitations with their status
```

## Dependencies

- invitations/invitations-schema (table must exist)
- api/auth-middleware (for RBAC checks)

## API Endpoints

### POST /api/invitations
```typescript
// Create and send invitation
Request: { email: string, role: 'owner' | 'admin' | 'member' | 'buyer' }
Response: { id: string, email: string, role: string, expires_at: string }
```

### GET /api/invitations
```typescript
// List all invitations for current account
Response: Array<{ id, email, role, sent_at, status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired' }>
```

### POST /api/invitations/:id/accept
```typescript
// Accept invitation (creates Account::Access)
Response: { account: { id, name, short_name }, role: string }
```

### POST /api/invitations/:id/decline
```typescript
// Decline invitation
Response: { message: 'Invitation declined' }
```

### POST /api/invitations/:id/revoke
```typescript
// Revoke invitation (admin only)
Response: { message: 'Invitation revoked' }
```

## Files to Create

- `src/api/invitations.ts` - Hono routes
- `src/lib/invitations.ts` - Business logic

## References

- PRD.md Section 3: Identity & Onboarding (REQ-ID-005 to REQ-ID-008)
- PRD.md: Team Access Management
