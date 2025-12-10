# Task: Invitation UI Components

## Description

Create React components for sending, viewing, and managing team invitations in the Settings > Team section. Includes invitation list, send invitation modal, and pending invitation management.

## Acceptance Criteria

- [ ] InviteTeamMemberButton component
- [ ] InviteTeamMemberDialog component with form validation
- [ ] InvitationsList component showing pending/accepted/declined/revoked/expired status
- [ ] Revoke invitation button for pending invites
- [ ] Resend invitation functionality
- [ ] Role selector dropdown
- [ ] Real-time status updates
- [ ] Empty state for no pending invitations

## Test Criteria

```gherkin
Feature: Invitation UI Components
  As an account admin
  I want to manage invitations via UI
  So that I can control team access easily

  @REQ-UI-001 @Dialog
  Scenario: Open invite dialog
    Given I am on the Team settings page
    When I click "Invite Team Member"
    Then I should see the invitation dialog
    And I should see fields for:
      | Field | Type     |
      | Email | Input    |
      | Role  | Dropdown |

  @REQ-UI-002 @Validation
  Scenario: Email validation
    Given the invite dialog is open
    When I enter invalid email "notanemail"
    And I click "Send Invitation"
    Then I should see error "Please enter a valid email address"

  @REQ-UI-003 @Submit
  Scenario: Send invitation
    Given the invite dialog is open
    When I enter email "alice@example.com"
    And I select role "Admin"
    And I click "Send Invitation"
    Then the invitation should be created
    And I should see success message "Invitation sent to alice@example.com"
    And the dialog should close
    And the invitation should appear in the pending list

  @REQ-UI-004 @List
  Scenario: View pending invitations
    Given there are 3 pending invitations
    When I view the Team page
    Then I should see all 3 invitations with:
      | Field      | Visible |
      | Email      | Yes     |
      | Role       | Yes     |
      | Sent date  | Yes     |
      | Status     | Yes     |
      | Actions    | Yes     |

  @REQ-UI-005 @Revoke
  Scenario: Revoke pending invitation
    Given a pending invitation exists for "pending@example.com"
    When I click "Revoke" next to the invitation
    And I confirm the action
    Then the invitation status should change to "Revoked"
    And the invitation should be removed from pending list

  @REQ-UI-006 @Resend
  Scenario: Resend invitation
    Given a pending invitation exists for "alice@example.com"
    When I click "Resend" next to the invitation
    Then a new invitation email should be sent
    And I should see success message "Invitation resent"

  @REQ-UI-007 @EmptyState
  Scenario: Empty state
    Given there are no pending invitations
    When I view the Team page
    Then I should see "No pending invitations"
    And I should see "Invite Team Member" CTA
```

## Dependencies

- invitations/invitation-api (API endpoints must exist)
- settings/team-access (Team settings page must exist)

## Components to Create

### InviteTeamMemberButton
```tsx
// Button that opens the invite dialog
<Button onClick={openDialog}>Invite Team Member</Button>
```

### InviteTeamMemberDialog
```tsx
// Modal with form for email and role selection
interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

### InvitationsList
```tsx
// List of all invitations with status badges
interface Invitation {
  id: string;
  email: string;
  role: string;
  sent_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';
}
```

### InvitationRow
```tsx
// Single invitation row with actions
<InvitationRow
  invitation={invitation}
  onRevoke={handleRevoke}
  onResend={handleResend}
/>
```

## Files to Create

- `src/components/settings/InviteTeamMemberButton.tsx`
- `src/components/settings/InviteTeamMemberDialog.tsx`
- `src/components/settings/InvitationsList.tsx`
- `src/components/settings/InvitationRow.tsx`

## Files to Modify

- `src/pages/dashboard/settings/team.astro` - Add invitation components

## References

- PRD.md Section 3: Identity & Onboarding (REQ-ID-005 to REQ-ID-008)
- PRD.md Section 9: Settings & Configuration
