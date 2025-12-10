# Fix: People/Onboarding Tests

## Priority: HIGH

## Failure Count: 6 tests

## Affected Files

| File | Failures | Description |
|------|----------|-------------|
| `src/components/people/OnboardingStep2.test.tsx` | 1 | Package selection step |
| `src/components/people/OnboardingStep3.test.tsx` | 2 | Delivery details step |
| `src/components/people/OnboardingWizard.test.tsx` | 3 | Full wizard flow |

## Problem

Onboarding wizard component tests are failing. Issues appear to be related to:
- Initial package selection state not preserved
- Shipping address form rendering
- Form data callback timing

## Investigation Steps

1. Run onboarding tests:
   ```bash
   bun run test -- src/components/people/
   ```

2. Check OnboardingStep2 for `initialPackage` prop handling
3. Check OnboardingStep3 for shipping form rendering
4. Review OnboardingWizard state management between steps

## Known Issues

From test output:
- `should preserve initial package selection` - Step2
- `should render shipping address form` - Step3
- `should call onContinue with delivery data when valid` - Step3

## Acceptance Criteria

```gherkin
Feature: Onboarding Tests

  Scenario: Package selection preserved
    Given a user selects a device package
    When they navigate away and back
    Then their selection should be preserved

  Scenario: Delivery form works
    Given a user is on the delivery details step
    When they fill out the shipping form
    Then they should be able to continue
```

## Complexity: medium

Component state and prop handling fixes.
