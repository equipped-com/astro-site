# Task: Checkout Stage 4 - Payment / Leasing

## Description

Implement the fourth and final stage of checkout: "Apply for leasing & place your order." This is the critical junction where users choose between leasing (Macquarie financing) or upfront card payment.

## Acceptance Criteria

- [ ] Leasing option as default/primary (24-month or 36-month)
- [ ] Card payment as alternative
- [ ] Company information form for leasing
- [ ] Bank verification via Plaid OR manual upload
- [ ] Leasing guarantee messages displayed
- [ ] Monthly payment breakdown visible
- [ ] "Apply & place order" final CTA

## Test Criteria

```gherkin
Feature: Checkout Stage 4 - Payment Selection
  As a buyer
  I want to choose how to pay for my equipment
  So that I can manage my cash flow appropriately

  Background:
    Given I have completed Stage 3 (Delivery)
    And I am on the Payment stage
    And cart total is "$1,199.00"

  @REQ-COM-PAY-001
  Scenario: Leasing selected by default
    Then "24-Month Leasing" should be selected by default
    And I should see monthly payment "$32.47/mo"
    And I should see buyout amount "Return or buy it out for $419 after 24 mo"
    And I should see Macquarie guarantee messages

  @REQ-COM-PAY-002
  Scenario: Leasing guarantee messages
    Then I should see the following guarantees:
      | Message |
      | Your leasing agreement will be financed by Macquarie |
      | The approval process usually takes 1-2 business days |
      | We'll process your order once you've signed their agreement digitally |
      | Applying won't affect your business credit score |

  @REQ-COM-PAY-003
  Scenario: Complete leasing application with Plaid
    Given I have filled company information
    When I select "Connect with Plaid"
    And I complete Plaid bank connection
    And I click "Apply & place order"
    Then a lease application should be created
    And order status should be "Pending leasing approval"
    And I should see confirmation page

  @REQ-COM-PAY-004
  Scenario: Complete leasing application with bank statements
    Given I have filled company information
    When I select "Upload bank statements"
    And I upload "March 2023.pdf", "April 2023.pdf", "May 2023.pdf"
    And I click "Apply & place order"
    Then files should be stored securely
    And lease application should include document references

  @REQ-COM-PAY-005
  Scenario: Company information form validation
    When I leave required fields empty
    And I click "Apply & place order"
    Then I should see validation errors for:
      | Field |
      | Company legal name |
      | EIN |
      | Contact name |
      | Contact email |
      | Registered business address |

  @REQ-COM-PAY-006
  Scenario: Switch to card payment
    When I select "Pay with card"
    Then the form should change to card payment
    And I should see Stripe payment element
    And monthly breakdown should be hidden
    And CTA should change to "Place order"

  @REQ-COM-PAY-007
  Scenario: 36-month lease option
    When I select "36-Month Leasing"
    Then monthly payment should decrease
    And buyout amount should increase
    And total cost over term should increase
```

## Dependencies

- commerce/checkout-delivery
- integrations/macquarie-leasing
- integrations/plaid-verification
- integrations/stripe-payments

## Company Information Form

```
┌─────────────────────────────────────────┐
│ Company legal name *                    │
│ [Acme Corporation                     ] │
│                                         │
│ EIN *                                   │
│ [12-3456789                           ] │
│                                         │
│ Contact name *                          │
│ [John Smith                           ] │
│                                         │
│ Contact email *                         │
│ [john@acme.com                        ] │
│                                         │
│ Registered business address *           │
│ [123 Main St, Suite 100               ] │
│ [San Francisco, CA 94102, USA         ] │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│ Bank Verification                       │
│ ┌─────────────┐ ┌─────────────────────┐ │
│ │ Connect     │ │ Upload bank         │ │
│ │ with Plaid  │ │ statements          │ │
│ └─────────────┘ └─────────────────────┘ │
│                                         │
│          [Apply & place order]          │
└─────────────────────────────────────────┘
```

## Files to Create

- `src/components/checkout/PaymentStage.tsx`
- `src/components/checkout/LeasingForm.tsx`
- `src/components/checkout/CompanyInfoForm.tsx`
- `src/components/checkout/BankVerification.tsx`
- `src/components/checkout/PlaidConnect.tsx`
- `src/components/checkout/BankStatementUpload.tsx`
- `src/components/checkout/CardPaymentForm.tsx`

## References

- documentation/platform-checkout.md Stage 4: Leasing
- documentation/platform-leasing.md
- PRD.md Section 2: Commerce & Purchasing
