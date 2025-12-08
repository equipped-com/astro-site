/**
 * Add Device Modal Tests
 *
 * Tests for the AddDeviceModal component following Gherkin BDD criteria.
 * @see tasks/fleet/device-inventory.md
 *
 * Coverage:
 * - @REQ-FLEET-003: Add device by serial number
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import AddDeviceModal from './AddDeviceModal'

// Mock fetch globally
global.fetch = vi.fn()

describe('AddDeviceModal Component', () => {
	const mockOnClose = vi.fn()
	const mockOnSuccess = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
	})

	test('should not render when isOpen is false', () => {
		render(<AddDeviceModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		expect(screen.queryByText('Add Device')).not.toBeInTheDocument()
	})

	test('should render when isOpen is true', () => {
		render(<AddDeviceModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		expect(screen.getByText('Add Device', { selector: 'h2' })).toBeInTheDocument()
		expect(screen.getByLabelText(/Name/)).toBeInTheDocument()
		expect(screen.getByLabelText(/Type/)).toBeInTheDocument()
		expect(screen.getByLabelText(/Model/)).toBeInTheDocument()
	})

	/**
	 * @REQ-FLEET-003: Add device by serial number
	 * Scenario: Add device by serial number
	 */
	test('@REQ-FLEET-003: should lookup device details by serial number (MacBook)', async () => {
		const user = userEvent.setup()

		render(<AddDeviceModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// When I click "Add Device"
		// And I enter serial "C02XYZ123ABC"
		const serialInput = screen.getByLabelText(/Serial Number/)
		await user.type(serialInput, 'C02XYZ123ABC')

		// Click Lookup button
		const lookupButton = screen.getByRole('button', { name: /Lookup/i })
		await user.click(lookupButton)

		// Then Alchemy API should populate (mocked):
		await waitFor(() => {
			// Model: MacBook Air M1
			expect(screen.getByDisplayValue('MacBook Air 13" M1 (2021)')).toBeInTheDocument()
		})

		// Name should be populated
		expect(screen.getByDisplayValue('MacBook Air M1')).toBeInTheDocument()
		// Type should be populated
		expect(screen.getByDisplayValue('laptop')).toBeInTheDocument()
	})

	test('@REQ-FLEET-003: should lookup device details by serial number (iPhone)', async () => {
		const user = userEvent.setup()

		render(<AddDeviceModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Enter iPhone serial (12 or 15 characters)
		const serialInput = screen.getByLabelText(/Serial Number/)
		await user.type(serialInput, 'ABC123456789')

		// Click Lookup button
		const lookupButton = screen.getByRole('button', { name: /Lookup/i })
		await user.click(lookupButton)

		// Then iPhone details should populate
		await waitFor(() => {
			expect(screen.getByDisplayValue('iPhone 15 Pro (2023)')).toBeInTheDocument()
		})

		expect(screen.getByDisplayValue('iPhone 15 Pro')).toBeInTheDocument()
		expect(screen.getByDisplayValue('phone')).toBeInTheDocument()
	})

	test('@REQ-FLEET-003: should handle serial lookup errors', async () => {
		const user = userEvent.setup()

		render(<AddDeviceModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Enter invalid serial
		const serialInput = screen.getByLabelText(/Serial Number/)
		await user.type(serialInput, 'INVALID')

		// Click Lookup button
		const lookupButton = screen.getByRole('button', { name: /Lookup/i })
		await user.click(lookupButton)

		// Then error should be shown
		await waitFor(() => {
			expect(screen.getByText('Serial number not found in database')).toBeInTheDocument()
		})
	})

	test('@REQ-FLEET-003: should save device to inventory after form submission', async () => {
		const user = userEvent.setup()
		const mockDevice = {
			id: 'dev_new',
			account_id: 'acc_123',
			name: 'MacBook Pro 14"',
			type: 'laptop',
			model: 'MacBook Pro 14" M3',
			serial_number: 'C02XYZ123ABC',
			status: 'available' as const,
			created_at: '2024-01-01T00:00:00Z',
		}

		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({ device: mockDevice }),
		})

		render(<AddDeviceModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Fill in required fields
		await user.type(screen.getByLabelText(/Name/), 'MacBook Pro 14"')
		await user.type(screen.getByLabelText(/Type/), 'laptop')
		await user.type(screen.getByLabelText(/Model/), 'MacBook Pro 14" M3')

		// Submit form
		const submitButton = screen.getByRole('button', { name: /Add Device/i })
		await user.click(submitButton)

		// Then device should be saved to inventory
		await waitFor(() => {
			const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
			expect(fetchCall[0]).toBe('/api/devices')
			expect(fetchCall[1].method).toBe('POST')
			const body = JSON.parse(fetchCall[1].body)
			expect(body.name).toBe('MacBook Pro 14"')
			expect(body.type).toBe('laptop')
			expect(body.model).toBe('MacBook Pro 14" M3')
		})

		// And onSuccess callback should be called
		expect(mockOnSuccess).toHaveBeenCalledWith(mockDevice)
	})

	test('should require name, type, and model fields', async () => {
		const user = userEvent.setup()

		render(<AddDeviceModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Submit button should be disabled when fields are empty
		const submitButton = screen.getByRole('button', { name: /Add Device/i })
		expect(submitButton).toBeDisabled()

		// Fill only name
		await user.type(screen.getByLabelText(/Name/), 'MacBook Pro')
		expect(submitButton).toBeDisabled()

		// Fill name and type
		await user.type(screen.getByLabelText(/Type/), 'laptop')
		expect(submitButton).toBeDisabled()

		// Fill all required fields
		await user.type(screen.getByLabelText(/Model/), 'MacBook Pro 14"')
		expect(submitButton).not.toBeDisabled()
	})

	test('should handle form submission errors', async () => {
		const user = userEvent.setup()

		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: false,
			json: async () => ({ error: 'Device already exists' }),
		})

		render(<AddDeviceModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Fill in required fields
		await user.type(screen.getByLabelText(/Name/), 'MacBook Pro 14"')
		await user.type(screen.getByLabelText(/Type/), 'laptop')
		await user.type(screen.getByLabelText(/Model/), 'MacBook Pro 14" M3')

		// Submit form
		const submitButton = screen.getByRole('button', { name: /Add Device/i })
		await user.click(submitButton)

		// Then error should be displayed
		await waitFor(() => {
			expect(screen.getByText('Device already exists')).toBeInTheDocument()
		})

		// onSuccess should not be called
		expect(mockOnSuccess).not.toHaveBeenCalled()
	})

	test('should close modal when clicking Cancel', async () => {
		const user = userEvent.setup()

		render(<AddDeviceModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Click Cancel button
		const cancelButton = screen.getByRole('button', { name: /Cancel/i })
		await user.click(cancelButton)

		// Then onClose should be called
		expect(mockOnClose).toHaveBeenCalled()
	})

	test('should close modal when clicking X button', async () => {
		const user = userEvent.setup()

		render(<AddDeviceModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Click X button (use the button, not the backdrop)
		const closeButton = screen.getByRole('button', { name: /Close$/i })
		await user.click(closeButton)

		// Then onClose should be called
		expect(mockOnClose).toHaveBeenCalled()
	})

	test('should reset form when modal reopens', async () => {
		const user = userEvent.setup()

		const { rerender } = render(<AddDeviceModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Fill in some fields
		await user.type(screen.getByLabelText(/Name/), 'MacBook Pro 14"')
		await user.type(screen.getByLabelText(/Type/), 'laptop')

		// Close modal
		rerender(<AddDeviceModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Reopen modal
		rerender(<AddDeviceModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Form should be reset
		expect(screen.getByLabelText(/Name/)).toHaveValue('')
		expect(screen.getByLabelText(/Type/)).toHaveValue('')
	})
})
