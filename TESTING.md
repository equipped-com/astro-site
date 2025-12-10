# Testing Guide

## Test Status

**Current Pass Rate**: ~94.4% (1095 passing / 65 failing out of 1160 total tests)

### Recent Improvements

- **January 2025**: Fixed all schema-related tests after database migration
- **Improved pass rate from 92.1% to 94.4%** (+26 tests fixed)
- All database schema tests now passing ✅

## Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode (recommended for development)
bun run test:watch

# Run specific test file
bun run test src/api/routes/devices.test.ts

# Generate coverage report
bun run test:coverage

# Visual test UI
bun run test:ui
```

## Test Categories

### ✅ Passing Test Suites (66 files)

All of these test suites are fully passing:

- **Cart & Storage**: cart-context, cart-storage, cart-context.regression
- **API Middleware**: auth, tenant, require-role, sysadmin
- **API Routes**: devices, device-assignments, people, proposals, store, alchemy, webhooks/clerk
- **Device Management**: device-crud.integration, trade-in-status
- **Admin Features**: impersonation, RestrictedAction, AdminStats, CustomerList
- **Components**: Most dashboard, navigation, and order components
- **Utilities**: utils, delivery-dates, proposal-tokens, address-validation, tenant-context

### ⚠️ Failing Test Suites (15 files - 65 tests)

#### API Route Tests (~20 failures)

**1. `organization.test.ts` (6/9 tests failing)**
- **Issue**: `getTenantContext()` not properly mocked in test environment
- **Error**: "Internal Server Error" / 500 responses
- **Fix needed**:
  ```typescript
  vi.mock('@/lib/tenant-context', () => ({
    getTenantContext: (c: any) => ({
      accountId: c.get('accountId'),
      userId: c.get('userId'),
      role: c.get('role'),
      DB: c.env.DB
    })
  }))
  ```

**2. `team.test.ts` (11 tests failing)**
- **Same issue as organization.test.ts**
- Needs getTenantContext() mock
- Tests are correctly structured, just missing context mock

**3. `user.regression.test.ts` (1 test failing)**
- **Issue**: Protected fields test needs better mock setup
- Minor fix needed for request body parsing

**4. `user.test.ts` (2 tests failing)**
- **Issue**: Complex query sequencing in mocks
- Needs proper handling of multiple SELECT queries

#### Component Tests (~45 failures)

**1. `TeamAccessManager.test.tsx` (14 tests failing)**
- **Issue**: `window.confirm` not available in test environment (happy-dom)
- **Fix needed**:
  ```typescript
  beforeEach(() => {
    window.confirm = vi.fn()
  })

  // Then in tests that need it:
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  ```

**2. `OnboardingWizard.test.tsx` (multiple failures)**
- **Issue**: Component stuck in loading state
- **Fix needed**: Better async handling with `waitFor()`
  ```typescript
  await waitFor(() => {
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
  })
  ```

**3. `OrganizationForm.test.tsx` (failures)**
- **Issue**: Mock setup for fetch calls
- Needs proper response mocking

**4. Other component tests**
- Similar async/loading state issues
- Need `window.confirm` polyfill
- Need better fetch mocking

## Common Test Patterns

### Mocking Database

```typescript
const mockDB = {
  prepare: vi.fn().mockReturnValue({
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(mockData),
    all: vi.fn().mockResolvedValue({ results: [mockData] }),
    run: vi.fn().mockResolvedValue({ success: true }),
  }),
} as unknown as D1Database
```

### Mocking Hono Middleware

```typescript
// At module level, before imports
vi.mock('../middleware/auth', () => ({
  requireAccountAccess: () => async (c: any, next: () => Promise<void>) => {
    c.set('userId', 'user-123')
    c.set('role', c.req.header('x-test-role') || 'owner')
    return next()
  },
}))
```

### Testing with Async Components

```typescript
import { render, screen, waitFor } from '@testing-library/react'

it('should load and display data', async () => {
  render(<MyComponent />)

  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
  })

  // Now assert on loaded content
  expect(screen.getByText('Expected Content')).toBeInTheDocument()
})
```

### Window API Polyfills

```typescript
// In test setup or beforeEach
beforeEach(() => {
  window.confirm = vi.fn()
  window.alert = vi.fn()
  window.scrollTo = vi.fn()
})
```

## Database Schema Testing

### Schema Alignment

All tests now correctly align with the new database schema:

**Orders Table:**
- ✅ Uses: `created_by_user_id`, `assigned_to_person_id`, `subtotal`, `total`, `shipping_cost`, `tax_amount`
- ❌ Removed: `order_number`, `total_amount`, `currency`

**Devices Table:**
- ✅ Uses: `assigned_to_person_id`, `purchase_date`, `purchase_price`, `trade_in_value`
- ❌ Old: `assigned_to`

**Device Assignments:**
- ✅ Uses: `device_id`, `person_id`, `assigned_by_user_id`, `assigned_at`, `returned_at`

### Regression Tests

We maintain regression tests for bugs that were fixed:

- **CART-001**: Negative quantity prevention
- **CART-002**: Corrupted localStorage handling
- **CART-003**: Account switching clears cart
- **CART-004**: Same SKU with different specs creates separate items
- **CART-005**: Promo code cleared with cart
- **CART-006**: Zero-priced items handled correctly

## Test Organization

```
src/
├── api/
│   ├── routes/
│   │   ├── devices.test.ts              # API endpoint tests
│   │   ├── device-assignments.test.ts
│   │   └── ...
│   ├── device-crud.integration.test.ts  # Integration tests
│   └── middleware/
│       ├── auth.test.ts                  # Middleware unit tests
│       └── ...
├── components/
│   ├── cart/
│   │   ├── Cart.test.tsx                 # Component tests
│   │   └── ...
│   └── ...
├── lib/
│   ├── cart-context.test.tsx             # React context tests
│   ├── cart-context.regression.test.tsx  # Regression tests
│   ├── cart-storage.test.ts              # Utility tests
│   └── ...
└── test/
    ├── setup.ts                           # Global test setup
    └── fixtures/                          # Shared test data
```

## Coverage Requirements

**Minimum (enforced in CI/CD):**
- Functions: **90%**
- Lines: **85%**
- Branches: **80%**
- Statements: **85%**

**Current Coverage:**
- Run `bun run test:coverage` to see latest numbers

## Fixing Remaining Tests

### Priority Order

1. **High Priority** - API route tests (20 tests)
   - Block core functionality testing
   - Fix: Add getTenantContext() mock
   - Estimated time: 1-2 hours

2. **Medium Priority** - Component tests with window.confirm (14 tests)
   - Fix: Add window.confirm polyfill
   - Estimated time: 30 minutes

3. **Low Priority** - Other component tests (31 tests)
   - Fix: Improve async handling and fetch mocking
   - Estimated time: 2-3 hours

### Quick Wins

These changes would fix ~20 tests in under an hour:

1. **Add to test setup** (`src/test/setup.ts` or vitest.config.ts):
   ```typescript
   // Polyfill window APIs
   global.window.confirm = vi.fn(() => true)
   global.window.alert = vi.fn()
   global.window.scrollTo = vi.fn()
   ```

2. **Mock getTenantContext** in API tests:
   ```typescript
   vi.mock('@/lib/tenant-context', () => ({
     getTenantContext: (c: any) => ({
       accountId: c.get('accountId'),
       userId: c.get('userId'),
       role: c.get('role'),
       DB: c.env.DB
     })
   }))
   ```

## Debugging Test Failures

### View Test Output

```bash
# Verbose output
bun run test -- --reporter=verbose

# UI mode for debugging
bun run test:ui

# Debug specific test
bun run test:debug src/path/to/test.ts
```

### Common Issues

**Issue: "Cannot read properties of undefined"**
- Check mock setup - ensure all required fields are mocked
- Verify middleware is setting expected context values

**Issue: "Unexpected token 'I', "Internal S"... is not valid JSON"**
- Server returned error instead of JSON
- Check mock response status codes
- Verify middleware isn't blocking the request

**Issue: "Unable to find element"**
- Component might still be loading
- Use `waitFor()` to wait for async operations
- Check if Spinner is still showing

**Issue: "vi.spyOn() can only spy on a function. Received undefined"**
- Function doesn't exist in test environment
- Add polyfill in beforeEach or test setup

## CI/CD Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Manual workflow dispatch

**Required for merge:**
- All tests must pass
- Coverage thresholds must be met
- No linting errors

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright (E2E)](https://playwright.dev/)
- Project tasks: `tasks/testing/*.md`
