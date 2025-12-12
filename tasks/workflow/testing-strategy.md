# Testing Strategy Decision Tree

## Description

Create clear documentation and decision tree for determining which type of test to write (unit, integration, E2E, regression) for different types of code changes.

## Dependencies

None - this is a documentation task.

## Acceptance Criteria

- [ ] Decision tree diagram or flowchart created
- [ ] Clear guidelines for each test type
- [ ] Examples for common scenarios (API, UI, business logic, bug fixes)
- [ ] Coverage targets defined by test type
- [ ] Integration with existing testing docs
- [ ] Quick reference guide for developers
- [ ] Documentation added to project

## Test Criteria

```gherkin
Feature: Testing Strategy Decision Tree
	As a developer
	I want clear guidelines on when to write which type of test
	So that I test appropriately without over-testing or under-testing

	@REQ-WF-004
	Scenario: Decide test type for a feature
		Given I am implementing a feature
		When I consult the testing decision tree
		Then I should know:
			| Question                          | Answer Leads To      |
			| Is this a UI component?           | Component test       |
			| Is this business logic?           | Unit test            |
			| Is this an API endpoint?          | Integration test     |
			| Is this a critical user flow?     | E2E test             |
			| Is this a bug fix?                | Regression test      |
```

## Implementation

### 1. Create Testing Strategy Document

Create `documentation/testing-strategy.md`:

```markdown
# Testing Strategy & Decision Tree

## Overview

This guide helps you decide which type of test to write for different code changes.

## Decision Tree

\`\`\`
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
\`\`\`

## Test Type Guidelines

### Unit Tests (Vitest)

**When to use:**
- Testing pure functions
- Testing utility/helper functions
- Testing business logic in isolation
- Testing data transformations

**Examples:**
- \`lib/utils.ts\` - Date formatting, string manipulation
- \`lib/validation.ts\` - Input validation
- \`lib/pricing.ts\` - Pricing calculations

**Coverage target: 100%** (utilities should be fully tested)

**Example:**
\`\`\`typescript
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
\`\`\`

### Component Tests (React Testing Library + Vitest)

**When to use:**
- Testing React components with state
- Testing user interactions (clicks, form inputs)
- Testing conditional rendering
- Testing component lifecycle

**Examples:**
- \`components/cart/CartButton.tsx\` - Add to cart interaction
- \`components/checkout/AssignmentStage.tsx\` - Form handling
- \`components/ui/Modal.tsx\` - Open/close state

**Coverage target: 80%+** (focus on interactive components)

**Example:**
\`\`\`typescript
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
\`\`\`

### Integration Tests (Vitest with Database)

**When to use:**
- Testing API endpoints
- Testing multi-component interactions
- Testing database queries
- Testing external service mocks

**Examples:**
- \`api/routes/devices.test.ts\` - Device CRUD endpoints
- \`api/routes/auth.test.ts\` - Auth flow with Clerk
- \`api/routes/checkout.test.ts\` - Multi-stage checkout

**Coverage target: 90%+** (APIs are critical)

**Example:**
\`\`\`typescript
// api/routes/devices.test.ts
describe('GET /api/devices', () => {
	it('should return tenant-scoped devices', async () => {
		const res = await request(app)
			.get('/api/devices')
			.set('Authorization', \`Bearer \${testToken}\`)
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
\`\`\`

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
\`\`\`typescript
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
\`\`\`

### Regression Tests (Any Framework)

**When to use:**
- EVERY bug fix
- Especially for security, auth, payments
- After production incidents

**Format:**
\`\`\`typescript
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
\`\`\`

## Coverage Requirements

| Test Type      | Minimum | Target  | Examples                   |
|----------------|---------|---------|----------------------------|
| Unit           | 85%     | 100%    | Utils, validation, pricing |
| Component      | 70%     | 80%     | React components           |
| Integration    | 85%     | 90%+    | API endpoints              |
| E2E            | N/A     | 5-10    | Critical user flows        |

**Overall project minimum: 85% statement coverage**

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

\`\`\`
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
\`\`\`

## References

- CLAUDE.md - Testing requirements
- tasks/testing/setup-vitest.md - Unit/integration setup
- tasks/testing/setup-playwright.md - E2E setup
- tasks/testing/regression-tests.md - Regression patterns
\`\`\`

### 2. Create Quick Reference Card

Create `documentation/testing-quick-reference.md`:

```markdown
# Testing Quick Reference

## Decision Flow

1. **Is it a bug fix?** → Regression test (ALWAYS)
2. **Is it an API endpoint?** → Integration test (ALWAYS)
3. **Is it a critical user flow?** → E2E test (ALWAYS)
4. **Is it business logic?** → Unit test (ALWAYS)
5. **Is it a React component with state?** → Component test (RECOMMENDED)
6. **Is it pure presentation?** → Component test (OPTIONAL)

## Test Commands

\`\`\`bash
# Unit + Integration tests
bun run test                # Run once
bun run test:watch          # Watch mode (recommended)
bun run test:coverage       # Coverage report

# E2E tests
bun run test:e2e            # Headless
bun run test:e2e:ui         # Visual UI
bun run test:e2e:debug      # Debug mode
\`\`\`

## Coverage Targets

- **Functions**: 90%
- **Lines**: 85%
- **Branches**: 80%
- **Statements**: 85%

## When in Doubt

Write the test. Better to have it and not need it.
\`\`\`

### 3. Update CLAUDE.md

Add reference to testing strategy in the testing section:

\`\`\`markdown
**Test Documentation:**
Checkout the testing tasks for comprehensive patterns:
- \`tasks/testing/setup-vitest.md\` - Framework setup & examples
- \`documentation/testing-strategy.md\` - **Decision tree for test types**
- \`tasks/testing/auth-tests.md\` - Auth system testing
- \`tasks/testing/integration-tests.md\` - API & multi-component testing
- \`tasks/testing/regression-tests.md\` - Bug fix verification
\`\`\`

## Files to Create/Modify

**Create:**
- `documentation/testing-strategy.md` - Comprehensive decision tree and guidelines
- `documentation/testing-quick-reference.md` - Quick lookup reference

**Modify:**
- `.claude/CLAUDE.md` - Add link to testing strategy

## References

- documentation/PRDs/workflow.md (REQ-WF-004)
- .claude/CLAUDE.md (existing testing requirements)
- tasks/testing/setup-vitest.md (unit/integration examples)
- tasks/testing/setup-playwright.md (E2E examples)
