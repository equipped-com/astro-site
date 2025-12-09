/**
 * Customer List Component Tests
 *
 * @REQ-SA-003 View all customers with search/filter
 * @REQ-SA-006 Enter impersonation mode
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CustomerList from './CustomerList'

// Mock fetch
global.fetch = vi.fn()

// Mock @clerk/clerk-react
vi.mock('@clerk/clerk-react', () => ({
	useUser: () => ({
		user: {
			id: 'user_admin123',
			firstName: 'John',
			lastName: 'Admin',
			primaryEmailAddress: { emailAddress: 'admin@tryequipped.com' },
		},
	}),
}))

// Mock localStorage
const mockStorage: Record<string, string> = {}
const mockLocalStorage = {
	getItem: vi.fn((key: string) => mockStorage[key] || null),
	setItem: vi.fn((key: string, value: string) => {
		mockStorage[key] = value
	}),
	removeItem: vi.fn((key: string) => {
		delete mockStorage[key]
	}),
	clear: vi.fn(() => {
		for (const key of Object.keys(mockStorage)) {
			delete mockStorage[key]
		}
	}),
}

// Store original location
const originalLocation = window.location

const mockCustomers = [
	{
		id: 'acc_1',
		name: 'Acme Corporation',
		short_name: 'acme',
		primary_contact_email: 'admin@acme.com',
		device_count: 50,
		last_order_date: '2024-01-15T00:00:00Z',
		created_at: '2023-06-01T00:00:00Z',
	},
	{
		id: 'acc_2',
		name: 'TechCorp Inc',
		short_name: 'techcorp',
		primary_contact_email: 'it@techcorp.com',
		device_count: 25,
		last_order_date: '2024-02-20T00:00:00Z',
		created_at: '2023-08-15T00:00:00Z',
	},
	{
		id: 'acc_3',
		name: 'StartupXYZ',
		short_name: 'startupxyz',
		primary_contact_email: null,
		device_count: 10,
		last_order_date: null,
		created_at: '2024-01-01T00:00:00Z',
	},
]

describe('CustomerList Component', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockLocalStorage.clear()
		Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

		// Mock window.location
		Object.defineProperty(window, 'location', {
			value: { href: '' },
			writable: true,
		})
	})

	afterEach(() => {
		Object.defineProperty(window, 'location', {
			value: originalLocation,
			writable: true,
		})
	})

	/**
	 * @REQ-SA-003
	 * Scenario: View all customers
	 *   When I view customer list
	 *   Then I should see all accounts across platform
	 */
	it('should display all customer accounts', async () => {
		// Given customers exist
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockCustomers,
		})

		// When component renders
		render(<CustomerList />)

		// Then all customers should be displayed
		await waitFor(() => {
			expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
			expect(screen.getByText('TechCorp Inc')).toBeInTheDocument()
			expect(screen.getByText('StartupXYZ')).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-SA-003
	 * Scenario: View all customers
	 *   And I should see:
	 *     | Company Name | Primary Contact | Device Count | Last Order | Created Date |
	 */
	it('should display all required columns', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockCustomers,
		})

		render(<CustomerList />)

		await waitFor(() => {
			// Check column headers
			expect(screen.getByText('Company Name')).toBeInTheDocument()
			expect(screen.getByText('Primary Contact')).toBeInTheDocument()
			expect(screen.getByText('Device Count')).toBeInTheDocument()
			expect(screen.getByText('Last Order')).toBeInTheDocument()
			expect(screen.getByText('Created Date')).toBeInTheDocument()

			// Check data
			expect(screen.getByText('admin@acme.com')).toBeInTheDocument()
			expect(screen.getByText('50')).toBeInTheDocument()
			expect(screen.getByText('25')).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-SA-003
	 * Scenario: View all customers
	 *   And I should be able to search by company name
	 */
	it('should filter customers by company name', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockCustomers,
		})

		const user = userEvent.setup()
		render(<CustomerList />)

		// Wait for customers to load
		await waitFor(() => {
			expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
		})

		// When user searches for "Acme"
		const searchInput = screen.getByPlaceholderText(/search by company name/i)
		await user.type(searchInput, 'Acme')

		// Then only Acme should be visible
		await waitFor(() => {
			expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
			expect(screen.queryByText('TechCorp Inc')).not.toBeInTheDocument()
			expect(screen.queryByText('StartupXYZ')).not.toBeInTheDocument()
		})

		// Check filtered count
		expect(screen.getByText('Showing 1 of 3 customers')).toBeInTheDocument()
	})

	it('should filter customers by email', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockCustomers,
		})

		const user = userEvent.setup()
		render(<CustomerList />)

		await waitFor(() => {
			expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
		})

		// Search by email
		const searchInput = screen.getByPlaceholderText(/search by company name/i)
		await user.type(searchInput, 'it@techcorp')

		await waitFor(() => {
			expect(screen.getByText('TechCorp Inc')).toBeInTheDocument()
			expect(screen.queryByText('Acme Corporation')).not.toBeInTheDocument()
		})
	})

	it('should show empty state when no customers match search', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockCustomers,
		})

		const user = userEvent.setup()
		render(<CustomerList />)

		await waitFor(() => {
			expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
		})

		// Search for non-existent customer
		const searchInput = screen.getByPlaceholderText(/search by company name/i)
		await user.type(searchInput, 'NonExistent')

		await waitFor(() => {
			expect(screen.getByText('No customers found')).toBeInTheDocument()
			expect(screen.getByText('Try adjusting your search query')).toBeInTheDocument()
		})
	})

	it('should display loading state while fetching', () => {
		;(global.fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

		render(<CustomerList />)

		// Should show loading skeleton
		expect(screen.getByTestId('table-skeleton')).toBeInTheDocument()
	})

	it('should display error state on fetch failure', async () => {
		;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

		render(<CustomerList />)

		await waitFor(() => {
			expect(screen.getByText('Error loading customers')).toBeInTheDocument()
			expect(screen.getByText('Network error')).toBeInTheDocument()
		})
	})

	it('should format dates correctly', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockCustomers,
		})

		render(<CustomerList />)

		await waitFor(() => {
			// Check formatted dates
			expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
			expect(screen.getByText(/Jun 1, 2023/)).toBeInTheDocument()
		})
	})

	it('should show "Not set" for missing contact email', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockCustomers,
		})

		render(<CustomerList />)

		await waitFor(() => {
			expect(screen.getByText('Not set')).toBeInTheDocument()
		})
	})

	it('should show "Never" for missing last order date', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockCustomers,
		})

		render(<CustomerList />)

		await waitFor(() => {
			expect(screen.getByText('Never')).toBeInTheDocument()
		})
	})

	it('should provide export CSV button', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockCustomers,
		})

		render(<CustomerList />)

		await waitFor(() => {
			expect(screen.getByText('Export CSV')).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-SA-006
	 * Scenario: Enter impersonation mode
	 *   Given I am viewing customer "Acme Corp" in admin
	 *   When I click "View as Customer"
	 *   Then I should see Acme's dashboard
	 */
	describe('Customer Impersonation', () => {
		it('should display "View as Customer" button for each customer', async () => {
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockCustomers,
			})

			render(<CustomerList />)

			await waitFor(() => {
				// Check for impersonation buttons
				expect(screen.getByTestId('impersonate-acme')).toBeInTheDocument()
				expect(screen.getByTestId('impersonate-techcorp')).toBeInTheDocument()
				expect(screen.getByTestId('impersonate-startupxyz')).toBeInTheDocument()
			})
		})

		it('should call impersonation API when clicking "View as Customer"', async () => {
			// Mock fetch for customers list
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockCustomers,
			})

			// Mock fetch for impersonation start
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					session: {
						adminUserId: 'user_admin123',
						adminEmail: 'admin@tryequipped.com',
						adminName: 'John Admin',
						accountId: 'acc_1',
						accountName: 'Acme Corporation',
						accountShortName: 'acme',
						startedAt: new Date().toISOString(),
					},
				}),
			})

			const user = userEvent.setup()
			render(<CustomerList />)

			await waitFor(() => {
				expect(screen.getByTestId('impersonate-acme')).toBeInTheDocument()
			})

			// Click the impersonate button
			await user.click(screen.getByTestId('impersonate-acme'))

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith('/api/admin/impersonation/start', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ accountId: 'acc_1' }),
				})
			})
		})

		it('should redirect to customer dashboard after starting impersonation', async () => {
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockCustomers,
			})

			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					session: {
						adminUserId: 'user_admin123',
						adminEmail: 'admin@tryequipped.com',
						adminName: 'John Admin',
						accountId: 'acc_1',
						accountName: 'Acme Corporation',
						accountShortName: 'acme',
						startedAt: new Date().toISOString(),
					},
				}),
			})

			const user = userEvent.setup()
			render(<CustomerList />)

			await waitFor(() => {
				expect(screen.getByTestId('impersonate-acme')).toBeInTheDocument()
			})

			await user.click(screen.getByTestId('impersonate-acme'))

			await waitFor(() => {
				expect(window.location.href).toBe('https://acme.tryequipped.com/dashboard?impersonate=true')
			})
		})

		it('should store impersonation session in localStorage', async () => {
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockCustomers,
			})

			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					session: {
						adminUserId: 'user_admin123',
						adminEmail: 'admin@tryequipped.com',
						adminName: 'John Admin',
						accountId: 'acc_1',
						accountName: 'Acme Corporation',
						accountShortName: 'acme',
						startedAt: new Date().toISOString(),
					},
				}),
			})

			const user = userEvent.setup()
			render(<CustomerList />)

			await waitFor(() => {
				expect(screen.getByTestId('impersonate-acme')).toBeInTheDocument()
			})

			await user.click(screen.getByTestId('impersonate-acme'))

			await waitFor(() => {
				expect(mockLocalStorage.setItem).toHaveBeenCalledWith('equipped_impersonation_session', expect.any(String))
			})
		})

		it('should show loading state while starting impersonation', async () => {
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockCustomers,
			})

			// Slow response for impersonation
			;(global.fetch as any).mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)))

			const user = userEvent.setup()
			render(<CustomerList />)

			await waitFor(() => {
				expect(screen.getByTestId('impersonate-acme')).toBeInTheDocument()
			})

			await user.click(screen.getByTestId('impersonate-acme'))

			// Button should show loading state
			await waitFor(() => {
				expect(screen.getByText('Loading...')).toBeInTheDocument()
			})
		})

		it('should show error when impersonation fails', async () => {
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockCustomers,
			})

			;(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: 'Failed to start impersonation' }),
			})

			const user = userEvent.setup()
			render(<CustomerList />)

			await waitFor(() => {
				expect(screen.getByTestId('impersonate-acme')).toBeInTheDocument()
			})

			await user.click(screen.getByTestId('impersonate-acme'))

			await waitFor(() => {
				expect(screen.getByText('Error loading customers')).toBeInTheDocument()
			})
		})
	})
})
