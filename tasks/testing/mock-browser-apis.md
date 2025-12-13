# Mock Browser APIs in Test Environment

## Description

Add mocks for browser-specific APIs (`confirm`, `alert`, `prompt`) to the test environment setup to fix 4 unhandled errors in component tests.

## Dependencies

- `testing/setup-vitest` - Vitest test infrastructure must be set up

## Acceptance Criteria

- [ ] Add `global.confirm` mock to test setup
- [ ] Add `global.alert` mock to test setup
- [ ] Add `global.prompt` mock to test setup
- [ ] Verify PendingInvitations.test.tsx no longer has unhandled errors
- [ ] Document browser API mocking pattern in testing docs

## Test Criteria

```gherkin
Feature: Browser API Mocking
	As a developer
	I want browser APIs mocked in tests
	So that component tests don't crash on browser-specific code

	@REQ-TEST-MOCK-001
	Scenario: confirm() is available in tests
		Given a test environment
		When a component calls window.confirm()
		Then it should not throw "confirm is not a function"
		And it should return a mockable value

	@REQ-TEST-MOCK-002
	Scenario: alert() is available in tests
		Given a test environment
		When a component calls window.alert()
		Then it should not throw an error
		And it should be callable with vi.fn()

	@REQ-TEST-MOCK-003
	Scenario: prompt() is available in tests
		Given a test environment
		When a component calls window.prompt()
		Then it should not throw an error
		And it should return a mockable value

	@REQ-TEST-MOCK-004
	Scenario: PendingInvitations component tests pass
		Given browser APIs are mocked
		When running PendingInvitations.test.tsx
		Then there should be 0 unhandled errors
		And all revoke confirmation tests should pass
```

## Implementation

### 1. Update src/test/dom-setup.ts

Add browser API mocks:

```typescript
// src/test/dom-setup.ts
import { beforeEach, vi } from 'vitest'

// Mock browser dialog APIs
global.confirm = vi.fn(() => true)
global.alert = vi.fn()
global.prompt = vi.fn(() => '')

// Reset mocks before each test for isolation
beforeEach(() => {
	vi.mocked(global.confirm).mockReturnValue(true)
	vi.mocked(global.alert).mockClear()
	vi.mocked(global.prompt).mockReturnValue('')
})
```

### 2. Document Pattern

Add to testing documentation:

```markdown
## Browser API Mocking

Browser-specific APIs are mocked globally:

- `confirm()` - Returns `true` by default
- `alert()` - No-op function
- `prompt()` - Returns empty string by default

**Override in specific tests:**

\`\`\`typescript
it('should handle user cancellation', () => {
	vi.mocked(global.confirm).mockReturnValueOnce(false)

	// Test cancellation behavior
	fireEvent.click(screen.getByText('Delete'))
	expect(mockDelete).not.toHaveBeenCalled()
})
\`\`\`
```

### 3. Verify Fix

Run tests and verify:

```bash
bun run test src/components/settings/PendingInvitations.test.tsx
```

Expected:
- ✅ 0 unhandled errors (was 4)
- ✅ All revoke confirmation tests pass

## Files to Create/Modify

**Modify:**
- `src/test/dom-setup.ts` - Add browser API mocks

**Document:**
- Update testing docs with browser API mocking pattern

## Notes

- Browser APIs are missing in JSDOM/happy-dom environments
- Global mocks allow all tests to use these APIs
- Individual tests can override default return values
- Mocks are reset between tests for isolation

## References

- test-failure-analysis-corrected.md (Pattern 2: Missing Browser APIs)
- src/components/settings/PendingInvitations.test.tsx (4 unhandled errors)
