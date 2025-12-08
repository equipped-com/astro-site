# Task: Organization Settings

## Description

Allow account owners/admins to manage organization profile, billing information, and platform integrations.

## Acceptance Criteria

- [ ] Organization profile (name, logo, address)
- [ ] Billing email configuration
- [ ] SSO settings (Google Workspace, Okta)
- [ ] Integration connections (MDM, Google, etc.)
- [ ] Danger zone (delete account)

## Test Criteria

```gherkin
Feature: Organization Settings
  As an account owner
  I want to configure my organization settings
  So that Equipped works correctly for my team

  @REQ-SET-001
  Scenario: Update organization profile
    Given I am an account owner
    When I navigate to Settings > Organization
    Then I should be able to update:
      | Field | Type |
      | Company name | Text |
      | Logo | Image upload |
      | Billing email | Email |
      | Address | Address autocomplete |

  @REQ-SET-002
  Scenario: Configure SSO
    When I navigate to Settings > Security
    Then I should see SSO options:
      | Provider | Status |
      | Google Workspace | Available |
      | Microsoft Azure AD | Available |
      | Okta | Coming soon |
    When I connect Google Workspace
    Then users can sign in with Google
    And user directory can be synced

  @REQ-SET-003
  Scenario: Manage integrations
    When I navigate to Settings > Integrations
    Then I should see available integrations:
      | Integration | Purpose |
      | Google Workspace | SSO + Directory sync |
      | Addigy | MDM device sync |
      | Slack | Support channel |
    And I should be able to connect/disconnect each

  @REQ-SET-004
  Scenario: View billing
    When I navigate to Settings > Billing
    Then I should see:
      | Section |
      | Current plan |
      | Payment method on file |
      | Billing history |
      | Usage (devices, users) |
    And I should be able to update payment method
    And I should be able to download invoices

  @REQ-SET-005
  Scenario: Delete account (owner only)
    Given I am the account owner
    When I navigate to Settings > Danger Zone
    Then I should see "Delete Account" option
    When I click delete
    Then I should confirm by typing account name
    And all data should be scheduled for deletion
```

## Dependencies

- auth/clerk-provider
- database/initial-schema

## Files to Create

- `src/pages/dashboard/settings/index.astro`
- `src/pages/dashboard/settings/organization.astro`
- `src/pages/dashboard/settings/security.astro`
- `src/pages/dashboard/settings/integrations.astro`
- `src/pages/dashboard/settings/billing.astro`
- `src/components/settings/OrganizationForm.tsx`
- `src/components/settings/SSOConfig.tsx`
- `src/components/settings/IntegrationList.tsx`

## References

- PRD.md Section 9: Settings & Configuration
- documentation/platform-account-settings.md
