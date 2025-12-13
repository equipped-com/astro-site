# Task: User Accounts API Endpoint

## Description

Create API endpoint that returns all accounts a user has access to, along with their role on each account. Used by the account switcher and user settings to display accessible accounts.

## Acceptance Criteria

- [ ] `GET /api/users/me/accounts` - List all accessible accounts
- [ ] Returns account details (id, name, short_name, logo_url)
- [ ] Returns user's role on each account
- [ ] Indicates which is the primary account
- [ ] Sorted by primary first, then alphabetically
- [ ] Requires authentication
- [ ] Includes account_access_id for role management

## Test Criteria

```gherkin
Feature: User Accounts API Endpoint
  As a user with multiple account access
  I want to retrieve my accessible accounts via API
  So that I can switch between them

  @REQ-API-001 @Authentication
  Scenario: Requires authentication
    Given I am not logged in
    When I GET "/api/users/me/accounts"
    Then the response status should be 401
    And the error should be "Authentication required"

  @REQ-API-002 @Response
  Scenario: List accessible accounts
    Given I am logged in as "alice@example.com"
    And I have access to:
      | Account       | Role   | Primary |
      | Acme Corp     | Owner  | Yes     |
      | Beta Inc      | Admin  | No      |
      | Client Co     | Member | No      |
    When I GET "/api/users/me/accounts"
    Then the response status should be 200
    And I should receive 3 accounts
    And each account should include:
      | Field         | Type    |
      | id            | string  |
      | name          | string  |
      | short_name    | string  |
      | logo_url      | string? |
      | role          | string  |
      | is_primary    | boolean |

  @REQ-API-003 @Sorting
  Scenario: Accounts sorted by primary then alphabetically
    Given I have access to accounts: "Zeta Co", "Acme Corp", "Beta Inc"
    And my primary account is "Beta Inc"
    When I GET "/api/users/me/accounts"
    Then the accounts should be ordered:
      | Position | Account   | Primary |
      | 1        | Beta Inc  | Yes     |
      | 2        | Acme Corp | No      |
      | 3        | Zeta Co   | No      |

  @REQ-API-004 @SingleAccount
  Scenario: User with single account
    Given I only have access to "Acme Corp"
    When I GET "/api/users/me/accounts"
    Then I should receive 1 account
    And it should be marked as primary

  @REQ-API-005 @NoAccess
  Scenario: User with no account access (edge case)
    Given I am logged in but have no account access
    When I GET "/api/users/me/accounts"
    Then the response status should be 200
    And I should receive an empty array
```

## Dependencies

- api/auth-middleware (for authentication and user context)

## API Specification

### GET /api/users/me/accounts

**Headers:**
```
Authorization: Bearer {clerk_session_token}
```

**Response 200:**
```json
{
  "accounts": [
    {
      "id": "acc_123",
      "name": "Acme Corporation",
      "short_name": "acmecorp",
      "logo_url": "https://...",
      "role": "owner",
      "is_primary": true,
      "account_access_id": "aa_456"
    },
    {
      "id": "acc_789",
      "name": "Beta Inc",
      "short_name": "betainc",
      "logo_url": null,
      "role": "admin",
      "is_primary": false,
      "account_access_id": "aa_012"
    }
  ]
}
```

**Response 401:**
```json
{
  "error": "Authentication required"
}
```

## Database Query

```sql
SELECT
  a.id,
  a.name,
  a.short_name,
  a.logo_url,
  aa.role,
  aa.id as account_access_id,
  CASE WHEN u.primary_account_id = a.id THEN 1 ELSE 0 END as is_primary
FROM account_access aa
JOIN accounts a ON aa.account_id = a.id
JOIN users u ON aa.user_id = u.id
WHERE aa.user_id = ?
ORDER BY is_primary DESC, a.name ASC
```

## Files to Create

- `src/api/users/accounts.ts` - Hono route handler

## Files to Modify

- `src/api/users.ts` - Add accounts route

## References

- PRD.md Section 3: Identity & Onboarding (REQ-ID-011)
- PRD.md: Consultant Pattern
