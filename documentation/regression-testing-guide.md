# Regression Testing Guide

**Status:** Active
**Last Updated:** 2025-12-08

## Overview

Regression tests are the **highest-value tests** in our codebase. They prevent known bugs from reoccurring and serve as living documentation of issues we've fixed.

**Golden Rule:** Every bug fix MUST include a regression test.

## Why Regression Tests Matter

1. **Prevent Reoccurrence** - Bugs that are fixed stay fixed
2. **Living Documentation** - Tests document exactly what broke and how
3. **Confidence in Refactoring** - Safe to improve code without breaking fixes
4. **Team Knowledge** - New developers learn from past mistakes

## Regression Test Structure

### Test Header Template

Every regression test MUST start with this comment:

```typescript
/**
 * REGRESSION TEST
 * Issue: [GH-123 | JIRA-456 | Bug description]
 * Description: [What was broken]
 * Fix: [How was it fixed]
 * Verification: [How test proves fix]
 */
```

### Example Regression Test

```typescript
/**
 * REGRESSION TEST
 * Issue: CART-002 - Corrupted localStorage crashed cart on load
 * Description: Invalid JSON in localStorage caused cart to crash on mount
 * Fix: Added try-catch around JSON.parse with fallback to empty cart
 * Verification: Cart gracefully handles corrupted localStorage
 */
it('should handle corrupted localStorage without crashing', async () => {
	// Corrupt localStorage with invalid JSON
	localStorage.setItem('equipped_cart', '{invalid json}}')

	const { result } = renderHook(() => useCart(), { wrapper })

	await waitFor(() => {
		expect(result.current.isLoading).toBe(false)
	})

	// Should fall back to empty cart instead of crashing
	expect(result.current.isEmpty).toBe(true)
	expect(result.current.cart.items).toHaveLength(0)
})
```

## The Regression Test Workflow

### When You Fix a Bug

1. **Reproduce the bug** - Create a failing test first
2. **Fix the bug** - Implement the fix
3. **Verify the test passes** - Test should now pass
4. **Verify it would fail without fix** - Comment out fix, test should fail
5. **Commit with test** - Include test in same commit as fix

### Commit Message Format

```bash
fix(cart): handle corrupted localStorage gracefully

- Added try-catch around JSON.parse in cart initialization
- Falls back to empty cart on parse error
- Prevents crash when localStorage is corrupted

Test: Added regression test CART-002
```

## Finding Bugs to Test

### 1. Recent Bug Fixes

```bash
# Search git history for bug fixes
git log --all --grep="fix:" --oneline

# Review commits and create tests for fixes without tests
git show <commit-hash>
```

### 2. Edge Cases in Code

Look for these patterns:

- **Empty collections**: `array.length === 0`, `object === {}`
- **Null/undefined**: Missing null checks
- **Zero values**: Division by zero, `price === 0`
- **Boundaries**: Max/min values, length limits
- **Concurrent operations**: Race conditions, rapid clicks

### 3. User-Reported Issues

- Review issue tracker for closed bugs
- Check support tickets for recurring problems
- Monitor error logs for patterns

### 4. Code Review Comments

- "This could crash if..."
- "What happens when..."
- "Edge case: ..."

## Regression Test Patterns

### Pattern 1: Validation Bypass

**Bug:** Protected fields could be updated via mass assignment

```typescript
/**
 * REGRESSION TEST
 * Issue: USER-004 - Protected field bypass via mass assignment
 * Fix: Whitelist allowed fields, reject protected fields
 */
test('should ignore protected fields in profile update', async () => {
	const res = await app.request('/', {
		method: 'PUT',
		body: JSON.stringify({
			id: 'user_hacked',
			email: 'hacker@evil.com',
			first_name: 'Updated',
		}),
	})

	const json = await res.json()
	expect(json.user.id).toBe('user_123') // Original preserved
	expect(json.user.email).toBe('original@example.com') // Original preserved
})
```

### Pattern 2: State Corruption

**Bug:** Rapid actions caused inconsistent state

```typescript
/**
 * REGRESSION TEST
 * Issue: NAV-001 - Rapid account switches caused state inconsistency
 * Fix: Debounce account switch requests
 */
it('should handle rapid account switching without state corruption', async () => {
	// Rapidly click multiple accounts
	fireEvent.click(betaOption)
	fireEvent.click(gammaOption)
	fireEvent.click(betaOption)

	await waitFor(() => {
		expect(onSwitch).toHaveBeenCalled()
	})

	// Should reflect last clicked account
	const finalCall = onSwitch.mock.calls[onSwitch.mock.calls.length - 1][0]
	expect(finalCall).toBe('acc_2') // Beta
})
```

### Pattern 3: Boundary Conditions

**Bug:** Empty or zero values caused calculation errors

```typescript
/**
 * REGRESSION TEST
 * Issue: CART-006 - Subtotal calculation incorrect with zero-priced items
 * Fix: Handle zero-priced items correctly in reduce
 */
it('should correctly calculate subtotal with zero-priced items', async () => {
	act(() => {
		result.current.addItem({ ...item, unitPrice: 1199 })
		result.current.addItem({ ...freeItem, unitPrice: 0 })
	})

	expect(result.current.cart.subtotal).toBe(1199)
	expect(Number.isNaN(result.current.cart.subtotal)).toBe(false)
})
```

### Pattern 4: Data Sanitization

**Bug:** Special characters broke parsing

```typescript
/**
 * REGRESSION TEST
 * Issue: USER-006 - Special characters in names broke JSON response
 * Fix: Proper JSON escaping in database and response
 */
test('should handle special characters in user names', async () => {
	const res = await app.request('/')
	const json = await res.json()

	expect(json.user.first_name).toBe(`O'Brien`)
	expect(json.user.last_name).toBe(`Test"User\\Special`)
})
```

### Pattern 5: Error Recovery

**Bug:** Failed operation left UI in broken state

```typescript
/**
 * REGRESSION TEST
 * Issue: NAV-007 - Failed switch left UI in loading state
 * Fix: Clear loading state on error
 */
it('should clear loading state when account switch fails', async () => {
	const onSwitch = vi.fn(async () => {
		throw new Error('Network error')
	})

	fireEvent.click(betaOption)

	await waitFor(() => {
		expect(screen.queryByRole('status')).not.toBeInTheDocument()
	})
	expect(screen.getByText(/failed to switch/i)).toBeInTheDocument()
})
```

## Regression Test Checklist

Before marking a regression test complete:

- [ ] **Issue documented** - REGRESSION TEST header with issue ID
- [ ] **Test name describes bug** - Not just feature, but what broke
- [ ] **Would fail with old code** - Test actually catches the bug
- [ ] **Passes with fix** - Test passes now
- [ ] **Edge case covered** - Tests the specific condition that triggered bug
- [ ] **Clear and maintainable** - Future developers can understand it
- [ ] **Reference in commit** - Commit message mentions test

## Organizing Regression Tests

### File Naming

```
src/
├── components/
│   ├── Cart.test.tsx              # Feature tests
│   └── Cart.regression.test.tsx   # Regression tests
├── api/
│   ├── user.test.ts               # Feature tests
│   └── user.regression.test.ts    # Regression tests
```

### Test Organization

```typescript
describe('Cart Component [REGRESSION TESTS]', () => {
	describe('State Management', () => {
		it('CART-001: should never allow negative quantities', ...)
		it('CART-003: should clear cart when accountId changes', ...)
	})

	describe('Data Persistence', () => {
		it('CART-002: should handle corrupted localStorage', ...)
		it('CART-005: should clear promo code when cart cleared', ...)
	})
})
```

## Metrics and Tracking

### Coverage Goal

**Target:** 100% of critical bug fixes have regression tests

### Current Status

```bash
# Count regression test files
find src -name "*.regression.test.ts*" | wc -l

# Count regression tests
grep -r "REGRESSION TEST" src --include="*.test.ts*" | wc -l
```

### Tracking Issues

Use issue tracker labels:

- `bug` - Confirmed bug
- `needs-regression-test` - Bug fix without test
- `has-regression-test` - Bug fix with test

## CI/CD Integration

### Block Deployment on Regression Failures

Regression tests are **critical** - they prevent known bugs from shipping.

```yaml
# .github/workflows/ci.yml
test:
	runs-on: ubuntu-latest
	steps:
		- run: bun run test
		- run: bun run test:regression # Explicit regression test run
		- if: failure()
			run: echo "REGRESSION TEST FAILED - Known bug reintroduced!"
```

### Separate Regression Test Run

```bash
# Run only regression tests
bun run test -- --grep="REGRESSION TEST"

# Run regression tests with coverage
bun run test:coverage -- --grep="REGRESSION TEST"
```

## Resources

- **Template:** `src/test/regression-template.ts` - Examples and patterns
- **Examples:**
	- `src/lib/cart-context.regression.test.tsx`
	- `src/api/routes/user.regression.test.ts`
	- `src/components/checkout/AddressForm.regression.test.tsx`
	- `src/components/navigation/AccountSwitcher.regression.test.tsx`

## FAQ

### Q: Should every bug get a regression test?

**A:** Yes, especially:

- Security bugs (auth, validation, injection)
- Payment/financial bugs
- Data corruption bugs
- User-facing crashes

Trivial bugs (typos, styling tweaks) may not need tests.

### Q: When should I write the test?

**A:** BEFORE fixing the bug (TDD style):

1. Write failing test that reproduces bug
2. Verify test fails
3. Fix bug
4. Verify test passes

This proves the test actually catches the bug.

### Q: What if I can't reproduce the bug?

**A:** Document what you tried:

```typescript
/**
 * ATTEMPTED REGRESSION TEST
 * Issue: BUG-123 - User reported crash on empty cart
 * Status: Unable to reproduce locally
 * Notes: Only occurs on Safari iOS 14.2, environment unavailable
 * TODO: Set up iOS testing environment
 */
it.skip('should handle empty cart on Safari iOS', ...)
```

### Q: How detailed should the test be?

**A:** Detailed enough that:

1. A developer reading it understands what broke
2. The test catches the exact bug, not just general behavior
3. Future changes that reintroduce the bug will fail the test

## Contributing

When reviewing PRs:

1. **Bug fixes without tests:** Request regression test
2. **Regression tests without issue ID:** Request documentation
3. **Vague test names:** Request specific bug description
4. **Tests that don't fail with old code:** Question if test is correct

**Remember:** Regression tests are documentation as much as verification.
