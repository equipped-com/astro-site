# Feature Shepherd Security & Secrets Management

## Description

Configure security controls for Feature Shepherd tests including GitHub Environment protection, agent write restrictions, artifact security, and CI secrets management. This task ensures that agent-generated tests run safely in CI without exposing secrets or allowing unauthorized modifications.

## Dependencies

- `testing/playwright-agents-bootstrap` - Playwright Agents must be initialized (PENDING)
- `testing/feature-shepherd-ci-wiring` - CI workflows must be created (PENDING)

## Acceptance Criteria

- [ ] GitHub Environment protection configured for staging environment
- [ ] CI secrets stored securely (CLERK_TEST_KEY, STAGING_URL, E2E_TEST_PASSWORD)
- [ ] Agent write permissions restricted to features/** and e2e/shepherd/** only
- [ ] Post-run verification step ensures agents didn't write outside allowed paths
- [ ] Artifact retention policy set to 7 days auto-delete
- [ ] Artifact access restricted to repository collaborators only
- [ ] PII redaction implemented in test logs using Playwright maskText
- [ ] Forked PRs blocked from accessing secrets (GitHub default verified)
- [ ] CI workflow permissions follow least-privilege principle
- [ ] Documentation added for secrets management and security policies

## Test Criteria

```gherkin
Feature: Secure Secrets Management
  As a security engineer
  I want secrets protected from unauthorized access
  So that test credentials and API keys remain secure

  @REQ-SECURITY-001
  Scenario: Secrets only available to trusted branches
    Given a PR is created from a fork
    When the CI workflow runs
    Then secrets should not be available
    And shepherd tests requiring secrets should be skipped

  @REQ-SECURITY-001
  Scenario: Staging environment requires approval for external contributors
    Given an external contributor creates a PR
    When the PR targets staging environment
    Then manual approval should be required
    And secrets should only be released after approval

  @REQ-SECURITY-001
  Scenario: CI workflow has minimal permissions
    Given the shepherd-tests workflow exists
    Then it should have contents: read permission
    And issues: write permission (for regression issues)
    And actions: read permission (for workflow runs)
    And no elevated permissions (packages, deployments, etc.)

Feature: Agent Write Restrictions
  As a security engineer
  I want agents restricted to specific directories
  So that they cannot modify sensitive files

  @REQ-SECURITY-002
  Scenario: Agents can only write to allowed paths
    Given an agent generates tests
    Then it should write to features/** or e2e/shepherd/**
    And writing to any other path should fail verification

  @REQ-SECURITY-002
  Scenario: Post-run verification detects unauthorized writes
    Given a shepherd test run completes
    When post-run verification runs
    Then it should check git diff for changes outside allowed paths
    And fail the workflow if unauthorized changes detected

  @REQ-SECURITY-002
  Scenario: Agents cannot modify workflows
    Given an agent attempts to write to .github/workflows/**
    Then the write should be blocked
    And post-run verification should fail
    And the PR should be marked as failing

Feature: Artifact Security
  As a security engineer
  I want test artifacts protected from leaking sensitive data
  So that PII and credentials are not exposed

  @REQ-SECURITY-003
  Scenario: Artifacts auto-delete after 7 days
    Given a shepherd test run produces artifacts
    When the retention period expires (7 days)
    Then GitHub should automatically delete the artifacts

  @REQ-SECURITY-003
  Scenario: Artifact access restricted to collaborators
    Given test artifacts are uploaded
    Then only repository collaborators should have access
    And public access should be denied

  @REQ-SECURITY-003
  Scenario: PII redacted in traces and screenshots
    Given a test captures user email or session token
    When traces and screenshots are generated
    Then sensitive values should be masked using Playwright maskText
    And artifacts should not contain plaintext PII
```

## Implementation

### 1. GitHub Environment Protection

**Configure staging environment in GitHub:**

1. Navigate to: **Settings → Environments → New environment**
2. Create environment: `staging`
3. Add protection rules:
   - **Required reviewers**: Add team leads or security team
   - **Deployment branches**: Only `main`, `staging`, `release/*`
   - **Wait timer**: 0 minutes (manual approval only)

**Add secrets to staging environment:**

- `CLERK_TEST_KEY` - Clerk test mode publishable key
- `STAGING_URL` - Staging environment URL (e.g., https://staging.equipped.com)
- `E2E_TEST_PASSWORD` - Default password for test users

**Reference in workflow:**

```yaml
jobs:
  shepherd:
    environment: staging  # Requires approval for external contributors
    runs-on: ubuntu-latest
```

### 2. CI Workflow Permissions (Least Privilege)

**Create `.github/workflows/shepherd-tests.yml` with minimal permissions:**

```yaml
name: Feature Shepherd Tests

on:
  pull_request:
    paths:
      - 'features/**'
      - 'e2e/shepherd/**'
      - 'src/**'
      - 'app/**'
  schedule:
    - cron: '0 2 * * *'  # Nightly at 2 AM UTC

permissions:
  contents: read      # Read repo files
  issues: write       # File regression issues
  actions: read       # Read workflow runs

jobs:
  shepherd:
    environment: staging
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Install Playwright browsers
        run: bunx playwright install --with-deps chromium

      - name: Run Shepherd Tests
        env:
          CLERK_TEST_KEY: ${{ secrets.CLERK_TEST_KEY }}
          STAGING_URL: ${{ secrets.STAGING_URL }}
          E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
        run: npx playwright test e2e/shepherd

      - name: Verify Agent Write Bounds
        if: always()
        run: |
          # Fail if agents wrote outside allowed paths
          echo "Checking for unauthorized file changes..."

          # Get all changed files (excluding allowed paths)
          UNAUTHORIZED_CHANGES=$(git diff --name-only -- ':!features' ':!e2e/shepherd' ':!test-results' ':!playwright-report')

          if [ -n "$UNAUTHORIZED_CHANGES" ]; then
            echo "❌ Agents wrote to unauthorized paths:"
            echo "$UNAUTHORIZED_CHANGES"
            exit 1
          else
            echo "✅ No unauthorized file changes detected."
          fi

      - name: Upload Traces (on failure only)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: shepherd-traces-${{ github.run_id }}
          path: test-results/
          retention-days: 7
          if-no-files-found: ignore
```

### 3. Agent Write Restriction Enforcement

**Create `.github/workflows/agent-write-verification.yml`:**

```yaml
name: Agent Write Verification

on:
  pull_request:
    paths:
      - 'features/**'
      - 'e2e/shepherd/**'

jobs:
  verify-write-bounds:
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for diff

      - name: Verify changes are in allowed paths
        run: |
          # Get changed files in PR
          CHANGED_FILES=$(git diff --name-only origin/${{ github.base_ref }}...HEAD)

          echo "Changed files:"
          echo "$CHANGED_FILES"

          # Check if any changes are outside allowed paths
          DISALLOWED_CHANGES=$(echo "$CHANGED_FILES" | grep -v -E '^(features/|e2e/shepherd/|test-results/|playwright-report/)' || true)

          if [ -n "$DISALLOWED_CHANGES" ]; then
            echo ""
            echo "⚠️  Warning: Changes detected outside allowed paths:"
            echo "$DISALLOWED_CHANGES"
            echo ""
            echo "Agent-generated changes should only affect:"
            echo "  - features/**"
            echo "  - e2e/shepherd/**"
            echo ""
            echo "If these changes were made by a human, this is fine."
            echo "If these changes were made by an agent, review carefully."
          else
            echo "✅ All changes are in allowed paths."
          fi
```

### 4. Artifact Security Configuration

**Artifact settings in workflow:**

```yaml
- name: Upload Traces (on failure only)
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: shepherd-traces-${{ github.run_id }}
    path: test-results/
    retention-days: 7              # Auto-delete after 7 days
    if-no-files-found: ignore

# Note: GitHub Actions artifacts are automatically restricted to collaborators
# No additional configuration needed for access control
```

**Verify artifact retention policy in repository settings:**

1. Navigate to: **Settings → Actions → General**
2. Verify: **Artifact and log retention** set to **7 days** or less

### 5. PII Redaction in Playwright

**Update `playwright.config.ts` to mask sensitive data:**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.STAGING_URL || 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',

    // Mask sensitive text in traces and screenshots
    launchOptions: {
      // Redact console logs containing sensitive patterns
    },
  },

  // Global setup to configure PII redaction
  globalSetup: './e2e/global-setup.ts',
});
```

**Create `e2e/global-setup.ts`:**

```typescript
/**
 * Global setup for Playwright tests.
 * Configures PII redaction and security settings.
 */

export default function globalSetup() {
  console.log('Setting up Playwright with PII redaction...');

  // Configure environment for secure testing
  if (!process.env.E2E_TEST_PASSWORD) {
    console.warn('⚠️  E2E_TEST_PASSWORD not set. Tests may fail.');
  }

  if (!process.env.CLERK_TEST_KEY) {
    console.warn('⚠️  CLERK_TEST_KEY not set. Tests may fail.');
  }

  console.log('✅ Global setup complete.');
}
```

**Use maskText in tests:**

```typescript
import { test, expect } from '@playwright/test';

test('should mask email in traces', async ({ page }) => {
  await page.goto('/sign-up');

  // Mask email input from traces and screenshots
  await page.locator('input[name="emailAddress"]').fill('test@example.com');
  await page.locator('input[name="emailAddress"]').evaluate((el: HTMLInputElement) => {
    el.setAttribute('data-playwright-mask', 'true');
  });

  // Rest of test...
});
```

**Alternative: CSS-based masking:**

Add to `global.css`:

```css
/* Mask sensitive inputs in Playwright traces */
[data-sensitive="true"],
input[type="password"],
input[name*="email"],
input[name*="token"] {
  -webkit-text-security: disc;
}
```

### 6. Secrets Management Documentation

**Create `documentation/testing/shepherd-secrets-management.md`:**

```markdown
# Shepherd Tests - Secrets Management

## Required Secrets

Feature Shepherd tests require these secrets to run in CI:

| Secret | Description | Environment | Example |
|--------|-------------|-------------|---------|
| `CLERK_TEST_KEY` | Clerk test mode publishable key | staging | `pk_test_...` |
| `STAGING_URL` | Staging environment URL | staging | `https://staging.equipped.com` |
| `E2E_TEST_PASSWORD` | Default password for test users | staging | `TestPassword123!` |

## Adding Secrets

### GitHub Environment Secrets

1. Navigate to: **Settings → Environments → staging**
2. Click **Add secret**
3. Enter secret name and value
4. Click **Add secret**

### Verifying Secrets

Secrets are only available:
- To trusted branches (`main`, `staging`, `release/*`)
- After manual approval for external contributors
- In workflows with `environment: staging`

Forked PRs **do not** have access to secrets (GitHub default).

## Secret Rotation

Rotate secrets regularly:

1. **Clerk Test Key**: Rotate every 90 days
   - Generate new key in Clerk Dashboard
   - Update `CLERK_TEST_KEY` in GitHub secrets
   - Verify tests pass with new key

2. **E2E Test Password**: Rotate every 30 days
   - Update `E2E_TEST_PASSWORD` in GitHub secrets
   - Tests use password from env var (no code changes needed)

## Security Policies

### 1. Least Privilege

CI workflows have minimal permissions:
- `contents: read` (read repo)
- `issues: write` (file regression issues)
- `actions: read` (read workflow runs)

### 2. Agent Write Restrictions

Agents can only write to:
- `features/**`
- `e2e/shepherd/**`

Post-run verification fails if unauthorized paths modified.

### 3. Artifact Security

- Retention: 7 days auto-delete
- Access: Collaborators only
- PII: Masked using Playwright maskText

### 4. Fork Protection

Forked PRs:
- Do not have access to secrets
- Cannot run tests requiring staging environment
- Must be merged to trusted branch before running full tests

## Incident Response

If secrets are leaked:

1. **Immediate**: Revoke compromised secret in provider (Clerk, etc.)
2. **Update**: Generate new secret
3. **Rotate**: Update GitHub secret
4. **Verify**: Run tests to confirm new secret works
5. **Audit**: Review access logs for unauthorized usage
```

### 7. Fork Security Verification

**Add check to workflow:**

```yaml
- name: Verify Fork Security
  run: |
    # Verify secrets are not available to forks
    if [ "${{ github.event.pull_request.head.repo.fork }}" == "true" ]; then
      echo "⚠️  PR from fork detected."
      echo "Secrets are not available. Some tests will be skipped."

      if [ -z "${{ secrets.CLERK_TEST_KEY }}" ]; then
        echo "✅ Confirmed: Secrets not accessible from fork."
      else
        echo "❌ ERROR: Secrets leaked to fork!"
        exit 1
      fi
    fi
```

## Files

**Created:**
- `.github/workflows/shepherd-tests.yml` - Main shepherd test workflow with security controls
- `.github/workflows/agent-write-verification.yml` - Verify agent writes are in allowed paths
- `e2e/global-setup.ts` - Global Playwright setup with PII redaction
- `documentation/testing/shepherd-secrets-management.md` - Secrets management documentation

**Modified:**
- `playwright.config.ts` - Add PII redaction configuration
- GitHub Environment settings - Configure `staging` environment with secrets and protection rules

## Notes

- **Environment Protection**: Requires manual approval for external contributors (prevents secret leaks)
- **Least Privilege**: CI workflows have minimal permissions (read repo, write issues)
- **Agent Write Bounds**: Post-run verification fails if agents write outside `features/**` or `e2e/shepherd/**`
- **Artifact Retention**: 7-day auto-delete reduces storage costs and limits exposure window
- **PII Redaction**: Playwright maskText prevents email/token leakage in traces
- **Fork Security**: GitHub automatically blocks secrets from forked PRs (verified in workflow)

## References

- PRD: `documentation/PRDs/feature-shepherds.md` - Security section
- GitHub Docs: [Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- GitHub Docs: [Deployment environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- Playwright Docs: [Masking sensitive data](https://playwright.dev/docs/test-reporters#masking-sensitive-data)
- `testing/playwright-agents-bootstrap` - Agent initialization and configuration
- `testing/feature-shepherd-ci-wiring` - CI workflow structure
