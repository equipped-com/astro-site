# Task: Create B2B Proposal

## Description

Allow users to create proposals from cart items for B2B approval workflows. Proposals can be shared via email link with external stakeholders who can approve and convert to orders.

## Acceptance Criteria

- [ ] "Share as proposal" option in cart
- [ ] Proposal creation with title and notes
- [ ] Recipient email entry
- [ ] Expiration date setting
- [ ] Unique share link generation
- [ ] Email notification to recipient

## Test Criteria

```gherkin
Feature: Create B2B Proposal
  As a buyer
  I want to create proposals from my cart
  So that stakeholders can approve purchases

  @REQ-PROP-001
  Scenario: Create proposal from cart
    Given I have items in my cart
    When I click "Share as proposal"
    Then I should see proposal creation form
    And I should enter:
      | Field | Required |
      | Title | Yes |
      | Recipient name | Yes |
      | Recipient email | Yes |
      | Expiration date | No (default 30 days) |
      | Notes | No |

  @REQ-PROP-002
  Scenario: Generate share link
    When I create a proposal
    Then a unique share_token should be generated
    And the share link should be:
      | Format | proposals.tryequipped.com/{share_token} |
    And the link should be copyable

  @REQ-PROP-003
  Scenario: Send proposal email
    When I click "Send proposal"
    Then an email should be sent to recipient
    And email should include:
      | Content |
      | Proposal title |
      | Your name and company |
      | Item summary |
      | Total value |
      | "View Proposal" CTA link |
      | Expiration date |

  @REQ-PROP-004
  Scenario: Proposal with multiple items
    Given cart has MacBook ($1,199) and iPad ($799)
    When I create a proposal
    Then proposal should include both items
    And subtotal should be $1,998
    And monthly options should be shown

  @REQ-PROP-005
  Scenario: Set proposal expiration
    When I set expiration to "2 weeks"
    Then expires_at should be set to 14 days from now
    And recipient should see expiration warning after 7 days
```

## Dependencies

- commerce/cart-management
- database/initial-schema

## Files to Create

- `src/components/proposals/CreateProposalModal.tsx`
- `src/components/proposals/ProposalForm.tsx`
- `src/lib/proposal-tokens.ts`
- `src/api/proposals.ts`

## References

- documentation/platform-proposals.md
- PRD.md Section 2: Commerce & Purchasing
