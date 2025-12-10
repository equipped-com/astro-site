/**
 * @REQ multi-account/account-switcher
 * @description Tests for AccountSwitcher component
 *
 * Feature: Account Switcher Component
 *   As a consultant with multiple client accounts
 *   I want to switch between accounts easily
 *   So that I can manage multiple organizations
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountSwitcher, type Account } from './AccountSwitcher'

const mockAccounts: Account[] = [
	{
		id: '1',
		name: 'Acme Corp',
		short_name: 'acmecorp',
		role: 'owner',
	},
	{
		id: '2',
		name: 'Beta Inc',
		short_name: 'betainc',
		role: 'admin',
	},
	{
		id: '3',
		name: 'Client Co',
		short_name: 'clientco',
		role: 'member',
	},
]

describe('AccountSwitcher', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Reset location mock
		delete (window as any).location
		window.location = { href: '', protocol: 'https:', hostname: 'acmecorp.tryequipped.com' } as any
	})

	/**
	 * @REQ-SWITCH-001 @Display
	 * Scenario: Display current account
	 *   Given I am logged into "Acme Corp"
	 *   When I view the dashboard header
	 *   Then I should see "Acme Corp" in the account switcher
	 *   And I should see the account logo (if available)
	 */
	it('should display current account name and role', () => {
		render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} />)

		expect(screen.getByText('Acme Corp')).toBeInTheDocument()
		expect(screen.getByText('owner')).toBeInTheDocument()
	})

	it('should display account logo if available', () => {
		const accountWithLogo = {
			...mockAccounts[0],
			logo_url: 'https://example.com/logo.png',
		}

		render(<AccountSwitcher currentAccount={accountWithLogo} accounts={mockAccounts} />)

		const logo = screen.getByAltText('Acme Corp')
		expect(logo).toBeInTheDocument()
		expect(logo).toHaveAttribute('src', 'https://example.com/logo.png')
	})

	it('should display account initials if no logo available', () => {
		render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} />)

		expect(screen.getByText('AC')).toBeInTheDocument()
	})

	/**
	 * @REQ-SWITCH-002 @Dropdown
	 * Scenario: View accessible accounts
	 *   Given I have access to:
	 *     | Account       | Role   |
	 *     | Acme Corp     | Owner  |
	 *     | Beta Inc      | Admin  |
	 *     | Client Co     | Member |
	 *   And my current account is "Acme Corp"
	 *   When I click the account switcher
	 *   Then I should see all 3 accounts listed
	 *   And "Acme Corp" should be highlighted as current
	 *   And each account should show my role
	 */
	it('should show all accessible accounts when dropdown is opened', async () => {
		render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} />)

		// Click to open dropdown
		const trigger = screen.getByRole('button', { expanded: false })
		fireEvent.click(trigger)

		// Wait for dropdown to appear
		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument()
		})

		// Check all accounts are listed
		const accountOptions = screen.getAllByRole('option')
		expect(accountOptions).toHaveLength(3)

		// Check each account shows name and role
		expect(screen.getAllByText('Acme Corp')).toHaveLength(2) // One in trigger, one in dropdown
		expect(screen.getByText('Beta Inc')).toBeInTheDocument()
		expect(screen.getByText('Client Co')).toBeInTheDocument()

		expect(screen.getAllByText('owner')).toHaveLength(2)
		expect(screen.getByText('admin')).toBeInTheDocument()
		expect(screen.getByText('member')).toBeInTheDocument()
	})

	it('should highlight current account with checkmark', async () => {
		render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { expanded: false })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument()
		})

		// Find current account option
		const currentOption = screen.getAllByRole('option')[0]
		expect(currentOption).toHaveAttribute('aria-selected', 'true')

		// Check for checkmark icon
		expect(screen.getByLabelText('Current account')).toBeInTheDocument()
	})

	/**
	 * @REQ-SWITCH-003 @Navigation
	 * Scenario: Switch to different account
	 *   Given I am on "acmecorp.tryequipped.com"
	 *   And I have access to "Beta Inc"
	 *   When I click the account switcher
	 *   And I select "Beta Inc"
	 *   Then I should be navigated to "betainc.tryequipped.com"
	 *   And the tenant context should switch to "Beta Inc"
	 *   And I should see Beta Inc's data
	 */
	it('should navigate to correct subdomain when switching accounts', async () => {
		const onSwitch = vi.fn()

		render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} onSwitch={onSwitch} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { expanded: false })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument()
		})

		// Click on Beta Inc (second option)
		const accountOptions = screen.getAllByRole('option')
		fireEvent.click(accountOptions[1])

		// Should call onSwitch with Beta Inc
		expect(onSwitch).toHaveBeenCalledWith(mockAccounts[1])
	})

	it('should use default subdomain navigation if no onSwitch provided', async () => {
		render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { expanded: false })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument()
		})

		// Click on Beta Inc
		const accountOptions = screen.getAllByRole('option')
		fireEvent.click(accountOptions[1])

		// Should navigate to new subdomain
		expect(window.location.href).toBe('https://betainc.tryequipped.com')
	})

	/**
	 * @REQ-SWITCH-004 @Loading
	 * Scenario: Loading state during switch
	 *   Given I am switching from "Acme Corp" to "Beta Inc"
	 *   When the navigation is in progress
	 *   Then I should see a loading indicator
	 *   And the switcher should be disabled
	 */
	it('should show loading indicator while switching', async () => {
		render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { expanded: false })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument()
		})

		// Click on Beta Inc to start switching
		const accountOptions = screen.getAllByRole('option')
		fireEvent.click(accountOptions[1])

		// Should see loading spinner
		await waitFor(() => {
			expect(document.querySelector('.animate-spin')).toBeInTheDocument()
		})

		// Trigger button should be disabled during switch
		expect(trigger).toBeDisabled()
	})

	it('should disable switcher when isLoading prop is true', () => {
		render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} isLoading={true} />)

		const trigger = screen.getByRole('button', { expanded: false })
		expect(trigger).toBeDisabled()
	})

	/**
	 * @REQ-SWITCH-005 @SingleAccount
	 * Scenario: Hide switcher for single account users
	 *   Given I only have access to "Acme Corp"
	 *   When I view the dashboard
	 *   Then the account switcher should not be displayed
	 *   Or it should be disabled with no dropdown
	 */
	it('should not render if user has only one account', () => {
		const { container } = render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={[mockAccounts[0]]} />)

		expect(container.firstChild).toBeNull()
	})

	it('should not render if user has no accounts', () => {
		const { container } = render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={[]} />)

		expect(container.firstChild).toBeNull()
	})

	/**
	 * @REQ-SWITCH-006 @Keyboard
	 * Scenario: Keyboard navigation
	 *   Given the account switcher dropdown is open
	 *   When I use arrow keys
	 *   Then I should be able to navigate between accounts
	 *   When I press Enter
	 *   Then the highlighted account should be selected
	 */
	it('should support keyboard navigation with arrow keys', async () => {
		const onSwitch = vi.fn()

		render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} onSwitch={onSwitch} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { expanded: false })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument()
		})

		const accountOptions = screen.getAllByRole('option')

		// Manually focus the second option and press Enter
		accountOptions[1].focus()
		expect(accountOptions[1]).toHaveFocus()

		// Press Enter on focused item
		fireEvent.keyDown(document, { key: 'Enter' })

		// Should select the focused account
		expect(onSwitch).toHaveBeenCalledWith(mockAccounts[1])
	})

	it('should support ArrowUp keyboard navigation', async () => {
		render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { expanded: false })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument()
		})

		// Press ArrowUp should wrap to last item
		fireEvent.keyDown(document, { key: 'ArrowUp' })

		const accountOptions = screen.getAllByRole('option')
		await waitFor(() => {
			expect(accountOptions[2]).toHaveFocus()
		})
	})

	it('should close dropdown when pressing Escape', async () => {
		render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { expanded: false })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument()
		})

		// Press Escape
		fireEvent.keyDown(document, { key: 'Escape' })

		// Dropdown should close
		await waitFor(() => {
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
		})
	})

	it('should close dropdown when clicking outside', async () => {
		render(
			<div>
				<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} />
				<div data-testid="outside">Outside element</div>
			</div>
		)

		// Open dropdown
		const trigger = screen.getByRole('button', { expanded: false })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument()
		})

		// Click outside
		fireEvent.click(screen.getByTestId('outside'))

		// Dropdown should close
		await waitFor(() => {
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
		})
	})

	it('should not switch to current account when clicking it', async () => {
		const onSwitch = vi.fn()

		render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} onSwitch={onSwitch} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { expanded: false })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument()
		})

		// Click on current account (first option)
		const accountOptions = screen.getAllByRole('option')
		fireEvent.click(accountOptions[0])

		// Should not call onSwitch for current account
		expect(onSwitch).not.toHaveBeenCalled()
	})

	it('should toggle dropdown when clicking trigger multiple times', async () => {
		render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} />)

		const trigger = screen.getByRole('button', { expanded: false })

		// First click - open
		fireEvent.click(trigger)
		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument()
		})

		// Second click - close
		fireEvent.click(trigger)
		await waitFor(() => {
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
		})

		// Third click - open again
		fireEvent.click(trigger)
		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument()
		})
	})

	it('should display account initials correctly for multi-word names', () => {
		const multiWordAccount = {
			id: '4',
			name: 'Big Company International',
			short_name: 'bigcompanyintl',
			role: 'owner' as const,
		}

		render(<AccountSwitcher currentAccount={multiWordAccount} accounts={[multiWordAccount, mockAccounts[0]]} />)

		// Should show "BC" (Big Company - first two words)
		expect(screen.getByText('BC')).toBeInTheDocument()
	})

	it('should close dropdown after selecting an account', async () => {
		const onSwitch = vi.fn()

		render(<AccountSwitcher currentAccount={mockAccounts[0]} accounts={mockAccounts} onSwitch={onSwitch} />)

		// Open dropdown
		const trigger = screen.getByRole('button', { expanded: false })
		fireEvent.click(trigger)

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument()
		})

		// Select different account
		const accountOptions = screen.getAllByRole('option')
		fireEvent.click(accountOptions[1])

		// Dropdown should close
		await waitFor(() => {
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
		})
	})
})
