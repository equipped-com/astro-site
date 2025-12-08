import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DeviceCollectionScheduler from './DeviceCollectionScheduler'

const mockPerson = {
	first_name: 'Bob',
	last_name: 'Jones',
	location: 'San Francisco, CA',
}

describe('DeviceCollectionScheduler', () => {
	const mockOnMethodSelected = vi.fn()

	it('should render collection options', () => {
		render(
			<DeviceCollectionScheduler
				person={mockPerson}
				deviceCount={2}
				onMethodSelected={mockOnMethodSelected}
				selectedMethod={null}
			/>
		)

		expect(screen.getByText('Schedule Device Collection')).toBeInTheDocument()
		expect(screen.getByText(/Choose how Bob Jones will return 2 devices/)).toBeInTheDocument()
		expect(screen.getByText(/from San Francisco, CA/)).toBeInTheDocument()

		// Should show all collection methods
		expect(screen.getByText('Ship return label to employee')).toBeInTheDocument()
		expect(screen.getByText('Schedule pickup at address')).toBeInTheDocument()
		expect(screen.getByText('Mark as returned in person')).toBeInTheDocument()
	})

	it('should handle singular device count', () => {
		render(
			<DeviceCollectionScheduler
				person={mockPerson}
				deviceCount={1}
				onMethodSelected={mockOnMethodSelected}
				selectedMethod={null}
			/>
		)

		expect(screen.getByText(/Choose how Bob Jones will return 1 device/)).toBeInTheDocument()
	})

	it('should select collection method', () => {
		render(
			<DeviceCollectionScheduler
				person={mockPerson}
				deviceCount={2}
				onMethodSelected={mockOnMethodSelected}
				selectedMethod={null}
			/>
		)

		const pickupButton = screen.getByText('Schedule pickup at address').closest('button')
		expect(pickupButton).toBeInTheDocument()

		fireEvent.click(pickupButton!)

		expect(mockOnMethodSelected).toHaveBeenCalledWith('pickup')
	})

	it('should highlight selected method', () => {
		const { container } = render(
			<DeviceCollectionScheduler
				person={mockPerson}
				deviceCount={2}
				onMethodSelected={mockOnMethodSelected}
				selectedMethod="return_label"
			/>
		)

		// Should show selected state for return_label
		const returnLabelButton = screen.getByText('Ship return label to employee').closest('button')
		expect(returnLabelButton).toHaveClass('border-primary')

		// Should show expanded details for selected option
		expect(screen.getByText('Prepaid shipping label sent to employee')).toBeInTheDocument()
		expect(screen.getByText('Typical turnaround: 3-5 business days')).toBeInTheDocument()
	})

	it('should show confirmation when method is selected', () => {
		render(
			<DeviceCollectionScheduler
				person={mockPerson}
				deviceCount={2}
				onMethodSelected={mockOnMethodSelected}
				selectedMethod="in_person"
			/>
		)

		expect(screen.getByText('Collection method selected')).toBeInTheDocument()
		expect(screen.getByText(/You can coordinate the details after completing/)).toBeInTheDocument()
	})

	it('should show all details for return label option', () => {
		render(
			<DeviceCollectionScheduler
				person={mockPerson}
				deviceCount={2}
				onMethodSelected={mockOnMethodSelected}
				selectedMethod="return_label"
			/>
		)

		expect(screen.getByText('Prepaid shipping label sent to employee')).toBeInTheDocument()
		expect(screen.getByText('Employee packages and ships devices')).toBeInTheDocument()
		expect(screen.getByText('Tracking provided for return shipment')).toBeInTheDocument()
		expect(screen.getByText('Typical turnaround: 3-5 business days')).toBeInTheDocument()
	})

	it('should show all details for pickup option', () => {
		render(
			<DeviceCollectionScheduler
				person={mockPerson}
				deviceCount={2}
				onMethodSelected={mockOnMethodSelected}
				selectedMethod="pickup"
			/>
		)

		expect(screen.getByText('Courier scheduled to employee address')).toBeInTheDocument()
		expect(screen.getByText('Pickup window coordinated with employee')).toBeInTheDocument()
		expect(screen.getByText('Devices packaged and collected on-site')).toBeInTheDocument()
		expect(screen.getByText('Typical turnaround: 2-3 business days')).toBeInTheDocument()
	})

	it('should show all details for in-person option', () => {
		render(
			<DeviceCollectionScheduler
				person={mockPerson}
				deviceCount={2}
				onMethodSelected={mockOnMethodSelected}
				selectedMethod="in_person"
			/>
		)

		expect(screen.getByText('Employee brings devices to office')).toBeInTheDocument()
		expect(screen.getByText('In-person handoff and verification')).toBeInTheDocument()
		expect(screen.getByText('Immediate processing of return')).toBeInTheDocument()
		expect(screen.getByText('No shipping costs or delays')).toBeInTheDocument()
	})

	it('should handle person without location', () => {
		const personNoLocation = {
			first_name: 'Alice',
			last_name: 'Smith',
			location: null,
		}

		render(
			<DeviceCollectionScheduler
				person={personNoLocation}
				deviceCount={1}
				onMethodSelected={mockOnMethodSelected}
				selectedMethod={null}
			/>
		)

		const text = screen.getByText(/Choose how Alice Smith will return 1 device/)
		expect(text).toBeInTheDocument()
		expect(text.textContent).not.toContain('from')
	})
})
