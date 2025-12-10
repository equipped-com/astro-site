# Fix: Checkout & Cart Tests

## Priority: HIGH

## Failure Count: 22 tests

## Affected Files

| File | Failures | Description |
|------|----------|-------------|
| `src/components/checkout/AddressForm.test.tsx` | 8 | Address form validation tests |
| `src/components/checkout/AddressForm.regression.test.tsx` | 7 | Address form regression tests |
| `src/components/cart/Cart.test.tsx` | 5 | Cart component tests |
| `src/lib/cart-context.regression.test.tsx` | 2 | Cart context regression tests |

## Problem

Checkout and cart component tests are failing. Key issues likely include:
- Phone number formatting on blur not working as expected
- Validation error display timing
- Email/zip code format validation
- Cart state management

## Investigation Steps

1. Run AddressForm tests with verbose output:
   ```bash
   bun run test -- src/components/checkout/AddressForm.test.tsx
   ```

2. Check `formatPhoneNumber` in `src/lib/address-validation.ts`
3. Check validation callback timing in AddressForm component
4. Review cart context for state update issues

## Known Issues

From test output:
- `should format phone number on blur` - formatting not applied correctly
- `should show validation errors after field is touched` - timing issue
- `should validate email format` - validation error not displayed

## Acceptance Criteria

```gherkin
Feature: Checkout Tests

  Scenario: Address form validation works
    Given a user is filling out the address form
    When they blur a field with invalid data
    Then validation errors should display

  Scenario: Phone number formatting
    Given a user enters a 10-digit phone number
    When they blur the phone field
    Then the number should be formatted as (XXX) XXX-XXXX
```

## Complexity: medium

Form validation and state management fixes.
