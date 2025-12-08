---
epic: testing
task_id: regression-tests
title: Establish Regression Testing & Bug Prevention
complexity: medium
priority: high
---

# Establish Regression Testing & Bug Prevention

## Description

Create systematic regression testing framework:
- Every bug fix gets a test (proves bug is fixed, prevents reoccurrence)
- Test describes the original issue and validates the fix
- Build test suite from real-world bugs
- Document issues with tests as living proof of fixes

Regression tests are the highest-value tests - they prevent known issues from coming back.

## Acceptance Criteria

- [ ] Regression test template documented
- [ ] Pattern established: issue → fix → test
- [ ] At least 5 regression tests written (from completed tasks)
- [ ] CI blocks if regression test fails
- [ ] Team guidance on writing regression tests
- [ ] Coverage: **100% of critical bug fixes**

## Test Criteria

```gherkin
Feature: Regression Testing Protocol
  Scenario: Bug is fixed with test
    Given a bug is discovered
    When bug is fixed
    Then a regression test is written
    And test verifies the fix
    And test prevents reoccurrence

  Scenario: Regression test catches future breaks
    Given regression test suite
    When code is refactored
    And regression is reintroduced
    Then test fails
    And developer is alerted immediately
```

## Implementation Pattern

### Regression Test Template

```typescript
/**
 * REGRESSION TEST
 * Issue: [GH-123 or JIRA-456]
 * Description: [What was broken]
 * Fix: [How was it fixed]
 * Verification: [How test proves fix]
 */

describe('Trade-In Device Valuation [REGRESSION]', () => {
	// Issue: GH-45 - Device with $0 value showed "Error" instead of "Recycle"
	// Fix: Handle zero-value devices with eco-friendly messaging
	// Verification: Test ensures zero-value devices get correct messaging

	it('should show "Recycle for Free" for devices with zero trade-in value', () => {
		const poorDevice = {
			model: 'iPhone 6',
			condition: 'poor',
		}

		const valuation = valuateDevice(poorDevice)

		// Before fix: valuation.message would be "Error"
		// After fix: should be "Recycle for Free"
		expect(valuation.value).toBe(0)
		expect(valuation.message).toContain('Recycle for Free')
		expect(valuation.ecoFriendly).toBe(true)
	})
})
```

### Examples from Completed Tasks

1. **Auth Middleware - REGRESSION**
   - Issue: Missing account_id validation allowed cross-account access
   - Test: Verify double-check against account_access table

2. **Checkout Assignment - REGRESSION**
   - Issue: Continue button enabled without selecting person
   - Test: Verify button disabled until selection made

3. **Trade-In Valuation - REGRESSION**
   - Issue: Zero-value devices crashed component
   - Test: Verify graceful handling of $0 valuations

4. **Payment Form - REGRESSION**
   - Issue: Form allowed submission with invalid EIN format
   - Test: Verify EIN validation XX-XXXXXXX format

5. **Dashboard Sidebar - REGRESSION**
   - Issue: Sidebar navigation had stale active state
   - Test: Verify active state updates on route change

## Process for Future Tasks

**When implementing a fix:**
1. Fix the bug
2. Write regression test that would fail with old code
3. Run test - confirm it passes with fix
4. Run test - confirm it fails with original code (proof of fix)
5. Commit: `fix: {issue}` + `test: add regression test for {issue}`

## Regression Test Metrics

```yaml
Total Regression Tests: [auto-count]
Critical Bugs Fixed: [number]
Bugs with Tests: [number]
Coverage: [number/number]
```

## Dependencies

- `testing/setup-vitest` - Vitest infrastructure ready
- Various feature tasks - Bugs to create tests for
