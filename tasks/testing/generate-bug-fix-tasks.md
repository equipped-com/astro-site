# Generate Bug Fix Task Files from Test Failures

## Description

Create individual bug fix task files in the bugs/ epic for each group of related test failures. This ensures each bug has proper documentation, acceptance criteria, and test criteria before being fixed.

## Dependencies

- `testing/reconcile-task-status` - Task status must be reconciled first
- Test failure analysis document must exist (test-failure-analysis-corrected.md)

## Acceptance Criteria

- [ ] Bug fix task created for each failing task group
- [ ] Each task follows bugs/ epic naming convention
- [ ] Each task has clear acceptance criteria
- [ ] Each task has Gherkin test criteria
- [ ] Each task references original failing task
- [ ] Each task lists specific failing tests
- [ ] All bug tasks added to tasks/index.yml
- [ ] Dependencies set correctly (must fix bugs before marking original tasks done)

## Test Criteria

```gherkin
Feature: Bug Fix Task Generation
	As a project manager
	I want bug fix tasks for all test failures
	So that bugs can be tracked and fixed systematically

	@REQ-BUG-GEN-001
	Scenario: Generate bug fix task from failing tests
		Given a task marked incomplete due to test failures
		When generating bug fix tasks
		Then a new task file should be created in bugs/
		And it should reference the original task
		And it should list specific failing tests

	@REQ-BUG-GEN-002
	Scenario: Bug tasks have complete structure
		Given a generated bug fix task
		When reviewing the task file
		Then it should have description
		And it should have acceptance criteria
		And it should have test criteria in Gherkin format
		And it should have implementation guidance

	@REQ-BUG-GEN-003
	Scenario: Bug tasks block original tasks
		Given a bug fix task for settings/team-access
		When checking dependencies in index.yml
		Then settings/team-access should depend on the bug fix task
		And settings/team-access should remain done: false
```

## Implementation

### Bug Fix Tasks to Create

Based on test-failure-analysis-corrected.md, create these bug fix tasks:

#### 1. bugs/fix-team-access-rendering
**Original Task:** settings/team-access (commit: 1abfc48)
**Failing Tests:** src/components/settings/TeamAccessManager.test.tsx (5 tests)
**Issue:** Component doesn't render expected elements (Bob, Alice not found)

#### 2. bugs/fix-invitation-ui-confirm
**Original Task:** invitations/invitation-ui (commit: 654a9b6)
**Failing Tests:** src/components/settings/PendingInvitations.test.tsx (9 tests + 4 errors)
**Issue:** confirm() not mocked, component rendering issues

#### 3. bugs/fix-catalog-schema-tests
**Original Task:** catalog/catalog-schema (commit: 0b87d74)
**Failing Tests:** src/db/catalog-schema.test.ts (20 tests)
**Issue:** Test database setup broken (createTestDb returns undefined)

#### 4. bugs/fix-catalog-api-tests
**Original Task:** catalog/catalog-api (commit: 2beacaf)
**Failing Tests:**
- src/api/routes/catalog/brands.test.ts
- src/api/routes/catalog/products.test.ts
- src/api/routes/catalog/inventory.test.ts
**Issue:** API endpoint tests failing, mock expectations not met

#### 5. bugs/fix-schema-naming-tests
**Original Task:** database/fix-schema-naming (commit: 11362b8)
**Failing Tests:**
- src/db/schema-naming.test.ts (16 tests)
- src/db/audit-log.integration.test.ts (10 tests)
**Issue:** Schema validation tests failing

#### 6. bugs/fix-impersonation-tests
**Original Task:** sysadmin/customer-impersonation (commit: cc49b6c)
**Failing Tests:**
- src/api/routes/admin/impersonation.test.ts (~10 tests)
- src/components/admin/useImpersonation.test.ts
- src/components/admin/ImpersonationBanner.test.tsx
- src/components/admin/RestrictedAction.test.tsx
**Issue:** Mock expectations not met, audit log not called correctly

#### 7. bugs/fix-user-api-tests
**Original Task:** api/user-endpoints (commit: 337a2b5)
**Failing Tests:** src/api/routes/user.test.ts
**Issue:** User API endpoint tests failing

#### 8. bugs/fix-cart-tests
**Original Task:** commerce/cart-management (commit: cb0bb8d)
**Failing Tests:** src/components/cart/Cart.test.tsx
**Issue:** Cart component tests failing

#### 9. bugs/fix-worker-tests
**Original Task:** invitations/invitation-expiry (commit: 632f34d)
**Failing Tests:** src/workers/invitation-expiry.test.ts
**Issue:** Worker tests failing

#### 10. bugs/fix-dashboard-tests
**Original Task:** dashboard/dashboard-home (commit: 183f066)
**Failing Tests:**
- src/test/pages/dashboard/index.test.tsx
- src/components/dashboard/QuickStats.test.tsx
- src/components/dashboard/AccountSwitcher.test.tsx
**Issue:** Dashboard component tests failing

#### 11. bugs/fix-trade-in-tests
**Original Task:** trade-in/return-shipping (commit: 3174704)
**Failing Tests:**
- src/components/trade-in/ReturnLabel.test.tsx
- src/components/trade-in/ValueAdjustmentModal.test.tsx
**Issue:** Trade-in component tests failing

#### 12. bugs/fix-catalog-admin-tests
**Original Task:** catalog/catalog-admin-ui (commit: 654d3be)
**Failing Tests:**
- src/components/admin/catalog/BrandTable.test.tsx
- src/components/admin/catalog/InventoryTable.test.tsx
- src/components/admin/catalog/ProductTable.test.tsx
**Issue:** Catalog admin component tests failing

### Task Template

Create each bug fix task using this template:

```markdown
# Fix [Feature Name] Test Failures

## Description

Fix failing tests for [original task name]. Tests are failing because [root cause].

## Original Task

- **Task ID:** [epic]/[task-id]
- **Commit:** [commit-hash]
- **Status:** Marked incomplete due to test failures

## Failing Tests

- [test-file-1.ts] - [X failures]
- [test-file-2.tsx] - [Y failures]

## Root Cause

[Detailed explanation of why tests are failing]

## Dependencies

- [epic]/[task-id] - Original implementation (incomplete)
- testing/[prerequisite] - Any test infrastructure dependencies

## Acceptance Criteria

- [ ] All [test-file-1] tests pass
- [ ] All [test-file-2] tests pass
- [ ] No regression in passing tests
- [ ] Original task can be marked done: true

## Test Criteria

\`\`\`gherkin
Feature: [Feature Name] Tests
	As a developer
	I want all [feature] tests to pass
	So that [feature] is verified

	@REQ-[EPIC]-[ID]
	Scenario: [Specific test scenario]
		Given [precondition]
		When [action]
		Then [expected result]
\`\`\`

## Implementation

[Specific guidance for fixing the tests]

## Files to Create/Modify

**Modify:**
- [test-file-1.ts]
- [test-file-2.tsx]

## References

- test-failure-analysis-corrected.md
- Original task: tasks/[epic]/[task-id].md
- Original commit: [commit-hash]
```

### Script to Generate Tasks

Create `scripts/generate-bug-fix-tasks.ts`:

```typescript
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

interface BugTask {
  id: string
  name: string
  originalTask: string
  originalCommit: string
  failingTests: string[]
  issue: string
}

const bugTasks: BugTask[] = [
  {
    id: 'fix-team-access-rendering',
    name: 'Fix Team Access Component Rendering',
    originalTask: 'settings/team-access',
    originalCommit: '1abfc48',
    failingTests: ['src/components/settings/TeamAccessManager.test.tsx (5 tests)'],
    issue: 'Component doesn\'t render expected elements (Bob, Alice not found)',
  },
  // ... rest of bug tasks
]

for (const bug of bugTasks) {
  const taskContent = generateBugTaskFile(bug)
  writeFileSync(
    join('tasks/bugs', `${bug.id}.md`),
    taskContent
  )
  console.log(`✅ Created tasks/bugs/${bug.id}.md`)
}

function generateBugTaskFile(bug: BugTask): string {
  return `# ${bug.name}

## Description

Fix failing tests for ${bug.originalTask}. Tests are failing because ${bug.issue}.

## Original Task

- **Task ID:** ${bug.originalTask}
- **Commit:** ${bug.originalCommit}
- **Status:** Marked incomplete due to test failures

## Failing Tests

${bug.failingTests.map(test => `- ${test}`).join('\n')}

## Root Cause

${bug.issue}

...
`
}
```

### Update tasks/index.yml

Add bug fix tasks to bugs epic:

```yaml
bugs:
  name: Bug Fixes & Architecture Issues
  description: Critical fixes for test failures and architectural problems
  priority: high
  tasks:
    # ... existing bug tasks ...

    # Test failure bug fixes
    - id: fix-team-access-rendering
      name: Fix Team Access Component Rendering
      file: bugs/fix-team-access-rendering.md
      done: false
      complexity: medium
      depends_on:
        - testing/mock-browser-apis
        - testing/fix-component-tests

    - id: fix-invitation-ui-confirm
      name: Fix Invitation UI confirm() Error
      file: bugs/fix-invitation-ui-confirm.md
      done: false
      complexity: low
      depends_on:
        - testing/mock-browser-apis

    # ... rest of bug fix tasks
```

### Update Original Tasks

Update original tasks to depend on bug fixes:

```yaml
settings:
  tasks:
    - id: team-access
      name: Team Access Management
      file: settings/team-access.md
      done: false  # Keep as incomplete
      complexity: medium
      reason: "Tests failing - see bugs/fix-team-access-rendering"
      depends_on:
        - settings/organization-settings
        - bugs/fix-team-access-rendering  # ADD THIS
```

## Files to Create/Modify

**Create:**
- tasks/bugs/fix-team-access-rendering.md
- tasks/bugs/fix-invitation-ui-confirm.md
- tasks/bugs/fix-catalog-schema-tests.md
- tasks/bugs/fix-catalog-api-tests.md
- tasks/bugs/fix-schema-naming-tests.md
- tasks/bugs/fix-impersonation-tests.md
- tasks/bugs/fix-user-api-tests.md
- tasks/bugs/fix-cart-tests.md
- tasks/bugs/fix-worker-tests.md
- tasks/bugs/fix-dashboard-tests.md
- tasks/bugs/fix-trade-in-tests.md
- tasks/bugs/fix-catalog-admin-tests.md

**Modify:**
- tasks/index.yml - Add bug tasks, update dependencies

**Reference:**
- test-failure-analysis-corrected.md

## Notes

- Each bug task should be independently fixable
- Bug tasks should block original tasks from being marked complete
- Use consistent naming: bugs/fix-[feature]-[issue]
- Include commit hash from original task for reference
- After bug is fixed, original task can be marked done: true

## References

- test-failure-analysis-corrected.md (source of truth for failures)
- tasks/index.yml (task structure and conventions)
- Task file format example: tasks/bugs/dynamic-routing-poc.md
