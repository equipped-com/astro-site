# Task: Macquarie Leasing Integration

## Description

Integrate with Macquarie for equipment leasing applications, approval workflows, agreement management, and recurring payment processing.

## Acceptance Criteria

- [ ] Submit lease applications via API
- [ ] Receive approval/decline webhooks
- [ ] Store lease agreements and terms
- [ ] Track payment schedules
- [ ] Handle decline fallback to card payment

## Test Criteria

```gherkin
Feature: Macquarie Leasing Integration
  As the platform
  I want to integrate with Macquarie
  So that customers can finance equipment purchases

  @REQ-INT-MACQ-001
  Scenario: Submit lease application
    Given customer has completed company info form
    And bank verification is complete
    When checkout submits leasing application
    Then application should be sent to Macquarie API
    And application should include:
      | Data |
      | Company legal name, EIN |
      | Contact name, email |
      | Equipment list with values |
      | Requested term (24/36 months) |

  @REQ-INT-MACQ-002
  Scenario: Receive approval webhook
    Given application was submitted
    When Macquarie approves the application
    Then webhook should be received at /api/webhooks/macquarie
    And lease_applications status should update to "approved"
    And lease_agreement record should be created
    And customer should be notified

  @REQ-INT-MACQ-003
  Scenario: Receive decline webhook
    When Macquarie declines the application
    Then lease_applications status should update to "declined"
    And decision_reason should be stored
    And customer should be prompted for alternative payment

  @REQ-INT-MACQ-004
  Scenario: Payment schedule setup
    Given lease agreement is signed
    Then monthly payment schedule should be created
    And first payment date should be set
    And recurring payments should be tracked

  @REQ-INT-MACQ-005
  Scenario: Payment status webhook
    When monthly payment is processed
    Then lease_payments record should be updated
    And customer should receive payment confirmation
```

## API Endpoints

```typescript
// Macquarie API (external)
POST /api/applications      // Submit application
GET  /api/applications/:id  // Check status
POST /api/agreements        // Create agreement
GET  /api/agreements/:id    // Get agreement details

// Our webhook handlers
POST /api/webhooks/macquarie/application-status
POST /api/webhooks/macquarie/payment-status
```

## Environment Variables

```
MACQUARIE_API_URL=https://api.macquarie.com/leasing
MACQUARIE_API_KEY=xxx
MACQUARIE_WEBHOOK_SECRET=xxx
```

## Files to Create

- `src/integrations/macquarie/client.ts`
- `src/integrations/macquarie/types.ts`
- `src/api/webhooks/macquarie.ts`
- `src/lib/leasing-service.ts`

## References

- documentation/platform-leasing.md
- PRD.md Section 2: Commerce & Purchasing
