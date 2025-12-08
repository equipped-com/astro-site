# Task: User Profile Endpoints

## Description

Create API endpoints for user profile and account access management. Users can belong to multiple accounts (consultant pattern), and these endpoints handle their profile data and account context.

## Acceptance Criteria

- [ ] `GET /api/user` - Get current user profile with accounts
- [ ] `PUT /api/user` - Update user profile fields
- [ ] `GET /api/user/accounts` - List user's account memberships
- [ ] `POST /api/user/accounts/:id/switch` - Switch active account context
- [ ] Returns user data from D1 (synced via webhook)
- [ ] Requires authentication

## Test Criteria

```gherkin
Feature: User Profile API
  As a platform user
  I want to manage my profile and account access
  So that I can work across multiple organizations

  Background:
    Given I am authenticated as user "user_123"
    And user "user_123" has profile:
      | Field | Value |
      | email | alice@consultant.com |
      | first_name | Alice |
      | last_name | Smith |

  @REQ-USER-001
  Scenario: Get user profile
    When I GET "/api/user"
    Then response status should be 200
    And response should contain:
      | Field | Value |
      | id | user_123 |
      | email | alice@consultant.com |
      | first_name | Alice |

  @REQ-USER-002
  Scenario: Update profile fields
    When I PUT to "/api/user" with:
      | Field | Value |
      | first_name | Alicia |
      | phone | +1-555-1234 |
    Then response status should be 200
    And user first_name should be "Alicia"
    And user phone should be "+1-555-1234"

  @REQ-USER-003
  Scenario: Cannot update protected fields
    When I PUT to "/api/user" with:
      | Field | Value |
      | id | user_hacked |
      | email | hacker@evil.com |
    Then response status should be 200
    And user id should still be "user_123"
    And user email should still be "alice@consultant.com"

  @REQ-USER-004
  Scenario: List account memberships
    Given user "user_123" has account access:
      | account_name | role |
      | Acme Corp | admin |
      | Beta Inc | member |
    When I GET "/api/user/accounts"
    Then response status should be 200
    And response should contain 2 accounts
    And accounts should include:
      | name | role |
      | Acme Corp | admin |
      | Beta Inc | member |

  @REQ-USER-005
  Scenario: Switch active account
    Given user "user_123" has access to account "acc_beta"
    When I POST to "/api/user/accounts/acc_beta/switch"
    Then response status should be 200
    And session context should be account "acc_beta"
    And subsequent requests should use account "acc_beta"

  @REQ-USER-006
  Scenario: Cannot switch to unauthorized account
    Given user "user_123" does NOT have access to account "acc_secret"
    When I POST to "/api/user/accounts/acc_secret/switch"
    Then response status should be 403
    And response should contain "Access denied"
```

## Dependencies

- api/auth-middleware
- api/clerk-webhook
- database/run-migrations

## Files to Create

- `src/api/routes/user.ts`

## API Specification

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/user` | - | `{ user: User, accounts: AccountAccess[] }` |
| PUT | `/api/user` | `{ first_name?, last_name?, phone? }` | `{ user: User }` |
| GET | `/api/user/accounts` | - | `{ accounts: AccountWithRole[] }` |
| POST | `/api/user/accounts/:id/switch` | - | `{ success: true, account: Account }` |

## Implementation

```typescript
// src/api/routes/user.ts
import { Hono } from 'hono'
import { getAuth } from '@hono/clerk-auth'
import { setCookie } from 'hono/cookie'

const user = new Hono<{ Bindings: Env }>()

user.get('/', async (c) => {
  const auth = getAuth(c)
  const userId = auth!.userId

  const result = await c.env.DB.prepare(`
    SELECT u.*, json_group_array(json_object(
      'account_id', aa.account_id,
      'role', aa.role,
      'account_name', a.name
    )) as accounts
    FROM users u
    LEFT JOIN account_access aa ON u.id = aa.user_id
    LEFT JOIN accounts a ON aa.account_id = a.id
    WHERE u.id = ? AND u.deleted_at IS NULL
    GROUP BY u.id
  `).bind(userId).first()

  if (!result) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({
    user: {
      id: result.id,
      email: result.email,
      first_name: result.first_name,
      last_name: result.last_name,
      phone: result.phone,
    },
    accounts: JSON.parse(result.accounts as string).filter((a: { account_id: string | null }) => a.account_id)
  })
})

user.put('/', async (c) => {
  const auth = getAuth(c)
  const userId = auth!.userId
  const body = await c.req.json()

  // Only allow updating safe fields
  const allowedFields = ['first_name', 'last_name', 'phone']
  const updates: string[] = ['updated_at = CURRENT_TIMESTAMP']
  const params: unknown[] = []

  for (const [key, value] of Object.entries(body)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updates.push(`${key} = ?`)
      params.push(value)
    }
  }

  if (updates.length > 1) {
    await c.env.DB.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params, userId).run()
  }

  const updated = await c.env.DB.prepare(
    'SELECT id, email, first_name, last_name, phone FROM users WHERE id = ?'
  ).bind(userId).first()

  return c.json({ user: updated })
})

user.get('/accounts', async (c) => {
  const auth = getAuth(c)
  const userId = auth!.userId

  const result = await c.env.DB.prepare(`
    SELECT a.*, aa.role
    FROM accounts a
    JOIN account_access aa ON a.id = aa.account_id
    WHERE aa.user_id = ? AND a.deleted_at IS NULL
    ORDER BY a.name
  `).bind(userId).all()

  return c.json({ accounts: result.results })
})

user.post('/accounts/:id/switch', async (c) => {
  const auth = getAuth(c)
  const userId = auth!.userId
  const accountId = c.req.param('id')

  // Verify user has access to this account
  const access = await c.env.DB.prepare(`
    SELECT aa.role, a.name, a.short_name
    FROM account_access aa
    JOIN accounts a ON aa.account_id = a.id
    WHERE aa.user_id = ? AND aa.account_id = ?
  `).bind(userId, accountId).first()

  if (!access) {
    return c.json({ error: 'Access denied' }, 403)
  }

  // Set account context cookie for subsequent requests
  setCookie(c, 'equipped_account', accountId, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return c.json({
    success: true,
    account: {
      id: accountId,
      name: access.name,
      short_name: access.short_name,
      role: access.role,
    }
  })
})

export default user
```

## References

- PRD.md Section 5: User Authentication (Consultant Pattern)
- documentation/platform-authentication.md
- [Clerk User Object](https://clerk.com/docs/references/javascript/user/user)
