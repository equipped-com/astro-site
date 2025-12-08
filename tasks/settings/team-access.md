# Task: Team Access Management

## Description

Manage team member access, roles, and invitations. Supports inviting new users, changing roles, and removing access.

## Acceptance Criteria

- [ ] View all team members with roles
- [ ] Invite new members by email
- [ ] Assign roles (owner, admin, member, buyer)
- [ ] Change existing member roles
- [ ] Remove member access
- [ ] Pending invitations list

## Test Criteria

```gherkin
Feature: Team Access Management
  As an account owner/admin
  I want to manage who has access to my account
  So that the right people can use the platform

  @REQ-SET-TEAM-001
  Scenario: View team members
    When I navigate to Settings > Team
    Then I should see all team members with:
      | Column |
      | Name |
      | Email |
      | Role |
      | Joined date |
      | Actions |

  @REQ-SET-TEAM-002
  Scenario: Invite new member
    When I click "Invite member"
    And I enter email "newuser@company.com"
    And I select role "member"
    And I click "Send invitation"
    Then invitation email should be sent via Clerk
    And invitation should appear in pending list

  @REQ-SET-TEAM-003
  Scenario: Role permissions
    Then roles should have these permissions:
      | Role | Permissions |
      | owner | Full access, billing, delete account |
      | admin | Manage devices, users, orders |
      | member | Read-only access |
      | buyer | Orders, invoices, store only |

  @REQ-SET-TEAM-004
  Scenario: Change member role
    Given user "Alice" has role "member"
    When I change Alice's role to "admin"
    Then Alice should have admin permissions
    And audit log should record the change

  @REQ-SET-TEAM-005
  Scenario: Remove member access
    Given user "Bob" has access
    When I click "Remove" on Bob's row
    And I confirm removal
    Then Bob's AccountAccess should be deleted
    And Bob should no longer see this account
    And Bob should keep access to other accounts (if any)

  @REQ-SET-TEAM-006
  Scenario: Cannot remove last owner
    Given I am the only owner
    When I try to remove myself
    Then I should see error "Cannot remove last owner"
    And I should be prompted to transfer ownership first
```

## Dependencies

- auth/clerk-provider
- database/initial-schema

## Files to Create

- `src/pages/dashboard/settings/team.astro`
- `src/components/settings/TeamMemberList.tsx`
- `src/components/settings/InviteMemberModal.tsx`
- `src/components/settings/RoleSelector.tsx`
- `src/components/settings/PendingInvitations.tsx`

## References

- PRD.md Section 9: Settings & Configuration
- PRD.md: Platform Roles
