---
epic: testing
task_id: setup-vitest
title: Setup Vitest Testing Infrastructure
complexity: medium
priority: high
---

# Setup Vitest Testing Infrastructure

## Description

Establish automated testing framework for the Equipped platform. Tests are critical for:
- **Regression prevention** - Catch breaking changes before production
- **Living documentation** - Tests show exactly how code should behave
- **Confidence in refactoring** - Safe to improve code with test coverage
- **Integration validation** - Verify components work together correctly

This task creates the foundation for all future testing (unit, integration, E2E).

## Acceptance Criteria

- [ ] Vitest installed with all required packages
- [ ] TypeScript configured for test files
- [ ] Test scripts added to `package.json` (`test`, `test:watch`, `test:coverage`)
- [ ] Test utilities and helpers created
- [ ] Example tests written (component + API endpoint)
- [ ] Coverage reporting configured
- [ ] CI/CD ready (tests run in build pipeline)
- [ ] Documentation for developers on how to write tests

## Test Criteria

```gherkin
Feature: Vitest Setup
  Scenario: Tests execute successfully
    Given Vitest is installed
    When running `npm run test`
    Then all tests pass without errors
    And coverage report is generated

  Scenario: Watch mode works for development
    When running `npm run test:watch`
    Then tests re-run on file changes
    And failures are reported clearly

  Scenario: Coverage thresholds enforced
    When running `npm run test:coverage`
    Then coverage report shows percentages
    And warnings appear if below thresholds

  Scenario: Example tests demonstrate patterns
    Given example test files exist
    When developer reads them
    Then they understand how to write similar tests
```

## Implementation

### 1. Install Packages

```bash
bun add -d vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/astro happy-dom
```

(Use `bun` for faster installs. Falls back to `npm` if bun not available.)

**Packages:**
- `vitest` - Test runner (fast, Vite-native)
- `@vitest/ui` - Visual test runner dashboard
- `@vitest/coverage-v8` - Coverage reporting
- `@testing-library/react` - React component testing utilities
- `@testing-library/astro` - Astro component testing utilities
- `happy-dom` - Lightweight DOM implementation for tests

### 2. Configure Vitest

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'
import { getViteConfig } from 'astro/config'

export default defineConfig(
	getViteConfig({
		test: {
			globals: true,
			environment: 'happy-dom',
			coverage: {
				provider: 'v8',
				reporter: ['text', 'html', 'json'],
				exclude: [
					'node_modules/',
					'dist/',
					'**/*.test.ts',
					'**/*.test.tsx',
					'**/*.spec.ts',
				],
				lines: 70,
				functions: 70,
				branches: 70,
				statements: 70,
			},
			include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts'],
		},
	})
)
```

### 3. Update package.json

```json
{
	"scripts": {
		"test": "vitest run",
		"test:watch": "vitest",
		"test:ui": "vitest --ui",
		"test:coverage": "vitest run --coverage",
		"test:debug": "vitest --inspect-brk --inspect --single-thread"
	}
}
```

### 4. Create Test Utilities

File: `src/test/setup.ts`

```typescript
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
	cleanup()
})

// Mock environment variables for tests
beforeAll(() => {
	process.env.PUBLIC_CLERK_PUBLISHABLE_KEY = 'test_key_12345'
})

// Global test utilities
export { render } from '@testing-library/react'
export { screen, fireEvent, waitFor } from '@testing-library/react'
```

File: `src/test/fixtures.ts`

```typescript
// Mock data for tests
export const mockUser = {
	id: 'user_123',
	email: 'test@example.com',
	name: 'Test User',
}

export const mockAccount = {
	id: 'account_123',
	name: 'Test Company',
	subdomain: 'testco',
}

export const mockDevice = {
	id: 'device_123',
	name: 'MacBook Pro',
	serial: 'C12345678',
	accountId: 'account_123',
}
```

### 5. Write Example Tests

File: `src/components/dashboard/Spinner.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/setup'
import { Spinner } from './Spinner'

describe('Spinner', () => {
	it('renders with default size', () => {
		render(<Spinner />)
		const spinner = screen.getByRole('status')
		expect(spinner).toBeInTheDocument()
	})

	it('applies custom className', () => {
		const { container } = render(<Spinner className="custom-class" />)
		const spinner = container.querySelector('[role="status"]')
		expect(spinner).toHaveClass('custom-class')
	})

	it('supports size variants', () => {
		const { rerender } = render(<Spinner size="sm" />)
		// Test small size
		rerender(<Spinner size="lg" />)
		// Test large size
	})
})
```

File: `src/lib/auth.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { validateToken, extractUserId } from './auth'

describe('Auth Utilities', () => {
	beforeEach(() => {
		// Setup before each test
	})

	it('should validate correct token format', () => {
		const validToken = 'eyJhbGc...' // Mock JWT
		expect(validateToken(validToken)).toBe(true)
	})

	it('should reject invalid tokens', () => {
		expect(validateToken('invalid')).toBe(false)
		expect(validateToken('')).toBe(false)
		expect(validateToken(null)).toBe(false)
	})

	it('should extract user ID from token', () => {
		const token = 'eyJhbGc...' // Mock JWT with user_123
		expect(extractUserId(token)).toBe('user_123')
	})
})
```

### 6. Regression Test Pattern

For bug fixes, create tests that verify the fix:

```typescript
describe('Device Valuation [REGRESSION]', () => {
	// Issue: Device with price $0 was showing as "error"
	// Fix: Handle zero-value devices with "Recycle for Free" message
	it('should handle zero-value devices correctly', () => {
		const result = valuateDevice({ model: 'old-device', condition: 'poor' })
		expect(result.value).toBe(0)
		expect(result.message).toContain('Recycle for Free')
	})
})
```

## Testing Patterns & Best Practices

### 1. **Tests as Documentation**

```typescript
// GOOD: Tests describe expected behavior clearly
describe('Checkout Assignment', () => {
	it('should disable Continue button until a person is assigned', () => {
		render(<AssignmentStage />)
		expect(screen.getByText('Continue')).toBeDisabled()

		fireEvent.click(screen.getByText('Assign to someone'))
		expect(screen.getByText('Continue')).toBeDisabled() // Still disabled

		// Select a person
		fireEvent.click(screen.getByText('Alice'))
		expect(screen.getByText('Continue')).toBeEnabled() // Now enabled
	})
})
```

### 2. **Integration Testing Pattern**

```typescript
// Test component + store + API interaction
describe('Order List Integration', () => {
	it('should fetch and display orders on mount', async () => {
		const { mockFetch } = setupMockAPI()
		mockFetch.get('/api/orders').returns([mockOrder])

		render(<OrderList />)

		await waitFor(() => {
			expect(screen.getByText('Order #123')).toBeInTheDocument()
		})
	})
})
```

### 3. **Snapshot Testing (Use Sparingly)**

```typescript
// Only for stable UI that rarely changes
it('should render dashboard layout correctly', () => {
	const { container } = render(<DashboardLayout />)
	expect(container).toMatchSnapshot()
})
```

### 4. **Error Boundary Testing**

```typescript
describe('Auth Middleware Error Handling', () => {
	it('should return 401 when token is invalid', async () => {
		const response = await middleware({
			headers: { authorization: 'Bearer invalid' },
		})
		expect(response.status).toBe(401)
		expect(response.body).toContain('Unauthorized')
	})
})
```

## Running Tests

```bash
# Run all tests once
bun run test

# Run tests in watch mode (recommended for development)
bun run test:watch

# Generate coverage report
bun run test:coverage

# Open visual UI
bun run test:ui

# Debug a specific test
bun run test:debug -- src/components/Spinner.test.tsx
```

**Note:** Use `bun run` instead of `npm run` for faster test execution.

## Coverage Expectations

**Minimum thresholds (enforced in CI):**
- **Functions:** 70%
- **Lines:** 70%
- **Branches:** 70%
- **Statements:** 70%

**Target (aspirational):**
- **Core features:** 80-90% (auth, checkout, payments)
- **Utilities:** 90%+
- **UI components:** 70-80%
- **Pages:** 60-70%

## Dependencies

- `infrastructure/setup-hono-worker` - Need Hono app setup
- `auth/install-clerk` - Need Clerk SDK for mocking

## References

- **Vitest Docs:** https://vitest.dev
- **Testing Library:** https://testing-library.com
- **Gherkin BDD:** https://cucumber.io/docs/gherkin/
- **Test-Driven Development:** Red-Green-Refactor cycle
- **Jest to Vitest Migration:** https://vitest.dev/guide/migration.html
