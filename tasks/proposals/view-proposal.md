# Task: View and Approve Proposal

## Description

Public proposal view page for recipients to review items, see pricing, and approve/decline proposals. Approved proposals convert to checkout flow.

## Acceptance Criteria

- [ ] Public page accessible via share link (no auth required)
- [ ] Read-only view of proposal items
- [ ] Pricing breakdown (buy vs lease options)
- [ ] Sender information displayed
- [ ] Approve and Decline buttons
- [ ] Convert to order on approval

## Test Criteria

```gherkin
Feature: View and Approve Proposal
  As a proposal recipient
  I want to review and approve proposals
  So that I can authorize equipment purchases

  Background:
    Given a proposal exists with share_token "abc123"
    And I access "proposals.tryequipped.com/abc123"

  @REQ-PROP-006
  Scenario: View proposal without login
    Then I should see proposal details without authentication
    And I should see:
      | Section |
      | Proposal title |
      | From: [sender name, company] |
      | Items with specs and pricing |
      | Subtotal |
      | Monthly payment options |
      | Notes from sender |
      | Expiration date |

  @REQ-PROP-007
  Scenario: Approve proposal
    When I click "Approve"
    Then I should be prompted to sign in or create account
    When I complete authentication
    Then proposal status should change to "approved"
    And I should be redirected to checkout with items pre-filled
    And sender should receive approval notification

  @REQ-PROP-008
  Scenario: Decline proposal
    When I click "Decline"
    And I optionally enter a reason
    Then proposal status should change to "declined"
    And sender should receive decline notification
    And I should see confirmation message

  @REQ-PROP-009
  Scenario: Expired proposal
    Given proposal has expired
    When I access the share link
    Then I should see "This proposal has expired"
    And approve/decline buttons should be disabled
    And I should see option to "Request new proposal"

  @REQ-PROP-010
  Scenario: Track proposal views
    When recipient opens proposal link
    Then status should change from "sent" to "viewed"
    And sender should receive view notification
    And viewed_at timestamp should be recorded
```

## Dependencies

- proposals/create-proposal
- auth/clerk-provider

## Files to Create

- `src/pages/proposals/[token].astro`
- `src/components/proposals/PublicProposalView.tsx`
- `src/components/proposals/ProposalItems.tsx`
- `src/components/proposals/ApprovalButtons.tsx`

## References

- documentation/platform-proposals.md
- PRD.md Section 2: Commerce & Purchasing
