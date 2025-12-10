# Task: Google Workspace OAuth Setup

## Description

Set up Google Workspace OAuth integration to allow account owners/admins to connect their Google Workspace for employee directory sync and SSO. Implements OAuth 2.0 authorization flow.

## Acceptance Criteria

- [ ] Google Cloud project configured with OAuth 2.0 credentials
- [ ] OAuth scopes requested: directory.readonly, userinfo.profile, userinfo.email
- [ ] OAuth consent screen configured
- [ ] Authorization flow implemented (redirect to Google, callback handler)
- [ ] Store OAuth tokens securely (encrypted in D1)
- [ ] Token refresh logic for expired tokens
- [ ] Settings UI to initiate Google Workspace connection
- [ ] Display connection status and connected workspace info

## Test Criteria

```gherkin
Feature: Google Workspace OAuth Integration
  As an account owner or admin
  I want to connect my Google Workspace
  So that I can sync employee data automatically

  @REQ-OAUTH-001 @Setup
  Scenario: Initiate Google Workspace connection
    Given I am an account owner
    And I am on the Settings > Integrations page
    When I click "Connect Google Workspace"
    Then I should be redirected to Google OAuth consent screen
    And I should see requested permissions:
      | Permission                      |
      | View directory users            |
      | View your email address         |
      | View your basic profile info    |

  @REQ-OAUTH-002 @Callback
  Scenario: Handle OAuth callback
    Given I authorized the Google Workspace integration
    When Google redirects back to our callback URL
    Then the OAuth tokens should be stored securely
    And the account should be marked as connected to Google
    And I should be redirected to Settings page
    And I should see "Google Workspace connected" status

  @REQ-OAUTH-003 @Tokens
  Scenario: Store OAuth tokens securely
    Given I completed OAuth flow
    Then the access_token should be encrypted
    And the refresh_token should be encrypted
    And tokens should be stored in account_integrations table
    And expiry timestamp should be recorded

  @REQ-OAUTH-004 @Refresh
  Scenario: Refresh expired token
    Given my Google access token expired
    When the system attempts to sync directory
    Then it should use the refresh_token to get new access_token
    And the new token should be stored
    And the sync should proceed with new token

  @REQ-OAUTH-005 @Revoke
  Scenario: Disconnect Google Workspace
    Given Google Workspace is connected
    When I click "Disconnect Google Workspace"
    And I confirm the action
    Then the OAuth tokens should be deleted
    And the account should be marked as disconnected
    And scheduled syncs should be disabled

  @REQ-OAUTH-006 @Error
  Scenario: Handle OAuth denial
    Given I am on the Google OAuth consent screen
    When I click "Deny"
    Then I should be redirected back to Settings
    And I should see "Google Workspace connection cancelled"
    And no tokens should be stored
```

## Dependencies

- api/auth-middleware (for RBAC checks)

## OAuth Configuration

### Google Cloud Console Setup
1. Create OAuth 2.0 Client ID
2. Configure authorized redirect URIs:
   - `https://{tenant}.tryequipped.com/api/integrations/google/callback`
   - `https://tryequipped.com/api/integrations/google/callback`
3. Request scopes:
   - `https://www.googleapis.com/auth/admin.directory.user.readonly`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`

### Environment Variables
```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

## Database Schema

```sql
CREATE TABLE account_integrations (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    integration_type TEXT NOT NULL,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at DATETIME,
    metadata TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, integration_type)
);
```

## API Endpoints

### GET /api/integrations/google/authorize
```typescript
// Redirects to Google OAuth consent screen
Query: { account_id: string }
Redirect: https://accounts.google.com/o/oauth2/v2/auth?...
```

### GET /api/integrations/google/callback
```typescript
// Handles OAuth callback
Query: { code: string, state: string }
Response: Redirect to settings with success message
```

### DELETE /api/integrations/google
```typescript
// Disconnect Google Workspace
Response: { message: 'Google Workspace disconnected' }
```

## Encryption

Use CloudFlare Workers built-in crypto API:
```typescript
async function encryptToken(token: string, key: CryptoKey): Promise<string> {
  // Encrypt using AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(token)
  );
  return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
}
```

## Files to Create

- `src/api/integrations/google/authorize.ts` - OAuth initiation
- `src/api/integrations/google/callback.ts` - OAuth callback handler
- `src/lib/google/oauth.ts` - OAuth helpers
- `src/lib/encryption.ts` - Token encryption utilities

## Files to Modify

- `src/pages/dashboard/settings/integrations.astro` - Add Google Workspace connection UI

## References

- PRD.md Section 3: Identity & Onboarding (REQ-ID-013)
- Google Workspace Admin SDK documentation
- Google OAuth 2.0 documentation
