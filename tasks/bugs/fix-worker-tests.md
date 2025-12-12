# Fix Invitation Expiry Worker Tests

## Description

Fix failing tests for invitations/invitation-expiry worker. Worker tests are failing due to Cloudflare Workers environment mocking issues.

## Original Task

- **Task ID:** invitations/invitation-expiry
- **Commit:** 632f34d
- **Status:** Marked incomplete due to test failures

## Failing Tests

- src/workers/invitation-expiry.test.ts - multiple test failures

## Root Cause

Invitation expiry worker tests are failing, likely due to:
1. Cloudflare Workers environment not properly mocked
2. Scheduled event triggers not properly mocked
3. Database operations in worker context not working
4. Time-based expiry logic issues

## Dependencies

- invitations/invitation-expiry - Original implementation (incomplete)
- invitations/invitations-schema - Schema must be working
- testing/setup-vitest - Test infrastructure

## Acceptance Criteria

- [ ] All tests in invitation-expiry.test.ts pass
- [ ] Worker execution properly tested
- [ ] Expired invitations correctly identified
- [ ] Database updates work in test environment
- [ ] No regression in other worker tests
- [ ] Original task invitations/invitation-expiry can be marked done: true

## Test Criteria

```gherkin
Feature: Invitation Expiry Worker
	As a developer
	I want all invitation expiry worker tests to pass
	So that automatic invitation cleanup is verified

	@REQ-WORKER-001
	Scenario: Identify expired invitations
		Given invitations with various expiry dates
		When worker runs
		Then expired invitations should be identified
		And only expired invitations should be processed

	@REQ-WORKER-002
	Scenario: Update expired invitation status
		Given an expired invitation
		When worker processes it
		Then invitation status should be set to expired
		And invitation should no longer be usable
```

## Implementation

1. Review `src/workers/invitation-expiry.test.ts` and `src/workers/invitation-expiry.ts`
2. Fix Cloudflare Workers environment mocks
3. Fix scheduled event mocks
4. Fix database mocks for worker context
5. Run tests: `bun run test src/workers/invitation-expiry.test.ts`

## Files to Modify

- src/workers/invitation-expiry.test.ts
- Potentially: src/workers/invitation-expiry.ts

## References

- test-failure-analysis-corrected.md (lines 68, 155, 315-320)
- Original task: tasks/invitations/invitation-expiry.md
- Original commit: 632f34d
