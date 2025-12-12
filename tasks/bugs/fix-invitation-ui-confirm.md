# Fix Invitation UI confirm() Error

## Description

Fix failing tests and unhandled errors in invitations/invitation-ui. Tests are failing because browser `confirm()` dialog is not mocked, causing 4 unhandled errors plus 9 test failures.

## Original Task

- **Task ID:** invitations/invitation-ui
- **Commit:** 654a9b6
- **Status:** Marked incomplete due to test failures

## Failing Tests

- src/components/settings/PendingInvitations.test.tsx - 9 test failures + 4 unhandled errors

## Root Cause

The PendingInvitations component uses `window.confirm()` to confirm invitation deletion/revocation, but this browser API doesn't exist in the test environment. This causes:

1. **4 Unhandled TypeError:** `confirm is not a function`
2. **9 Test failures:** Tests expect component to handle confirmation dialogs but fail when confirm() is not available

The solution is to mock browser dialog APIs in the test environment.

## Dependencies

- invitations/invitation-ui - Original implementation (incomplete)
- testing/mock-browser-apis - Browser API mocking infrastructure (blocks this)

## Acceptance Criteria

- [ ] All 4 unhandled errors resolved (confirm() mocked)
- [ ] All 9 tests in PendingInvitations.test.tsx pass
- [ ] Browser dialog APIs (confirm, alert, prompt) properly mocked
- [ ] Tests verify confirmation dialog behavior
- [ ] No regression in other passing tests
- [ ] Original task invitations/invitation-ui can be marked done: true

## Test Criteria

```gherkin
Feature: Invitation UI Components
	As a developer
	I want all invitation UI tests to pass
	So that invitation management is verified

	@REQ-INVITATIONS-001
	Scenario: Mock confirm dialog for invitation cancellation
		Given a PendingInvitations component
		And a pending invitation exists
		When user clicks cancel invitation button
		Then confirm dialog should be shown
		And if confirmed, invitation should be deleted

	@REQ-INVITATIONS-002
	Scenario: Handle confirm dialog rejection
		Given a PendingInvitations component
		And confirm() is mocked to return false
		When user clicks cancel invitation button
		Then invitation should NOT be deleted
		And invitation should remain in list

	@REQ-INVITATIONS-003
	Scenario: Render pending invitations list
		Given a PendingInvitations component
		And multiple pending invitations exist
		When the component renders
		Then all invitations should be displayed
		And each should show email and status
```

## Implementation

### Step 1: Add Browser API Mocks to Test Setup

Add to `src/test/dom-setup.ts` or test file:

```typescript
// Mock browser dialog APIs globally for all tests
global.confirm = vi.fn(() => true)
global.alert = vi.fn()
global.prompt = vi.fn(() => '')
```

Or add to individual test file:
```typescript
// PendingInvitations.test.tsx
import { beforeEach, vi } from 'vitest'

beforeEach(() => {
	global.confirm = vi.fn(() => true)
})
```

### Step 2: Test Confirmation Dialog Behavior

Add tests that verify dialog behavior:

```typescript
it('should show confirmation dialog when canceling invitation', async () => {
	const confirmMock = vi.fn(() => true)
	global.confirm = confirmMock

	render(<PendingInvitations />)

	const cancelButton = screen.getByText('Cancel Invitation')
	await userEvent.click(cancelButton)

	expect(confirmMock).toHaveBeenCalledWith(
		expect.stringContaining('cancel this invitation')
	)
})

it('should not delete invitation if user cancels confirmation', async () => {
	global.confirm = vi.fn(() => false) // User clicks "Cancel"

	const deleteMock = vi.fn()
	render(<PendingInvitations onDelete={deleteMock} />)

	const cancelButton = screen.getByText('Cancel Invitation')
	await userEvent.click(cancelButton)

	expect(deleteMock).not.toHaveBeenCalled()
})
```

### Step 3: Fix Component if Needed

If component has issues beyond mocking:
1. Ensure component properly handles confirm() return value
2. Check conditional logic for deletion
3. Verify component updates state correctly after deletion

### Step 4: Run Tests and Verify

```bash
bun run test src/components/settings/PendingInvitations.test.tsx
```

All 9 tests should pass, and 4 unhandled errors should be resolved.

## Files to Create/Modify

**Modify:**
- src/test/dom-setup.ts (add global browser API mocks)
- src/components/settings/PendingInvitations.test.tsx (add confirmation tests)
- Potentially: src/components/settings/PendingInvitations.tsx (if component has bugs)

## References

- test-failure-analysis-corrected.md (lines 94-100, 237-244)
- Original task: tasks/invitations/invitation-ui.md
- Original commit: 654a9b6

## Quick Win

This is a **QUICK WIN** - adding 3 lines to mock browser APIs will resolve 4 unhandled errors immediately. The 9 test failures may also resolve once confirm() is available.

```typescript
// src/test/dom-setup.ts
global.confirm = vi.fn(() => true)
global.alert = vi.fn()
global.prompt = vi.fn(() => '')
```

**Expected Impact:** Fixes 4 unhandled errors + potentially 9 test failures (~15-20 minute fix)
