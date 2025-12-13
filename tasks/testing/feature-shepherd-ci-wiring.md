# Feature Shepherd CI Wiring

## Description

Implement CI/CD logic that intelligently maps changed files to Feature Shepherd test suites and orchestrates PR vs nightly test execution. This ensures impacted shepherds run on PRs (blocking) while nightly runs execute all shepherds with regression escalation.

## Dependencies

- `testing/setup-playwright` - Playwright infrastructure (DONE)
- `testing/feature-shepherd-contracts` - Shepherd config structure (PENDING)
- `testing/playwright-agents-bootstrap` - Agent-based test generator (PENDING)

## Acceptance Criteria

- [ ] `shepherd.config.json` defines feature-to-code mappings (codeOwners.globs, routePrefixes, labels)
- [ ] CI selection logic implemented: changed files intersect globs OR feature contract changed OR PR labels match
- [ ] PR workflow runs impacted shepherds only (blocking)
- [ ] PR workflow includes 2 retries per test
- [ ] PR workflow generates trace/screenshot artifacts on failure
- [ ] Nightly workflow runs all shepherds (non-blocking but alerting)
- [ ] Nightly workflow creates GitHub issues for failures with feature key, traces, CODEOWNERS
- [ ] Slack/email notifications configured for nightly failures
- [ ] GitHub Actions workflows created (.github/workflows/shepherd-pr.yml, shepherd-nightly.yml)
- [ ] Tests follow Gherkin-to-code pattern with @REQ-FSH-008 and @REQ-FSH-009 traceability

## Test Criteria

```gherkin
Feature: Feature Shepherd CI Wiring
  @REQ-FSH-008
  Scenario: PR workflow selects impacted shepherds based on changed files
    Given a PR modifies src/components/auth/SignInButton.tsx
    And shepherd.config.json maps src/components/auth/** to auth feature
    When the PR CI workflow runs
    Then the auth shepherd test suite is executed
    And non-impacted shepherds are skipped
    And the PR check is marked as required

  @REQ-FSH-008
  Scenario: PR workflow runs shepherd when feature contract changes
    Given a PR modifies e2e/shepherd/auth/shepherd.config.json
    When the PR CI workflow runs
    Then the auth shepherd test suite is executed
    And the PR check is marked as required

  @REQ-FSH-008
  Scenario: PR workflow selects shepherd based on label
    Given a PR has label shepherd:checkout
    When the PR CI workflow runs
    Then the checkout shepherd test suite is executed
    And the PR check is marked as required

  @REQ-FSH-009
  Scenario: PR workflow retries failed tests
    Given a PR triggers the auth shepherd
    And a test fails on first run
    When the PR workflow retries the test
    Then up to 2 retries are attempted
    And trace/screenshot artifacts are uploaded on final failure

  @REQ-FSH-009
  Scenario: Nightly workflow runs all shepherds
    Given the nightly cron job triggers at 2 AM UTC
    When the workflow executes
    Then all shepherd test suites run
    And failures do not block the workflow
    And GitHub issues are created for failures
    And Slack notifications are sent

  @REQ-FSH-009
  Scenario: Nightly workflow creates regression issues
    Given the auth shepherd fails in nightly run
    When the workflow completes
    Then a GitHub issue is created with:
      | Field          | Value                          |
      | Title          | [Shepherd Regression] auth     |
      | Labels         | regression, shepherd:auth      |
      | Body contains  | Feature key, trace zip, CODEOWNERS |
    And the issue is assigned to CODEOWNERS
    And Slack notification is sent to #engineering

  @REQ-FSH-008
  Scenario: CI detects code change in multiple features
    Given a PR modifies src/lib/api-client.ts
    And shepherd.config.json maps src/lib/** to [auth, checkout, fleet]
    When the PR CI workflow runs
    Then auth, checkout, and fleet shepherds are executed
    And the PR check requires all three to pass
```

## Implementation

### 1. Create shepherd.config.json

```json
{
  "version": 1,
  "features": {
    "auth": {
      "codeOwners": {
        "globs": [
          "src/components/auth/**",
          "src/lib/clerk/**",
          "src/api/routes/auth/**"
        ]
      },
      "routePrefixes": ["/sign-in", "/sign-up", "/dashboard"],
      "labels": ["shepherd:auth"]
    },
    "checkout": {
      "codeOwners": {
        "globs": [
          "src/components/checkout/**",
          "src/api/routes/cart/**",
          "src/lib/stripe/**"
        ]
      },
      "routePrefixes": ["/checkout", "/cart"],
      "labels": ["shepherd:checkout"]
    },
    "fleet": {
      "codeOwners": {
        "globs": [
          "src/components/fleet/**",
          "src/api/routes/devices/**"
        ]
      },
      "routePrefixes": ["/fleet", "/devices"],
      "labels": ["shepherd:fleet"]
    }
  }
}
```

### 2. Create GitHub Actions workflow - .github/workflows/shepherd-pr.yml

```yaml
name: Feature Shepherds (PR)

on:
  pull_request:
    types: [opened, synchronize, reopened, labeled]

jobs:
  detect-impacted-shepherds:
    name: Detect Impacted Shepherds
    runs-on: ubuntu-latest
    outputs:
      shepherds: ${{ steps.detect.outputs.shepherds }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: oven-sh/setup-bun@v2

      - name: Detect Impacted Shepherds
        id: detect
        run: |
          # Get changed files
          CHANGED_FILES=$(git diff --name-only ${{ github.event.pull_request.base.sha }} ${{ github.sha }})

          # Run detection script
          SHEPHERDS=$(bun scripts/detect-impacted-shepherds.ts "$CHANGED_FILES" "${{ github.event.pull_request.labels.*.name }}")
          echo "shepherds=$SHEPHERDS" >> $GITHUB_OUTPUT

  run-shepherds:
    name: Run Shepherd - ${{ matrix.shepherd }}
    runs-on: ubuntu-latest
    needs: detect-impacted-shepherds
    if: needs.detect-impacted-shepherds.outputs.shepherds != '[]'
    strategy:
      fail-fast: false
      matrix:
        shepherd: ${{ fromJSON(needs.detect-impacted-shepherds.outputs.shepherds) }}

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - uses: actions/setup-node@v4

      - name: Install Dependencies
        run: bun install

      - name: Install Playwright Browsers
        run: bunx playwright install --with-deps chromium

      - name: Run Shepherd Test Suite
        run: bun run test:e2e -- e2e/shepherd/${{ matrix.shepherd }}
        env:
          CI: true
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
          CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}
        continue-on-error: false
        timeout-minutes: 10

      - name: Upload Artifacts on Failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: shepherd-${{ matrix.shepherd }}-traces
          path: |
            playwright-report/
            test-results/
          retention-days: 7

      - name: Retry on Failure (Attempt 1)
        if: failure()
        run: bun run test:e2e -- e2e/shepherd/${{ matrix.shepherd }}
        env:
          CI: true
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
          CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}
        continue-on-error: true

      - name: Retry on Failure (Attempt 2)
        if: failure()
        run: bun run test:e2e -- e2e/shepherd/${{ matrix.shepherd }}
        env:
          CI: true
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
          CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}
        continue-on-error: false
```

### 3. Create GitHub Actions workflow - .github/workflows/shepherd-nightly.yml

```yaml
name: Feature Shepherds (Nightly)

on:
  schedule:
    - cron: '0 2 * * *' # 2 AM UTC daily
  workflow_dispatch: # Manual trigger

jobs:
  run-all-shepherds:
    name: Run Shepherd - ${{ matrix.shepherd }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shepherd: [auth, checkout, fleet]

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - uses: actions/setup-node@v4

      - name: Install Dependencies
        run: bun install

      - name: Install Playwright Browsers
        run: bunx playwright install --with-deps chromium

      - name: Run Shepherd Test Suite
        id: test
        run: bun run test:e2e -- e2e/shepherd/${{ matrix.shepherd }}
        env:
          CI: true
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
          CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}
        continue-on-error: true
        timeout-minutes: 10

      - name: Upload Traces and Screenshots
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: shepherd-${{ matrix.shepherd }}-traces-${{ github.run_id }}
          path: |
            playwright-report/
            test-results/
          retention-days: 14

      - name: Create Regression Issue on Failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const shepherdConfig = JSON.parse(fs.readFileSync('shepherd.config.json', 'utf8'));
            const feature = '${{ matrix.shepherd }}';
            const codeOwners = shepherdConfig.features[feature]?.codeOwners?.globs || [];

            // Extract CODEOWNERS from globs
            const codeownersPath = '.github/CODEOWNERS';
            let owners = '@equipped-com/engineering'; // Default
            if (fs.existsSync(codeownersPath)) {
              const codeownersContent = fs.readFileSync(codeownersPath, 'utf8');
              // Parse CODEOWNERS file to find matching owners
              // Simplified - should parse properly in production
            }

            const issueBody = `
            ## Shepherd Regression: ${feature}

            **Feature Key:** \`${feature}\`
            **Run ID:** ${{ github.run_id }}
            **Commit:** ${{ github.sha }}

            ### Artifacts
            - [Trace & Screenshots](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})

            ### CODEOWNERS
            ${codeOwners.map(g => `- \`${g}\``).join('\n')}

            ### Links
            - [Feature Plan](e2e/shepherd/${feature}/plan.md)
            - [Feature Spec](e2e/shepherd/${feature}/spec.md)

            ### Action Required
            1. Download trace from artifacts
            2. Debug failure in Playwright UI
            3. Update plan.md if requirements changed
            4. Fix regression or update acceptance criteria
            `;

            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `[Shepherd Regression] ${feature}`,
              body: issueBody,
              labels: ['regression', `shepherd:${feature}`],
              assignees: [owners.replace('@equipped-com/', '').split(',')[0]] // Simplified
            });

      - name: Send Slack Notification on Failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚨 Shepherd Regression: ${{ matrix.shepherd }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Shepherd Regression*\n\n*Feature:* ${{ matrix.shepherd }}\n*Run:* <https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Logs>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 4. Create detection script - scripts/detect-impacted-shepherds.ts

```typescript
#!/usr/bin/env bun
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import minimatch from 'minimatch';

interface ShepherdConfig {
	version: number;
	features: Record<
		string,
		{
			codeOwners: { globs: string[] };
			routePrefixes: string[];
			labels: string[];
		}
	>;
}

function detectImpactedShepherds(
	changedFiles: string[],
	prLabels: string[],
): string[] {
	const configPath = resolve(process.cwd(), 'shepherd.config.json');
	const config: ShepherdConfig = JSON.parse(
		readFileSync(configPath, 'utf-8'),
	);

	const impactedShepherds = new Set<string>();

	for (const [featureKey, featureConfig] of Object.entries(
		config.features,
	)) {
		// Check if any changed file matches feature globs
		const matchesGlob = changedFiles.some((file) =>
			featureConfig.codeOwners.globs.some((glob) =>
				minimatch(file, glob),
			),
		);

		// Check if feature contract changed
		const contractChanged = changedFiles.some((file) =>
			file.startsWith(`e2e/shepherd/${featureKey}/`),
		);

		// Check if PR has matching label
		const hasLabel = prLabels.some((label) =>
			featureConfig.labels.includes(label),
		);

		if (matchesGlob || contractChanged || hasLabel) {
			impactedShepherds.add(featureKey);
		}
	}

	return Array.from(impactedShepherds);
}

// Parse arguments
const changedFilesArg = process.argv[2] || '';
const prLabelsArg = process.argv[3] || '';

const changedFiles = changedFilesArg
	.split('\n')
	.filter((f) => f.trim().length > 0);
const prLabels = prLabelsArg
	.split(',')
	.map((l) => l.trim())
	.filter((l) => l.length > 0);

const shepherds = detectImpactedShepherds(changedFiles, prLabels);

// Output JSON array for GitHub Actions matrix
console.log(JSON.stringify(shepherds));
```

### 5. Add dependencies

```bash
bun add -d minimatch @types/minimatch
```

## Notes

- **Required secrets**: CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, SLACK_WEBHOOK_URL
- **CODEOWNERS parsing**: Simplified in example, should properly parse .github/CODEOWNERS
- **Nightly schedule**: Runs at 2 AM UTC to avoid peak hours
- **Artifact retention**: PR artifacts kept 7 days, nightly 14 days
- **Retry logic**: PR retries twice on failure, nightly creates issues immediately

## References

- [GitHub Actions - Matrix Strategy](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- [Playwright CI](https://playwright.dev/docs/ci)
- PRD.md - REQ-FSH-008, REQ-FSH-009
