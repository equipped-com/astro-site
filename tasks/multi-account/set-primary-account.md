# Task: Set Primary Account

## Description

Allow users to set their preferred/default account, which determines which account they land on after login. Updates the `users.primary_account_id` field.

## Acceptance Criteria

- [ ] `PUT /api/users/me/primary-account` - Set primary account
- [ ] Validates user has access to the specified account
- [ ] Updates `users.primary_account_id` in database
- [ ] Returns updated user profile
- [ ] UI in user settings to select primary account
- [ ] Clerk redirects to primary account subdomain after login

## Test Criteria

```gherkin
Feature: Set Primary Account
  As a user with multiple accounts
  I want to set my default account
  So that I land on the right account after login

  @REQ-API-001 @Update
  Scenario: Set primary account
    Given I am logged in as "alice@example.com"
    And I have access to "Acme Corp" and "Beta Inc"
    And my current primary is "Acme Corp"
    When I PUT "/api/users/me/primary-account" with:
      | account_id | acc_betainc |
    Then the response status should be 200
    And users.primary_account_id should be "acc_betainc"
    And my next login should default to "betainc.tryequipped.com"

  @REQ-API-002 @Validation
  Scenario: Cannot set primary to account without access
    Given I am logged in as "alice@example.com"
    And I do NOT have access to "Client Co"
    When I PUT "/api/users/me/primary-account" with:
      | account_id | acc_clientco |
    Then the response status should be 403
    And the error should be "You do not have access to this account"

  @REQ-API-003 @Login
  Scenario: Login redirects to primary account
    Given my primary account is "Beta Inc" (betainc.tryequipped.com)
    When I complete login at tryequipped.com
    Then I should be redirected to "betainc.tryequipped.com"
    And the tenant context should be "Beta Inc"

  @REQ-UI-004 @Settings
  Scenario: Select primary account in settings
    Given I am on the user settings page
    And I have access to multiple accounts
    When I view the "Default Account" section
    Then I should see a dropdown with all my accounts
    And my current primary should be selected
    When I select "Beta Inc"
    And I click "Save"
    Then my primary account should update
    And I should see success message
```

## Dependencies

- multi-account/account-list-api (to fetch accessible accounts)
- api/user-endpoints (for user profile updates)

## API Specification

### PUT /api/users/me/primary-account

**Headers:**
```
Authorization: Bearer {clerk_session_token}
Content-Type: application/json
```

**Request:**
```json
{
  "account_id": "acc_123"
}
```

**Response 200:**
```json
{
  "user": {
    "id": "user_123",
    "email": "alice@example.com",
    "primary_account_id": "acc_123"
  }
}
```

**Response 403:**
```json
{
  "error": "You do not have access to this account"
}
```

## Database Update

```sql
UPDATE users
SET primary_account_id = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?
```

## Clerk Integration

After updating primary account, may need to update Clerk user metadata:
```typescript
await clerkClient.users.updateUser(userId, {
  publicMetadata: {
    primary_account_id: accountId
  }
});
```

## UI Component

```tsx
// In user settings page
<Select
  label="Default Account"
  value={user.primary_account_id}
  onChange={handleSetPrimary}
>
  {accounts.map(account => (
    <option key={account.id} value={account.id}>
      {account.name} ({account.role})
    </option>
  ))}
</Select>
```

## Files to Create

- `src/api/users/primary-account.ts` - API endpoint

## Files to Modify

- `src/pages/dashboard/settings/profile.astro` - Add primary account selector
- `src/api/users.ts` - Add primary account route

## References

- PRD.md Section 3: Identity & Onboarding (REQ-ID-012)
- PRD.md: Consultant Pattern
