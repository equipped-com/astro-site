# Feature Shepherd Test Metadata Headers

## Description

Implement machine-readable metadata headers in all agent-generated Feature Shepherd tests to enable traceability, coverage reporting, and debugging. Headers include feature key, scenario, requirements, plan source, seed test reference, and generation timestamps.

## Dependencies

- `testing/playwright-agents-bootstrap` - Playwright Agents must be initialized (PENDING)
- `testing/feature-shepherd-prompt-template` - Shepherd prompt template must exist (PENDING)
- `testing/feature-shepherd-contracts` - Feature contract structure must exist (PENDING)
- `testing/feature-shepherd-determinism` - Plan commit hash tracking must be implemented (PENDING)

## Acceptance Criteria

- [ ] Generator agent produces test files with standardized metadata headers
- [ ] Required header fields implemented: @featureKey, @scenario, @requirements, @planSource, @seedTest, @generatedAt, @lastHealed
- [ ] Header format uses JSDoc-style comments for TypeScript compatibility
- [ ] CI validation script ensures all shepherd tests have required headers
- [ ] CI reporting script aggregates coverage by @requirements tags
- [ ] Failed test links in CI reports point to @planSource for context
- [ ] Healer agent updates @lastHealed timestamp when modifying tests
- [ ] Documentation added for header format and usage

## Test Criteria

```gherkin
Feature: Test Metadata for Traceability
  As a test reporter
  I want structured metadata in every generated test
  So that I can aggregate coverage and trace failures

  @REQ-FSH-012
  Scenario: Generated test includes required headers
    Given the Generator creates e2e/shepherd/checkout/add-item.spec.ts
    Then the file should include a metadata header
    And the header should contain @featureKey, @scenario, @requirements
    And @planSource should reference the commit hash of plan.md
    And @seedTest should reference e2e/shepherd/checkout/seed.spec.ts
    And @generatedAt should be an ISO 8601 timestamp

  @REQ-FSH-012
  Scenario: CI validates header presence
    Given e2e/shepherd/auth/login.spec.ts exists
    When CI runs header validation
    Then it should pass if all required fields are present
    And fail if any required field is missing

  @REQ-FSH-012
  Scenario: CI report aggregates by requirements
    Given tests include @requirements tags
    When CI runs shepherd suites
    Then the report should show which REQ-* IDs are covered
    And which tests cover each requirement
    And which requirements have no coverage

  @REQ-FSH-012
  Scenario: Failed test links to plan source
    Given a test fails in CI
    When I view the failure report
    Then the report should include a link to @planSource
    And the link should point to the specific plan.md commit hash

  @REQ-FSH-012
  Scenario: Healer updates lastHealed timestamp
    Given a test was generated at 2025-12-13T10:30:00Z
    When the Healer modifies the test at 2025-12-13T12:45:00Z
    Then @lastHealed should be updated to 2025-12-13T12:45:00Z
    And @generatedAt should remain unchanged

  @REQ-FSH-012
  Scenario: Filter tests by feature key
    Given multiple shepherd suites exist
    When I search for @featureKey checkout
    Then I should find all checkout shepherd tests
    And be able to run them in isolation
```

## Implementation

### 1. Standard Header Format

**Template for Generator agent:**

```typescript
/**
 * @featureKey {FEATURE_KEY}
 * @scenario {SCENARIO_NAME}
 * @requirements {REQ_IDS_COMMA_SEPARATED}
 * @planSource features/{FEATURE_KEY}/plan.md@{COMMIT_HASH}
 * @seedTest e2e/shepherd/{FEATURE_KEY}/seed.spec.ts
 * @generatedAt {ISO_8601_TIMESTAMP}
 * @lastHealed {ISO_8601_TIMESTAMP_OR_NEVER}
 */
```

**Example:**

```typescript
/**
 * @featureKey checkout
 * @scenario add-item-to-cart
 * @requirements REQ-FSH-001, REQ-CHECKOUT-003, REQ-CHECKOUT-005
 * @planSource features/checkout/plan.md@a1b2c3d
 * @seedTest e2e/shepherd/checkout/seed.spec.ts
 * @generatedAt 2025-12-13T10:30:00Z
 * @lastHealed never
 */

import { test, expect } from '@playwright/test';
import { setupFeature } from '../../fixtures/shepherd';

test.describe('Checkout - Add Item to Cart', () => {
  // Test implementation...
});
```

### 2. Generator Agent Integration

**Update Generator prompt to include header generation:**

Add to `features/_templates/shepherd.prompt.md` (or Generator agent configuration):

```markdown
## Test File Header Requirements

Every generated test file MUST begin with a metadata header in this exact format:

/**
 * @featureKey {FEATURE_KEY}
 * @scenario {scenario-name-kebab-case}
 * @requirements {comma-separated REQ-IDs from acceptance.md}
 * @planSource features/{FEATURE_KEY}/plan.md@{git-commit-hash}
 * @seedTest e2e/shepherd/{FEATURE_KEY}/seed.spec.ts
 * @generatedAt {current-ISO-8601-timestamp}
 * @lastHealed never
 */

**Field Descriptions:**

- `@featureKey`: The FEATURE_KEY from shepherd.config.json
- `@scenario`: Descriptive kebab-case scenario name (e.g., "add-item-to-cart")
- `@requirements`: Space-separated list of REQ-* IDs this test covers
- `@planSource`: Path to plan.md with git commit hash (use: git log -1 --format=%h -- features/{FEATURE_KEY}/plan.md)
- `@seedTest`: Path to seed.spec.ts for this feature
- `@generatedAt`: ISO 8601 timestamp when test was generated
- `@lastHealed`: ISO 8601 timestamp when Healer last modified this test, or "never"
```

### 3. Header Validation Script

**Create `scripts/validate-shepherd-headers.js`:**

```typescript
#!/usr/bin/env node

/**
 * Validate that all shepherd test files have required metadata headers.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REQUIRED_FIELDS = [
  '@featureKey',
  '@scenario',
  '@requirements',
  '@planSource',
  '@seedTest',
  '@generatedAt',
  '@lastHealed',
];

const shepherdDir = resolve(process.cwd(), 'e2e/shepherd');

if (!existsSync(shepherdDir)) {
  console.log('No shepherd tests found (e2e/shepherd/ does not exist).');
  process.exit(0);
}

const featureDirs = readdirSync(shepherdDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let hasErrors = false;

for (const featureKey of featureDirs) {
  const testFiles = readdirSync(resolve(shepherdDir, featureKey))
    .filter(f => f.endsWith('.spec.ts'));

  for (const testFile of testFiles) {
    const filePath = resolve(shepherdDir, featureKey, testFile);
    const content = readFileSync(filePath, 'utf-8');

    // Extract header (first comment block)
    const headerMatch = content.match(/^\/\*\*\n([\s\S]*?)\n \*\//);

    if (!headerMatch) {
      console.error(`❌ Missing header: ${featureKey}/${testFile}`);
      hasErrors = true;
      continue;
    }

    const header = headerMatch[1];

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
      const regex = new RegExp(`\\* ${field.replace('@', '@')}\\s+\\S+`);
      if (!regex.test(header)) {
        console.error(`❌ Missing field ${field} in ${featureKey}/${testFile}`);
        hasErrors = true;
      }
    }

    // Validate @requirements format (should be REQ-* IDs)
    const reqMatch = header.match(/\* @requirements\s+(.+)/);
    if (reqMatch) {
      const reqs = reqMatch[1].trim();
      if (reqs !== 'none' && !/^REQ-[\w-]+(,\s*REQ-[\w-]+)*$/.test(reqs)) {
        console.error(`❌ Invalid @requirements format in ${featureKey}/${testFile}: ${reqs}`);
        console.error('   Expected: REQ-ABC-001, REQ-XYZ-002 or "none"');
        hasErrors = true;
      }
    }
  }
}

if (hasErrors) {
  console.error('\n❌ Header validation failed. Regenerate affected tests or fix headers manually.');
  process.exit(1);
} else {
  console.log('✅ All shepherd tests have valid metadata headers.');
}
```

### 4. Coverage Reporting by Requirements

**Create `scripts/shepherd-coverage-report.js`:**

```typescript
#!/usr/bin/env node

/**
 * Generate coverage report showing which REQ-* IDs are covered by shepherd tests.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const shepherdDir = resolve(process.cwd(), 'e2e/shepherd');
const outputPath = resolve(process.cwd(), 'test-results/shepherd-coverage.md');

// Collect all @requirements tags from shepherd tests
const coverageMap = new Map(); // REQ-ID -> [list of test files]

const featureDirs = readdirSync(shepherdDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const featureKey of featureDirs) {
  const testFiles = readdirSync(resolve(shepherdDir, featureKey))
    .filter(f => f.endsWith('.spec.ts'));

  for (const testFile of testFiles) {
    const content = readFileSync(resolve(shepherdDir, featureKey, testFile), 'utf-8');

    // Extract @requirements
    const reqMatch = content.match(/\* @requirements\s+(.+)/);
    if (reqMatch) {
      const reqs = reqMatch[1].split(',').map(r => r.trim());

      for (const req of reqs) {
        if (req === 'none') continue;

        if (!coverageMap.has(req)) {
          coverageMap.set(req, []);
        }

        coverageMap.get(req).push(`${featureKey}/${testFile}`);
      }
    }
  }
}

// Generate Markdown report
const sortedReqs = Array.from(coverageMap.keys()).sort();

let report = '# Shepherd Test Coverage by Requirements\n\n';
report += `**Generated**: ${new Date().toISOString()}\n\n`;
report += `**Total Requirements Covered**: ${sortedReqs.length}\n\n`;
report += '## Coverage Map\n\n';

for (const req of sortedReqs) {
  const tests = coverageMap.get(req);
  report += `### ${req}\n\n`;
  report += `Covered by ${tests.length} test(s):\n\n`;

  for (const test of tests) {
    report += `- \`${test}\`\n`;
  }

  report += '\n';
}

// Write report
writeFileSync(outputPath, report, 'utf-8');

console.log(`✅ Coverage report generated: ${outputPath}`);
console.log(`   Requirements covered: ${sortedReqs.length}`);
```

**Add to package.json:**

```json
{
  "scripts": {
    "shepherd:coverage": "node scripts/shepherd-coverage-report.js"
  }
}
```

### 5. CI Integration for Header Validation

**Add to `.github/workflows/shepherd-tests.yml`:**

```yaml
- name: Validate Shepherd Test Headers
  run: node scripts/validate-shepherd-headers.js

- name: Generate Coverage Report
  if: always()
  run: npm run shepherd:coverage

- name: Upload Coverage Report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: shepherd-coverage
    path: test-results/shepherd-coverage.md
    retention-days: 30
```

### 6. Healer Agent Integration

**Update Healer agent to update @lastHealed:**

When Healer modifies a test file, it must:

1. Preserve existing header fields
2. Update `@lastHealed` to current ISO 8601 timestamp
3. NOT change `@generatedAt` (original generation time)

**Example Healer update logic:**

```typescript
// When Healer modifies a test file:
const content = readFileSync(testPath, 'utf-8');

// Update @lastHealed timestamp
const updatedContent = content.replace(
  /(\* @lastHealed\s+)(.+)/,
  `$1${new Date().toISOString()}`
);

writeFileSync(testPath, updatedContent, 'utf-8');
```

### 7. Documentation

**Create `documentation/testing/shepherd-metadata-headers.md`:**

```markdown
# Shepherd Test Metadata Headers

All agent-generated Feature Shepherd tests include machine-readable metadata headers for traceability and reporting.

## Header Format

/**
 * @featureKey {FEATURE_KEY}
 * @scenario {scenario-name}
 * @requirements {REQ-IDs}
 * @planSource features/{FEATURE_KEY}/plan.md@{hash}
 * @seedTest e2e/shepherd/{FEATURE_KEY}/seed.spec.ts
 * @generatedAt {ISO-8601-timestamp}
 * @lastHealed {ISO-8601-timestamp-or-never}
 */

## Field Descriptions

| Field | Description | Example |
|-------|-------------|---------|
| `@featureKey` | Feature identifier from shepherd.config.json | `checkout` |
| `@scenario` | Descriptive scenario name (kebab-case) | `add-item-to-cart` |
| `@requirements` | Comma-separated REQ-* IDs this test covers | `REQ-FSH-001, REQ-CHECKOUT-003` |
| `@planSource` | Path to plan.md with commit hash | `features/checkout/plan.md@a1b2c3d` |
| `@seedTest` | Path to seed test for this feature | `e2e/shepherd/checkout/seed.spec.ts` |
| `@generatedAt` | ISO 8601 timestamp when test was generated | `2025-12-13T10:30:00Z` |
| `@lastHealed` | ISO 8601 timestamp when Healer last modified test | `2025-12-13T12:45:00Z` or `never` |

## Usage

### Coverage Reporting

npm run shepherd:coverage

Generates `test-results/shepherd-coverage.md` showing which requirements are covered by which tests.

### Header Validation

CI automatically validates headers on every PR:

node scripts/validate-shepherd-headers.js

### Filter Tests by Feature

npx playwright test --grep "@featureKey checkout"

### Find Tests for a Requirement

grep -r "@requirements.*REQ-CHECKOUT-003" e2e/shepherd/
```

## Files

**Created:**
- `scripts/validate-shepherd-headers.js` - CI validation of required header fields
- `scripts/shepherd-coverage-report.js` - Coverage report by @requirements tags
- `documentation/testing/shepherd-metadata-headers.md` - Header format documentation

**Modified:**
- `package.json` - Add `shepherd:coverage` script
- `.github/workflows/shepherd-tests.yml` - Add header validation and coverage reporting steps
- `features/_templates/shepherd.prompt.md` - Add header generation instructions for Generator agent

## Notes

- **Generator Responsibility**: Generator agent must produce headers with all required fields
- **Healer Responsibility**: Healer agent updates @lastHealed when modifying tests
- **CI Enforcement**: Header validation runs on every PR to catch missing or malformed headers
- **Coverage Reporting**: Aggregates all @requirements tags to show which REQ-* IDs have test coverage
- **Traceability**: @planSource links failed tests to their source requirements and test plan

## References

- PRD: `documentation/PRDs/feature-shepherds.md` - REQ-FSH-012
- `testing/playwright-agents-bootstrap` - Agent initialization
- `testing/feature-shepherd-determinism` - Plan commit hash tracking
- `testing/feature-shepherd-prompt-template` - Generator agent prompts
