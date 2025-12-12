# Fix Team Access Component Rendering

## Description

Fix failing tests for settings/team-access. Tests are failing because component doesn't render expected elements (Bob, Alice not found).

## Original Task

- **Task ID:** settings/team-access
- **Commit:** 1abfc48
- **Status:** Marked incomplete due to test failures

## Failing Tests

- src/components/settings/TeamAccessManager.test.tsx - 5 failures

## Root Cause

The TeamAccessManager component is not rendering expected team member elements in the test environment. Tests expect to find team members "Bob" and "Alice" but the component doesn't render these elements, suggesting:

1. Component may not be fetching/displaying team member data correctly
2. Test mocks may not be properly configured to provide team member data
3. Component may require additional context providers or props that aren't set up in tests

## Dependencies

- settings/team-access - Original implementation (incomplete)
- testing/mock-browser-apis - Browser API mocking infrastructure
- testing/fix-component-tests - General component test fixes

## Acceptance Criteria

- [ ] All 5 tests in TeamAccessManager.test.tsx pass
- [ ] Component correctly renders team member list with names
- [ ] Tests properly mock team member data
- [ ] No regression in other passing tests
- [ ] Original task settings/team-access can be marked done: true

## Test Criteria

```gherkin
Feature: Team Access Manager Component
	As a developer
	I want all TeamAccessManager tests to pass
	So that team access management is verified

	@REQ-SETTINGS-001
	Scenario: Render team member list
		Given a TeamAccessManager component
		And mock team members Bob and Alice
		When the component renders
		Then Bob should be visible in the member list
		And Alice should be visible in the member list

	@REQ-SETTINGS-002
	Scenario: Handle empty team member list
		Given a TeamAccessManager component
		And no team members exist
		When the component renders
		Then an empty state message should be displayed

	@REQ-SETTINGS-003
	Scenario: Team member role display
		Given a TeamAccessManager component with members
		When the component renders
		Then each member should display their role
		And role should be editable by authorized users
```

## Implementation

### Step 1: Analyze Component Structure

Review `src/components/settings/TeamAccessManager.tsx` to understand:
- How team member data is fetched
- What props/context providers are required
- How the component renders member list

### Step 2: Review Test File

Review `src/components/settings/TeamAccessManager.test.tsx` to identify:
- What data mocks are being used
- Whether mocks match component expectations
- Missing context providers or setup

### Step 3: Fix Test Mocks

Ensure test properly mocks:
```typescript
// Example mock structure
const mockTeamMembers = [
	{ id: '1', name: 'Bob', email: 'bob@example.com', role: 'admin' },
	{ id: '2', name: 'Alice', email: 'alice@example.com', role: 'member' }
]

// Mock API or context provider
vi.mock('@/api/team', () => ({
	useTeamMembers: () => ({
		data: mockTeamMembers,
		isLoading: false
	})
}))
```

### Step 4: Fix Component Rendering

If component has rendering issues:
1. Ensure component correctly maps over team member data
2. Verify conditional rendering logic
3. Check that member names are actually rendered in the DOM

### Step 5: Add Missing Context Providers

Wrap component in required providers:
```typescript
render(
	<AuthProvider>
		<TeamProvider>
			<TeamAccessManager />
		</TeamProvider>
	</AuthProvider>
)
```

### Step 6: Verify All Tests Pass

Run tests and ensure all 5 tests pass:
```bash
bun run test src/components/settings/TeamAccessManager.test.tsx
```

## Files to Create/Modify

**Modify:**
- src/components/settings/TeamAccessManager.test.tsx
- Potentially: src/components/settings/TeamAccessManager.tsx (if component has bugs)

## References

- test-failure-analysis-corrected.md (lines 79-89, 254-257)
- Original task: tasks/settings/team-access.md
- Original commit: 1abfc48
