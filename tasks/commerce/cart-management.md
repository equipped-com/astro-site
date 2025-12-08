# Task: Shopping Cart Management

## Description

Implement shopping cart functionality with real-time pricing, payment method selection (buy vs lease), and proposal sharing for B2B workflows.

## Acceptance Criteria

- [ ] Add/remove items from cart
- [ ] Update quantities
- [ ] Payment method toggle (Buy / 24-month / 36-month)
- [ ] Real-time price recalculation
- [ ] Promo/discount code application
- [ ] "Share cart" and "Share as proposal" options
- [ ] Cart persistence (localStorage + API sync)
- [ ] Cart summary sidebar

## Test Criteria

```gherkin
Feature: Shopping Cart
  As a buyer
  I want to manage my cart with flexible payment options
  So that I can compare costs and share with stakeholders

  @REQ-COM-CART-001
  Scenario: Add product to cart
    Given I am viewing "MacBook Air M2"
    When I click "Add to cart"
    Then the item should appear in cart
    And cart count badge should update
    And I should see a confirmation toast

  @REQ-COM-CART-002
  Scenario: Toggle payment method
    Given I have "MacBook Air M2" ($1,199) in cart
    When I select "Buy" payment method
    Then I should see total "$1,199.00"
    And monthly price should be hidden
    When I select "24-month"
    Then I should see monthly "$32.47/mo"
    And total should show "$1,199.00 value"
    When I select "36-month"
    Then monthly should decrease
    And total lease cost should be visible

  @REQ-COM-CART-003
  Scenario: Real-time cart calculations
    Given cart has items totaling $2,798.00
    When I view cart summary
    Then I should see:
      | Line | Amount |
      | Subtotal | $2,798.00 |
      | Shipping | Calculated at checkout |
      | Taxes | Calculated at checkout |
      | Monthly | $76.94/mo (if leasing) |

  @REQ-COM-CART-004
  Scenario: Apply promo code
    Given I have items in cart
    When I enter promo code "FIRST10"
    And I click "Apply"
    Then I should see discount applied
    And subtotal should reflect discount
    And monthly payment should recalculate

  @REQ-COM-CART-005
  Scenario: Share cart as proposal
    Given I have items in cart
    When I click "Share as proposal"
    Then I should be prompted for recipient details
    When I enter "client@company.com" and click send
    Then a proposal should be created
    And recipient should receive email with proposal link

  @REQ-COM-CART-006
  Scenario: Cart persistence
    Given I add items to cart
    When I close the browser
    And I return to the site
    Then my cart should still contain the items
    And payment method selection should persist

  @REQ-COM-CART-007
  Scenario: Empty cart state
    Given my cart is empty
    When I view the cart
    Then I should see "Your cart is empty"
    And I should see "Start shopping" CTA
```

## Dependencies

- database/initial-schema
- integrations/shopify-api (product data)

## Cart Data Structure

```typescript
interface Cart {
  id: string
  accountId: string
  userId: string
  paymentMethod: 'buy' | '24-month' | '36-month'
  items: CartItem[]
  promoCode?: string
  promoDiscount?: number
  subtotal: number
  monthlyTotal?: number
  createdAt: Date
  updatedAt: Date
}

interface CartItem {
  id: string
  productSku: string
  productName: string
  productImage: string
  specs: Record<string, string>
  quantity: number
  unitPrice: number
  monthlyPrice24?: number
  monthlyPrice36?: number
}
```

## Files to Create

- `src/components/cart/Cart.tsx`
- `src/components/cart/CartItem.tsx`
- `src/components/cart/CartSummary.tsx`
- `src/components/cart/PaymentMethodToggle.tsx`
- `src/components/cart/PromoCodeInput.tsx`
- `src/lib/cart-storage.ts`
- `src/api/cart.ts`

## References

- documentation/platform-cart.md
- PRD.md Section 2: Commerce & Purchasing
