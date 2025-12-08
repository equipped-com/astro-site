# Task: Upgraded API Integration

## Description

Integrate with Upgraded platform for order management, fulfillment, embedded store, and trade-in processing.

## Acceptance Criteria

- [ ] Sync product catalog from Upgraded
- [ ] Submit orders to Upgraded for fulfillment
- [ ] Receive order status webhooks
- [ ] Handle trade-in processing
- [ ] Embedded store widget support

## Test Criteria

```gherkin
Feature: Upgraded API Integration
  As the platform
  I want to integrate with Upgraded
  So that orders are fulfilled and trade-ins processed

  @REQ-INT-UPG-001
  Scenario: Sync product catalog
    When product sync job runs
    Then products should be fetched from Upgraded API
    And product data should be cached locally
    And pricing should be updated

  @REQ-INT-UPG-002
  Scenario: Submit order for fulfillment
    Given an order is placed and paid
    When order is ready for fulfillment
    Then order should be submitted to Upgraded API
    And Upgraded order ID should be stored
    And order status should be "Processing"

  @REQ-INT-UPG-003
  Scenario: Order status webhook
    When Upgraded updates order status
    Then webhook should be received
    And local order status should update
    And customer should be notified

  @REQ-INT-UPG-004
  Scenario: Trade-in submission
    Given trade-in is initiated
    When return label is requested
    Then trade-in should be submitted to Upgraded
    And return shipping label should be generated
    And tracking should be enabled

  @REQ-INT-UPG-005
  Scenario: Trade-in completion
    When Upgraded receives and inspects device
    Then webhook should update trade-in status
    And final_value should be confirmed
    And credit should be applied
```

## API Endpoints

```typescript
// Upgraded API (external)
GET  /api/products              // Catalog sync
POST /api/orders                // Submit order
GET  /api/orders/:id            // Order status
POST /api/trade-ins             // Submit trade-in
GET  /api/trade-ins/:id/label   // Get return label

// Our webhook handlers
POST /api/webhooks/upgraded/order-status
POST /api/webhooks/upgraded/trade-in-status
```

## Environment Variables

```
UPGRADED_API_URL=https://api.upgraded.com
UPGRADED_API_TOKEN=xxx
UPGRADED_WEBHOOK_TOKEN=xxx
UPGRADED_STORE_ID=xxx
```

## Files to Create

- `src/integrations/upgraded/client.ts`
- `src/integrations/upgraded/types.ts`
- `src/api/webhooks/upgraded.ts`
- `src/lib/fulfillment-service.ts`

## References

- PRD.md: External Integrations (Upgraded)
