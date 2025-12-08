# Task: Sys Admin Dashboard

## Description

Internal dashboard for Equipped staff (sys_admin role) to manage all customers, view global data, and provide support. Accessible at admin.tryequipped.com.

## Acceptance Criteria

- [ ] Separate admin subdomain (admin.tryequipped.com)
- [ ] Sys_admin role check (email domain validation)
- [ ] Customer list with search/filter
- [ ] Global device view across all customers
- [ ] Global order management
- [ ] Feature flag management

## Test Criteria

```gherkin
Feature: Sys Admin Dashboard
  As an Equipped staff member
  I want to manage all customers from a central dashboard
  So that I can provide white-glove support

  Background:
    Given I am logged in with email "@tryequipped.com"
    And I have sys_admin privileges

  @REQ-SA-001
  Scenario: Access admin dashboard
    When I navigate to "admin.tryequipped.com"
    Then I should see the admin dashboard
    And I should NOT see customer account context
    And I should see global navigation

  @REQ-SA-002
  Scenario: Sys admin email domain check
    Given user has email "staff@tryequipped.com"
    Then user should have sys_admin access
    Given user has email "user@company.com"
    Then user should NOT have sys_admin access

  @REQ-SA-003
  Scenario: View all customers
    When I view customer list
    Then I should see all accounts across platform
    And I should be able to search by company name
    And I should see:
      | Column |
      | Company Name |
      | Primary Contact |
      | Device Count |
      | Last Order |
      | Created Date |

  @REQ-SA-004
  Scenario: Global device view
    When I navigate to Global > Devices
    Then I should see devices across ALL customers
    And I should be able to filter by customer
    And I should be able to export device data

  @REQ-SA-005
  Scenario: Manage feature flags
    When I navigate to Admin > Feature Flags
    Then I should see all feature flags
    And I should be able to enable/disable per account
    And changes should take effect immediately
```

## Dependencies

- multi-tenancy/subdomain-routing
- auth/clerk-provider

## Files to Create

- `src/pages/admin/index.astro`
- `src/pages/admin/customers/index.astro`
- `src/pages/admin/devices/index.astro`
- `src/pages/admin/orders/index.astro`
- `src/pages/admin/flags/index.astro`
- `src/components/admin/CustomerList.tsx`
- `src/components/admin/GlobalDeviceView.tsx`
- `src/middleware/sysadmin.ts`

## References

- PRD.md Section 10: Sys Admin Dashboard
- PRD.md: Platform Roles (sys_admin)
