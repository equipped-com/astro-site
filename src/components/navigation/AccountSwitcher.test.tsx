import * as ClerkReact from '@clerk/clerk-react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountSwitcher } from './AccountSwitcher'

// Mock useUser hook
const mockUseUser = vi.fn()
vi.mock('@clerk/clerk-react', () => ({
	useUser: () => mockUseUser(),
}))

// Mock fetch
global.fetch = vi.fn()

describe('AccountSwitcher', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		;(global.fetch as ReturnType<typeof vi.fn>).mockReset()
	})

	/**
	 * @REQ-NAV-004
	 * Scenario: Single account user should not see account switcher
	 */
	it('should not render when user has only one account', async () => {
		mockUseUser.mockReturnValue({
			user: { id: 'user-1', emailAddresses: [{ emailAddress: 'alice@company.com' }] },
		})

		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			json: async () => ({
				accounts: [{ id: 'acct-1', name: 'Acme Corp', short_name: 'AC', role: 'admin' }],
			}),
		})

		const { container } = render(<AccountSwitcher />)

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith('/api/user/accounts')
		})

		expect(container.firstChild).toBeNull()
	})

	/**
	 * @REQ-NAV-004
	 * Scenario: Multi-account user should see account switcher
	 */
	it('should render account switcher when user has multiple accounts', async () => {
		mockUseUser.mockReturnValue({
			user: { id: 'user-1', emailAddresses: [{ emailAddress: 'consultant@example.com' }] },
		})

		const mockAccounts = [
			{ id: 'acct-1', name: 'Acme Corp', short_name: 'AC', role: 'consultant' },
			{ id: 'acct-2', name: 'Beta Inc', short_name: 'BI', role: 'consultant' },
		]

		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			json: async () => ({ accounts: mockAccounts }),
		})

		render(<AccountSwitcher />)

		await waitFor(() => {
			expect(screen.getByRole('combobox')).toBeInTheDocument()
		})

		const select = screen.getByRole('combobox')
		const options = screen.getAllByRole('option')

		expect(options).toHaveLength(2)
		expect(options[0]).toHaveTextContent('Acme Corp')
		expect(options[1]).toHaveTextContent('Beta Inc')
	})

	/**
	 * @REQ-NAV-004
	 * Scenario: User can switch between accounts
	 */
	it('should call switch account API when account is changed', async () => {
		mockUseUser.mockReturnValue({
			user: { id: 'user-1', emailAddresses: [{ emailAddress: 'consultant@example.com' }] },
		})

		const mockAccounts = [
			{ id: 'acct-1', name: 'Acme Corp', short_name: 'AC', role: 'consultant' },
			{ id: 'acct-2', name: 'Beta Inc', short_name: 'BI', role: 'consultant' },
		]

		// Mock fetch for both account list and switch
		;(global.fetch as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce({
				json: async () => ({ accounts: mockAccounts }),
			})
			.mockResolvedValueOnce({
				ok: true,
			})

		// Mock window.location.reload
		const reloadMock = vi.fn()
		Object.defineProperty(window, 'location', {
			value: { reload: reloadMock },
			writable: true,
		})

		render(<AccountSwitcher />)

		await waitFor(() => {
			expect(screen.getByRole('combobox')).toBeInTheDocument()
		})

		const select = screen.getByRole('combobox')
		fireEvent.change(select, { target: { value: 'acct-2' } })

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith('/api/user/accounts/acct-2/switch', { method: 'POST' })
		})

		expect(reloadMock).toHaveBeenCalled()
	})

	/**
	 * Scenario: Component should not fetch accounts when user is not signed in
	 */
	it('should not fetch accounts when user is null', () => {
		mockUseUser.mockReturnValue({ user: null })

		render(<AccountSwitcher />)

		expect(global.fetch).not.toHaveBeenCalled()
	})

	it('should apply correct styling to select element', async () => {
		mockUseUser.mockReturnValue({
			user: { id: 'user-1', emailAddresses: [{ emailAddress: 'consultant@example.com' }] },
		})

		const mockAccounts = [
			{ id: 'acct-1', name: 'Acme Corp', short_name: 'AC', role: 'consultant' },
			{ id: 'acct-2', name: 'Beta Inc', short_name: 'BI', role: 'consultant' },
		]

		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			json: async () => ({ accounts: mockAccounts }),
		})

		render(<AccountSwitcher />)

		await waitFor(() => {
			expect(screen.getByRole('combobox')).toBeInTheDocument()
		})

		const select = screen.getByRole('combobox')
		expect(select).toHaveClass('bg-background')
		expect(select).toHaveClass('border')
		expect(select).toHaveClass('border-border')
		expect(select).toHaveClass('rounded-md')
	})
})
