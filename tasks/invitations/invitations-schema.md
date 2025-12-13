# Task: Account Invitations Table Migration

## Description

Create the `account_invitations` table to support the full invitation lifecycle including accept, decline, revoke, and automatic expiry. This table tracks pending invitations to join an account with a specific role.

## Acceptance Criteria

- [ ] `account_invitations` table created with all required fields
- [ ] Migration file follows Drizzle ORM conventions
- [ ] Unique constraint on (account_id, email) to prevent duplicate invites
- [ ] Foreign key relationships to accounts and users tables
- [ ] Indexes on email and account_id for performance
- [ ] Default expiry set to 14 days from creation

## Test Criteria

```gherkin
Feature: Account Invitations Schema
  As a database administrator
  I want a proper invitations table
  So that we can track invitation lifecycle

  @REQ-SCHEMA-001
  Scenario: Table structure
    Given the migrations have been run
    When I query the account_invitations table
    Then it should have the following columns:
      | Column             | Type     | Constraints          |
      | id                 | TEXT     | PRIMARY KEY          |
      | account_id         | TEXT     | NOT NULL, FK         |
      | email              | TEXT     | NOT NULL             |
      | role               | TEXT     | NOT NULL, DEFAULT    |
      | invited_by_user_id | TEXT     | NOT NULL, FK         |
      | sent_at            | DATETIME | DEFAULT CURRENT      |
      | accepted_at        | DATETIME | NULL                 |
      | declined_at        | DATETIME | NULL                 |
      | revoked_at         | DATETIME | NULL                 |
      | expires_at         | DATETIME | NOT NULL             |

  @REQ-SCHEMA-002
  Scenario: Unique constraint
    Given an invitation exists for "alice@example.com" to "Acme Corp"
    When I try to create another invitation for same email/account
    Then the insert should fail with unique constraint error

  @REQ-SCHEMA-003
  Scenario: Foreign key constraints
    When I try to create invitation with invalid account_id
    Then the insert should fail with foreign key error
    When I try to create invitation with invalid invited_by_user_id
    Then the insert should fail with foreign key error

  @REQ-SCHEMA-004
  Scenario: Default expiry calculation
    When I insert a new invitation without specifying expires_at
    Then expires_at should be set to sent_at + 14 days
```

## Dependencies

- database/initial-schema (accounts and users tables must exist)

## Schema Definition

```sql
CREATE TABLE account_invitations (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    invited_by_user_id TEXT NOT NULL REFERENCES users(id),
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    declined_at DATETIME,
    revoked_at DATETIME,
    expires_at DATETIME NOT NULL,
    UNIQUE(account_id, email)
);

CREATE INDEX idx_invitations_email ON account_invitations(email);
CREATE INDEX idx_invitations_account ON account_invitations(account_id);
```

## Files to Create

- `src/db/migrations/XXXX_create_account_invitations.sql`

## References

- PRD.md Section 3: Identity & Onboarding (REQ-ID-005 to REQ-ID-008)
- PRD.md Database Schema section
