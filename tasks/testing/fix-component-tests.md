# Fix Failing Component Tests

## Description

Fix 14 failing component test files where React components don't render expected elements. Components are marked complete but tests fail because elements aren't found, props aren't passed correctly, or context providers are missing.

## Dependencies

- `testing/mock-browser-apis` - Browser APIs must be mocked first
- `testing/setup-vitest` - Test infrastructure must be working

## Acceptance Criteria

- [ ] All TeamAccessManager tests pass (5 tests)
- [ ] All PendingInvitations tests pass (9 tests)
- [ ] All InviteMemberModal tests pass
- [ ] All admin component tests pass (7 files)
- [ ] All dashboard component tests pass (3 files)
- [ ] All trade-in component tests pass (2 files)
- [ ] All cart component tests pass
- [ ] Zero "Unable to find element" errors
- [ ] All components render expected content in tests

## Test Criteria

```gherkin
Feature: Component Test Fixes
	As a developer
	I want all component tests to pass
	So that I can verify UI behavior

	@REQ-COMP-TEST-001
	Scenario: TeamAccessManager renders team members
		Given a list of team members
		When rendering TeamAccessManager
		Then it should display member names (Alice, Bob)
		And it should display member roles
		And it should display invite button

	@REQ-COMP-TEST-002
	Scenario: PendingInvitations shows revoke button
		Given pending invitations
		When rendering PendingInvitations
		Then it should show revoke button for each invitation
		And clicking revoke should call onRevoke handler
		And should show confirmation dialog (mocked)

	@REQ-COMP-TEST-003
	Scenario: Admin components render with auth context
		Given authenticated admin user
		When rendering admin components
		Then they should access user context without errors
		And they should display admin-specific UI

	@REQ-COMP-TEST-004
	Scenario: Dashboard components fetch and display data
		Given mocked API responses
		When rendering dashboard components
		Then they should display fetched data
		And they should handle loading states
		And they should handle error states
```

## Implementation

### Failing Component Test Files (14 total)

**Settings Components (3 files):**
1. `src/components/settings/TeamAccessManager.test.tsx` - 5 failures
2. `src/components/settings/PendingInvitations.test.tsx` - 9 failures
3. `src/components/settings/InviteMemberModal.test.tsx` - failures

**Admin Components (7 files):**
4. `src/components/admin/CustomerList.test.tsx` - failures
5. `src/components/admin/ImpersonationBanner.test.tsx` - failures
6. `src/components/admin/RestrictedAction.test.tsx` - failures
7. `src/components/admin/useImpersonation.test.ts` - failures
8. `src/components/admin/catalog/BrandTable.test.tsx` - failures
9. `src/components/admin/catalog/InventoryTable.test.tsx` - failures
10. `src/components/admin/catalog/ProductTable.test.tsx` - failures

**Dashboard Components (3 files):**
11. `src/components/dashboard/AccountSwitcher.test.tsx` - failures
12. `src/components/dashboard/QuickStats.test.tsx` - failures
13. `src/test/pages/dashboard/index.test.tsx` - failures

**Other Components (2 files):**
14. `src/components/cart/Cart.test.tsx` - failures
15. `src/components/trade-in/ReturnLabel.test.tsx` - failures
16. `src/components/trade-in/ValueAdjustmentModal.test.tsx` - failures

### Common Fix Patterns

#### Pattern 1: Missing Test Data

**Problem:**
```typescript
screen.getByText('Bob')  // ❌ Not found
```

**Fix:**
```typescript
// Ensure test data is in the rendered component
const mockMembers = [
  { id: '1', name: 'Alice', role: 'owner' },
  { id: '2', name: 'Bob', role: 'member' },
]

render(<TeamAccessManager members={mockMembers} />)
screen.getByText('Bob')  // ✅ Found
```

#### Pattern 2: Missing Context Providers

**Problem:**
```typescript
render(<Component />)  // ❌ useUser() returns undefined
```

**Fix:**
```typescript
import { UserProvider } from '@/contexts/UserContext'

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <UserProvider value={mockUser}>
      {ui}
    </UserProvider>
  )
}

renderWithProviders(<Component />)  // ✅ Works
```

#### Pattern 3: Async Data Not Loaded

**Problem:**
```typescript
render(<Component />)
screen.getByText('Data loaded')  // ❌ Component still loading
```

**Fix:**
```typescript
render(<Component />)
await screen.findByText('Data loaded')  // ✅ Waits for async
```

#### Pattern 4: Component Conditions Not Met

**Problem:**
```typescript
// Component only shows "Invite" button if user is owner
render(<Component currentUserRole="member" />)
screen.getByText('Invite Member')  // ❌ Not shown for members
```

**Fix:**
```typescript
render(<Component currentUserRole="owner" />)
screen.getByText('Invite Member')  // ✅ Shown for owners
```

### Step-by-Step Fix Process

**For each failing test file:**

1. **Run the test in isolation:**
   ```bash
   bun run test src/components/settings/TeamAccessManager.test.tsx
   ```

2. **Read the error message carefully:**
   ```
   Unable to find element with text: Bob
   ```

3. **Check what the component actually renders:**
   ```typescript
   // Add debug output
   const { debug } = render(<TeamAccessManager />)
   debug()  // See actual DOM
   ```

4. **Identify the root cause:**
   - Missing props?
   - Missing context?
   - Wrong mock data?
   - Async not awaited?

5. **Apply appropriate fix pattern**

6. **Verify fix:**
   ```bash
   bun run test src/components/settings/TeamAccessManager.test.tsx
   ```

7. **Commit fix:**
   ```bash
   git add src/components/settings/TeamAccessManager.test.tsx
   git commit -m "fix(testing): fix TeamAccessManager test - provide correct props"
   ```

### Testing Helpers to Create

Create `src/test/helpers/render-with-providers.tsx`:

```typescript
import { render, RenderOptions } from '@testing-library/react'
import { UserProvider } from '@/contexts/UserContext'
import { CartProvider } from '@/contexts/CartContext'

interface CustomRenderOptions extends RenderOptions {
  user?: User
  cart?: Cart
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    user = mockUser,
    cart = mockCart,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <UserProvider value={user}>
        <CartProvider initialCart={cart}>
          {children}
        </CartProvider>
      </UserProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}
```

## Files to Create/Modify

**Modify (fix tests):**
- All 14+ component test files listed above

**Create (test helpers):**
- `src/test/helpers/render-with-providers.tsx`
- `src/test/fixtures/mock-users.ts`
- `src/test/fixtures/mock-components.tsx`

## Notes

- Fix tests one file at a time
- Commit after each file is fixed
- Use `debug()` liberally to see actual DOM
- Create reusable test helpers for common patterns
- Update related tasks as tests pass

## References

- test-failure-analysis-corrected.md (Pattern 1: Component Rendering)
- Testing Library docs: https://testing-library.com/docs/react-testing-library/intro
- All 14 failing component test files
