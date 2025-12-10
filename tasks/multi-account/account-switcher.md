# Task: Account Switcher Component

## Description

Create a dropdown component in the dashboard navigation that allows users with access to multiple accounts to switch between them. Displays all accessible accounts with current account highlighted.

## Acceptance Criteria

- [ ] AccountSwitcher component in dashboard header
- [ ] Shows current account name and logo
- [ ] Dropdown lists all accounts user has access to
- [ ] Each account shows: name, role, and logo
- [ ] Current account is highlighted/checked
- [ ] Clicking account triggers subdomain navigation
- [ ] Loading state while switching
- [ ] Empty state if user has only one account (hide switcher)

## Test Criteria

```gherkin
Feature: Account Switcher Component
  As a consultant with multiple client accounts
  I want to switch between accounts easily
  So that I can manage multiple organizations

  @REQ-SWITCH-001 @Display
  Scenario: Display current account
    Given I am logged into "Acme Corp"
    When I view the dashboard header
    Then I should see "Acme Corp" in the account switcher
    And I should see the account logo (if available)

  @REQ-SWITCH-002 @Dropdown
  Scenario: View accessible accounts
    Given I have access to:
      | Account       | Role   |
      | Acme Corp     | Owner  |
      | Beta Inc      | Admin  |
      | Client Co     | Member |
    And my current account is "Acme Corp"
    When I click the account switcher
    Then I should see all 3 accounts listed
    And "Acme Corp" should be highlighted as current
    And each account should show my role

  @REQ-SWITCH-003 @Navigation
  Scenario: Switch to different account
    Given I am on "acmecorp.tryequipped.com"
    And I have access to "Beta Inc"
    When I click the account switcher
    And I select "Beta Inc"
    Then I should be navigated to "betainc.tryequipped.com"
    And the tenant context should switch to "Beta Inc"
    And I should see Beta Inc's data

  @REQ-SWITCH-004 @Loading
  Scenario: Loading state during switch
    Given I am switching from "Acme Corp" to "Beta Inc"
    When the navigation is in progress
    Then I should see a loading indicator
    And the switcher should be disabled

  @REQ-SWITCH-005 @SingleAccount
  Scenario: Hide switcher for single account users
    Given I only have access to "Acme Corp"
    When I view the dashboard
    Then the account switcher should not be displayed
    Or it should be disabled with no dropdown

  @REQ-SWITCH-006 @Keyboard
  Scenario: Keyboard navigation
    Given the account switcher dropdown is open
    When I use arrow keys
    Then I should be able to navigate between accounts
    When I press Enter
    Then the highlighted account should be selected
```

## Dependencies

- auth/clerk-provider (user authentication must be active)
- api/auth-middleware (to verify account access)

## Component Design

### AccountSwitcher
```tsx
interface Account {
  id: string;
  name: string;
  short_name: string;
  logo_url?: string;
  role: 'owner' | 'admin' | 'member' | 'buyer';
}

interface Props {
  currentAccount: Account;
  accounts: Account[];
  onSwitch: (account: Account) => void;
}
```

### API Integration
Fetches user's accounts from:
```typescript
GET /api/users/me/accounts
Response: Array<{
  id: string;
  name: string;
  short_name: string;
  logo_url?: string;
  role: string;
}>
```

### Switch Logic
```typescript
function switchAccount(account: Account) {
  // Navigate to new subdomain
  window.location.href = `https://${account.short_name}.tryequipped.com`;
}
```

## Files to Create

- `src/components/dashboard/AccountSwitcher.tsx` - Main component
- `src/components/dashboard/AccountSwitcherItem.tsx` - Individual account item

## Files to Modify

- `src/components/dashboard/DashboardNav.tsx` - Add AccountSwitcher to header

## Styling

Use shadcn/ui dropdown menu pattern with:
- Checkmark for current account
- Role badge for each account
- Avatar/logo display
- Hover states

## References

- PRD.md Section 3: Identity & Onboarding (REQ-ID-011)
- PRD.md: Consultant Pattern (Multi-Account Access)
