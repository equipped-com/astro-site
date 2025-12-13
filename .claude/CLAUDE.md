# tryequipped Landing Page

Landing page for Equipped - an IT asset management and device provisioning platform.

**Tagline:** "All things tech, one monthly fee. It's that simple."

## Tech Stack

- **Astro 5** - Static site generator
- **Tailwind CSS v4** - Vite plugin (NOT PostCSS)
- **React 19** - Interactive components (infinite-slider, progressive-blur)
- **Framer Motion** - Animations
- **Sharp** - Image optimization
- **CloudFlare Workers** - Edge deployment with custom headers
- **Biome** - Linting + formatting

## Key Files

- `src/pages/index.astro` - Main landing page
- `src/components/hero/HeroSection.astro` - Hero with CSS Ken Burns
- `src/components/sections/` - FeatureCard, TestimonialCard, StatCard
- `src/components/ui/` - infinite-slider, progressive-blur
- `src/worker.ts` - CloudFlare Worker for cache/security headers
- `src/styles/global.css` - Theme variables and animations

## Commands

```bash
# Development & Building
bun run dev      # Dev server at localhost:4321
bun run build    # Production build
bun run deploy   # Deploy to CloudFlare Workers
bun run check    # Biome linting

# Testing (HIGH PRIORITY)
bun run test                 # Run all tests once
bun run test:watch           # Watch mode (recommended for dev)
bun run test:coverage        # Generate coverage report
bun run test:ui              # Visual UI dashboard
```

**IMPORTANT:** Use `bun` instead of `npm` for faster execution. Falls back to `npm` if bun not available.
- **ALWAYS use `bun run test`** - NEVER use `bun test` (uses Bun's built-in test runner which fails with errors)
- `bun run test` uses Vitest with proper configuration (tests passing)
- A failsafe in `bunfig.toml` will block `bun test` with an error message

## Dependency Management

**NEVER modify `package.json` directly.** Always use package manager commands:

```bash
bun add <package>       # Add dependency
bun add -d <package>    # Add dev dependency
bun remove <package>    # Remove dependency
bun install             # Install after git pull
```

This ensures `package.json` and `bun.lock` stay in sync and prevents version conflicts.

## Design Guidelines

- **Colors:** Black primary, pastel accents, clean whites (oklch color system)
- **Style:** Professional, clean, small rounded corners
- **No:** Colored shadow boxes, heavy gradients, busy backgrounds

## Code Style

- Use **tabs** for indentation
- Use **kebab-case** for file names
- Prefer **functional style** with ternary operators and `.map()`
- Use **real functions** instead of arrow functions where applicable
- Use **standard shadcn/ui color names** (primary, secondary, muted, accent)
- **ALWAYS use TypeScript** - No plain JavaScript files allowed
  - All new files must be `.ts` or `.tsx`
  - Rewrite any existing `.js` files to TypeScript when touching them
  - Strict mode enabled - no `any` types unless absolutely necessary

## Code Preferences

- **NO AXIOS**: Use native `fetch()` for HTTP requests - no extra dependencies needed
- **NO BACKWARDS COMPATIBILITY HACKS**: Fix it right, don't maintain broken patterns alongside new ones
- **QUESTION EVERY LAYER**: Before adding abstraction, ask "what does this hide?"
  - Good: hides complexity, reduces coupling
  - Bad: just passes data through, exists because it "feels proper"
- **STREAMING FOR LARGE DATA**: Use streaming patterns instead of accumulating arrays in memory
- **COMMENTS ONLY FOR COMPLEXITY**: Use clear variable/function names; add comments only where logic isn't self-evident

## Biome Linting - CRITICAL

When Biome reports lint errors:

1. **DO NOT run `biome check` repeatedly** - this only reports errors
2. **Apply fixes immediately**:
   ```bash
   bunx biome check --write <files>           # Safe fixes
   bunx biome check --write --unsafe <files>  # All fixes (use when safe)
   ```
3. **If stuck in a check loop** - STOP and apply fixes instead of checking again

**Common pattern to avoid**:
```bash
bunx biome check file.ts  # Reports errors
bunx biome check file.ts  # Still has errors (no progress!)
bunx biome check file.ts  # Infinite loop...
```

**Correct pattern**:
```bash
bunx biome check file.ts                   # Identify errors
bunx biome check --write --unsafe file.ts  # Fix them
bunx biome check file.ts                   # Verify clean
```

## Testing Strategy - MANDATORY

**Tests are NOT optional. All code must be tested.**

### Testing Philosophy

Tests serve THREE critical purposes:
1. **Regression prevention** - Catch breaking changes before production
2. **Living documentation** - Tests show exactly how code should behave
3. **Refactoring confidence** - Safe to improve code with test coverage

### Test Types & Framework

- **Unit Tests** - Vitest - Individual functions, utilities, components
- **Integration Tests** - Vitest - API endpoints, multi-component flows, database interactions
- **E2E Tests** - Playwright (future) - Critical user journeys
- **Regression Tests** - Vitest - Every bug fix gets a test to prevent reoccurrence

### Coverage Requirements

**MINIMUM (enforced in CI/CD):**
- Functions: **90%**
- Lines: **85%**
- Branches: **80%**
- Statements: **85%**

**TARGET:**
- Core features (auth, checkout, payments): **95%**
- Utilities & helpers: **100%**
- API endpoints: **90%+**
- React components: **80%+**

### When to Write Tests

**REQUIRED - Do not commit without tests:**
- [ ] **Every bug fix** (especially security bugs, auth, payments)
- [ ] **Every API endpoint**
- [ ] **Every auth/permission check**
- [ ] **Every state management change**
- [ ] **Every form submission**

**STRONGLY RECOMMENDED:**
- [ ] React components (especially with state/effects)
- [ ] Utility functions used in multiple places
- [ ] Complex business logic
- [ ] Integration between systems

**OPTIONAL (but appreciated):**
- [ ] Simple presentational components (text labels, styled divs)
- [ ] One-off scripts that won't be reused

### Test Quality Requirements

**Good test:**
```typescript
// ✅ GOOD: Describes behavior, tests edge cases, easy to understand
describe('Checkout Assignment', () => {
	it('should disable Continue button until a person is assigned', () => {
		render(<AssignmentStage />)
		expect(screen.getByText('Continue')).toBeDisabled()

		fireEvent.click(screen.getByText('Assign to someone'))
		expect(screen.getByText('Continue')).toBeDisabled() // Still disabled

		fireEvent.click(screen.getByText('Alice'))
		expect(screen.getByText('Continue')).toBeEnabled() // Now enabled
	})
})
```

**Bad test:**
```typescript
// ❌ BAD: Vague, hard to understand what it's testing
describe('AssignmentStage', () => {
	it('works correctly', () => {
		const { container } = render(<AssignmentStage />)
		fireEvent.click(container.querySelector('button'))
		// ... unclear what this tests
	})
})
```

### Regression Test Pattern

Every bug fix gets a regression test:

```typescript
/**
 * REGRESSION TEST
 * Issue: [GH-123 or JIRA-456]
 * Description: [What was broken]
 * Fix: [How was it fixed]
 */
describe('Trade-In Valuation [REGRESSION]', () => {
	// Issue: GH-45 - Zero-value devices showed "Error"
	it('should show "Recycle for Free" for zero-value devices', () => {
		const valuation = valuateDevice({ model: 'old-iphone', condition: 'poor' })
		expect(valuation.value).toBe(0)
		expect(valuation.message).toContain('Recycle for Free')
	})
})
```

### Test Organization

```
src/
├── components/
│   ├── Spinner.tsx
│   └── Spinner.test.tsx      # Co-located with component
├── api/
│   ├── auth-middleware.ts
│   └── auth-middleware.test.ts
├── lib/
│   ├── utils.ts
│   └── utils.test.ts
└── test/                       # Shared test utilities
    ├── setup.ts               # Test configuration
    └── fixtures.ts            # Mock data
```

### Running Tests in Development

```bash
# Watch mode - tests re-run on file changes (RECOMMENDED)
bun run test:watch

# Single run
bun run test

# Coverage report
bun run test:coverage

# Visual dashboard
bun run test:ui

# Specific test file
bun run test:watch -- src/components/Spinner.test.tsx
```

### Test Documentation

Checkout the testing tasks for comprehensive patterns:
- `tasks/testing/setup-vitest.md` - Framework setup & examples
- `tasks/testing/auth-tests.md` - Auth system testing
- `tasks/testing/integration-tests.md` - API & multi-component testing
- `tasks/testing/regression-tests.md` - Bug fix verification

### Test Responsibility - CRITICAL

**Agents MUST take ownership of test quality. Passing tests are a requirement, not a suggestion.**

#### After Making Changes

**MANDATORY: Run tests before marking work complete**

```bash
# Run all tests
bun run test

# Or run specific tests affected by your changes
bun run test -- path/to/affected/test.test.tsx
```

**You MUST verify tests pass after:**
- Code changes (even "small" ones)
- Dependency updates
- Configuration changes (tsconfig, vite, astro.config, etc.)
- Refactoring
- Bug fixes

#### Scope of Responsibility

**1. File-level changes (components, utilities, APIs)**
   - Run tests for the specific files you modified
   - Run tests for files that import your changed files
   - Example: If you modify `src/lib/utils.ts`, run tests that import it

**2. Configuration/global changes (tsconfig, vite, build config)**
   - Run **ALL tests** - you are responsible for the entire test suite
   - Global changes can break anything, anywhere
   - No exceptions

**3. Dependency changes (package.json, lockfile)**
   - Run **ALL tests** - dependency updates can have wide-reaching effects
   - Check for breaking changes in upgrade guides
   - Test both unit tests and build process

#### Ownership Rules

**DO NOT blame other agents unless proven innocent:**
- If a test fails after your changes, assume it's your fault first
- Debug the failure thoroughly before claiming "it was already broken"
- Check git history: `git log --oneline -- path/to/test.test.tsx`
- Only attribute to others if you can prove your changes had no impact

**Examples:**
- ✅ "I modified auth middleware and auth tests are failing - I need to fix this"
- ✅ "I updated vite config and all tests are failing - I broke the test runner"
- ❌ "Component tests are failing but I only changed CSS - not my problem"
  - Wrong! CSS changes can break snapshot tests, render tests, etc.
- ❌ "I updated React and tests fail - React must have a bug"
  - Wrong! You chose to update React, you own making tests pass

#### Forbidden Solutions

**NEVER do these to "fix" failing tests:**

❌ Skip tests with `.skip()` or `xit()`
❌ Delete failing tests
❌ Comment out assertions
❌ Increase timeout limits without understanding why tests are slow
❌ Add `@ts-ignore` or `@ts-expect-error` to mask type errors in tests
❌ Mock everything to force tests to pass
❌ Change test assertions to match broken behavior

**These are NOT solutions - they hide problems instead of fixing them.**

#### When You Can't Fix a Test

If you've exhausted all options and cannot fix a failing test:

1. **Document the failure thoroughly**
   ```
   ESCALATION: Test failure in src/components/Checkout.test.tsx

   Failure: "should calculate shipping correctly"
   Error: Expected 5.99, received 0

   Investigation:
   - Checked shipping calculation logic - looks correct
   - Tried different test data - still fails
   - Reviewed recent commits - no obvious cause
   - Suspect integration with external pricing API

   Next steps:
   - Create task for shipping calculation debugging
   - May need access to API docs or domain expert
   ```

2. **Create a task for fixing it**
   - Add to `tasks/bugs/fix-{test-name}.md`
   - Include error messages, stack traces, investigation notes
   - Mark as `high` priority if it blocks other work

3. **Do NOT mark your task as complete**
   - Broken tests = incomplete work
   - Task stays `in_progress` until tests pass OR handoff task created

4. **Report to user**
   ```
   ⚠️ TASK INCOMPLETE: Tests failing after implementation

   I've created task `bugs/fix-checkout-shipping-test` to address
   the test failure. I cannot mark this task complete until tests pass.
   ```

#### Test-First Workflow (Recommended)

For new features, consider writing tests first:

1. Write failing test that describes desired behavior
2. Implement feature until test passes
3. Refactor with confidence (tests prevent regressions)

This ensures:
- Tests are comprehensive (written before implementation bias)
- Code is testable (hard-to-test code is usually poorly designed)
- No forgotten tests (you can't mark complete until tests exist)

#### Quick Reference

**Before marking task complete:**
- [ ] All relevant tests pass (`bun run test`)
- [ ] No tests skipped/deleted to make them pass
- [ ] If tests fail and I can't fix them, I created a follow-up task
- [ ] If I made global/config changes, entire test suite passes

**Remember:** Tests are not obstacles - they're safety nets. Breaking them means breaking production.

## Pre-Implementation Checklist

For non-trivial features:
1. Research the approach (official docs, compatibility)
2. Identify potential conflicts (library compatibility, React patterns)
3. Propose solution with evidence
4. Get confirmation if ambiguous
5. THEN implement

Skip for: typo fixes, obvious fixes, clear instructions

## Git Workflow

- Use feature branches
- Commit incrementally during larger tasks
- Rebase to main branch on completion

## Tailwind CSS v4 - CRITICAL

**DO NOT create these files** (v4 doesn't use them):
- `tailwind.config.js`
- `postcss.config.js`

Config is via Vite plugin in `astro.config.ts` and `@import "tailwindcss"` in global.css.

## Import Alias

```typescript
import BaseLayout from '@/layouts/BaseLayout.astro'
import { cn } from '@/lib/utils'
```

## CloudFlare Workers

- Custom domain: tryequipped.preview.frst.dev
- Worker handles cache headers (`run_worker_first = true`)
- `/lib/*` assets: immutable, 1 year cache
- Security headers: X-Content-Type-Options, X-Frame-Options

## Task System

Tasks are organized in `tasks/{epic}/{task}.md` with `tasks/index.yml` as master index.

### Task Selection Rules

When selecting tasks to work on:

1. **EXCLUDE `requires: human`** - Skip tasks needing manual action
2. **Match `complexity` to agent** - Use appropriate agent for task difficulty
3. **Check dependencies** - Complete prerequisites first (see task file)
4. **Respect priority** - Work on `high` priority epics before `medium` or `low`
5. **Mark done when complete** - Update `done: true` in index.yml

### Complexity Levels

| Level | Agent | Use For |
|-------|-------|---------|
| `low` | haiku (fast/cheap) | Static pages, loading states, simple patterns |
| `medium` | sonnet (standard) | Dashboard views, CRUD, forms, list/detail |
| `high` | opus (advanced) | Auth, payments, external APIs, architecture |

### Human-Required Tasks

Tasks marked `requires: human` need real-world action:

- External dashboard setup (Clerk, CloudFlare, Stripe, Plaid)
- Partnership agreements (Macquarie, Upgraded)
- Account creation on third-party services
- API key generation from external providers

When encountering these, inform the user what manual steps are needed.

### Escalation Protocol

If an agent fails to complete a task:

1. Document the failure reason clearly
2. Report: `ESCALATION NEEDED: {task_id} - {reason}`
3. Suggest complexity upgrade if task was harder than rated
4. Do NOT mark the task as done
5. Do NOT retry without escalation

### Task Dependency Tracking

**NEW:** Each task declares hard dependencies via `depends_on` array in `tasks/index.yml`.

**Before starting a task:**
```bash
bun scripts/validate-task-dependencies.js
```

This shows:
- **Ready tasks** - All dependencies satisfied, safe to assign
- **Blocked tasks** - Waiting for prerequisites
- **12 ready tasks** grouped by complexity (low/medium/high)

**Check specific task:**
```bash
bun scripts/validate-task-dependencies.js api/device-crud
```

Shows exactly which dependencies are blocking the task.

### Commit Tracking

**MANDATORY:** When marking a task `done: true`, also add `commit: {hash}`

Example:
```yaml
- id: auth-pages
  done: true
  commit: 70f4386  # Git commit hash
  depends_on:
    - auth/install-clerk
```

This creates an audit trail:
- Task ↔ Commit hash ↔ Code changes
- Traceability for debugging and rollbacks
- Progress tracking by commit

### Key Documents

- `documentation/PRDs/*.md` - Product Requirements Documents (authoritative for features)
  - `product.md` - Core product features and capabilities
  - `workflow.md` - Development workflow and process improvements
  - **Note:** Only actual PRDs go here, not templates or support files
- `documentation/prd-template.md` - Template for new PRDs
- `documentation/prd-preparation-checklist.md` - PRD scoping checklist
- `documentation/*.md` - UX flows and integrations
- `tasks/index.yml` - Task index with status tracking + dependencies + commit hashes
- `prd.yml` - Tracks PRD processing status
- `scripts/validate-task-dependencies.js` - Validation tool for task readiness

### PRD-to-Task Generation Workflow

**IMPORTANT:** When new PRD files are added or task files are missing, use `/prepare-prd`:

```bash
/prepare-prd
```

This command:
1. Scans `documentation/PRDs/*.md` for unprocessed or incomplete PRDs
2. Checks `prd.yml` for PRDs with status `pending` or `attention-needed`
3. Launches parallel Sonnet agents to generate task files
4. Creates `tasks/{epic}/` directories and `{task}.md` files
5. Updates `prd.yml` with completion status

**PRD Status Values in `prd.yml`:**
- `complete` - All task files generated successfully
- `in-progress` - Currently being processed
- `pending` - Not yet processed
- `attention-needed` - Failed generation, needs retry

**When to use `/prepare-prd`:**
- Adding a new PRD file to `documentation/PRDs/`
- Task files are missing but epic exists in `tasks/index.yml`
- PRD marked `attention-needed` in `prd.yml`

**Do NOT manually create task files from PRDs** - always use `/prepare-prd` for consistency.

### Test Criteria Format

All tasks use Gherkin BDD format for test criteria:

```gherkin
Feature: Feature Name
  Scenario: Specific behavior
    Given precondition
    When action
    Then expected result
```
