# Task: Customer Impersonation

## Description

Allow sys_admins to view customer accounts as the customer would see them for support purposes. All actions are logged for audit.

## Acceptance Criteria

- [ ] "View as customer" button on customer detail
- [ ] Switch to customer's dashboard view
- [ ] Admin mode banner visible throughout
- [ ] All actions logged with admin context
- [ ] Exit impersonation easily

## Test Criteria

```gherkin
Feature: Customer Impersonation
  As an Equipped support staff
  I want to view customer accounts as they see them
  So that I can troubleshoot issues effectively

  @REQ-SA-006
  Scenario: Enter impersonation mode
    Given I am viewing customer "Acme Corp" in admin
    When I click "View as Customer"
    Then I should see Acme's dashboard
    And I should see "Admin Mode" banner at top
    And URL should indicate impersonation mode

  @REQ-SA-007
  Scenario: Admin mode banner
    When I am impersonating a customer
    Then I should see persistent banner with:
      | Element |
      | "Viewing as: Acme Corp" |
      | "Exit" button |
      | Warning about audit logging |

  @REQ-SA-008
  Scenario: Actions are logged
    When I perform any action while impersonating
    Then audit_log should record:
      | Field | Value |
      | user_id | My admin user ID |
      | account_id | Customer's account ID |
      | action | The action performed |
      | is_impersonation | true |

  @REQ-SA-009
  Scenario: Exit impersonation
    When I click "Exit" in admin banner
    Then I should return to admin dashboard
    And I should no longer be in customer context
    And customer session should be cleared

  @REQ-SA-010
  Scenario: Restricted actions while impersonating
    When I am impersonating
    Then I should NOT be able to:
      | Action |
      | Delete the account |
      | Change billing/payment |
      | Remove the owner |
    And these should show "Action restricted in admin mode"
```

## Dependencies

- sysadmin/admin-dashboard

## Files to Create

- `src/components/admin/ImpersonationBanner.tsx`
- `src/lib/impersonation.ts`
- `src/middleware/impersonation.ts`

## References

- PRD.md Section 10: Sys Admin Dashboard
