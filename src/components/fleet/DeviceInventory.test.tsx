/**
 * Device Inventory Tests
 *
 * Tests for the DeviceInventory component following Gherkin BDD criteria.
 * @see tasks/fleet/device-inventory.md
 *
 * Coverage:
 * - @REQ-FLEET-001: View device inventory
 * - @REQ-FLEET-002: Fleet value summary
 * - @REQ-FLEET-004: Filter devices
 * - @REQ-FLEET-006: Empty fleet state
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import DeviceInventory from './DeviceInventory'

// Mock fetch globally
global.fetch = vi.fn()

const mockDevices = [
	{
		id: 'dev_1',
		account_id: 'acc_123',
		name: 'MacBook Pro 14"',
		type: 'laptop',
		model: 'MacBook Pro 14" M3',
		serial_number: 'C02XYZ123ABC',
		status: 'assigned' as const,
		assigned_to: 'Alice',
		created_at: '2024-01-01T00:00:00Z',
	},
	{
		id: 'dev_2',
		account_id: 'acc_123',
		name: 'iPhone 15 Pro',
		type: 'phone',
		model: 'iPhone 15 Pro',
		serial_number: 'ABC123456789',
		status: 'available' as const,
		assigned_to: null,
		created_at: '2024-01-02T00:00:00Z',
	},
	{
		id: 'dev_3',
		account_id: 'acc_123',
		name: 'MacBook Air M1',
		type: 'laptop',
		model: 'MacBook Air 13" M1',
		serial_number: 'C01ABC789XYZ',
		status: 'in_use' as const,
		assigned_to: 'Bob',
		created_at: '2024-01-03T00:00:00Z',
	},
]

describe('DeviceInventory Component', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * @REQ-FLEET-001: View device inventory
	 * Scenario: View device inventory
	 */
	test('@REQ-FLEET-001: should display all company devices with required fields', async () => {
		// Given I have devices in my account
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({ devices: mockDevices }),
		})

		// When I navigate to Fleet/Devices page
		render(<DeviceInventory />)

		// Then I should see all company devices
		await waitFor(() => {
			expect(screen.getAllByText('MacBook Pro 14"')).toHaveLength(1)
		})

		// All devices should be present (checking unique identifiers)
		expect(screen.getByText('C02XYZ123ABC')).toBeInTheDocument() // MacBook Pro serial
		expect(screen.getByText('ABC123456789')).toBeInTheDocument() // iPhone serial
		expect(screen.getByText('C01ABC789XYZ')).toBeInTheDocument() // MacBook Air serial

		// And each device should display required fields
		// Type (required) - checking at least 2 laptops and 1 phone exist (may be more due to icons/labels/filters)
		expect(screen.getAllByText('laptop').length).toBeGreaterThanOrEqual(2)
		expect(screen.getAllByText('phone').length).toBeGreaterThanOrEqual(1)
		// Model (required)
		expect(screen.getByText('MacBook Pro 14" M3')).toBeInTheDocument()
		expect(screen.getByText('MacBook Air 13" M1')).toBeInTheDocument()
		// Status (required) - appears in filter dropdown and potentially in table
		expect(screen.getAllByText('Assigned').length).toBeGreaterThanOrEqual(1)
		expect(screen.getAllByText('Available').length).toBeGreaterThanOrEqual(1)
		expect(screen.getAllByText('In Use').length).toBeGreaterThanOrEqual(1)
		// Assigned To (optional)
		expect(screen.getByText('Alice')).toBeInTheDocument()
		expect(screen.getByText('Bob')).toBeInTheDocument()
		// Trade-In Value (required - mocked for now)
		expect(screen.getAllByText(/Trade-In: \$/)).toHaveLength(3)
	})

	/**
	 * @REQ-FLEET-002: Fleet value summary
	 * Scenario: Fleet value summary
	 */
	test('@REQ-FLEET-002: should display fleet value summary card with stats', async () => {
		// Given I have devices with trade-in values
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({ devices: mockDevices }),
		})

		// When the page loads
		render(<DeviceInventory />)

		// Then I should see "Total Fleet Value" card
		await waitFor(() => {
			expect(screen.getByText('Total Fleet Value')).toBeInTheDocument()
		})

		// And I should see depreciation trend
		expect(screen.getByText(/vs\. last quarter/)).toBeInTheDocument()

		// And I should see device count by status
		expect(screen.getByText('Total Devices')).toBeInTheDocument()
		expect(screen.getByText('3')).toBeInTheDocument() // Total device count
	})

	/**
	 * @REQ-FLEET-004: Filter devices
	 * Scenario: Filter devices
	 */
	test('@REQ-FLEET-004: should filter devices by status', async () => {
		const user = userEvent.setup()
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({ devices: mockDevices }),
		})

		render(<DeviceInventory />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		})

		// When I filter by status "Assigned"
		const statusFilter = screen.getByDisplayValue('All Statuses')
		await user.selectOptions(statusFilter, 'assigned')

		// Then I should only see assigned devices
		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
			expect(screen.queryByText('iPhone 15 Pro')).not.toBeInTheDocument()
			expect(screen.queryByText('MacBook Air M1')).not.toBeInTheDocument()
		})

		// Result count should update
		expect(screen.getByText('Showing 1 of 3 devices')).toBeInTheDocument()
	})

	test('@REQ-FLEET-004: should filter devices by type', async () => {
		const user = userEvent.setup()
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({ devices: mockDevices }),
		})

		render(<DeviceInventory />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		})

		// When I filter by type "laptop"
		const typeFilter = screen.getByDisplayValue('All Types')
		await user.selectOptions(typeFilter, 'laptop')

		// Then I should only see laptop devices
		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
			expect(screen.getByText('MacBook Air M1')).toBeInTheDocument()
			expect(screen.queryByText('iPhone 15 Pro')).not.toBeInTheDocument()
		})

		expect(screen.getByText('Showing 2 of 3 devices')).toBeInTheDocument()
	})

	test('@REQ-FLEET-004: should search devices by name/serial/assignee', async () => {
		const user = userEvent.setup()
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({ devices: mockDevices }),
		})

		render(<DeviceInventory />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		})

		// When I search for "Alice"
		const searchInput = screen.getByPlaceholderText(/Search by name/)
		await user.type(searchInput, 'Alice')

		// Then I should see devices assigned to Alice
		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
			expect(screen.queryByText('iPhone 15 Pro')).not.toBeInTheDocument()
			expect(screen.queryByText('MacBook Air M1')).not.toBeInTheDocument()
		})

		expect(screen.getByText('Showing 1 of 3 devices')).toBeInTheDocument()
	})

	/**
	 * @REQ-FLEET-006: Empty fleet state
	 * Scenario: Empty fleet state
	 */
	test('@REQ-FLEET-006: should show friendly empty state when no devices', async () => {
		// Given account has no devices
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({ devices: [] }),
		})

		// When I view fleet page
		render(<DeviceInventory />)

		// Then I should see friendly empty state
		await waitFor(() => {
			expect(screen.getByText('No devices yet')).toBeInTheDocument()
		})
		expect(screen.getByText('Get started by adding your first device')).toBeInTheDocument()

		// And I should see quick actions
		expect(screen.getByText(/Add device by serial number/)).toBeInTheDocument()
		expect(screen.getByText(/Order new device from store/)).toBeInTheDocument()
		expect(screen.getByText(/Import from spreadsheet/)).toBeInTheDocument()
	})

	test('@REQ-FLEET-006: should show "no results" when filters return empty', async () => {
		const user = userEvent.setup()
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({ devices: mockDevices }),
		})

		render(<DeviceInventory />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		})

		// When I search for something that doesn't exist
		const searchInput = screen.getByPlaceholderText(/Search by name/)
		await user.type(searchInput, 'NonexistentDevice')

		// Then I should see "No results found"
		await waitFor(() => {
			expect(screen.getByText('No results found')).toBeInTheDocument()
		})
		expect(screen.getByText('Try adjusting your filters or search query')).toBeInTheDocument()

		// And I should see a "Clear Filters" button
		expect(screen.getByText('Clear Filters')).toBeInTheDocument()
	})

	test('should handle API errors gracefully', async () => {
		// Given API returns an error
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: false,
			statusText: 'Internal Server Error',
		})

		// When I render the component
		render(<DeviceInventory />)

		// Then I should see an error message
		await waitFor(() => {
			expect(screen.getByText('Error loading devices')).toBeInTheDocument()
		})
		expect(screen.getByText(/Failed to fetch devices/)).toBeInTheDocument()
	})

	test('should open Add Device modal when clicking Add button', async () => {
		const user = userEvent.setup()
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({ devices: mockDevices }),
		})

		render(<DeviceInventory />)

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		})

		// When I click "Add Device"
		const addButton = screen.getByRole('button', { name: /Add Device/i })
		await user.click(addButton)

		// Then the modal should open
		await waitFor(() => {
			expect(screen.getByText('Add Device', { selector: 'h2' })).toBeInTheDocument()
		})
	})
})
