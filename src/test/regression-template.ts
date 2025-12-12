/**
 * Regression Test Template
 *
 * This file provides utilities and examples for writing regression tests.
 * Every bug fix MUST include a regression test to prevent reoccurrence.
 *
 * @see tasks/testing/regression-tests.md
 * @see .claude/CLAUDE.md - Testing Strategy section
 */

/**
 * Regression Test Header Template
 *
 * Use this comment structure at the top of every regression test:
 *
 * ```typescript
 * /**
 *  * REGRESSION TEST
 *  * Issue: [GH-123 | JIRA-456 | Bug description]
 *  * Description: [What was broken]
 *  * Fix: [How was it fixed]
 *  * Verification: [How test proves fix]
 *  * /
 * ```
 */

/**
 * Example 1: API Validation Regression
 *
 * REGRESSION TEST
 * Issue: Missing validation allowed zero-length account IDs
 * Description: API accepted empty account_id strings, causing database errors
 * Fix: Added validation to reject empty strings in account switching
 * Verification: Test ensures 400 error for empty account_id
 */
export const exampleApiValidation = `
describe('Account Switching API [REGRESSION]', () => {
	/**
	 * REGRESSION TEST
	 * Issue: GH-45 - Empty account_id caused database error
	 * Description: POST /accounts//switch accepted empty account_id
	 * Fix: Added validation to reject empty account_id before DB query
	 * Verification: Returns 400 with clear error message
	 */
	test('should reject empty account_id in switch request', async () => {
		const mockDb = { prepare: vi.fn() }
		const app = createTestApp(mockDb)

		const res = await app.request('/accounts//switch', {
			method: 'POST',
		})

		expect(res.status).toBe(400)
		const json = await res.json()
		expect(json.error).toContain('account_id is required')

		// Verify DB was never called (validation happened first)
		expect(mockDb.prepare).not.toHaveBeenCalled()
	})
})
`

/**
 * Example 2: React Component Edge Case
 *
 * REGRESSION TEST
 * Issue: Cart crashed when all items removed simultaneously
 * Description: Empty cart array caused undefined access in summary calculation
 * Fix: Added null check before calculating subtotal
 * Verification: Component renders empty state without crashing
 */
export const exampleComponentCrash = `
describe('Cart Component [REGRESSION]', () => {
	/**
	 * REGRESSION TEST
	 * Issue: GH-67 - Cart crashed on simultaneous item removal
	 * Description: Removing last item caused undefined access in subtotal calc
	 * Fix: Added guards for empty items array before calculations
	 * Verification: Component shows empty state instead of crashing
	 */
	test('should handle empty cart after removing all items', async () => {
		const cart = {
			id: 'test-cart',
			accountId: 'test-account',
			userId: 'test-user',
			paymentMethod: 'buy' as const,
			items: [
				{
					id: 'item-1',
					productSku: 'MB-M2',
					productName: 'MacBook Air M2',
					productImage: '',
					specs: {},
					quantity: 1,
					unitPrice: 1199,
				},
			],
			subtotal: 1199,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		localStorage.setItem('equipped_cart', JSON.stringify(cart))

		renderCart()

		await waitFor(() => {
			expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
		})

		// Remove the only item
		const removeButton = screen.getByLabelText('Remove item')
		fireEvent.click(removeButton)

		// Should NOT crash - should show empty state
		await waitFor(() => {
			expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
		})

		// Verify no error was thrown
		expect(console.error).not.toHaveBeenCalled()
	})
})
`

/**
 * Example 3: Form Validation Regression
 *
 * REGRESSION TEST
 * Issue: Form allowed invalid EIN format
 * Description: Payment form accepted EINs without proper XX-XXXXXXX format
 * Fix: Added regex validation for EIN format
 * Verification: Form rejects invalid formats and shows error message
 */
export const exampleFormValidation = `
describe('Payment Form [REGRESSION]', () => {
	/**
	 * REGRESSION TEST
	 * Issue: GH-89 - Invalid EIN formats allowed in payment form
	 * Description: Form accepted EINs like "123456789" without hyphens
	 * Fix: Added validation regex /^\\d{2}-\\d{7}$/ for EIN field
	 * Verification: Form shows error for invalid formats
	 */
	test('should reject EIN without proper XX-XXXXXXX format', async () => {
		render(<PaymentForm />)

		const einInput = screen.getByLabelText('EIN')
		const submitButton = screen.getByRole('button', { name: /continue/i })

		// Try invalid format (no hyphen)
		fireEvent.change(einInput, { target: { value: '123456789' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(screen.getByText(/EIN must be in format XX-XXXXXXX/i)).toBeInTheDocument()
		})

		// Verify form was not submitted
		expect(submitButton).toBeEnabled()
	})

	test('should accept valid EIN format XX-XXXXXXX', async () => {
		render(<PaymentForm />)

		const einInput = screen.getByLabelText('EIN')
		fireEvent.change(einInput, { target: { value: '12-3456789' } })

		// Should not show error
		expect(screen.queryByText(/EIN must be in format/i)).not.toBeInTheDocument()
	})
})
`

/**
 * Example 4: Authentication Edge Case
 *
 * REGRESSION TEST
 * Issue: Session expired redirected to wrong page
 * Description: Expired sessions redirected to /login instead of preserving intended destination
 * Fix: Store intended destination before redirect
 * Verification: User redirected to original destination after login
 */
export const exampleAuthRedirect = `
import { type Mock } from 'vitest'

describe('Auth Middleware [REGRESSION]', () => {
	/**
	 * REGRESSION TEST
	 * Issue: GH-112 - Lost intended destination after session expiry
	 * Description: Expired session on /dashboard/devices redirected to /login, then to /dashboard (root)
	 * Fix: Store intended URL in redirect_url query param
	 * Verification: After login, user lands on original destination
	 */
	test('should preserve intended destination on session expiry', async () => {
		const { getAuth } = await import('@hono/clerk-auth')
		(getAuth as Mock).mockReturnValueOnce({ userId: undefined } as MockAuth)

		const mockDb = { prepare: vi.fn() }
		const app = createTestApp(mockDb)

		const res = await app.request('/dashboard/devices')

		expect(res.status).toBe(302) // Redirect
		const location = res.headers.get('Location')
		expect(location).toContain('/login')
		expect(location).toContain('redirect_url=%2Fdashboard%2Fdevices')
	})
})
`

/**
 * Example 5: State Management Race Condition
 *
 * REGRESSION TEST
 * Issue: Sidebar active state stale on route change
 * Description: Sidebar nav showed wrong active item after navigation
 * Fix: Added useEffect to sync active state with current route
 * Verification: Active state updates immediately on route change
 */
export const exampleStateSync = `
describe('Dashboard Sidebar [REGRESSION]', () => {
	/**
	 * REGRESSION TEST
	 * Issue: GH-134 - Sidebar active state stale after navigation
	 * Description: After navigating to /devices, sidebar still showed /dashboard as active
	 * Fix: Added useEffect with location dependency to update active state
	 * Verification: Active state updates on route change
	 */
	test('should update active state when route changes', async () => {
		const { rerender } = render(<Sidebar currentPath="/dashboard" />)

		expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('aria-current', 'page')
		expect(screen.getByRole('link', { name: /devices/i })).not.toHaveAttribute('aria-current', 'page')

		// Simulate route change
		rerender(<Sidebar currentPath="/dashboard/devices" />)

		await waitFor(() => {
			expect(screen.getByRole('link', { name: /devices/i })).toHaveAttribute('aria-current', 'page')
		})
		expect(screen.getByRole('link', { name: /dashboard/i })).not.toHaveAttribute('aria-current', 'page')
	})
})
`

/**
 * Regression Test Checklist
 *
 * When writing a regression test:
 *
 * ☐ Add REGRESSION TEST comment header with issue/fix/verification
 * ☐ Name test describes the BUG, not just the feature (e.g., "should not crash on empty cart")
 * ☐ Test would FAIL with the original buggy code
 * ☐ Test PASSES with the fix applied
 * ☐ Test is specific enough to catch the exact bug, not just general behavior
 * ☐ Test includes edge cases that triggered the bug
 * ☐ Test documents the original issue for future developers
 * ☐ Reference issue number (GH-123, JIRA-456) in test header
 */

/**
 * Finding Bugs to Create Regression Tests For
 *
 * Look for these patterns in your codebase:
 *
 * 1. Recent bug fixes in git history:
 *    - Search commits: git log --all --grep="fix:" --oneline
 *    - Create tests for each fix
 *
 * 2. Edge cases in existing code:
 *    - Empty arrays/objects
 *    - Null/undefined values
 *    - Zero values in calculations
 *    - Maximum/minimum values
 *    - Concurrent operations
 *
 * 3. User-reported issues:
 *    - Check issue tracker
 *    - Review support tickets
 *    - Monitor error logs
 *
 * 4. Code review comments:
 *    - "This could crash if..."
 *    - "What happens when..."
 *    - "Edge case: ..."
 */
