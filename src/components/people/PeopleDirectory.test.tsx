/**
 * PeopleDirectory Component Tests
 *
 * Tests for the people directory view component.
 *
 * Test scenarios from task file (people/directory-view.md):
 * - @REQ-PPL-002: Filter by status
 * - @REQ-PPL-003: Search people
 * - @REQ-PPL-006: Distinguish platform users
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PeopleDirectory from './PeopleDirectory'

// Mock fetch globally
global.fetch = vi.fn()

const mockPeople = [
	{
		id: 'person_1',
		first_name: 'Alice',
		last_name: 'Smith',
		email: 'alice@example.com',
		phone: '+1-555-1234',
		title: 'Engineer',
		department: 'Engineering',
		location: 'San Francisco',
		status: 'active',
		has_platform_access: 1,
		device_count: 2,
		start_date: '2025-01-01',
		end_date: null,
		created_at: '2025-01-01T00:00:00Z',
		updated_at: '2025-01-01T00:00:00Z',
	},
	{
		id: 'person_2',
		first_name: 'Bob',
		last_name: 'Jones',
		email: 'bob@example.com',
		phone: null,
		title: 'Designer',
		department: 'Design',
		location: 'New York',
		status: 'onboarding',
		has_platform_access: 0,
		device_count: 0,
		start_date: '2025-01-15',
		end_date: null,
		created_at: '2025-01-02T00:00:00Z',
		updated_at: '2025-01-02T00:00:00Z',
	},
	{
		id: 'person_3',
		first_name: 'Charlie',
		last_name: 'Brown',
		email: 'charlie@example.com',
		phone: '+1-555-5678',
		title: 'Manager',
		department: 'Engineering',
		location: 'San Francisco',
		status: 'departed',
		has_platform_access: 0,
		device_count: 0,
		start_date: '2024-01-01',
		end_date: '2024-12-31',
		created_at: '2025-01-03T00:00:00Z',
		updated_at: '2025-01-03T00:00:00Z',
	},
]

describe('PeopleDirectory', () => {
	beforeEach(() => {
		// Reset fetch mock before each test
		vi.clearAllMocks()
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({ people: mockPeople }),
		} as Response)
	})

	it('should render loading state initially', () => {
		render(<PeopleDirectory />)
		expect(screen.getByRole('status')).toBeDefined() // Spinner has role="status"
	})

	it('should fetch and display people on mount', async () => {
		render(<PeopleDirectory />)

		await waitFor(() => {
			expect(screen.getByText('Alice Smith')).toBeDefined()
			expect(screen.getByText('Bob Jones')).toBeDefined()
			expect(screen.getByText('Charlie Brown')).toBeDefined()
		})
	})

	/**
	 * @REQ-PPL-002: Filter by status
	 */
	it('should filter people by status', async () => {
		render(<PeopleDirectory />)

		await waitFor(() => {
			expect(screen.getByText('Alice Smith')).toBeDefined()
		})

		// Filter by "Onboarding"
		const statusFilter = screen.getByDisplayValue('All Statuses')
		fireEvent.change(statusFilter, { target: { value: 'onboarding' } })

		// Should show only Bob (onboarding status)
		await waitFor(() => {
			expect(screen.getByText('Bob Jones')).toBeDefined()
			expect(screen.getByText('Showing 1 of 3 people')).toBeDefined()
		})
	})

	it('should update count when filtering by status', async () => {
		render(<PeopleDirectory />)

		await waitFor(() => {
			expect(screen.getByText('Showing 3 of 3 people')).toBeDefined()
		})

		// Filter by "Active"
		const statusFilter = screen.getByDisplayValue('All Statuses')
		fireEvent.change(statusFilter, { target: { value: 'active' } })

		await waitFor(() => {
			expect(screen.getByText('Showing 1 of 3 people')).toBeDefined()
		})
	})

	/**
	 * @REQ-PPL-003: Search people
	 */
	it('should search people by name', async () => {
		render(<PeopleDirectory />)

		await waitFor(() => {
			expect(screen.getByText('Alice Smith')).toBeDefined()
		})

		// Search for "alice"
		const searchInput = screen.getByPlaceholderText('Search by name or email...')
		fireEvent.change(searchInput, { target: { value: 'alice' } })

		// Should show only Alice
		await waitFor(() => {
			expect(screen.getByText('Alice Smith')).toBeDefined()
			expect(screen.getByText('Showing 1 of 3 people')).toBeDefined()
		})
	})

	it('should search people by email', async () => {
		render(<PeopleDirectory />)

		await waitFor(() => {
			expect(screen.getByText('Alice Smith')).toBeDefined()
		})

		// Search for email
		const searchInput = screen.getByPlaceholderText('Search by name or email...')
		fireEvent.change(searchInput, { target: { value: 'bob@example.com' } })

		// Should show only Bob
		await waitFor(() => {
			expect(screen.getByText('Bob Jones')).toBeDefined()
			expect(screen.getByText('Showing 1 of 3 people')).toBeDefined()
		})
	})

	/**
	 * @REQ-PPL-006: Distinguish platform users
	 */
	it('should show User badge for people with platform access', async () => {
		render(<PeopleDirectory />)

		await waitFor(() => {
			const userBadges = screen.getAllByText('User')
			// Alice has platform access, Bob and Charlie don't
			expect(userBadges.length).toBe(1)
		})
	})

	it('should filter by department', async () => {
		render(<PeopleDirectory />)

		await waitFor(() => {
			expect(screen.getByText('Alice Smith')).toBeDefined()
		})

		// Filter by Engineering department
		const deptFilter = screen.getByDisplayValue('All Departments')
		fireEvent.change(deptFilter, { target: { value: 'Engineering' } })

		// Should show Alice and Charlie (both Engineering)
		await waitFor(() => {
			expect(screen.getByText('Alice Smith')).toBeDefined()
			expect(screen.getByText('Charlie Brown')).toBeDefined()
			expect(screen.getByText('Showing 2 of 3 people')).toBeDefined()
		})
	})

	it('should open Add Person modal when clicking Add Person button', async () => {
		render(<PeopleDirectory />)

		await waitFor(() => {
			expect(screen.getByText('Alice Smith')).toBeDefined()
		})

		const addButton = screen.getByText('Add Person')
		fireEvent.click(addButton)

		await waitFor(() => {
			expect(screen.getByText('Add New Person')).toBeDefined()
		})
	})

	it('should show empty state when no people exist', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({ people: [] }),
		} as Response)

		render(<PeopleDirectory />)

		await waitFor(() => {
			expect(screen.getByText('No people yet')).toBeDefined()
			expect(screen.getByText('Get started by adding your first team member')).toBeDefined()
		})
	})

	it('should show error state on fetch failure', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: false,
			statusText: 'Unauthorized',
		} as Response)

		render(<PeopleDirectory />)

		await waitFor(() => {
			expect(screen.getByText('Error loading people')).toBeDefined()
		})
	})

	it('should allow clearing filters', async () => {
		render(<PeopleDirectory />)

		await waitFor(() => {
			expect(screen.getByText('Alice Smith')).toBeDefined()
		})

		// Apply search filter
		const searchInput = screen.getByPlaceholderText('Search by name or email...')
		fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

		await waitFor(() => {
			expect(screen.getByText('No results found')).toBeDefined()
		})

		// Clear filters
		const clearButton = screen.getByText('Clear Filters')
		fireEvent.click(clearButton)

		// Should show all people again
		await waitFor(() => {
			expect(screen.getByText('Alice Smith')).toBeDefined()
			expect(screen.getByText('Showing 3 of 3 people')).toBeDefined()
		})
	})
})
