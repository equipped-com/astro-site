---
epic: bugs
task_id: exclude-e2e-from-vitest
title: Exclude Playwright E2E Tests from Vitest (3 test failures)
complexity: low
priority: high
---

# Exclude Playwright E2E Tests from Vitest

## Description

**3 E2E test files** are being incorrectly run by Vitest instead of Playwright:
- `e2e/smoke.spec.ts`
- `e2e/auth.spec.ts`
- `e2e/clerk-integration.spec.ts`

**Error:** `Playwright Test did not expect test.describe() to be called here`

This happens because:
1. Vitest config includes pattern: `src/**/*.spec.ts`
2. E2E files use `.spec.ts` extension
3. Playwright expects to run these tests, not Vitest

## Root Cause

`vitest.config.ts` line 32:
```typescript
include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts'],
```

The `src/**/*.spec.ts` pattern is too broad and catches E2E tests outside `src/`.

## Acceptance Criteria

- [ ] E2E tests are excluded from Vitest runs
- [ ] E2E tests still run with `bun run test:e2e` (Playwright)
- [ ] Vitest only runs unit and integration tests
- [ ] No "Playwright Test did not expect..." errors
- [ ] All 3 E2E test files pass when run with Playwright

## Test Criteria

```gherkin
Feature: Separate E2E and Unit Test Runners
	As a developer
	I want E2E tests to run only with Playwright
	So that each test runner handles appropriate tests

	@REQ-E2E-001 @Exclusion
	Scenario: Vitest skips E2E tests
		Given I run bun test (Vitest)
		When Vitest discovers test files
		Then e2e/ directory should be excluded
		And no Playwright tests should execute
		And no "Playwright Test did not expect" errors occur

	@REQ-E2E-002 @Playwright
	Scenario: Playwright runs E2E tests
		Given I run bun run test:e2e
		When Playwright executes
		Then all e2e/*.spec.ts files should run
		And tests should pass with Playwright runner

	@REQ-E2E-003 @Separation
	Scenario: Test commands are clearly separated
		Given I want to run different test types
		When I check package.json scripts
		Then bun test should run unit/integration (Vitest)
		And bun run test:e2e should run E2E (Playwright)
		And no overlap should exist
```

## Implementation

### Solution: Update vitest.config.ts

**Current (incorrect):**
```typescript
test: {
	include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts'],
	// ↑ This catches e2e/*.spec.ts incorrectly
}
```

**Fixed:**
```typescript
test: {
	include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
	// ↑ Removed '*.spec.ts' - only Playwright uses .spec.ts

	// Or be explicit:
	exclude: [
		'node_modules/',
		'dist/',
		'e2e/**', // ← Explicitly exclude E2E directory
		'playwright-report/',
		'test-results/',
	],
}
```

### Recommended Approach

**Use .spec.ts exclusively for E2E tests:**
- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts` (Playwright only)

This makes it clear which runner should execute each test.

## Files to Modify

1. **vitest.config.ts**
   - Remove `'src/**/*.spec.ts'` from include array
   - OR add `'e2e/**'` to exclude array

## Testing

### Verify Vitest excludes E2E tests:

```bash
# Before fix: 3 E2E test errors
bun test 2>&1 | grep "Playwright Test did not expect"
# Shows errors from 3 files

# After fix: 0 E2E test errors
bun test 2>&1 | grep "Playwright Test did not expect"
# Should show nothing

# Verify E2E tests still work with Playwright
bun run test:e2e
# Should run all E2E tests successfully
```

### Count test files discovered:

```bash
# Vitest should only find .test.ts files
bun test --reporter=verbose | grep "Test Files"
# Should NOT include e2e/ files

# Playwright should find .spec.ts files
bun run test:e2e --list
# Should show all e2e/*.spec.ts files
```

## Migration Steps

1. **Update vitest.config.ts**
   ```typescript
   test: {
   	include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
   	exclude: [
   		'node_modules/',
   		'dist/',
   		'e2e/**', // Playwright tests
   		'playwright-report/',
   		'test-results/',
   		'**/*.spec.ts', // .spec.ts reserved for E2E
   	],
   }
   ```

2. **Verify exclusion works**
   ```bash
   bun test --reporter=verbose | head -50
   # Should only list src/ test files
   ```

3. **Test E2E separately**
   ```bash
   bun run test:e2e
   # All 3 E2E tests should pass
   ```

4. **Update documentation**
   - Document that `.test.ts` = unit/integration (Vitest)
   - Document that `.spec.ts` = E2E only (Playwright)

## Expected Outcome

**Before fix:**
```
❌ e2e/smoke.spec.ts - Error: Playwright Test did not expect...
❌ e2e/auth.spec.ts - Error: Playwright Test did not expect...
❌ e2e/clerk-integration.spec.ts - Error: Playwright Test did not expect...

698 fail / 606 pass
```

**After fix:**
```
✅ Vitest: Only runs src/**/*.test.ts files
✅ No Playwright errors in Vitest output
✅ E2E tests run separately with: bun run test:e2e

~695 fail / 606 pass (3 fewer failures)
```

## References

- Vitest Config Documentation: https://vitest.dev/config/#include
- Playwright Test Documentation: https://playwright.dev/docs/intro
- Current test structure: Mixing .test.ts and .spec.ts
- Recommended: Separate by extension (.test.ts = unit, .spec.ts = E2E)
