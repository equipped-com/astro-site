# Testing Quick Reference

**Quick answer:** When in doubt, write a test. Better to have it and not need it.

## Decision Flow (Use This!)

Answer these questions in order:

1. **Is it a bug fix?**
   - YES → **Regression test** (ALWAYS)
   - NO → Continue to question 2

2. **Is it an API endpoint?**
   - YES → **Integration test** (ALWAYS)
   - NO → Continue to question 3

3. **Is it a critical user flow?** (sign in, checkout, payments, onboarding)
   - YES → **E2E test** (ALWAYS)
   - NO → Continue to question 4

4. **Is it business logic or utility function?**
   - Used in multiple places? → **Unit test** (ALWAYS)
   - One-off? → **Unit test** (IF complex, OPTIONAL otherwise)
   - NO → Continue to question 5

5. **Is it a React component?**
   - Has state/effects/interactions? → **Component test** (RECOMMENDED)
   - Pure presentation? → **Component test** (OPTIONAL)
   - NO → Continue to question 6

6. **Is it database migration, configuration, or styling?**
   - Database → **Migration test**
   - Configuration or styling → **NO test** (unless behavioral)

## Test Type Summary

| Test Type | Framework | Files | When |
|-----------|-----------|-------|------|
| **Unit** | Vitest | `lib/utils.test.ts` | Utility functions, business logic, pure functions |
| **Component** | React Testing Library + Vitest | `components/Button.test.tsx` | React components with state or interactions |
| **Integration** | Vitest | `api/routes/devices.test.ts` | API endpoints, database queries, multi-component flows |
| **E2E** | Playwright | `e2e/checkout.spec.ts` | Complete user journeys across pages |
| **Regression** | Any | Same file as test | Every bug fix (high priority) |

## Test Commands

```bash
# Unit + Integration tests
bun run test                # Run all tests once
bun run test:watch          # Watch mode (RECOMMENDED for development)
bun run test:coverage       # Generate coverage report
bun run test:ui             # Interactive dashboard

# E2E tests (if configured)
bun run test:e2e            # Run E2E tests
bun run test:e2e:ui         # Visual UI for E2E
bun run test:e2e:debug      # Debug mode
```

## Coverage Targets

**MINIMUM (must pass CI/CD):**
- Functions: 90%
- Lines: 85%
- Branches: 80%
- Statements: 85%

**TARGET (aim for these):**
- Core features (auth, checkout, payments): 95%
- Utilities & helpers: 100%
- API endpoints: 90%+
- React components: 80%+

## Must-Test Scenarios

| Scenario | Test Type | Priority |
|----------|-----------|----------|
| Authentication flow | Integration + E2E | CRITICAL |
| Payment processing | Integration + E2E | CRITICAL |
| Bug fix | Regression | CRITICAL |
| API endpoint | Integration | HIGH |
| Form submission | Component + Integration | HIGH |
| Permission check | Integration | HIGH |
| State management | Component | HIGH |
| Utility function | Unit | MEDIUM |

## Test File Naming

- **Unit tests:** `src/lib/utils.test.ts`
- **Component tests:** `src/components/Button.test.tsx`
- **Integration tests:** `src/api/routes/devices.test.ts`
- **E2E tests:** `e2e/checkout.spec.ts`

**Pattern:** Same directory as source file, add `.test.ts/tsx` before extension.

## Example: Auth Bug Fix

You fixed an auth bug where users could access protected routes without login.

**Tests needed:**
1. **Regression test** - Verify protected route blocks unauthenticated users
2. **Integration test** - Verify auth middleware works correctly
3. **E2E test** - Verify sign-in flow works end-to-end (if critical)

```typescript
// Regression test in auth.test.ts
/**
 * REGRESSION TEST
 * Issue: GH-123
 * Description: Protected routes accessible without login
 * Fix: Added auth middleware check
 */
describe('Auth [REGRESSION]', () => {
	it('should require authentication for protected routes', async () => {
		const res = await request(app)
			.get('/api/protected')
			.expect(401);

		expect(res.body.error).toContain('Unauthorized');
	});
});
```

## Example: New Feature (Checkout Stage)

You're adding a new stage to the checkout flow.

**Tests needed:**
1. **Component test** - Verify the stage component works
2. **Integration test** - Verify API endpoints for this stage
3. **E2E test** - Update full checkout flow test

```typescript
// Component test
describe('ShippingStage', () => {
	it('should require address before continuing', async () => {
		const { user } = render(<ShippingStage />);
		expect(screen.getByText('Continue')).toBeDisabled();

		await user.type(screen.getByLabel('Address'), '123 Main St');
		expect(screen.getByText('Continue')).toBeEnabled();
	});
});

// Integration test
describe('POST /api/checkout/shipping', () => {
	it('should validate address format', async () => {
		const res = await request(app)
			.post('/api/checkout/shipping')
			.set('Authorization', `Bearer ${token}`)
			.send({ address: 'invalid' })
			.expect(400);

		expect(res.body.error).toContain('Invalid address');
	});
});
```

## Red Flags (Test Anti-Patterns)

Don't write tests for:
- ❌ CSS/styling only (no behavior change)
- ❌ Pure presentation components (no state, no interactions)
- ❌ One-off scripts
- ❌ Configuration files
- ❌ Auto-generated code

Do write tests for:
- ✅ Security-sensitive code (auth, permissions, payments)
- ✅ Complex business logic
- ✅ Bug fixes
- ✅ API endpoints
- ✅ Components with state or interactions

## Regression Test Template

Always use this format for bug fixes:

```typescript
/**
 * REGRESSION TEST
 * Issue: [Ticket number or GH-123]
 * Description: [What was broken]
 * Fix: [How you fixed it]
 */
describe('[Feature] [REGRESSION]', () => {
	// Issue: GH-45 - [Description]
	it('should [expected behavior after fix]', () => {
		// Test that fails before fix, passes after
	});
});
```

## Learning Resources

For detailed information, see:
- **Full Testing Strategy:** [documentation/testing-strategy.md](/documentation/testing-strategy.md)
- **Setup & Examples:** [tasks/testing/setup-vitest.md](/tasks/testing/setup-vitest.md)
- **E2E Testing:** [tasks/testing/setup-playwright.md](/tasks/testing/setup-playwright.md)
- **Regression Patterns:** [tasks/testing/regression-tests.md](/tasks/testing/regression-tests.md)
- **In-Depth Standards:** [.claude/CLAUDE.md](/.claude/CLAUDE.md)

## Common Questions

**Q: How many tests should I write?**
A: Enough to cover the critical paths. One test per behavior, not one test per line.

**Q: Should I test private functions?**
A: No, test the public interface. If private functions are complex, move them to utilities and test those.

**Q: How do I avoid flaky tests?**
A: Use `userEvent` instead of `fireEvent`. Wait for async operations. Use specific selectors, not brittle text matching.

**Q: When should I use snapshots?**
A: Rarely. They hide issues. Use for visual regression testing only, not for logic.

**Q: What if I don't know what to test?**
A: Start with the happy path. What should happen when everything works correctly? Test that first.
