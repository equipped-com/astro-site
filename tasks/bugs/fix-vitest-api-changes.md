---
epic: bugs
task_id: fix-vitest-api-changes
title: Update Tests for Vitest 4.x API Changes (75 test failures)
complexity: low
priority: high
---

# Update Tests for Vitest 4.x API Changes

## Description

**75 tests (11% of failures)** are failing due to Vitest API changes between v3 and v4:
- 25 failures: `vi.stubGlobal is not a function`
- 25 failures: `vi.unstubAllGlobals is not a function`
- 18 failures: `vi.mocked is not a function` (general)
- 7 failures: `vi.mocked is not a function` (fetch)

The project uses Vitest 4.0.15, which removed/renamed these APIs from earlier versions.

## Root Cause

Vitest 4.x breaking changes:
- `vi.stubGlobal()` / `vi.unstubAllGlobals()` → Removed, use `vi.spyOn()` instead
- `vi.mocked()` → Replaced with TypeScript type utilities

## Acceptance Criteria

- [ ] Replace all `vi.stubGlobal()` calls with equivalent Vitest 4.x API
- [ ] Replace all `vi.unstubAllGlobals()` calls with proper cleanup
- [ ] Replace all `vi.mocked()` calls with type assertions
- [ ] All 75 affected tests pass
- [ ] No Vitest API deprecation warnings
- [ ] Tests run successfully with `bun test`

## Test Criteria

```gherkin
Feature: Vitest 4.x API Compatibility
	As a developer
	I want tests to use current Vitest APIs
	So that tests run without errors

	@REQ-VITEST-001 @GlobalMocking
	Scenario: Global variables are mocked correctly
		Given I need to mock localStorage in a test
		When I use the Vitest 4.x compatible API
		Then the mock should work without errors
		And cleanup should restore original values

	@REQ-VITEST-002 @TypeSafety
	Scenario: Mocked functions have correct types
		Given I mock a function with vi.fn()
		When I use type assertions instead of vi.mocked()
		Then TypeScript should understand the mock
		And I can call mock methods like mockReturnValue

	@REQ-VITEST-003 @NoDeprecations
	Scenario: No deprecated APIs used
		Given I run the full test suite
		When tests complete
		Then no deprecation warnings should appear
		And all tests should use current Vitest 4.x APIs
```

## Implementation

### Migration Guide

#### 1. Replace vi.stubGlobal / vi.unstubAllGlobals

**Before (Vitest 3.x):**
```typescript
import { beforeEach, afterEach, vi } from 'vitest'

beforeEach(() => {
	vi.stubGlobal('localStorage', mockLocalStorage)
	vi.stubGlobal('window', mockWindow)
})

afterEach(() => {
	vi.unstubAllGlobals()
})
```

**After (Vitest 4.x):**
```typescript
import { beforeEach, afterEach, vi } from 'vitest'

let localStorageSpy: any
let windowSpy: any

beforeEach(() => {
	localStorageSpy = vi.spyOn(global, 'localStorage', 'get').mockReturnValue(mockLocalStorage)
	// OR assign directly:
	global.localStorage = mockLocalStorage as any
})

afterEach(() => {
	localStorageSpy?.mockRestore()
	// OR:
	vi.restoreAllMocks()
})
```

#### 2. Replace vi.mocked()

**Before (Vitest 3.x):**
```typescript
import { vi } from 'vitest'

const mockFetch = vi.fn()
vi.mocked(global.fetch).mockResolvedValue({ ok: true })
```

**After (Vitest 4.x):**
```typescript
import { vi, type Mock } from 'vitest'

const mockFetch = vi.fn<typeof fetch>()
global.fetch = mockFetch

// Type assertion instead of vi.mocked():
;(global.fetch as Mock).mockResolvedValue({ ok: true })
// OR:
mockFetch.mockResolvedValue({ ok: true } as any)
```

### Affected Files

Based on error output, these files need updates:

1. **src/lib/impersonation.test.ts** (25 failures)
   - Replace `vi.stubGlobal('localStorage', ...)`
   - Replace `vi.unstubAllGlobals()`

2. **Tests using vi.mocked()** (~25 failures)
   - Find with: `grep -r "vi.mocked" src/`
   - Replace with type assertions

### Automated Migration

Create a script to help:

```bash
# Find all files using deprecated APIs
grep -r "vi.stubGlobal\|vi.unstubAllGlobals\|vi.mocked" src/ --include="*.test.ts" --include="*.test.tsx"

# Count occurrences
grep -r "vi.stubGlobal" src/ --include="*.test.ts" | wc -l
```

## Files to Modify

Priority order (by number of failures):

1. `src/lib/impersonation.test.ts` - 25 failures (stubGlobal/unstubAllGlobals)
2. Files using `vi.mocked(useUser)` - 12 failures
3. Files using `vi.mocked(fetch)` - 25 failures
4. Other files with vi.mocked() - 13 failures

## Testing

```bash
# Find affected test files
grep -l "vi\.stubGlobal\|vi\.mocked" src/**/*.test.ts src/**/*.test.tsx

# Test a single file after fixing
bun test src/lib/impersonation.test.ts

# Verify all 75 failures are fixed
bun test 2>&1 | grep -E "vi\.(stubGlobal|mocked|unstubAllGlobals)" | wc -l
# Should show 0
```

## Migration Steps

1. **Fix impersonation.test.ts first** (biggest impact - 25 tests)
   - Replace stubGlobal with direct assignment
   - Replace unstubAllGlobals with vi.restoreAllMocks()

2. **Fix vi.mocked() usage** (50 tests)
   - Use type assertions: `(fn as Mock)`
   - Or declare mock with proper type: `vi.fn<typeof originalFn>()`

3. **Test each file after changes**
   ```bash
   bun test {file} --reporter=verbose
   ```

4. **Verify full suite**
   ```bash
   bun test | tail -20
   ```

## References

- Vitest 4.0 Migration Guide: https://vitest.dev/guide/migration.html
- Vitest Mocking Guide: https://vitest.dev/guide/mocking.html
- Current Vitest version: 4.0.15
- Affected tests: 75/698 failures (11%)
