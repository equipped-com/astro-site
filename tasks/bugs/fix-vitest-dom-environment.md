---
epic: bugs
task_id: fix-vitest-dom-environment
title: Fix Vitest DOM Environment (489 test failures)
complexity: medium
priority: critical
---

# Fix Vitest DOM Environment Issues

## Description

**489 tests (70% of all failures)** are failing due to missing DOM APIs:
- 384 failures: `document is not defined`
- 56 failures: `localStorage is not defined`
- 49 failures: `window is not defined`

The vitest.config.ts is configured with `environment: 'happy-dom'`, but DOM APIs are still undefined. This suggests:
1. happy-dom may not be properly loaded
2. Vitest 4.x may have changed how environment setup works
3. Some tests may need explicit environment configuration

## Root Cause

Vitest 4.x changed how test environments are handled. Tests now need explicit DOM environment markers or proper setup configuration.

## Acceptance Criteria

- [ ] All 489 DOM-related test failures resolved
- [ ] `document`, `window`, `localStorage` available in all tests
- [ ] No changes needed to individual test files (fix at config level)
- [ ] Tests run successfully with `bun test`
- [ ] Coverage remains above 85%

## Test Criteria

```gherkin
Feature: DOM Environment Setup
	As a developer
	I want DOM APIs available in all tests
	So that component and integration tests work correctly

	@REQ-DOM-001 @Document
	Scenario: document API is available
		Given I have a test that uses document
		When I run the test with bun test
		Then document should be defined
		And document.createElement should work
		And no ReferenceError should occur

	@REQ-DOM-002 @LocalStorage
	Scenario: localStorage API is available
		Given I have a test that uses localStorage
		When I run the test with bun test
		Then localStorage should be defined
		And localStorage.setItem/getItem should work
		And no ReferenceError should occur

	@REQ-DOM-003 @Window
	Scenario: window API is available
		Given I have a test that uses window
		When I run the test with bun test
		Then window should be defined
		And window.location should be accessible
		And no ReferenceError should occur

	@REQ-DOM-004 @AllTests
	Scenario: All existing tests pass with DOM environment
		Given the DOM environment is fixed
		When I run the full test suite
		Then all 489 previously failing tests should pass
		And no new failures should be introduced
```

## Implementation

### Option 1: Add environment docblock to test files (recommended)

For React component tests and tests that need DOM:

```typescript
/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
// ... rest of test
```

**Pros:** Explicit, per-file control
**Cons:** Need to add to many files

### Option 2: Fix global environment configuration

Update `vitest.config.ts`:

```typescript
export default defineConfig(
	getViteConfig({
		plugins: [react()],
		test: {
			globals: true,
			environment: 'happy-dom', // ← Already set but not working
			environmentOptions: {
				happyDOM: {
					settings: {
						// Ensure full DOM API availability
						url: 'http://localhost:3000',
						width: 1024,
						height: 768,
					},
				},
			},
			// ... rest of config
		},
	}),
)
```

### Option 3: Add custom setup file

Create `src/test/dom-setup.ts`:

```typescript
import { beforeAll } from 'vitest'
import { JSDOM } from 'jsdom'

beforeAll(() => {
	// Ensure DOM APIs are available
	if (typeof document === 'undefined') {
		const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
			url: 'http://localhost:3000',
		})

		global.document = dom.window.document
		global.window = dom.window as any
		global.navigator = dom.window.navigator
		global.localStorage = dom.window.localStorage
		global.sessionStorage = dom.window.sessionStorage
	}
})
```

Then update `vitest.config.ts`:

```typescript
setupFiles: ['./src/test/setup.ts', './src/test/dom-setup.ts'],
```

## Recommended Solution

**Use Option 2 + Option 3 combo:**

1. Fix `vitest.config.ts` with proper environmentOptions
2. Add `dom-setup.ts` as fallback for edge cases
3. If still failing, add `@vitest-environment` docblocks to problematic files

## Files to Modify

- `vitest.config.ts` - Add environmentOptions
- `src/test/dom-setup.ts` - Create fallback DOM setup
- Potentially add docblocks to failing test files if needed

## Testing

```bash
# Before fix: 698 failures
bun test 2>&1 | grep -E "ReferenceError: (document|localStorage|window) is not defined" | wc -l
# Should show 489

# After fix: 0 DOM failures
bun test 2>&1 | grep -E "ReferenceError: (document|localStorage|window) is not defined" | wc -l
# Should show 0

# Verify overall improvement
bun test | tail -5
# Should show significantly fewer failures
```

## References

- Vitest 4.x Environment Documentation: https://vitest.dev/config/#environment
- happy-dom GitHub: https://github.com/capricorn86/happy-dom
- Current failures: 489/698 (70% of all failures)
- Related issue: Vitest 4.x changed environment behavior
