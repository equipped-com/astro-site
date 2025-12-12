# Reconcile Task Status with Test Results

## Description

Update tasks/index.yml to mark tasks as incomplete (`done: false`) when their associated tests are failing. This ensures task status accurately reflects the actual state of the codebase.

## Dependencies

- Test suite must be runnable (`bun run test`)
- Test failure analysis must be complete (test-failure-analysis-corrected.md exists)

## Acceptance Criteria

- [ ] Identify all tasks marked `done: true` with failing tests
- [ ] Update tasks/index.yml to mark failing tasks as `done: false`
- [ ] Add `reason` field explaining why task is incomplete
- [ ] Add `failing_tests` field listing specific test failures
- [ ] Document reconciliation process in workflow documentation
- [ ] Create GitHub issues for each incomplete task (optional)

## Test Criteria

```gherkin
Feature: Task Status Reconciliation
	As a project manager
	I want task status to reflect actual test results
	So that I have accurate project status

	@REQ-RECONCILE-001
	Scenario: Tasks with failing tests are marked incomplete
		Given a task marked done: true
		And the task has associated failing tests
		When reconciling task status
		Then the task should be marked done: false
		And a reason field should be added

	@REQ-RECONCILE-002
	Scenario: Tasks with passing tests remain complete
		Given a task marked done: true
		And all associated tests pass
		When reconciling task status
		Then the task should remain done: true
		And commit hash should be preserved

	@REQ-RECONCILE-003
	Scenario: Failing tests are documented
		Given a task marked incomplete due to test failures
		When viewing the task in index.yml
		Then the failing_tests field should list specific test files
		And the reason field should explain what's broken
```

## Implementation

### 1. Identify Tasks with Failing Tests

From test-failure-analysis-corrected.md, tasks to update:

```yaml
# Tasks to mark incomplete

settings/team-access:
  current: done: true, commit: 1abfc48
  update: done: false
  reason: "5 component tests failing - elements not rendering as expected"
  failing_tests:
    - src/components/settings/TeamAccessManager.test.tsx

invitations/invitation-ui:
  current: done: true, commit: 654a9b6
  update: done: false
  reason: "9 tests failing + 4 unhandled errors - confirm() not mocked, components not rendering"
  failing_tests:
    - src/components/settings/PendingInvitations.test.tsx

catalog/catalog-schema:
  current: done: true, commit: 0b87d74
  update: done: false
  reason: "20 schema tests failing - test database setup broken"
  failing_tests:
    - src/db/catalog-schema.test.ts

catalog/catalog-api:
  current: done: true, commit: 2beacaf
  update: done: false
  reason: "~15 API tests failing - catalog endpoints not working as expected"
  failing_tests:
    - src/api/routes/catalog/brands.test.ts
    - src/api/routes/catalog/products.test.ts
    - src/api/routes/catalog/inventory.test.ts

database/fix-schema-naming:
  current: done: true, commit: 11362b8
  update: done: false
  reason: "16 schema naming tests failing - validation not passing"
  failing_tests:
    - src/db/schema-naming.test.ts
    - src/db/audit-log.integration.test.ts

sysadmin/customer-impersonation:
  current: done: true, commit: cc49b6c
  update: done: false
  reason: "~10 impersonation tests failing - mock expectations not met"
  failing_tests:
    - src/api/routes/admin/impersonation.test.ts
    - src/components/admin/useImpersonation.test.ts
    - src/components/admin/ImpersonationBanner.test.tsx
    - src/components/admin/RestrictedAction.test.tsx

api/user-endpoints:
  current: done: true, commit: 337a2b5
  update: done: false
  reason: "User API tests failing"
  failing_tests:
    - src/api/routes/user.test.ts

commerce/cart-management:
  current: done: true, commit: cb0bb8d
  update: done: false
  reason: "Cart component tests failing"
  failing_tests:
    - src/components/cart/Cart.test.tsx

invitations/invitation-expiry:
  current: done: true, commit: 632f34d
  update: done: false
  reason: "Worker tests failing"
  failing_tests:
    - src/workers/invitation-expiry.test.ts

dashboard/dashboard-home:
  current: done: true, commit: 183f066
  update: done: false
  reason: "Dashboard tests failing"
  failing_tests:
    - src/test/pages/dashboard/index.test.tsx
    - src/components/dashboard/QuickStats.test.tsx
    - src/components/dashboard/AccountSwitcher.test.tsx

trade-in/return-shipping:
  current: done: true, commit: 3174704
  update: done: false
  reason: "Trade-in component tests failing"
  failing_tests:
    - src/components/trade-in/ReturnLabel.test.tsx
    - src/components/trade-in/ValueAdjustmentModal.test.tsx

catalog/catalog-admin-ui:
  current: done: true, commit: 654d3be
  update: done: false
  reason: "Catalog admin component tests failing"
  failing_tests:
    - src/components/admin/catalog/BrandTable.test.tsx
    - src/components/admin/catalog/InventoryTable.test.tsx
    - src/components/admin/catalog/ProductTable.test.tsx
```

### 2. Update tasks/index.yml

For each task, update the YAML structure:

```yaml
- id: team-access
  name: Team Access Management
  file: settings/team-access.md
  done: false  # Was: true
  # commit: 1abfc48  # Keep original commit for reference
  complexity: medium
  reason: "5 component tests failing - elements not rendering as expected"
  failing_tests:
    - src/components/settings/TeamAccessManager.test.tsx
  depends_on:
    - settings/organization-settings
```

### 3. Preserve Git History

Keep the original commit hash in comments so we can see what was implemented:

```yaml
done: false
# original_commit: 1abfc48  # Implementation completed but tests failing
reason: "Tests failing - needs bug fixes"
```

### 4. Document Reconciliation Process

Create `documentation/task-reconciliation.md`:

```markdown
# Task Reconciliation Process

## Purpose

Ensure tasks/index.yml accurately reflects the actual state of the codebase by reconciling task status with test results.

## Process

1. **Run full test suite:** `bun run test`
2. **Analyze failures:** Map each failure to a task
3. **Update index.yml:** Mark tasks with failures as incomplete
4. **Add metadata:** Include reason and failing tests
5. **Preserve history:** Keep original commit in comments
6. **Create fix tasks:** Generate bug fix tasks for failures

## Frequency

- **Daily:** During active development
- **Before releases:** Before any deployment
- **After major changes:** After refactoring or infrastructure changes

## Automation

Consider automating with CI/CD:

\`\`\`yaml
# .github/workflows/test-reconciliation.yml
on: [push]
jobs:
  reconcile:
    runs-on: ubuntu-latest
    steps:
      - run: bun run test
      - run: bun scripts/reconcile-tasks.ts
      - uses: create-pull-request@v4
        if: failure()
\`\`\`
```

### 5. Run Verification

After updating tasks/index.yml:

```bash
# Verify YAML is valid
bun scripts/validate-task-dependencies.js

# Verify all referenced task files exist
for task in $(grep "file:" tasks/index.yml | cut -d: -f2); do
  [ -f "tasks/$task" ] || echo "Missing: tasks/$task"
done
```

## Files to Create/Modify

**Modify:**
- `tasks/index.yml` - Update 12+ task entries

**Create:**
- `documentation/task-reconciliation.md` - Document process
- `scripts/reconcile-tasks.ts` - Automation script (optional)

**Reference:**
- `test-failure-analysis-corrected.md` - Source of truth for failures

## Notes

- This is a one-time cleanup, but should become part of regular workflow
- Keep original commits for audit trail
- Failing tasks should block related tasks via dependencies
- Consider adding automated checks in CI/CD

## References

- test-failure-analysis-corrected.md
- tasks/index.yml (lines 1-1144)
- Tasks marked done with failing tests (12 identified)
