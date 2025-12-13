# Feature Shepherd Determinism & Test Generation Controls

## Description

Enforce determinism and version control for agent-generated Feature Shepherd tests to prevent drift. This task implements controls for test plan stability, version pinning, explicit regeneration triggers, and validation that generated tests match their committed plans.

## Dependencies

- `testing/playwright-agents-bootstrap` - Playwright Agents must be initialized (PENDING)
- `testing/feature-shepherd-contracts` - Feature contract structure must exist (PENDING)
- `testing/feature-shepherd-prompt-template` - Shepherd prompt template must be defined (PENDING)

## Acceptance Criteria

- [ ] Playwright version pinned in package.json
- [ ] Playwright Agents tooling version pinned in package.json or documentation
- [ ] plan.md files committed to version control under features/{FEATURE_KEY}/
- [ ] npm script `shepherd:regen` created to explicitly regenerate test plans
- [ ] CI diff check validates plan.md hasn't changed unexpectedly
- [ ] Generated test files include header comments with plan.md commit hash
- [ ] CI fails if generated test references a different plan version than committed
- [ ] Documentation added for regeneration triggers (manual command, PR label, contract change)
- [ ] Plan change review policy documented (require approval for > 5 files affected)

## Test Criteria

```gherkin
Feature: Test Generation Determinism
  As a repo maintainer
  I want stable, reviewable test plans
  So that agent changes are auditable

  @REQ-FSH-011
  Scenario: Playwright and Agent versions are pinned
    Given package.json exists
    Then it should have an exact pinned version for @playwright/test
    And it should document or pin the Playwright Agents tooling version
    And agent definitions should not auto-regenerate

  @REQ-FSH-011
  Scenario: Committed plan.md prevents drift
    Given features/checkout/plan.md is committed at hash abc123
    When CI runs the Generator
    Then it should produce tests matching the committed plan
    And fail if generated tests reference a different plan version

  @REQ-FSH-011
  Scenario: Explicit regeneration command works
    Given I update features/checkout/acceptance.md
    When I run "npm run shepherd:regen -- checkout"
    Then the Planner should generate a new plan.md
    And the diff should be reviewable in the PR
    And I must approve the plan changes before merging

  @REQ-FSH-011
  Scenario: Plan changes detected in CI
    Given features/auth/plan.md is committed
    When a PR includes uncommitted changes to plan.md
    Then CI should detect the diff
    And fail with a message to review plan changes

  @REQ-FSH-011
  Scenario: Generated tests reference plan commit hash
    Given features/checkout/plan.md exists at commit abc123
    When the Generator creates e2e/shepherd/checkout/add-item.spec.ts
    Then the test file should include a header comment
    And the header should contain "@planSource features/checkout/plan.md@abc123"

  @REQ-FSH-011
  Scenario: Feature contract change triggers explicit regeneration
    Given I modify features/checkout/shepherd.config.json
    When I run the PR workflow
    Then CI should require manual regeneration via "npm run shepherd:regen -- checkout"
    Or a PR label "shepherd:regenerate" to proceed
```

## Implementation

### 1. Pin Versions in package.json

**Playwright Version:**

```bash
# Pin exact version (no ^ or ~ prefix)
bun add -d --exact @playwright/test
```

**In package.json:**
```json
{
  "devDependencies": {
    "@playwright/test": "1.48.0"
  }
}
```

**Playwright Agents Version:**

Document the version in `documentation/testing/shepherd-agents-version.md`:

```markdown
# Playwright Agents Version

**Current Version**: 1.0.0-beta.1 (or official release version)

**Installation Command:**
npx playwright@1.48.0 init-agents --loop=claude

**Last Regenerated**: 2025-12-13

**Regeneration Policy:**
- Do NOT auto-regenerate agent definitions
- Only regenerate when explicitly upgrading Playwright major version
- Commit regenerated agent definitions to .github/ and review diffs
```

### 2. Create npm script for explicit regeneration

**Add to package.json:**

```json
{
  "scripts": {
    "shepherd:regen": "node scripts/regenerate-shepherd.js"
  }
}
```

**Create `scripts/regenerate-shepherd.js`:**

```typescript
#!/usr/bin/env node

/**
 * Regenerate Feature Shepherd test plan and tests for a specific feature.
 *
 * Usage:
 *   npm run shepherd:regen -- checkout
 *   npm run shepherd:regen -- auth
 *
 * This script:
 * 1. Validates feature key exists in features/
 * 2. Invokes Planner agent to regenerate plan.md
 * 3. Invokes Generator agent to regenerate tests
 * 4. Reports changes for review
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const featureKey = process.argv[2];

if (!featureKey) {
  console.error('Usage: npm run shepherd:regen -- <FEATURE_KEY>');
  process.exit(1);
}

const featurePath = resolve(process.cwd(), 'features', featureKey);

if (!existsSync(featurePath)) {
  console.error(`Feature not found: features/${featureKey}`);
  console.error('Ensure features/{FEATURE_KEY}/prd.md and shepherd.config.json exist.');
  process.exit(1);
}

console.log(`Regenerating Feature Shepherd for: ${featureKey}`);
console.log(`Feature path: ${featurePath}`);

// TODO: Invoke Planner agent via Playwright Agents CLI
// Example:
// npx playwright test-agents plan --feature ${featureKey}

// TODO: Invoke Generator agent
// npx playwright test-agents generate --feature ${featureKey}

console.log('\nRegeneration complete. Review changes:');
console.log(`  git diff features/${featureKey}/plan.md`);
console.log(`  git diff e2e/shepherd/${featureKey}/`);
console.log('\nCommit changes if approved.');
```

### 3. Commit plan.md to version control

**Add .gitignore exception:**

Ensure `features/**/plan.md` is NOT ignored:

```gitignore
# .gitignore - Do NOT ignore plan.md
# features/**/plan.md  # <- Remove this if it exists
```

**Commit existing plan.md files:**

```bash
git add features/*/plan.md
git commit -m "feat(testing): commit shepherd plan.md for version control"
```

### 4. CI plan diff check

**Add `.github/workflows/shepherd-plan-check.yml`:**

```yaml
name: Shepherd Plan Diff Check

on:
  pull_request:
    paths:
      - 'features/**/plan.md'

jobs:
  check-plan-diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for diff

      - name: Check for uncommitted plan changes
        run: |
          # Get changed plan.md files in this PR
          CHANGED_PLANS=$(git diff --name-only origin/${{ github.base_ref }}...HEAD | grep 'features/.*/plan.md' || true)

          if [ -z "$CHANGED_PLANS" ]; then
            echo "No plan.md changes detected."
            exit 0
          fi

          echo "⚠️  plan.md files changed in this PR:"
          echo "$CHANGED_PLANS"
          echo ""
          echo "Plan changes must be reviewed carefully:"
          echo "  - Verify changes align with updated acceptance criteria"
          echo "  - Check that > 5 test files affected require senior approval"
          echo "  - Ensure regeneration was triggered explicitly (shepherd:regen or PR label)"
          echo ""
          echo "To regenerate a plan:"
          echo "  npm run shepherd:regen -- <FEATURE_KEY>"
```

### 5. Generated test metadata headers

**Generator agent must include plan commit hash:**

When the Generator creates test files, include this header:

```typescript
/**
 * @featureKey checkout
 * @scenario add-item-to-cart
 * @requirements REQ-FSH-001, REQ-CHECKOUT-003
 * @planSource features/checkout/plan.md@abc123
 * @seedTest e2e/shepherd/checkout/seed.spec.ts
 * @generatedAt 2025-12-13T10:30:00Z
 * @lastHealed 2025-12-13T12:45:00Z
 */
```

**Extract commit hash:**

```bash
# Get commit hash of plan.md
PLAN_HASH=$(git log -1 --format=%h -- features/checkout/plan.md)
```

### 6. CI validation of test-to-plan hash match

**Add to shepherd test run workflow:**

```yaml
- name: Validate test plan references
  run: |
    # For each generated test, verify @planSource hash matches committed plan.md
    node scripts/validate-plan-hashes.js
```

**Create `scripts/validate-plan-hashes.js`:**

```typescript
#!/usr/bin/env node

/**
 * Validate that generated shepherd tests reference the correct plan.md commit hash.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const shepherdDir = resolve(process.cwd(), 'e2e/shepherd');
const featureDirs = readdirSync(shepherdDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let hasErrors = false;

for (const featureKey of featureDirs) {
  const planPath = `features/${featureKey}/plan.md`;

  // Get actual commit hash of plan.md
  let actualHash;
  try {
    actualHash = execSync(`git log -1 --format=%h -- ${planPath}`, { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.error(`❌ Cannot find plan.md for feature: ${featureKey}`);
    hasErrors = true;
    continue;
  }

  // Read all test files in e2e/shepherd/{featureKey}
  const testFiles = readdirSync(resolve(shepherdDir, featureKey))
    .filter(f => f.endsWith('.spec.ts'));

  for (const testFile of testFiles) {
    const content = readFileSync(resolve(shepherdDir, featureKey, testFile), 'utf-8');

    // Extract @planSource hash
    const match = content.match(/@planSource\s+features\/\w+\/plan\.md@(\w+)/);

    if (!match) {
      console.error(`❌ Missing @planSource in ${featureKey}/${testFile}`);
      hasErrors = true;
      continue;
    }

    const referencedHash = match[1];

    if (referencedHash !== actualHash) {
      console.error(`❌ Hash mismatch in ${featureKey}/${testFile}`);
      console.error(`   Referenced: ${referencedHash}`);
      console.error(`   Actual:     ${actualHash}`);
      console.error(`   Run: npm run shepherd:regen -- ${featureKey}`);
      hasErrors = true;
    }
  }
}

if (hasErrors) {
  console.error('\n❌ Plan hash validation failed. Regenerate affected shepherds.');
  process.exit(1);
} else {
  console.log('✅ All shepherd tests reference correct plan.md versions.');
}
```

### 7. Documentation for regeneration policy

**Create `documentation/testing/shepherd-regeneration-policy.md`:**

```markdown
# Feature Shepherd Regeneration Policy

## When to Regenerate

Shepherd test plans and tests should be regenerated ONLY when:

1. **Feature contract changes** - prd.md, acceptance.md, or shepherd.config.json updated
2. **Manual command** - Explicit developer action: `npm run shepherd:regen -- {FEATURE_KEY}`
3. **PR label** - PR labeled with `shepherd:regenerate`

## How to Regenerate

### Single Feature

npm run shepherd:regen -- checkout

### Review Changes

git diff features/checkout/plan.md
git diff e2e/shepherd/checkout/

### Approval Requirements

- **< 5 test files affected**: Standard PR review
- **≥ 5 test files affected**: Require senior engineer or QA approval
- **Plan format changes**: Require testing lead approval

## CI Validation

CI automatically checks:

1. plan.md is committed (not ignored)
2. Generated tests reference correct plan.md commit hash
3. Unexpected plan changes trigger warnings

## Preventing Drift

- Playwright version is pinned (no automatic upgrades)
- Agent definitions are versioned and manually regenerated
- Plan diffs are treated like code (reviewed and approved)
```

## Files

**Created:**
- `scripts/regenerate-shepherd.js` - Explicit regeneration command
- `scripts/validate-plan-hashes.js` - CI validation of test-to-plan hash matches
- `documentation/testing/shepherd-agents-version.md` - Version tracking for Playwright Agents
- `documentation/testing/shepherd-regeneration-policy.md` - Regeneration policy documentation
- `.github/workflows/shepherd-plan-check.yml` - CI workflow for plan diff detection

**Modified:**
- `package.json` - Add exact Playwright version pin and `shepherd:regen` script
- `.gitignore` - Ensure plan.md is NOT ignored (remove if present)

## Notes

- **Version Pinning**: Use `--exact` flag when installing Playwright to prevent ^ or ~ prefixes
- **Plan Stability**: Treat plan.md like code - review diffs carefully before merging
- **Commit Hash Tracking**: Generator agent must extract git hash of plan.md and embed in test headers
- **CI Enforcement**: Plan diff check runs on every PR touching plan.md files
- **Manual Regeneration**: Explicit `npm run shepherd:regen -- {FEATURE_KEY}` command prevents accidental drift

## References

- PRD: `documentation/PRDs/feature-shepherds.md` - REQ-FSH-011
- Playwright Agents Documentation: https://playwright.dev/docs/test-agents
- `testing/playwright-agents-bootstrap` - Agent initialization task
- `testing/feature-shepherd-contracts` - Feature contract structure
