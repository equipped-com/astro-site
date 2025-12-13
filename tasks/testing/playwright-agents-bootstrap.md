# Integrate Playwright Agents with E2E Stack

## Description

Integrate **Playwright Agents** (Planner, Generator, Healer) into the existing Playwright E2E infrastructure. Playwright Agents use Claude to automatically plan, generate, and heal end-to-end tests based on feature contracts.

This task initializes Playwright Agents, configures the agent workflow, and wires them into our existing `e2e/` directory structure and `playwright.config.ts` setup.

## Dependencies

- `testing/setup-playwright` - Base Playwright E2E configuration (DONE)
- `testing/feature-shepherd-contracts` - Feature contract structure must exist

## Acceptance Criteria

- [ ] Playwright Agents installed via `npx playwright init-agents --loop=claude`
- [ ] Agent definitions generated in `.github/` directory
- [ ] `.github/workflows/shepherd-agents.yml` created for agent orchestration
- [ ] Bun scripts added to `package.json`:
  - [ ] `shepherd:plan -- <featureKey>` - Invoke Planner agent
  - [ ] `shepherd:generate -- <featureKey>` - Invoke Generator agent
  - [ ] `shepherd:heal -- <featureKey>` - Invoke Healer agent
  - [ ] `shepherd:regen -- <featureKey>` - Full regeneration (plan → generate → heal)
- [ ] Agent configuration enforces:
  - [ ] Read permissions: `features/**`, `e2e/fixtures/**`, `playwright.config.ts`
  - [ ] Write permissions: `features/{FEATURE_KEY}/plan.md`, `features/{FEATURE_KEY}/report.md`, `e2e/shepherd/{FEATURE_KEY}/**`
  - [ ] No write access to other directories (enforced via workflow permissions)
- [ ] Agents use existing `playwright.config.ts` (headless browsers, retries, traces)
- [ ] Generated tests include metadata headers (featureKey, scenario, requirements, planSource)
- [ ] Post-run verification: `git diff --exit-code` on non-allowed paths (fails if agents wrote outside bounds)

## Test Criteria

```gherkin
Feature: Playwright Agents Integration
  As a testing workflow owner
  I want Planner, Generator, and Healer wired into our Playwright stack
  So that shepherd suites can be created and maintained automatically

  @REQ-FSH-002
  Scenario: Initialize Playwright Agents
    When I run "npx playwright init-agents --loop=claude"
    Then agent definitions should be created in .github/ directory
    And the agents should be configured to work with our directory structure

  @REQ-FSH-002
  Scenario: Planner generates test plan
    Given features/example/ contract files exist (prd.md, acceptance.md, data.md, shepherd.config.json)
    When I run "bun run shepherd:plan -- example"
    Then features/example/plan.md should be created
    And plan.md should contain test scenarios in Markdown format
    And plan.md should reference requirements from acceptance.md

  @REQ-FSH-002
  Scenario: Generator creates test files from plan
    Given features/example/plan.md exists
    When I run "bun run shepherd:generate -- example"
    Then e2e/shepherd/example/ directory should be created
    And e2e/shepherd/example/seed.spec.ts should exist (bootstrap test)
    And at least one scenario test file should exist
    And generated tests should use shared fixtures from e2e/fixtures/

  @REQ-FSH-002
  Scenario: Healer debugs and fixes failing tests
    Given e2e/shepherd/example/seed.spec.ts exists but is failing
    When I run "bun run shepherd:heal -- example"
    Then the Healer should inspect the UI
    And update locators if elements changed
    And retry tests until they pass or max retries reached

  @REQ-FSH-002
  Scenario: Agents respect write boundaries
    Given Playwright Agents are configured
    When I run "bun run shepherd:regen -- example"
    Then agents should only write to features/example/ and e2e/shepherd/example/
    And no files outside those paths should be modified
    And git diff verification should pass

  @REQ-FSH-012
  Scenario: Generated tests include metadata headers
    Given Generator creates e2e/shepherd/example/scenario.spec.ts
    Then the file should include a metadata header comment
    And the header should contain @featureKey example
    And the header should contain @scenario
    And the header should contain @requirements with REQ-* tags
    And the header should contain @planSource with plan.md commit hash
```

## Implementation

### 1. Install Playwright Agents

Run the official CLI to initialize agents:

```bash
npx playwright init-agents --loop=claude
```

This creates agent definitions in `.github/` directory and sets up the agent workflow.

**Note:** Review the generated files and customize as needed for our repo structure.

### 2. Agent Directory Structure

After initialization, the structure should look like:

```
repo/
  .github/
    workflows/
      shepherd-agents.yml          # Agent orchestration workflow (generated + customized)
  features/{FEATURE_KEY}/
    prd.md                         # Input: Feature requirements
    acceptance.md                  # Input: Acceptance criteria
    data.md                        # Input: Test data
    risks.md                       # Input: Known risks
    shepherd.config.json           # Input: Entry URLs, roles, flags
    plan.md                        # Output: Generated by Planner (Markdown test plan)
    report.md                      # Output: Generated by Agents (coverage report)
  e2e/
    fixtures/                      # Shared helpers and auth fixtures
    shepherd/{FEATURE_KEY}/        # Output: Generated tests for each feature
      seed.spec.ts                 # Bootstrap test (environment setup)
      *.spec.ts                    # Generated test files
  playwright.config.ts             # Existing Playwright configuration (reused)
```

### 3. Add Bun Scripts to package.json

```json
{
  "scripts": {
    "shepherd:plan": "bun scripts/shepherd-plan.ts",
    "shepherd:generate": "bun scripts/shepherd-generate.ts",
    "shepherd:heal": "bun scripts/shepherd-heal.ts",
    "shepherd:regen": "bun scripts/shepherd-regen.ts"
  }
}
```

### 4. Planner Script: scripts/shepherd-plan.ts

```typescript
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function runPlanner(featureKey: string): void {
	const featurePath = join(process.cwd(), 'features', featureKey);

	if (!existsSync(featurePath)) {
		console.error(`❌ Feature contract not found: features/${featureKey}/`);
		console.error(`   Run: bun scripts/create-shepherd-feature.ts ${featureKey}`);
		process.exit(1);
	}

	// Validate contract before planning
	try {
		execSync(`bun scripts/validate-shepherd-contract.ts ${featureKey}`, {
			stdio: 'inherit',
		});
	} catch {
		console.error(`❌ Feature contract validation failed for "${featureKey}"`);
		process.exit(1);
	}

	console.log(`🤖 Invoking Planner agent for feature "${featureKey}"...`);

	// Invoke Planner agent via GitHub Actions or local CLI
	// This will generate features/{FEATURE_KEY}/plan.md
	try {
		execSync(
			`gh workflow run shepherd-agents.yml --ref main -f agent=planner -f featureKey=${featureKey}`,
			{ stdio: 'inherit' },
		);
		console.log(`✅ Planner agent invoked. Check features/${featureKey}/plan.md when complete.`);
	} catch (error) {
		console.error(`❌ Failed to invoke Planner agent: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
}

// CLI entry point
const featureKey = process.argv[2];
if (!featureKey) {
	console.error('Usage: bun run shepherd:plan -- <featureKey>');
	process.exit(1);
}

runPlanner(featureKey);
```

### 5. Generator Script: scripts/shepherd-generate.ts

```typescript
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function runGenerator(featureKey: string): void {
	const planPath = join(process.cwd(), 'features', featureKey, 'plan.md');

	if (!existsSync(planPath)) {
		console.error(`❌ Test plan not found: features/${featureKey}/plan.md`);
		console.error(`   Run: bun run shepherd:plan -- ${featureKey}`);
		process.exit(1);
	}

	console.log(`🤖 Invoking Generator agent for feature "${featureKey}"...`);

	// Invoke Generator agent
	// This will generate e2e/shepherd/{FEATURE_KEY}/*.spec.ts
	try {
		execSync(
			`gh workflow run shepherd-agents.yml --ref main -f agent=generator -f featureKey=${featureKey}`,
			{ stdio: 'inherit' },
		);
		console.log(`✅ Generator agent invoked. Check e2e/shepherd/${featureKey}/ when complete.`);
	} catch (error) {
		console.error(`❌ Failed to invoke Generator agent: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
}

// CLI entry point
const featureKey = process.argv[2];
if (!featureKey) {
	console.error('Usage: bun run shepherd:generate -- <featureKey>');
	process.exit(1);
}

runGenerator(featureKey);
```

### 6. Healer Script: scripts/shepherd-heal.ts

```typescript
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function runHealer(featureKey: string): void {
	const shepherdPath = join(process.cwd(), 'e2e', 'shepherd', featureKey);

	if (!existsSync(shepherdPath)) {
		console.error(`❌ Shepherd suite not found: e2e/shepherd/${featureKey}/`);
		console.error(`   Run: bun run shepherd:generate -- ${featureKey}`);
		process.exit(1);
	}

	console.log(`🤖 Invoking Healer agent for feature "${featureKey}"...`);

	// Invoke Healer agent
	// This will debug and fix failing tests in e2e/shepherd/{FEATURE_KEY}/
	try {
		execSync(
			`gh workflow run shepherd-agents.yml --ref main -f agent=healer -f featureKey=${featureKey}`,
			{ stdio: 'inherit' },
		);
		console.log(`✅ Healer agent invoked. Check e2e/shepherd/${featureKey}/ for updated tests.`);
	} catch (error) {
		console.error(`❌ Failed to invoke Healer agent: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
}

// CLI entry point
const featureKey = process.argv[2];
if (!featureKey) {
	console.error('Usage: bun run shepherd:heal -- <featureKey>');
	process.exit(1);
}

runHealer(featureKey);
```

### 7. Regeneration Script: scripts/shepherd-regen.ts

```typescript
import { execSync } from 'node:child_process';

function regenerateShepherd(featureKey: string): void {
	console.log(`🔄 Regenerating shepherd suite for "${featureKey}"...`);
	console.log('   Step 1/3: Planning...');

	try {
		execSync(`bun run shepherd:plan -- ${featureKey}`, { stdio: 'inherit' });
	} catch (error) {
		console.error(`❌ Planner failed: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}

	// Wait for plan generation (GitHub Actions workflow)
	console.log('   Waiting for plan generation... (this may take a few minutes)');
	console.log('   Step 2/3: Generating tests...');

	try {
		execSync(`bun run shepherd:generate -- ${featureKey}`, { stdio: 'inherit' });
	} catch (error) {
		console.error(`❌ Generator failed: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}

	console.log('   Step 3/3: Healing tests...');

	try {
		execSync(`bun run shepherd:heal -- ${featureKey}`, { stdio: 'inherit' });
	} catch (error) {
		console.error(`❌ Healer failed: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}

	console.log(`✅ Shepherd suite regenerated for "${featureKey}"`);
	console.log(`   Plan: features/${featureKey}/plan.md`);
	console.log(`   Tests: e2e/shepherd/${featureKey}/`);
	console.log(`   Report: features/${featureKey}/report.md`);
}

// CLI entry point
const featureKey = process.argv[2];
if (!featureKey) {
	console.error('Usage: bun run shepherd:regen -- <featureKey>');
	process.exit(1);
}

regenerateShepherd(featureKey);
```

### 8. GitHub Actions Workflow: .github/workflows/shepherd-agents.yml

```yaml
name: Shepherd Agents

on:
  workflow_dispatch:
    inputs:
      agent:
        description: 'Agent to run (planner, generator, healer)'
        required: true
        type: choice
        options:
          - planner
          - generator
          - healer
      featureKey:
        description: 'Feature key (e.g., checkout, auth)'
        required: true
        type: string

permissions:
  contents: write  # Agents can commit plan.md, report.md, test files
  issues: write    # Healer can file regression issues

jobs:
  run-agent:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Install Playwright browsers
        run: bunx playwright install --with-deps chromium

      - name: Validate feature contract
        if: inputs.agent == 'planner'
        run: bun scripts/validate-shepherd-contract.ts ${{ inputs.featureKey }}

      - name: Run Planner Agent
        if: inputs.agent == 'planner'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # TODO: Invoke Planner agent using Playwright Agents CLI
          # Generates features/{FEATURE_KEY}/plan.md
          echo "Planner agent not yet implemented"
          exit 1

      - name: Run Generator Agent
        if: inputs.agent == 'generator'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # TODO: Invoke Generator agent using Playwright Agents CLI
          # Generates e2e/shepherd/{FEATURE_KEY}/*.spec.ts
          echo "Generator agent not yet implemented"
          exit 1

      - name: Run Healer Agent
        if: inputs.agent == 'healer'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # TODO: Invoke Healer agent using Playwright Agents CLI
          # Debugs and fixes tests in e2e/shepherd/{FEATURE_KEY}/
          echo "Healer agent not yet implemented"
          exit 1

      - name: Verify agent write boundaries
        run: |
          # Fail if agents wrote outside allowed paths
          git diff --exit-code -- ':!features' ':!e2e/shepherd'

      - name: Commit agent changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add features/${{ inputs.featureKey }}/ e2e/shepherd/${{ inputs.featureKey }}/
          git diff --cached --quiet || git commit -m "feat(shepherd): ${{ inputs.agent }} run for ${{ inputs.featureKey }}"
          git push
```

### 9. Metadata Header Generation

Generated tests must include metadata headers for traceability (REQ-FSH-012):

```typescript
/**
 * @featureKey checkout
 * @scenario add-item-to-cart
 * @requirements REQ-FSH-005, REQ-CHECKOUT-003
 * @planSource features/checkout/plan.md@abc123
 * @seedTest e2e/shepherd/checkout/seed.spec.ts
 * @generatedAt 2025-12-13T10:30:00Z
 * @lastHealed never
 */

import { test, expect } from '@playwright/test';

test.describe('Checkout - Add Item to Cart', () => {
	test('user can add item to cart', async ({ page }) => {
		// Test implementation
	});
});
```

The Generator agent should:
1. Read `plan.md` to extract requirements
2. Get current git commit hash of `plan.md`
3. Include these in the header comment
4. Update `@lastHealed` timestamp when Healer modifies the test

## Files

### New Files Created

- `.github/workflows/shepherd-agents.yml` - Agent orchestration workflow
- `scripts/shepherd-plan.ts` - Planner invocation script
- `scripts/shepherd-generate.ts` - Generator invocation script
- `scripts/shepherd-heal.ts` - Healer invocation script
- `scripts/shepherd-regen.ts` - Full regeneration script

### Files Modified

- `package.json` - Add shepherd scripts (plan, generate, heal, regen)

### Files Generated by Agents (not committed initially)

- `features/{FEATURE_KEY}/plan.md` - Generated by Planner
- `features/{FEATURE_KEY}/report.md` - Generated by Agents
- `e2e/shepherd/{FEATURE_KEY}/seed.spec.ts` - Generated by Generator
- `e2e/shepherd/{FEATURE_KEY}/*.spec.ts` - Generated by Generator

## Notes

- **Playwright Agents documentation**: https://playwright.dev/docs/test-agents is the source of truth
- The `.github/workflows/shepherd-agents.yml` is a **template** - actual agent invocation commands will be finalized after researching Playwright Agents CLI
- Agents run via GitHub Actions workflow (not locally) to ensure consistent environment
- `ANTHROPIC_API_KEY` must be configured as a repository secret
- Initial implementation generates TODO placeholders - actual agent integration requires Playwright Agents research
- Generated tests should reuse fixtures from `e2e/fixtures/shepherd.ts` (created in next task)

## References

- `documentation/PRDs/feature-shepherds.md` - Full PRD (REQ-FSH-002, REQ-FSH-012)
- Playwright Agents documentation - https://playwright.dev/docs/test-agents
- `tasks/testing/setup-playwright.md` - Existing Playwright setup
- `tasks/testing/feature-shepherd-contracts.md` - Feature contract structure
