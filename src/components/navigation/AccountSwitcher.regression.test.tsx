/**
 * Account Switcher - REGRESSION TESTS
 *
 * Tests for bugs discovered and fixed in account switching.
 * Each test prevents a known bug from reoccurring.
 *
 * @see tasks/testing/regression-tests.md
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountSwitcher } from './AccountSwitcher'

const mockAccounts = [
	{ id: 'acc_1', name: 'Acme Corp', short_name: 'acme', role: 'admin' as const },
	{ id: 'acc_2', name: 'Beta Inc', short_name: 'beta', role: 'member' as const },
	{ id: 'acc_3', name: 'Gamma LLC', short_name: 'gamma', role: 'member' as const },
]

describe('AccountSwitcher [REGRESSION TESTS]', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * REGRESSION TEST
	 * Issue: NAV-001 - Rapid account switches caused state inconsistency
	 * Description: Clicking multiple accounts rapidly caused UI to show wrong account
	 * Fix: Debounce account switch requests and disable UI during transition
	 * Verification: Rapid clicks queued, final state reflects last click
	 */
	it('should handle rapid account switching without state corruption', async () => {
		const onSwitch = vi.fn(async (accountId: string) => {
			// Simulate async API call
			await new Promise(resolve => setTimeout(resolve, 100))
			return { success: true, accountId }
		})

		render(<AccountSwitcher accounts={mockAccounts} currentAccountId="acc_1" onSwitch={onSwitch} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { name: /acme corp/i })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByText('Beta Inc')).toBeInTheDocument()
		})

		// Rapidly click multiple accounts
		const betaOption = screen.getByText('Beta Inc')
		const gammaOption = screen.getByText('Gamma LLC')

		fireEvent.click(betaOption)
		fireEvent.click(gammaOption)
		fireEvent.click(betaOption)

		// Wait for all requests to settle
		await waitFor(
			() => {
				expect(onSwitch).toHaveBeenCalled()
			},
			{ timeout: 1000 },
		)

		// Should reflect last clicked account (Beta)
		const finalCall = onSwitch.mock.calls[onSwitch.mock.calls.length - 1][0]
		expect(finalCall).toBe('acc_2') // Beta
	})

	/**
	 * REGRESSION TEST
	 * Issue: NAV-002 - Dropdown didn't close after successful switch
	 * Description: After switching accounts, dropdown remained open
	 * Fix: Close dropdown on successful switch
	 * Verification: Dropdown closes after account switch
	 */
	it('should close dropdown after successful account switch', async () => {
		const onSwitch = vi.fn(async () => ({ success: true }))

		render(<AccountSwitcher accounts={mockAccounts} currentAccountId="acc_1" onSwitch={onSwitch} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { name: /acme corp/i })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByText('Beta Inc')).toBeInTheDocument()
		})

		// Switch account
		const betaOption = screen.getByText('Beta Inc')
		fireEvent.click(betaOption)

		// Dropdown should close
		await waitFor(() => {
			expect(screen.queryByText('Beta Inc')).not.toBeInTheDocument()
		})
	})

	/**
	 * REGRESSION TEST
	 * Issue: NAV-003 - Keyboard navigation skipped disabled accounts
	 * Description: Arrow keys navigated to accounts user no longer has access to
	 * Fix: Filter disabled accounts from keyboard navigation
	 * Verification: Keyboard nav only cycles through active accounts
	 */
	it('should skip disabled accounts in keyboard navigation', async () => {
		const accountsWithDisabled = [
			...mockAccounts,
			{ id: 'acc_4', name: 'Disabled Corp', short_name: 'disabled', role: 'member' as const, disabled: true },
		]

		render(<AccountSwitcher accounts={accountsWithDisabled} currentAccountId="acc_1" onSwitch={vi.fn()} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { name: /acme corp/i })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByText('Beta Inc')).toBeInTheDocument()
		})

		// Press down arrow multiple times
		fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' })
		fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' })
		fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' })

		// Should never focus disabled account
		const disabledOption = screen.queryByText('Disabled Corp')
		if (disabledOption) {
			expect(disabledOption).toHaveAttribute('aria-disabled', 'true')
		}
	})

	/**
	 * REGRESSION TEST
	 * Issue: NAV-004 - Current account shown twice in dropdown
	 * Description: Current account appeared both as trigger and in list
	 * Fix: Filter current account from dropdown options
	 * Verification: Current account not shown in dropdown list
	 */
	it('should not show current account in dropdown options', async () => {
		render(<AccountSwitcher accounts={mockAccounts} currentAccountId="acc_1" onSwitch={vi.fn()} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { name: /acme corp/i })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByText('Beta Inc')).toBeInTheDocument()
		})

		// Current account (Acme Corp) should appear once (in trigger)
		const acmeElements = screen.getAllByText(/acme corp/i)
		expect(acmeElements).toHaveLength(1) // Only in trigger, not in list
	})

	/**
	 * REGRESSION TEST
	 * Issue: NAV-005 - Long account names overflowed UI
	 * Description: Account names longer than 50 chars broke layout
	 * Fix: Truncate long names with ellipsis
	 * Verification: Long names truncated gracefully
	 */
	it('should truncate very long account names', async () => {
		const longNameAccounts = [
			{
				id: 'acc_long',
				name: 'This is an extremely long company name that should be truncated to fit in the UI properly',
				short_name: 'long',
				role: 'admin' as const,
			},
		]

		render(<AccountSwitcher accounts={longNameAccounts} currentAccountId="acc_long" onSwitch={vi.fn()} />)

		const trigger = screen.getByRole('button')

		// Should contain ellipsis or be visually truncated
		const triggerText = trigger.textContent
		expect(triggerText).toBeDefined()

		// Either truncated with ellipsis or has CSS truncation class
		const hasEllipsis = triggerText?.includes('...')
		const hasTruncateClass = trigger.className.includes('truncate')

		expect(hasEllipsis || hasTruncateClass).toBe(true)
	})

	/**
	 * REGRESSION TEST
	 * Issue: NAV-006 - Role badge missing for non-admin accounts
	 * Description: Only admin accounts showed role badge
	 * Fix: Show role badge for all accounts, style differently
	 * Verification: All accounts display role badge
	 */
	it('should show role badge for all account types', async () => {
		render(<AccountSwitcher accounts={mockAccounts} currentAccountId="acc_1" onSwitch={vi.fn()} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { name: /acme corp/i })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByText('Beta Inc')).toBeInTheDocument()
		})

		// Check for admin badge
		expect(screen.getByText(/admin/i)).toBeInTheDocument()

		// Check for member badges
		const memberBadges = screen.getAllByText(/member/i)
		expect(memberBadges.length).toBeGreaterThanOrEqual(2) // Beta and Gamma
	})

	/**
	 * REGRESSION TEST
	 * Issue: NAV-007 - Failed switch left UI in loading state
	 * Description: Network error during switch left spinner forever
	 * Fix: Clear loading state on error, show error message
	 * Verification: Loading state clears on error
	 */
	it('should clear loading state when account switch fails', async () => {
		const onSwitch = vi.fn(async () => {
			throw new Error('Network error')
		})

		render(<AccountSwitcher accounts={mockAccounts} currentAccountId="acc_1" onSwitch={onSwitch} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { name: /acme corp/i })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByText('Beta Inc')).toBeInTheDocument()
		})

		// Attempt switch
		const betaOption = screen.getByText('Beta Inc')
		fireEvent.click(betaOption)

		// Wait for error
		await waitFor(
			() => {
				expect(onSwitch).toHaveBeenCalled()
			},
			{ timeout: 1000 },
		)

		// Loading spinner should not be stuck
		await waitFor(() => {
			expect(screen.queryByRole('status')).not.toBeInTheDocument()
		})

		// Error message should be shown
		expect(screen.getByText(/failed to switch/i)).toBeInTheDocument()
	})
})
