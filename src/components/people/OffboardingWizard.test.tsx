import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OffboardingWizard from './OffboardingWizard'

const mockPerson = {
	id: 'person-123',
	first_name: 'Bob',
	last_name: 'Jones',
	email: 'bob.jones@example.com',
	phone: '+1-555-0123',
	title: 'Senior Developer',
	department: 'Engineering',
	location: 'San Francisco, CA',
	status: 'active' as const,
	has_platform_access: 1,
	device_count: 2,
	start_date: '2020-01-15',
	end_date: null,
}

const mockDevices = [
	{
		id: 'device-1',
		name: 'MacBook Pro 14"',
		serial_number: 'XYZ123',
		status: 'deployed' as const,
		device_type: 'Laptop',
	},
	{
		id: 'device-2',
		name: 'Magic Keyboard',
		serial_number: 'ABC456',
		status: 'deployed' as const,
		device_type: 'Accessory',
	},
]

describe('OffboardingWizard', () => {
	const mockOnClose = vi.fn()
	const mockOnComplete = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
		global.fetch = vi.fn()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	/**
	 * @REQ-PPL-OFFBOARD-001
	 * Feature: Employee Offboarding
	 * Scenario: Initiate offboarding
	 *   Given employee "Bob Jones" has assigned devices
	 *   When I click "Offboard employee" on Bob's profile
	 *   Then I should see offboarding workflow
	 *   And I should see all devices assigned to Bob
	 */
	it('should initiate offboarding workflow and show overview', () => {
		render(
			<OffboardingWizard
				person={mockPerson}
				isOpen={true}
				onClose={mockOnClose}
				onComplete={mockOnComplete}
			/>
		)

		// Should show offboarding wizard
		expect(screen.getByText('Offboard Employee')).toBeInTheDocument()
		expect(screen.getByText('Bob Jones')).toBeInTheDocument()

		// Should show overview step
		expect(screen.getByText('Starting Offboarding Process')).toBeInTheDocument()
		expect(screen.getByText(/This will initiate the offboarding workflow/)).toBeInTheDocument()

		// Should show last day input
		expect(screen.getByLabelText(/Last Day of Employment/)).toBeInTheDocument()
	})

	it('should require last day before proceeding', () => {
		render(
			<OffboardingWizard
				person={mockPerson}
				isOpen={true}
				onClose={mockOnClose}
				onComplete={mockOnComplete}
			/>
		)

		const continueButton = screen.getByText('Continue')
		expect(continueButton).toBeDisabled()

		// Enter last day
		const lastDayInput = screen.getByLabelText(/Last Day of Employment/)
		fireEvent.change(lastDayInput, { target: { value: '2025-12-31' } })

		expect(continueButton).toBeEnabled()
	})

	/**
	 * @REQ-PPL-OFFBOARD-002
	 * Feature: Employee Offboarding
	 * Scenario: View assigned devices
	 *   When I am in offboarding flow
	 *   Then I should see:
	 *     | Device | Status |
	 *     | MacBook Pro 14" (Serial: XYZ) | Deployed |
	 *     | Magic Keyboard | Deployed |
	 *   And I should see total device count
	 */
	it('should fetch and display assigned devices', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ devices: mockDevices }),
		})

		render(
			<OffboardingWizard
				person={mockPerson}
				isOpen={true}
				onClose={mockOnClose}
				onComplete={mockOnComplete}
			/>
		)

		// Enter last day and proceed
		const lastDayInput = screen.getByLabelText(/Last Day of Employment/)
		fireEvent.change(lastDayInput, { target: { value: '2025-12-31' } })
		fireEvent.click(screen.getByText('Continue'))

		// Wait for devices to load
		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		})

		// Should show all devices
		expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		expect(screen.getByText('XYZ123')).toBeInTheDocument()
		expect(screen.getByText('Magic Keyboard')).toBeInTheDocument()
		expect(screen.getByText('ABC456')).toBeInTheDocument()

		// Should show total device count
		expect(screen.getByText(/Total devices: 2/)).toBeInTheDocument()
	})

	it('should handle no devices scenario', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ devices: [] }),
		})

		render(
			<OffboardingWizard
				person={mockPerson}
				isOpen={true}
				onClose={mockOnClose}
				onComplete={mockOnComplete}
			/>
		)

		// Proceed to devices step
		const lastDayInput = screen.getByLabelText(/Last Day of Employment/)
		fireEvent.change(lastDayInput, { target: { value: '2025-12-31' } })
		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('No devices assigned')).toBeInTheDocument()
		})

		expect(screen.getByText(/This employee has no devices to return/)).toBeInTheDocument()
	})

	/**
	 * @REQ-PPL-OFFBOARD-003
	 * Feature: Employee Offboarding
	 * Scenario: Schedule device collection
	 *   When I click "Schedule collection"
	 *   Then I should be able to:
	 *     | Option |
	 *     | Ship return label to employee |
	 *     | Schedule pickup at address |
	 *     | Mark as returned in person |
	 */
	it('should show collection options', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ devices: mockDevices }),
		})

		render(
			<OffboardingWizard
				person={mockPerson}
				isOpen={true}
				onClose={mockOnClose}
				onComplete={mockOnComplete}
			/>
		)

		// Navigate to collection step
		const lastDayInput = screen.getByLabelText(/Last Day of Employment/)
		fireEvent.change(lastDayInput, { target: { value: '2025-12-31' } })
		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		})

		fireEvent.click(screen.getByText('Continue'))

		// Should show collection options
		await waitFor(() => {
			expect(screen.getByText('Schedule Device Collection')).toBeInTheDocument()
		})

		expect(screen.getByText('Ship return label to employee')).toBeInTheDocument()
		expect(screen.getByText('Schedule pickup at address')).toBeInTheDocument()
		expect(screen.getByText('Mark as returned in person')).toBeInTheDocument()
	})

	it('should select collection method', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ devices: mockDevices }),
		})

		render(
			<OffboardingWizard
				person={mockPerson}
				isOpen={true}
				onClose={mockOnClose}
				onComplete={mockOnComplete}
			/>
		)

		// Navigate to collection step
		const lastDayInput = screen.getByLabelText(/Last Day of Employment/)
		fireEvent.change(lastDayInput, { target: { value: '2025-12-31' } })
		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		})

		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('Schedule Device Collection')).toBeInTheDocument()
		})

		// Select pickup method
		const pickupButton = screen.getByText('Schedule pickup at address').closest('button')
		expect(pickupButton).toBeInTheDocument()
		fireEvent.click(pickupButton!)

		// Should show confirmation
		expect(screen.getByText('Collection method selected')).toBeInTheDocument()
	})

	/**
	 * @REQ-PPL-OFFBOARD-004
	 * Feature: Employee Offboarding
	 * Scenario: Request secure wipe
	 *   When I request data wipe
	 *   Then I should see wipe options:
	 *     | Option | Description |
	 *     | Standard wipe | Factory reset |
	 *     | Secure wipe | DoD 5220.22-M compliant |
	 *     | Certified wipe | With destruction certificate |
	 *   And wipe status should be tracked
	 */
	it('should show wipe options', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ devices: mockDevices }),
		})

		render(
			<OffboardingWizard
				person={mockPerson}
				isOpen={true}
				onClose={mockOnClose}
				onComplete={mockOnComplete}
			/>
		)

		// Navigate to wipe step
		const lastDayInput = screen.getByLabelText(/Last Day of Employment/)
		fireEvent.change(lastDayInput, { target: { value: '2025-12-31' } })
		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		})

		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('Schedule Device Collection')).toBeInTheDocument()
		})

		const pickupButton = screen.getByText('Schedule pickup at address').closest('button')
		fireEvent.click(pickupButton!)
		fireEvent.click(screen.getByText('Continue'))

		// Should show wipe options
		await waitFor(() => {
			expect(screen.getByText('Request Secure Data Wipe')).toBeInTheDocument()
		})

		expect(screen.getByText('Standard wipe')).toBeInTheDocument()
		expect(screen.getByText('Factory reset')).toBeInTheDocument()
		expect(screen.getByText('Secure wipe')).toBeInTheDocument()
		expect(screen.getByText('DoD 5220.22-M compliant')).toBeInTheDocument()
		expect(screen.getByText('Certified wipe')).toBeInTheDocument()
		expect(screen.getByText('With destruction certificate')).toBeInTheDocument()
	})

	it('should select wipe option and show tracking confirmation', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ devices: mockDevices }),
		})

		render(
			<OffboardingWizard
				person={mockPerson}
				isOpen={true}
				onClose={mockOnClose}
				onComplete={mockOnComplete}
			/>
		)

		// Navigate to wipe step
		const lastDayInput = screen.getByLabelText(/Last Day of Employment/)
		fireEvent.change(lastDayInput, { target: { value: '2025-12-31' } })
		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		})

		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('Schedule Device Collection')).toBeInTheDocument()
		})

		const pickupButton = screen.getByText('Schedule pickup at address').closest('button')
		fireEvent.click(pickupButton!)
		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('Request Secure Data Wipe')).toBeInTheDocument()
		})

		// Select secure wipe
		const secureWipeButton = screen.getByText('Secure wipe').closest('button')
		fireEvent.click(secureWipeButton!)

		// Should show tracking confirmation
		expect(screen.getByText('Data wipe will be tracked')).toBeInTheDocument()
		expect(screen.getByText(/Wipe status and completion will be recorded/)).toBeInTheDocument()
	})

	/**
	 * @REQ-PPL-OFFBOARD-005
	 * Feature: Employee Offboarding
	 * Scenario: Complete offboarding
	 *   When I complete offboarding with last day "Dec 31"
	 *   Then:
	 *     | Action | Timing |
	 *     | Platform access revoked | On Dec 31 |
	 *     | Status updated to "departed" | On Dec 31 |
	 *     | Devices unassigned | When returned |
	 *     | End date set | Dec 31 |
	 */
	it('should complete offboarding with all details', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ devices: mockDevices }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					person: { ...mockPerson, status: 'offboarding', end_date: '2025-12-31' },
				}),
			})

		render(
			<OffboardingWizard
				person={mockPerson}
				isOpen={true}
				onClose={mockOnClose}
				onComplete={mockOnComplete}
			/>
		)

		// Complete all steps
		const lastDayInput = screen.getByLabelText(/Last Day of Employment/)
		fireEvent.change(lastDayInput, { target: { value: '2025-12-31' } })
		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		})

		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('Schedule Device Collection')).toBeInTheDocument()
		})

		const pickupButton = screen.getByText('Schedule pickup at address').closest('button')
		fireEvent.click(pickupButton!)
		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('Request Secure Data Wipe')).toBeInTheDocument()
		})

		const secureWipeButton = screen.getByText('Secure wipe').closest('button')
		fireEvent.click(secureWipeButton!)
		fireEvent.click(screen.getByText('Continue'))

		// Should show confirmation step
		await waitFor(() => {
			expect(screen.getByText('Ready to Complete Offboarding')).toBeInTheDocument()
		})

		// Should show summary
		expect(screen.getByText('Bob Jones')).toBeInTheDocument()
		expect(screen.getByText('December 31, 2025')).toBeInTheDocument()
		expect(screen.getByText('2 devices')).toBeInTheDocument()

		// Should show actions
		expect(screen.getByText(/Platform access will be revoked/)).toBeInTheDocument()
		expect(screen.getByText(/Employee status will change to "departed"/)).toBeInTheDocument()
		expect(screen.getByText(/Devices will be unassigned when returned/)).toBeInTheDocument()

		// Complete offboarding
		fireEvent.click(screen.getByText('Complete Offboarding'))

		await waitFor(() => {
			expect(mockOnComplete).toHaveBeenCalledWith({
				...mockPerson,
				status: 'offboarding',
				end_date: '2025-12-31',
			})
		})

		// Should call API with correct data
		expect(global.fetch).toHaveBeenCalledWith(
			'/api/people/person-123/offboard',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({
					end_date: '2025-12-31',
					collection_method: 'pickup',
					wipe_option: 'secure_wipe',
				}),
			})
		)
	})

	it('should handle API errors during completion', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ devices: mockDevices }),
			})
			.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: 'Failed to offboard employee' }),
			})

		render(
			<OffboardingWizard
				person={mockPerson}
				isOpen={true}
				onClose={mockOnClose}
				onComplete={mockOnComplete}
			/>
		)

		// Navigate through all steps
		const lastDayInput = screen.getByLabelText(/Last Day of Employment/)
		fireEvent.change(lastDayInput, { target: { value: '2025-12-31' } })
		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		})

		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('Schedule Device Collection')).toBeInTheDocument()
		})

		const pickupButton = screen.getByText('Schedule pickup at address').closest('button')
		fireEvent.click(pickupButton!)
		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('Request Secure Data Wipe')).toBeInTheDocument()
		})

		const secureWipeButton = screen.getByText('Secure wipe').closest('button')
		fireEvent.click(secureWipeButton!)
		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('Ready to Complete Offboarding')).toBeInTheDocument()
		})

		fireEvent.click(screen.getByText('Complete Offboarding'))

		// Should show error
		await waitFor(() => {
			expect(screen.getByText('Failed to offboard employee')).toBeInTheDocument()
		})

		expect(mockOnComplete).not.toHaveBeenCalled()
	})

	it('should allow closing wizard', () => {
		render(
			<OffboardingWizard
				person={mockPerson}
				isOpen={true}
				onClose={mockOnClose}
				onComplete={mockOnComplete}
			/>
		)

		const closeButton = screen.getByRole('button', { name: '' }).parentElement?.querySelector('button')
		fireEvent.click(closeButton!)

		expect(mockOnClose).toHaveBeenCalled()
	})

	it('should not render when closed', () => {
		const { container } = render(
			<OffboardingWizard
				person={mockPerson}
				isOpen={false}
				onClose={mockOnClose}
				onComplete={mockOnComplete}
			/>
		)

		expect(container.firstChild).toBeNull()
	})

	it('should allow navigating back through steps', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ devices: mockDevices }),
		})

		render(
			<OffboardingWizard
				person={mockPerson}
				isOpen={true}
				onClose={mockOnClose}
				onComplete={mockOnComplete}
			/>
		)

		// Navigate forward
		const lastDayInput = screen.getByLabelText(/Last Day of Employment/)
		fireEvent.change(lastDayInput, { target: { value: '2025-12-31' } })
		fireEvent.click(screen.getByText('Continue'))

		await waitFor(() => {
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		})

		// Navigate back
		fireEvent.click(screen.getByText('Back'))

		// Should be back at overview
		expect(screen.getByText('Starting Offboarding Process')).toBeInTheDocument()
	})
})
