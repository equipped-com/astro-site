# Task: Plaid Bank Verification

## Description

Integrate Plaid for secure bank account verification during leasing applications. Alternative to manual bank statement upload.

## Acceptance Criteria

- [ ] Plaid Link integration in checkout
- [ ] Secure OAuth flow for bank connection
- [ ] Retrieve and store bank verification token
- [ ] Pass verification to Macquarie
- [ ] Handle connection errors gracefully

## Test Criteria

```gherkin
Feature: Plaid Bank Verification
  As a customer applying for leasing
  I want to connect my bank via Plaid
  So that verification is fast and secure

  @REQ-INT-PLAID-001
  Scenario: Open Plaid Link
    Given I am on checkout Stage 4 (Payment)
    And I select "Connect with Plaid"
    When I click the connect button
    Then Plaid Link modal should open
    And I should see bank selection interface

  @REQ-INT-PLAID-002
  Scenario: Complete bank connection
    When I select my bank
    And I authenticate with my bank credentials
    Then Plaid should return a public_token
    And we should exchange it for access_token
    And bank verification should be marked complete

  @REQ-INT-PLAID-003
  Scenario: Bank connection error
    When bank connection fails
    Then I should see error message
    And I should be able to retry
    And I should see "Upload bank statements" fallback option

  @REQ-INT-PLAID-004
  Scenario: Data shared with Macquarie
    Given bank connection is successful
    When lease application is submitted
    Then Plaid verification data should be included
    And sensitive data should be tokenized
```

## Implementation

```typescript
// src/components/checkout/PlaidConnect.tsx
import { usePlaidLink } from 'react-plaid-link'

export function PlaidConnect({ onSuccess, onError }) {
  const { open, ready } = usePlaidLink({
    token: linkToken, // From /api/plaid/link-token
    onSuccess: (publicToken, metadata) => {
      // Exchange public token for access token
      fetch('/api/plaid/exchange', {
        method: 'POST',
        body: JSON.stringify({ publicToken }),
      }).then(onSuccess)
    },
    onExit: (err) => {
      if (err) onError(err)
    },
  })

  return (
    <button onClick={() => open()} disabled={!ready}>
      Connect with Plaid
    </button>
  )
}
```

## Environment Variables

```
PLAID_CLIENT_ID=xxx
PLAID_SECRET=xxx
PLAID_ENV=sandbox  # or production
```

## Files to Create

- `src/components/checkout/PlaidConnect.tsx`
- `src/api/plaid/link-token.ts`
- `src/api/plaid/exchange.ts`
- `src/integrations/plaid/client.ts`

## References

- documentation/platform-checkout.md Stage 4
- documentation/platform-leasing.md
