# Fix DOM Setup Navigator Read-Only Error

## Description

Fix critical DOM setup error that is completely blocking 4 test suites from running. The error occurs when trying to assign to `globalThis.navigator` which has a read-only getter property.

## Original Task

- **Task ID:** testing/mock-browser-apis
- **Commit:** ad1dcdb
- **Status:** Marked incomplete due to DOM setup error

## Failing Tests

**CRITICAL: These 4 test suites are completely blocked from running:**
- src/api/device-crud.integration.test.ts
- src/lib/tenant.integration.test.ts
- src/workers/invitation-expiry.test.ts
- src/lib/spark/client.test.ts

## Error Details

```
TypeError: Cannot set property navigator of #<Object> which has only a getter
Location: src/test/dom-setup.ts:21:12
```

## Root Cause

The `src/test/dom-setup.ts` file attempts to set `globalThis.navigator` using direct assignment:
```typescript
globalThis.navigator = window.navigator as any
```

However, `globalThis.navigator` has a getter-only property descriptor in the test environment, making it read-only. This causes an immediate TypeError before any tests can run.

## Dependencies

- testing/setup-vitest - Test framework configuration

## Acceptance Criteria

- [ ] DOM setup completes without errors
- [ ] All 4 blocked test suites can run
- [ ] `globalThis.navigator` properly set to happy-dom navigator
- [ ] No other global properties affected
- [ ] All previously passing tests still pass
- [ ] Original task testing/mock-browser-apis can be marked done: true

## Test Criteria

```gherkin
Feature: DOM Setup
	As a test suite
	I want DOM APIs to be available globally
	So that all tests can access browser APIs

	@REQ-TEST-DOM-001
	Scenario: Navigator API availability
		Given test environment initializes
		When DOM setup runs
		Then globalThis.navigator should be defined
		And navigator.userAgent should be accessible
		And no errors should be thrown

	@REQ-TEST-DOM-002
	Scenario: Test suites can run
		Given DOM setup completes
		When running device-crud integration tests
		Then tests should execute without setup errors
		And tests should have access to navigator API
```

## Implementation

1. Open `src/test/dom-setup.ts`
2. Replace direct assignment with `Object.defineProperty`:

```typescript
// Instead of:
globalThis.navigator = window.navigator as any

// Use:
Object.defineProperty(globalThis, 'navigator', {
  value: window.navigator,
  writable: true,
  configurable: true
})
```

3. Apply the same pattern to any other potentially read-only properties
4. Run blocked tests to verify fix:
   ```bash
   bun run test src/api/device-crud.integration.test.ts
   bun run test src/lib/tenant.integration.test.ts
   bun run test src/workers/invitation-expiry.test.ts
   bun run test src/lib/spark/client.test.ts
   ```

## Files to Modify

- src/test/dom-setup.ts (lines 19-38)

## References

- Original task: tasks/testing/mock-browser-apis.md
- Original commit: ad1dcdb
- MDN: Object.defineProperty - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
