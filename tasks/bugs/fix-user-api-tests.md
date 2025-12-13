# Fix User API Endpoint Tests

## Description

Fix failing tests for api/user-endpoints. User profile API endpoint tests are failing due to mock configuration issues.

## Original Task

- **Task ID:** api/user-endpoints
- **Commit:** 337a2b5
- **Status:** Marked incomplete due to test failures

## Failing Tests

- src/api/routes/user.test.ts - multiple test failures

## Root Cause

User API endpoint tests are failing, likely due to:
1. Auth middleware not properly mocked
2. Database queries not properly mocked
3. Clerk user data not properly mocked
4. Request/response mocks incomplete

## Dependencies

- api/user-endpoints - Original implementation (incomplete)
- api/auth-middleware - Auth middleware must be working
- testing/fix-api-tests - General API test infrastructure

## Acceptance Criteria

- [ ] All tests in user.test.ts pass
- [ ] User profile CRUD operations tested
- [ ] Auth checks properly mocked
- [ ] No regression in other API tests
- [ ] Original task api/user-endpoints can be marked done: true

## Test Criteria

```gherkin
Feature: User API Endpoints
	As a developer
	I want all user API tests to pass
	So that user profile management is verified

	@REQ-USER-API-001
	Scenario: Get user profile
		Given an authenticated user
		When requesting GET /api/user/profile
		Then user profile should be returned
		And response should include user details

	@REQ-USER-API-002
	Scenario: Update user profile
		Given an authenticated user
		And valid profile data
		When requesting PATCH /api/user/profile
		Then profile should be updated
		And response should reflect changes
```

## Implementation

1. Review `src/api/routes/user.test.ts` and `src/api/routes/user.ts`
2. Fix auth middleware mocks
3. Fix database mocks for user queries
4. Fix Clerk user data mocks
5. Run tests: `bun run test src/api/routes/user.test.ts`

## Files to Modify

- src/api/routes/user.test.ts
- Potentially: src/api/routes/user.ts

## References

- test-failure-analysis-corrected.md (lines 56, 152)
- Original task: tasks/api/user-endpoints.md
- Original commit: 337a2b5
