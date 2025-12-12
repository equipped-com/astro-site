# Fix Customer Impersonation Test Failures

## Description

Fix failing tests for sysadmin/customer-impersonation. Tests are failing across API endpoints, React hooks, and UI components due to mock expectations not being met and audit log issues.

## Original Task

- **Task ID:** sysadmin/customer-impersonation
- **Commit:** cc49b6c
- **Status:** Marked incomplete due to test failures

## Failing Tests

- src/api/routes/admin/impersonation.test.ts - ~10 test failures
- src/components/admin/useImpersonation.test.ts - multiple failures
- src/components/admin/ImpersonationBanner.test.tsx - multiple failures
- src/components/admin/RestrictedAction.test.tsx - multiple failures

**Total:** ~15-20 test failures

## Root Cause

The impersonation tests fail for multiple reasons:

1. **Mock expectations not met** - Functions expected to be called aren't being invoked
2. **Audit log not called correctly** - Impersonation actions should be audited but audit log mock isn't receiving calls
3. **JSON parsing errors** - Tests trying to parse non-JSON strings (e.g., "account" is not valid JSON)
4. **Component rendering issues** - React components not rendering expected elements
5. **Hook behavior issues** - useImpersonation hook not returning expected data/functions

Common patterns:
```
AssertionError: expected "vi.fn()" to be called with arguments: [ StringContaining{...} ]
Received: [nothing]

SyntaxError: Unexpected token 'a', "account" is not valid JSON
```

## Dependencies

- sysadmin/customer-impersonation - Original implementation (incomplete)
- api/auth-middleware - Auth middleware must be working
- testing/fix-component-tests - General component test infrastructure
- testing/fix-api-tests - General API test infrastructure

## Acceptance Criteria

- [ ] All ~10 tests in impersonation.test.ts pass
- [ ] All tests in useImpersonation.test.ts pass
- [ ] All tests in ImpersonationBanner.test.tsx pass
- [ ] All tests in RestrictedAction.test.tsx pass
- [ ] Audit log properly mocked and called for impersonation actions
- [ ] No JSON parsing errors in tests
- [ ] No regression in other passing tests
- [ ] Original task sysadmin/customer-impersonation can be marked done: true

## Test Criteria

```gherkin
Feature: Customer Impersonation
	As a developer
	I want all impersonation tests to pass
	So that admin impersonation is verified

	@REQ-IMPERSONATION-001
	Scenario: Start impersonation session
		Given an admin user
		And a target customer account
		When starting impersonation
		Then impersonation session should be created
		And audit log should record the action
		And admin should have customer's permissions

	@REQ-IMPERSONATION-002
	Scenario: Display impersonation banner
		Given an active impersonation session
		When rendering the dashboard
		Then impersonation banner should be visible
		And banner should show customer name
		And banner should have "Stop Impersonation" button

	@REQ-IMPERSONATION-003
	Scenario: Stop impersonation session
		Given an active impersonation session
		When admin clicks "Stop Impersonation"
		Then session should be ended
		And audit log should record the action
		And admin should return to normal permissions

	@REQ-IMPERSONATION-004
	Scenario: Restrict actions during impersonation
		Given an active impersonation session
		When admin attempts restricted action (e.g., delete account)
		Then action should be blocked
		And warning message should be displayed
```

## Implementation

### Step 1: Fix Audit Log Mocks

Ensure audit log is properly mocked in tests:

```typescript
import { vi } from 'vitest'

const mockAuditLog = vi.fn()

vi.mock('@/lib/audit-log', () => ({
	logAuditEvent: mockAuditLog
}))

// In test
await startImpersonation({ accountId: '123' })

expect(mockAuditLog).toHaveBeenCalledWith({
	action: 'impersonation.start',
	actorId: 'admin-user-id',
	targetAccountId: '123',
	timestamp: expect.any(Date)
})
```

### Step 2: Fix JSON Parsing Errors

Check where tests are trying to parse strings as JSON:

```typescript
// BAD: Response is plain text, not JSON
const result = JSON.parse(response.text) // "account" → Error

// GOOD: Check content type or handle both
const result = response.headers.get('content-type')?.includes('json')
	? JSON.parse(response.text)
	: response.text
```

### Step 3: Fix API Endpoint Tests

Check `src/api/routes/admin/impersonation.test.ts`:
- Ensure request/response mocks are correct
- Verify auth middleware allows admin access
- Check database mocks return expected data

```typescript
// Example fix
const mockDb = {
	query: {
		accounts: {
			findFirst: vi.fn().mockResolvedValue({
				id: '123',
				name: 'Customer Account'
			})
		}
	}
}
```

### Step 4: Fix useImpersonation Hook Tests

Check `src/components/admin/useImpersonation.test.ts`:
- Ensure hook returns expected shape
- Mock any API calls the hook makes
- Verify state updates correctly

```typescript
import { renderHook, act } from '@testing-library/react'
import { useImpersonation } from './useImpersonation'

it('should start impersonation', async () => {
	const { result } = renderHook(() => useImpersonation())

	await act(async () => {
		await result.current.startImpersonation('123')
	})

	expect(result.current.isImpersonating).toBe(true)
	expect(result.current.targetAccountId).toBe('123')
})
```

### Step 5: Fix Component Tests

Check banner and restricted action components:
- Ensure components render with correct props
- Mock useImpersonation hook
- Verify click handlers work correctly

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('./useImpersonation', () => ({
	useImpersonation: () => ({
		isImpersonating: true,
		targetAccountName: 'Customer Account',
		stopImpersonation: vi.fn()
	})
}))

it('should display impersonation banner', () => {
	render(<ImpersonationBanner />)
	expect(screen.getByText('Customer Account')).toBeInTheDocument()
	expect(screen.getByText('Stop Impersonation')).toBeInTheDocument()
})
```

### Step 6: Run Tests

Test each file separately:
```bash
bun run test src/api/routes/admin/impersonation.test.ts
bun run test src/components/admin/useImpersonation.test.ts
bun run test src/components/admin/ImpersonationBanner.test.tsx
bun run test src/components/admin/RestrictedAction.test.tsx
```

### Step 7: Verify All Pass

Run all impersonation tests:
```bash
bun run test --grep impersonation
```

## Files to Create/Modify

**Modify:**
- src/api/routes/admin/impersonation.test.ts
- src/components/admin/useImpersonation.test.ts
- src/components/admin/ImpersonationBanner.test.tsx
- src/components/admin/RestrictedAction.test.tsx
- Potentially: implementation files if bugs found

**Review:**
- src/api/routes/admin/impersonation.ts
- src/components/admin/useImpersonation.ts
- src/components/admin/ImpersonationBanner.tsx
- src/components/admin/RestrictedAction.tsx
- src/lib/audit-log.ts

## References

- test-failure-analysis-corrected.md (lines 36-42, 119-127, 151, 264-270)
- Original task: tasks/sysadmin/customer-impersonation.md
- Original commit: cc49b6c

## Security Note

Customer impersonation is **SECURITY CRITICAL**. All actions must be audited. Ensure:
1. Only sys admins can impersonate
2. All impersonation actions are logged
3. Certain actions are restricted during impersonation
4. Impersonation sessions have timeouts
5. Tests verify all security constraints
