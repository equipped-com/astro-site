# Task: Create Auth Pages

## Description

Create sign-in and sign-up pages using Clerk's React components. These pages integrate with the Astro framework using React islands for interactive authentication UI.

## Acceptance Criteria

- [ ] `src/pages/sign-in.astro` created with Clerk SignIn component
- [ ] `src/pages/sign-up.astro` created with Clerk SignUp component
- [ ] Pages use BaseLayout for consistent styling
- [ ] Dark theme matches site design
- [ ] Redirect to `/dashboard` after successful auth
- [ ] Error states display correctly
- [ ] Mobile responsive design

## Test Criteria

```gherkin
Feature: Authentication Pages
  As a visitor
  I want to sign in or create an account
  So that I can access the customer dashboard

  @REQ-AUTH-PAGE-001
  Scenario: Sign-in page renders
    When I navigate to "/sign-in"
    Then I should see the Clerk sign-in form
    And the page should have title "Sign In - Equipped"
    And the form should match site styling

  @REQ-AUTH-PAGE-002
  Scenario: Sign-up page renders
    When I navigate to "/sign-up"
    Then I should see the Clerk sign-up form
    And the page should have title "Sign Up - Equipped"
    And email field should be visible

  @REQ-AUTH-PAGE-003
  Scenario: Successful sign-in redirect
    Given I am on the sign-in page
    And I have a valid account
    When I enter my credentials
    And I submit the form
    Then I should be redirected to "/dashboard"
    And I should see my account dashboard

  @REQ-AUTH-PAGE-004
  Scenario: Successful sign-up redirect
    Given I am on the sign-up page
    When I complete the registration form
    And I verify my email
    Then I should be redirected to "/dashboard"
    And account setup wizard should be shown

  @REQ-AUTH-PAGE-005
  Scenario: Invalid credentials error
    Given I am on the sign-in page
    When I enter invalid credentials
    Then I should see an error message
    And I should remain on the sign-in page

  @REQ-AUTH-PAGE-006
  Scenario: Mobile responsiveness
    Given I am on a mobile device
    When I view the sign-in page
    Then the form should be readable
    And all buttons should be tappable
    And the layout should not overflow
```

## Dependencies

- auth/install-clerk
- auth/create-clerk-app
- auth/clerk-provider

## Files to Create

- `src/pages/sign-in.astro`
- `src/pages/sign-up.astro`
- `src/components/auth/SignInComponent.tsx`
- `src/components/auth/SignUpComponent.tsx`

## Implementation

```astro
---
// src/pages/sign-in.astro
import BaseLayout from '@/layouts/BaseLayout.astro'
import SignInComponent from '@/components/auth/SignInComponent'
---
<BaseLayout title="Sign In - Equipped">
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="w-full max-w-md p-8">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold">Welcome back</h1>
        <p class="text-muted-foreground mt-2">Sign in to your account</p>
      </div>
      <SignInComponent client:load />
    </div>
  </div>
</BaseLayout>
```

```tsx
// src/components/auth/SignInComponent.tsx
import { SignIn } from '@clerk/clerk-react'

export default function SignInComponent() {
  return (
    <SignIn
      routing="path"
      path="/sign-in"
      afterSignInUrl="/dashboard"
      appearance={{
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90',
          card: 'bg-card border border-border shadow-lg',
          headerTitle: 'text-foreground',
          headerSubtitle: 'text-muted-foreground',
        }
      }}
    />
  )
}
```

```tsx
// src/components/auth/SignUpComponent.tsx
import { SignUp } from '@clerk/clerk-react'

export default function SignUpComponent() {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      afterSignUpUrl="/dashboard"
      appearance={{
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90',
          card: 'bg-card border border-border shadow-lg',
        }
      }}
    />
  )
}
```

## References

- PRD.md Section 5: User Authentication
- documentation/platform-authentication.md
- [Clerk SignIn Component](https://clerk.com/docs/components/authentication/sign-in)
- [Clerk SignUp Component](https://clerk.com/docs/components/authentication/sign-up)
- [Clerk Appearance](https://clerk.com/docs/components/customization/overview)
