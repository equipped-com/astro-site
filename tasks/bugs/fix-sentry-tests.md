# Fix Sentry Performance Monitoring Tests

## Description

Fix failing Sentry performance monitoring test. The test is failing with a TypeError when calling `vi.fn()`, likely due to incorrect mock setup or Vitest API changes.

## Original Task

- **Task ID:** monitoring/error-tracking
- **Commit:** 187288f
- **Status:** Marked incomplete due to test failures

## Failing Tests

- src/lib/sentry.test.ts - "@REQ-MON-007: Performance monitoring - should create performance transaction for API request"

## Error Details

```
TypeError: {(intermediate value)} is not a function
Location: src/lib/sentry.test.ts:181:39

179| describe('@REQ-MON-007: Performance monitoring', () => {
180|   it('should create performance transaction for API request', () => {
181|    const mockSpan = { finish: vi.fn() }
     |                                      ^
```

## Root Cause

The test is attempting to call `vi.fn()` but it's failing. Possible causes:
1. Import statement missing or incorrect
2. Vitest API change in version 4.x
3. Mock setup needs to be inside `beforeEach` or test function
4. Type issue with mock object structure
5. Sentry mock not properly configured

## Dependencies

- testing/setup-vitest - Test framework configuration
- monitoring/health-check - Base monitoring infrastructure

## Acceptance Criteria

- [ ] Sentry performance monitoring test passes
- [ ] Mock span object properly created with vi.fn()
- [ ] Sentry.startSpan properly mocked
- [ ] No regression in other Sentry tests
- [ ] Original task monitoring/error-tracking can be marked done: true

## Test Criteria

```gherkin
Feature: Sentry Performance Monitoring
	As a monitoring system
	I want to track performance metrics
	So that we can identify slow operations

	@REQ-MON-007
	Scenario: API request performance tracking
		Given Sentry is configured
		When an API request is made
		Then a performance span should be created
		And the span should track request duration
		And the span should be finished on completion
```

## Implementation

1. Review `src/lib/sentry.test.ts` around line 181
2. Check import statements for `vi` from 'vitest'
3. Verify mock setup for Sentry.startSpan
4. Fix the mockSpan object creation:

```typescript
// Option 1: Move mock creation inside test
it('should create performance transaction for API request', () => {
  const mockFinish = vi.fn()
  const mockSpan = { finish: mockFinish }

  // ... rest of test
})

// Option 2: Check if Sentry mocks are properly configured
vi.mock('@sentry/browser', () => ({
  startSpan: vi.fn((options, callback) => {
    const mockSpan = { finish: vi.fn() }
    return callback(mockSpan)
  }),
  // ... other mocks
}))
```

5. Run tests to verify fix:
   ```bash
   bun run test src/lib/sentry.test.ts
   ```

## Files to Modify

- src/lib/sentry.test.ts (around line 179-185)

## References

- Original task: tasks/monitoring/error-tracking.md
- Original commit: 187288f
- Vitest API: https://vitest.dev/api/vi.html
- Sentry docs: https://docs.sentry.io/platforms/javascript/performance/
