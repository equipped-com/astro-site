# Testing Strategy & Decision Tree

## Overview

This guide helps you decide which type of test to write for different code changes. Tests serve three critical purposes:

1. **Regression prevention** - Catch breaking changes before production
2. **Living documentation** - Tests show exactly how code should behave
3. **Refactoring confidence** - Safe to improve code with test coverage

## Decision Tree

```
Start: What are you implementing?
│
├─ UI Component? ──────────────────────────────────────┐
│  │                                                    │
│  ├─ Pure presentation (no state/effects)? ───────────┤
│  │  └─ OPTIONAL: Component test                      │
│  │                                                    │
│  └─ Has state/effects/user interactions? ────────────┤
│     └─ REQUIRED: Component test (React Testing Library)
│
├─ Business Logic / Utility Function? ─────────────────┐
│  │                                                    │
│  ├─ Used in multiple places? ─────────────────────────┤
│  │  └─ REQUIRED: Unit test                           │
│  │                                                    │
│  └─ One-off use? ────────────────────────────────────┤
│     └─ OPTIONAL: Unit test (unless complex)          │
│
├─ API Endpoint? ──────────────────────────────────────┐
│  └─ REQUIRED: Integration test                       │
│     - Test request/response                          │
│     - Test auth/permissions                          │
│     - Test database interactions                     │
│
├─ Critical User Flow? ────────────────────────────────┐
│  └─ REQUIRED: E2E test (Playwright)                  │
│     - Auth flows                                     │
│     - Checkout/payment                               │
│     - Onboarding/offboarding                         │
│
├─ Bug Fix? ───────────────────────────────────────────┐
│  └─ REQUIRED: Regression test                        │
│     - Write test that fails before fix               │
│     - Verify test passes after fix                   │
│     - Prevents regression                            │
│
└─ Database Migration? ────────────────────────────────┐
   └─ REQUIRED: Migration test                         │
      - Test migration up/down                         │
      - Verify schema changes                          │
      - Test data integrity                            │
```

## Test Type Guidelines

### Unit Tests (Vitest)

**When to use:**
- Testing pure functions
- Testing utility/helper functions
- Testing business logic in isolation
- Testing data transformations

**Examples:**
- `lib/utils.ts` - Date formatting, string manipulation
- `lib/validation.ts` - Input validation
- `lib/pricing.ts` - Pricing calculations

**Coverage target: 100%** (utilities should be fully tested)

**Example:**
```typescript
// lib/pricing.test.ts
describe('calculateMonthlyLease', () => {
	it('should calculate correct monthly payment', () => {
		const result = calculateMonthlyLease({
			devicePrice: 1000,
			termMonths: 24,
			interestRate: 0.05
		});
		expect(result).toBeCloseTo(43.87, 2);
	});

	it('should throw for invalid term', () => {
		expect(() => calculateMonthlyLease({
			devicePrice: 1000,
			termMonths: 0,
			interestRate: 0.05
		})).toThrow('Invalid term');
	});
});
```

### Component Tests (React Testing Library + Vitest)

**When to use:**
- Testing React components with state
- Testing user interactions (clicks, form inputs)
- Testing conditional rendering
- Testing component lifecycle

**Examples:**
- `components/cart/CartButton.tsx` - Add to cart interaction
- `components/checkout/AssignmentStage.tsx` - Form handling
- `components/ui/Modal.tsx` - Open/close state

**Coverage target: 80%+** (focus on interactive components)

**Example:**
```typescript
// components/cart/CartButton.test.tsx
describe('CartButton', () => {
	it('should add item to cart on click', async () => {
		const { user } = render(<CartButton productId="abc123" />);

		await user.click(screen.getByText('Add to Cart'));

		expect(screen.getByText('Added to Cart')).toBeInTheDocument();
	});

	it('should disable button while adding', async () => {
		const { user } = render(<CartButton productId="abc123" />);
		const button = screen.getByText('Add to Cart');

		const clickPromise = user.click(button);
		expect(button).toBeDisabled();

		await clickPromise;
		expect(button).toBeEnabled();
	});
});
```

### Integration Tests (Vitest with Database)

**When to use:**
- Testing API endpoints
- Testing multi-component interactions
- Testing database queries
- Testing external service mocks

**Examples:**
- `api/routes/devices.test.ts` - Device CRUD endpoints
- `api/routes/auth.test.ts` - Auth flow with Clerk
- `api/routes/checkout.test.ts` - Multi-stage checkout

**Coverage target: 90%+** (APIs are critical)

**Example:**
```typescript
// api/routes/devices.test.ts
describe('GET /api/devices', () => {
	it('should return tenant-scoped devices', async () => {
		const res = await request(app)
			.get('/api/devices')
			.set('Authorization', `Bearer ${testToken}`)
			.expect(200);

		expect(res.body.devices).toHaveLength(3);
		expect(res.body.devices[0].account_id).toBe('test-account-123');
	});

	it('should require authentication', async () => {
		await request(app)
			.get('/api/devices')
			.expect(401);
	});
});
```

### E2E Tests (Playwright)

**When to use:**
- Testing complete user journeys
- Testing critical business flows
- Testing across multiple pages
- Testing real browser interactions

**Examples:**
- Sign in → Dashboard → Checkout → Payment
- Onboarding workflow (multi-page)
- Device assignment flow

**Coverage target: Critical paths only** (5-10 key journeys)

**Example:**
```typescript
// e2e/checkout.spec.ts
test('complete checkout flow', async ({ page }) => {
	// Given I am signed in
	await signIn(page);

	// When I add a device and checkout
	await page.goto('/catalog');
	await page.click('text=MacBook Pro');
	await page.click('button:has-text("Add to Cart")');
	await page.click('text=Checkout');

	// And complete all stages
	await page.click('text=Assign to myself');
	await page.click('button:has-text("Continue")');
	// ... shipping, delivery, payment ...

	// Then order is created
	await expect(page.locator('text=Order confirmed')).toBeVisible();
});
```

### Regression Tests (Any Framework)

**When to use:**
- EVERY bug fix
- Especially for security, auth, payments
- After production incidents

**Format:**
```typescript
/**
 * REGRESSION TEST
 * Issue: [GH-123 or ticket number]
 * Description: [What was broken]
 * Fix: [How it was fixed]
 */
describe('[Component/Feature] [REGRESSION]', () => {
	// Issue: GH-45 - Zero-value devices showed "Error"
	it('should show "Recycle for Free" for zero-value devices', () => {
		const valuation = valuateDevice({
			model: 'old-iphone',
			condition: 'poor'
		});
		expect(valuation.value).toBe(0);
		expect(valuation.message).toContain('Recycle for Free');
	});
});
```

## Coverage Requirements

**Global minimums (enforced in CI/CD):**

- Functions: **90%**
- Lines: **85%**
- Branches: **80%**
- Statements: **85%**

| Test Type      | Target        | Examples                   |
|----------------|--------------|----------------------------|
| Unit           | 100%         | Utils, validation, pricing |
| Component      | 80%+         | React components           |
| Integration    | 90%+         | API endpoints              |
| E2E            | 5-10 key flows | Critical user flows      |

## Quick Reference

### "Should I write a test for this?"

| Change Type                     | Test Required? | Test Type      |
|---------------------------------|----------------|----------------|
| New API endpoint                | YES            | Integration    |
| New React component with state  | YES            | Component      |
| Bug fix (any type)              | YES            | Regression     |
| Utility function                | YES            | Unit           |
| Simple presentational component | OPTIONAL       | Component      |
| CSS/styling only                | NO             | N/A            |
| Documentation                   | NO             | N/A            |

### Common Scenarios

**Scenario: Adding new checkout stage**
- Component test (AssignmentStage.test.tsx)
- Integration test (checkout API endpoints)
- Update E2E test (full checkout flow)

**Scenario: Fixing auth bug**
- Regression test (auth.test.ts)
- Update integration test (if needed)
- Update E2E test (if critical flow affected)

**Scenario: New pricing calculation**
- Unit test (pricing.test.ts) - 100% coverage
- Integration test (checkout calculates correctly)

**Scenario: Adding loading state**
- Component test (verify spinner shows)
- NO E2E test needed (too granular)

## Test Organization

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx         # Co-located component test
├── lib/
│   ├── utils.ts
│   └── utils.test.ts           # Co-located unit test
├── api/
│   └── routes/
│       ├── devices.ts
│       └── devices.test.ts     # Co-located integration test
e2e/
├── auth.spec.ts                # E2E tests separate
└── checkout.spec.ts
```

## References

- [CLAUDE.md Testing Requirements](/.claude/CLAUDE.md) - In-depth testing standards
- [tasks/testing/setup-vitest.md](/tasks/testing/setup-vitest.md) - Unit/integration setup
- [tasks/testing/setup-playwright.md](/tasks/testing/setup-playwright.md) - E2E setup
- [tasks/testing/regression-tests.md](/tasks/testing/regression-tests.md) - Regression patterns
