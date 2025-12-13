# Feature Shepherd Healing Policy

## Description

Implement Healer escalation rules and regression issue creation with required artifacts. The Healer can autonomously fix brittle locators and timing issues but MUST escalate true regressions by creating GitHub issues with traces, screenshots, error context, and CODEOWNERS lookup.

## Dependencies

- `testing/setup-playwright` - Playwright infrastructure (DONE)
- `testing/feature-shepherd-contracts` - Shepherd structure (plan.md, spec.md) (PENDING)
- `testing/playwright-agents-bootstrap` - Agent-based test generator (PENDING)
- `testing/feature-shepherd-ci-wiring` - CI integration for regression workflow (PENDING)

## Acceptance Criteria

- [ ] Healer policy documented in `e2e/healer-policy.md`
- [ ] Healer MAY change: locators (equivalent semantics), wait times (≤10s), navigation steps, helper functions
- [ ] Healer MUST STOP and escalate when: acceptance assertions fail, required UI missing, API semantics change, console errors, timeout > 2 retries
- [ ] Regression escalation script created (`scripts/create-shepherd-regression.ts`)
- [ ] Regression issue template includes: feature key, scenario, trace zip, screenshots, error/stack, CODEOWNERS, plan.md link, spec.md link
- [ ] Labels applied: `regression`, `shepherd:{FEATURE_KEY}`
- [ ] GitHub issue created automatically on nightly failures
- [ ] CODEOWNERS lookup from `.github/CODEOWNERS` and `shepherd.config.json`
- [ ] Tests follow Gherkin-to-code pattern with @REQ-FSH-010 traceability

## Test Criteria

```gherkin
Feature: Feature Shepherd Healing Policy

  @REQ-FSH-010
  Scenario: Healer fixes brittle locator without escalation
    Given a test uses locator 'button:has-text("Submit")'
    And the button text changes to "Continue"
    When the Healer reviews the failure
    And the button exists with equivalent semantics (form submission)
    Then the Healer updates the locator to 'button[type="submit"]'
    And the test passes
    And no regression issue is created

  @REQ-FSH-010
  Scenario: Healer increases wait time within threshold
    Given a test waits 3s for an API response
    And the API now takes 5s
    When the Healer reviews the timeout
    And the delay is ≤ 10s
    Then the Healer increases the wait to 6s
    And the test passes
    And no regression issue is created

  @REQ-FSH-010
  Scenario: Healer refactors navigation steps
    Given a test navigates via direct URL
    And the navigation now requires clicking a link
    When the Healer reviews the failure
    And the navigation intent is unchanged
    Then the Healer updates navigation to use link click
    And the test passes
    And no regression issue is created

  @REQ-FSH-010
  Scenario: Healer escalates acceptance assertion failure
    Given a test asserts "Order total is $100"
    And the order total is now $95
    When the Healer reviews the failure
    Then the Healer detects acceptance criteria violation
    And stops autonomous fixing
    And creates a regression issue with:
      | Field          | Value                          |
      | Title          | [Shepherd Regression] checkout |
      | Feature Key    | checkout                       |
      | Scenario       | Calculate order total          |
      | Trace          | trace.zip (attached)           |
      | Screenshots    | failure-screenshot.png         |
      | Error Message  | Expected $100, got $95         |
      | CODEOWNERS     | src/components/checkout/**     |
      | Links          | plan.md, spec.md               |
      | Labels         | regression, shepherd:checkout  |

  @REQ-FSH-010
  Scenario: Healer escalates missing UI element
    Given a test expects a "Delete Account" button
    And the button is removed from the UI
    When the Healer reviews the failure
    Then the Healer detects missing required element
    And stops autonomous fixing
    And creates a regression issue

  @REQ-FSH-010
  Scenario: Healer escalates API semantic change
    Given a test calls POST /api/cart with { productId, quantity }
    And the API now requires { productId, quantity, tenantId }
    When the Healer reviews the API failure
    Then the Healer detects semantic change (new required field)
    And stops autonomous fixing
    And creates a regression issue

  @REQ-FSH-010
  Scenario: Healer escalates console errors
    Given a test navigates to /dashboard
    And new console errors appear (Uncaught TypeError)
    When the Healer reviews the page load
    Then the Healer detects console errors
    And stops autonomous fixing
    And creates a regression issue

  @REQ-FSH-010
  Scenario: Healer escalates timeout exceeding threshold
    Given a test waits for API response
    And the API times out after 15s (> 10s threshold)
    When the Healer reviews the timeout
    Then the Healer detects excessive delay
    And stops autonomous fixing
    And creates a regression issue

  @REQ-FSH-010
  Scenario: Regression issue includes CODEOWNERS lookup
    Given a regression is detected in the "auth" feature
    And shepherd.config.json maps auth to src/components/auth/**
    And .github/CODEOWNERS maps src/components/auth/** to @equipped-com/auth-team
    When a regression issue is created
    Then the issue body includes:
      """
      ### CODEOWNERS
      - `src/components/auth/**` → @equipped-com/auth-team
      """
    And the issue is assigned to @equipped-com/auth-team

  @REQ-FSH-010
  Scenario: Regression issue includes trace and screenshots
    Given a test fails in nightly run
    And Playwright generates trace.zip and failure-screenshot.png
    When a regression issue is created
    Then the artifacts are uploaded to GitHub
    And the issue links to the artifacts
    And the trace can be viewed in Playwright UI
```

## Implementation

### 1. Create e2e/healer-policy.md

```markdown
# Healer Policy & Escalation Rules

## Overview
The Healer is an autonomous agent that attempts to fix brittle E2E tests by updating locators, wait times, and navigation steps. However, the Healer MUST escalate true regressions to human engineers.

## Allowed Changes (Autonomous)

### 1. Locator Updates
The Healer MAY change locators if:
- The element still exists with equivalent semantics
- The user intent is unchanged
- Example: `button:has-text("Submit")` → `button[type="submit"]` (same button, different text)

### 2. Wait Times / Retries
The Healer MAY increase wait times if:
- The delay is ≤ 10 seconds
- The element/response eventually appears
- Example: `waitForSelector(..., { timeout: 3000 })` → `waitForSelector(..., { timeout: 6000 })`

### 3. Navigation Steps
The Healer MAY change navigation if:
- The navigation intent is unchanged
- The user flow is preserved
- Example: `page.goto('/dashboard')` → `page.click('a[href="/dashboard"]')`

### 4. Helper Function Usage
The Healer MAY refactor to use helper functions if:
- The test logic is unchanged
- Code is more maintainable
- Example: Inline auth → `await signIn(page)`

## Forbidden Changes (Must Escalate)

### 1. Acceptance Assertion Failures
**Rule**: If an acceptance criterion assertion fails, STOP and escalate.

**Examples**:
- `expect(total).toBe(100)` → total is now 95 ❌ ESCALATE
- `expect(title).toContain('Dashboard')` → title is now 'Home' ❌ ESCALATE

### 2. Missing Required UI Elements
**Rule**: If a required element is missing from the UI, STOP and escalate.

**Examples**:
- `button:has-text("Delete Account")` not found ❌ ESCALATE
- `input[name="email"]` removed from form ❌ ESCALATE

### 3. API Semantic Changes
**Rule**: If an API contract changes (new required fields, status codes, response structure), STOP and escalate.

**Examples**:
- POST /api/cart now requires `tenantId` field ❌ ESCALATE
- GET /api/user returns 401 instead of 200 ❌ ESCALATE

### 4. Console Errors
**Rule**: If new console errors appear (Uncaught TypeError, network failures), STOP and escalate.

**Examples**:
- `Uncaught TypeError: Cannot read property 'name' of undefined` ❌ ESCALATE
- `Failed to load resource: net::ERR_FAILED` ❌ ESCALATE

### 5. Timeout Exceeds Threshold
**Rule**: If a timeout exceeds 10 seconds after 2 retries, STOP and escalate.

**Examples**:
- API response takes 15 seconds ❌ ESCALATE
- Page load stalls for 20 seconds ❌ ESCALATE

## Escalation Workflow

When the Healer encounters a forbidden change:

1. **Stop autonomous fixing** - Do not attempt further changes
2. **Capture artifacts** - Trace, screenshots, error messages, stack traces
3. **Lookup CODEOWNERS** - Map feature globs to team ownership
4. **Create regression issue** - Use template with all required fields
5. **Notify team** - Slack/email notification to CODEOWNERS

## Regression Issue Template

```markdown
## Shepherd Regression: {FEATURE_KEY}

**Feature Key:** `{FEATURE_KEY}`
**Scenario:** {Failing scenario name}
**Run ID:** {GitHub Actions run ID}
**Commit:** {Git SHA}

### Error Details
```
{Error message}
{Stack trace}
```

### Artifacts
- [Trace](link-to-trace.zip)
- [Screenshot](link-to-screenshot.png)
- [CI Logs](link-to-github-actions-run)

### CODEOWNERS
{List of globs and owners from .github/CODEOWNERS}

### Links
- [Feature Plan](e2e/shepherd/{FEATURE_KEY}/plan.md)
- [Feature Spec](e2e/shepherd/{FEATURE_KEY}/spec.md)

### Action Required
1. Download trace from artifacts
2. Debug failure in Playwright UI (`npx playwright show-trace trace.zip`)
3. Determine if this is a true regression or requirements change
4. If regression: fix the bug
5. If requirements change: update plan.md and spec.md
```

## Decision Tree

```
Test Failure Detected
  ↓
Is it a locator issue? (element exists with equivalent semantics)
  YES → Healer fixes locator ✅
  NO ↓

Is it a timing issue? (element appears after longer wait, ≤10s)
  YES → Healer increases timeout ✅
  NO ↓

Is it a navigation change? (same intent, different route)
  YES → Healer updates navigation ✅
  NO ↓

Is it an acceptance assertion failure?
  YES → ESCALATE ❌
  NO ↓

Is a required UI element missing?
  YES → ESCALATE ❌
  NO ↓

Is there an API semantic change?
  YES → ESCALATE ❌
  NO ↓

Are there new console errors?
  YES → ESCALATE ❌
  NO ↓

Does timeout exceed threshold (>10s)?
  YES → ESCALATE ❌
  NO ↓

Unknown failure → ESCALATE ❌
```
```

### 2. Create scripts/create-shepherd-regression.ts

```typescript
#!/usr/bin/env bun
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Octokit } from '@octokit/rest';

interface RegressionDetails {
	featureKey: string;
	scenario: string;
	errorMessage: string;
	stackTrace: string;
	traceUrl: string;
	screenshotUrl: string;
	runId: string;
	commitSha: string;
}

interface CodeOwner {
	glob: string;
	owners: string[];
}

function parseCodeOwners(): CodeOwner[] {
	const codeownersPath = resolve(
		process.cwd(),
		'.github/CODEOWNERS',
	);
	if (!existsSync(codeownersPath)) {
		return [];
	}

	const content = readFileSync(codeownersPath, 'utf-8');
	const lines = content.split('\n').filter((line) => line.trim() && !line.startsWith('#'));

	return lines.map((line) => {
		const [glob, ...owners] = line.trim().split(/\s+/);
		return { glob, owners };
	});
}

function lookupCodeOwners(featureKey: string): string {
	const configPath = resolve(
		process.cwd(),
		'shepherd.config.json',
	);
	const config = JSON.parse(readFileSync(configPath, 'utf-8'));

	const featureGlobs =
		config.features[featureKey]?.codeOwners?.globs || [];
	const codeOwners = parseCodeOwners();

	const matchedOwners: string[] = [];
	for (const glob of featureGlobs) {
		const owner = codeOwners.find((co) => co.glob === glob);
		if (owner) {
			matchedOwners.push(
				`- \`${glob}\` → ${owner.owners.join(', ')}`,
			);
		}
	}

	return matchedOwners.length > 0
		? matchedOwners.join('\n')
		: '- No CODEOWNERS found';
}

async function createRegressionIssue(
	details: RegressionDetails,
): Promise<void> {
	const octokit = new Octokit({
		auth: process.env.GITHUB_TOKEN,
	});

	const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split(
		'/',
	);
	if (!owner || !repo) {
		throw new Error('GITHUB_REPOSITORY not set');
	}

	const codeOwnersSection = lookupCodeOwners(details.featureKey);

	const issueBody = `
## Shepherd Regression: ${details.featureKey}

**Feature Key:** \`${details.featureKey}\`
**Scenario:** ${details.scenario}
**Run ID:** ${details.runId}
**Commit:** ${details.commitSha}

### Error Details
\`\`\`
${details.errorMessage}

${details.stackTrace}
\`\`\`

### Artifacts
- [Trace](${details.traceUrl})
- [Screenshot](${details.screenshotUrl})
- [CI Logs](https://github.com/${owner}/${repo}/actions/runs/${details.runId})

### CODEOWNERS
${codeOwnersSection}

### Links
- [Feature Plan](e2e/shepherd/${details.featureKey}/plan.md)
- [Feature Spec](e2e/shepherd/${details.featureKey}/spec.md)

### Action Required
1. Download trace from artifacts
2. Debug failure in Playwright UI (\`npx playwright show-trace trace.zip\`)
3. Determine if this is a true regression or requirements change
4. If regression: fix the bug
5. If requirements change: update plan.md and spec.md, re-generate tests
`;

	const issue = await octokit.rest.issues.create({
		owner,
		repo,
		title: `[Shepherd Regression] ${details.featureKey}`,
		body: issueBody,
		labels: ['regression', `shepherd:${details.featureKey}`],
	});

	console.log(`Created regression issue: ${issue.data.html_url}`);
}

// Parse arguments
const args = process.argv.slice(2);
if (args.length < 8) {
	console.error(
		'Usage: create-shepherd-regression.ts <featureKey> <scenario> <errorMessage> <stackTrace> <traceUrl> <screenshotUrl> <runId> <commitSha>',
	);
	process.exit(1);
}

const details: RegressionDetails = {
	featureKey: args[0],
	scenario: args[1],
	errorMessage: args[2],
	stackTrace: args[3],
	traceUrl: args[4],
	screenshotUrl: args[5],
	runId: args[6],
	commitSha: args[7],
};

createRegressionIssue(details).catch((error) => {
	console.error('Failed to create regression issue:', error);
	process.exit(1);
});
```

### 3. Add dependencies

```bash
bun add -d @octokit/rest
```

### 4. Create Healer agent prompt template

```markdown
# Healer Agent Prompt

You are the Healer, an autonomous agent that fixes brittle E2E tests. Your job is to analyze test failures and determine if they are fixable or require escalation.

## Test Failure Context
- **Feature Key**: {FEATURE_KEY}
- **Scenario**: {SCENARIO}
- **Error**: {ERROR_MESSAGE}
- **Trace**: {TRACE_URL}

## Your Responsibilities

1. **Analyze the failure** using the trace and error message
2. **Determine if it's fixable** per the Healer Policy (see e2e/healer-policy.md)
3. **If fixable**: Update the test code (locators, waits, navigation)
4. **If not fixable**: Call escalation script with all required artifacts

## Allowed Changes
- Locators (if element exists with equivalent semantics)
- Wait times (≤ 10s)
- Navigation steps (same intent)
- Helper function usage

## Forbidden Changes (MUST ESCALATE)
- Acceptance assertion failures
- Missing required UI elements
- API semantic changes
- New console errors
- Timeouts > 10s (after 2 retries)

## Escalation Command
```bash
bun scripts/create-shepherd-regression.ts \
  "{FEATURE_KEY}" \
  "{SCENARIO}" \
  "{ERROR_MESSAGE}" \
  "{STACK_TRACE}" \
  "{TRACE_URL}" \
  "{SCREENSHOT_URL}" \
  "{RUN_ID}" \
  "{COMMIT_SHA}"
```

## Decision Process
1. Is the element present but locator changed? → Fix locator ✅
2. Is the element delayed but appears within 10s? → Increase timeout ✅
3. Is the navigation route changed but intent same? → Update navigation ✅
4. Is an acceptance assertion failing? → ESCALATE ❌
5. Is a required element missing? → ESCALATE ❌
6. Unknown failure? → ESCALATE ❌

Remember: When in doubt, ESCALATE. Autonomous fixes should only handle brittle test code, not functional regressions.
```

## Notes

- **CODEOWNERS parsing**: Script parses `.github/CODEOWNERS` and matches globs from `shepherd.config.json`
- **Trace viewing**: Use `npx playwright show-trace trace.zip` to debug failures
- **Escalation threshold**: 2 retries max before escalation
- **Artifact retention**: Traces/screenshots stored 14 days in nightly, 7 days in PR
- **Healer agent**: Separate agent with access to Healer Policy doc and escalation script

## References

- [Playwright Traces](https://playwright.dev/docs/trace-viewer)
- [GitHub CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Octokit REST API](https://octokit.github.io/rest.js/)
- PRD.md - REQ-FSH-010
