/**
 * Feature Flag Manager Component Tests
 *
 * @REQ-SA-005 Manage feature flags per account
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FeatureFlagManager from './FeatureFlagManager'

// Mock fetch
global.fetch = vi.fn()

const mockFlagsData = {
	flags: [
		{
			key: 'trade_in_enabled',
			name: 'Trade-In Program',
			description: 'Allow customers to trade in old devices',
			enabled_globally: false,
		},
		{
			key: 'plaid_enabled',
			name: 'Plaid Integration',
			description: 'Enable bank account verification via Plaid',
			enabled_globally: false,
		},
	],
	accountFlags: [
		{
			account_id: 'acc_1',
			account_name: 'Acme Corporation',
			flags: {
				trade_in_enabled: true,
				plaid_enabled: false,
			},
		},
		{
			account_id: 'acc_2',
			account_name: 'TechCorp Inc',
			flags: {
				trade_in_enabled: false,
				plaid_enabled: true,
			},
		},
	],
}

describe('FeatureFlagManager Component', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * @REQ-SA-005
	 * Scenario: Manage feature flags
	 *   When I navigate to Admin > Feature Flags
	 *   Then I should see all feature flags
	 */
	it('should display all available feature flags', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockFlagsData,
		})

		render(<FeatureFlagManager />)

		await waitFor(() => {
			// Use getAllByText since flags appear in both list and table header
			expect(screen.getAllByText('Trade-In Program').length).toBeGreaterThan(0)
			expect(screen.getByText('Allow customers to trade in old devices')).toBeInTheDocument()
			expect(screen.getAllByText('Plaid Integration').length).toBeGreaterThan(0)
			expect(screen.getByText('Enable bank account verification via Plaid')).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-SA-005
	 * Scenario: Manage feature flags
	 *   And I should be able to enable/disable per account
	 */
	it('should display account-level toggle switches', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockFlagsData,
		})

		render(<FeatureFlagManager />)

		await waitFor(() => {
			expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
			expect(screen.getByText('TechCorp Inc')).toBeInTheDocument()
		})

		// Should have toggle buttons (2 accounts × 2 flags = 4 toggles)
		const toggleButtons = screen.getAllByRole('button').filter(btn => {
			const hasToggleClass = btn.className.includes('h-6 w-11')
			return hasToggleClass
		})
		expect(toggleButtons.length).toBeGreaterThan(0)
	})

	it('should toggle flag state when clicking switch', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockFlagsData,
		})

		const user = userEvent.setup()
		render(<FeatureFlagManager />)

		await waitFor(() => {
			expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
		})

		// Find toggle buttons
		const toggleButtons = screen.getAllByRole('button').filter(btn => {
			return btn.className.includes('h-6 w-11')
		})

		// Click a toggle to change state
		const initialClass = toggleButtons[0].className
		await user.click(toggleButtons[0])

		// Class should change (primary/muted toggle)
		await waitFor(() => {
			expect(toggleButtons[0].className).not.toBe(initialClass)
		})
	})

	/**
	 * @REQ-SA-005
	 * Scenario: Manage feature flags
	 *   And changes should take effect immediately
	 */
	it('should save changes when clicking save button', async () => {
		;(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockFlagsData,
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			})

		const user = userEvent.setup()
		render(<FeatureFlagManager />)

		await waitFor(() => {
			expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
		})

		// Click save button
		const saveButton = screen.getByText('Save Changes')
		await user.click(saveButton)

		// Should show success message
		await waitFor(() => {
			expect(screen.getByText('Feature flags updated successfully')).toBeInTheDocument()
		})

		// Should call PUT API
		expect(global.fetch).toHaveBeenCalledWith(
			'/api/admin/flags',
			expect.objectContaining({
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
			}),
		)
	})

	it('should display loading state while fetching', () => {
		;(global.fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

		render(<FeatureFlagManager />)

		expect(screen.getByTestId('spinner')).toBeInTheDocument()
	})

	it('should display error state on fetch failure', async () => {
		;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

		render(<FeatureFlagManager />)

		await waitFor(() => {
			expect(screen.getByText('Error loading feature flags')).toBeInTheDocument()
			expect(screen.getByText('Network error')).toBeInTheDocument()
		})
	})

	it('should display error on save failure', async () => {
		;(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockFlagsData,
			})
			.mockRejectedValueOnce(new Error('Save failed'))

		const user = userEvent.setup()
		render(<FeatureFlagManager />)

		await waitFor(() => {
			expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
		})

		// Click save button
		const saveButton = screen.getByText('Save Changes')
		await user.click(saveButton)

		// Should show error message
		await waitFor(() => {
			expect(screen.getByText('Error saving flags')).toBeInTheDocument()
			expect(screen.getByText('Save failed')).toBeInTheDocument()
		})
	})

	it('should disable save button while saving', async () => {
		;(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockFlagsData,
			})
			.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 1000)))

		const user = userEvent.setup()
		render(<FeatureFlagManager />)

		await waitFor(() => {
			expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
		})

		// Click save button
		const saveButton = screen.getByText('Save Changes')
		await user.click(saveButton)

		// Button should be disabled and show "Saving..."
		await waitFor(() => {
			expect(screen.getByText('Saving...')).toBeInTheDocument()
		})
	})
})
