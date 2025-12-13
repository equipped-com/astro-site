/**
 * @REQ multi-account/account-switcher
 * @description Tests for AccountSwitcherItem component
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AccountSwitcherItem } from './AccountSwitcherItem'
import type { Account } from './AccountSwitcher'

const mockAccount: Account = {
	id: '1',
	name: 'Acme Corp',
	short_name: 'acmecorp',
	role: 'owner',
}

describe('AccountSwitcherItem', () => {
	it('should render account name and role', () => {
		const onSelect = vi.fn()

		render(<AccountSwitcherItem account={mockAccount} isCurrent={false} onSelect={onSelect} />)

		expect(screen.getByText('Acme Corp')).toBeInTheDocument()
		expect(screen.getByText('owner')).toBeInTheDocument()
	})

	it('should display account logo if available', () => {
		const accountWithLogo = {
			...mockAccount,
			logo_url: 'https://example.com/logo.png',
		}
		const onSelect = vi.fn()

		render(<AccountSwitcherItem account={accountWithLogo} isCurrent={false} onSelect={onSelect} />)

		const logo = screen.getByAltText('Acme Corp')
		expect(logo).toBeInTheDocument()
		expect(logo).toHaveAttribute('src', 'https://example.com/logo.png')
	})

	it('should display account initials if no logo available', () => {
		const onSelect = vi.fn()

		render(<AccountSwitcherItem account={mockAccount} isCurrent={false} onSelect={onSelect} />)

		expect(screen.getByText('AC')).toBeInTheDocument()
	})

	it('should call onSelect when clicked', () => {
		const onSelect = vi.fn()

		render(<AccountSwitcherItem account={mockAccount} isCurrent={false} onSelect={onSelect} />)

		const button = screen.getByRole('option')
		fireEvent.click(button)

		expect(onSelect).toHaveBeenCalledWith(mockAccount)
	})

	it('should show checkmark for current account', () => {
		const onSelect = vi.fn()

		render(<AccountSwitcherItem account={mockAccount} isCurrent={true} onSelect={onSelect} />)

		expect(screen.getByLabelText('Current account')).toBeInTheDocument()
	})

	it('should not show checkmark for non-current account', () => {
		const onSelect = vi.fn()

		render(<AccountSwitcherItem account={mockAccount} isCurrent={false} onSelect={onSelect} />)

		expect(screen.queryByLabelText('Current account')).not.toBeInTheDocument()
	})

	it('should be disabled when isCurrent is true', () => {
		const onSelect = vi.fn()

		render(<AccountSwitcherItem account={mockAccount} isCurrent={true} onSelect={onSelect} />)

		const button = screen.getByRole('option')
		expect(button).toBeDisabled()
	})

	it('should not be disabled when isCurrent is false', () => {
		const onSelect = vi.fn()

		render(<AccountSwitcherItem account={mockAccount} isCurrent={false} onSelect={onSelect} />)

		const button = screen.getByRole('option')
		expect(button).not.toBeDisabled()
	})

	it('should have aria-selected true when current', () => {
		const onSelect = vi.fn()

		render(<AccountSwitcherItem account={mockAccount} isCurrent={true} onSelect={onSelect} />)

		const button = screen.getByRole('option')
		expect(button).toHaveAttribute('aria-selected', 'true')
	})

	it('should have aria-selected false when not current', () => {
		const onSelect = vi.fn()

		render(<AccountSwitcherItem account={mockAccount} isCurrent={false} onSelect={onSelect} />)

		const button = screen.getByRole('option')
		expect(button).toHaveAttribute('aria-selected', 'false')
	})

	it('should capitalize role in display', () => {
		const onSelect = vi.fn()

		render(<AccountSwitcherItem account={mockAccount} isCurrent={false} onSelect={onSelect} />)

		// Role should be capitalized via CSS
		const roleElement = screen.getByText('owner')
		expect(roleElement).toHaveClass('capitalize')
	})

	it('should display initials for multi-word account names', () => {
		const multiWordAccount = {
			...mockAccount,
			name: 'Big Company International',
		}
		const onSelect = vi.fn()

		render(<AccountSwitcherItem account={multiWordAccount} isCurrent={false} onSelect={onSelect} />)

		// Should show "BC" (Big Company - first two words)
		expect(screen.getByText('BC')).toBeInTheDocument()
	})
})
