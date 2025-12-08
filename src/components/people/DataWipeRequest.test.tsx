import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DataWipeRequest from './DataWipeRequest'

describe('DataWipeRequest', () => {
	const mockOnWipeOptionSelected = vi.fn()

	it('should render wipe options', () => {
		render(<DataWipeRequest deviceCount={2} onWipeOptionSelected={mockOnWipeOptionSelected} selectedOption={null} />)

		expect(screen.getByText('Request Secure Data Wipe')).toBeInTheDocument()
		expect(screen.getByText(/Choose the level of data security for wiping 2 devices/)).toBeInTheDocument()

		// Should show all wipe options
		expect(screen.getByText('Standard wipe')).toBeInTheDocument()
		expect(screen.getByText('Factory reset')).toBeInTheDocument()
		expect(screen.getByText('Secure wipe')).toBeInTheDocument()
		expect(screen.getByText('DoD 5220.22-M compliant')).toBeInTheDocument()
		expect(screen.getByText('Certified wipe')).toBeInTheDocument()
		expect(screen.getByText('With destruction certificate')).toBeInTheDocument()
	})

	it('should handle singular device count', () => {
		render(<DataWipeRequest deviceCount={1} onWipeOptionSelected={mockOnWipeOptionSelected} selectedOption={null} />)

		expect(screen.getByText(/Choose the level of data security for wiping 1 device/)).toBeInTheDocument()
	})

	it('should select wipe option', () => {
		render(<DataWipeRequest deviceCount={2} onWipeOptionSelected={mockOnWipeOptionSelected} selectedOption={null} />)

		const secureWipeButton = screen.getByText('Secure wipe').closest('button')
		expect(secureWipeButton).toBeInTheDocument()

		fireEvent.click(secureWipeButton!)

		expect(mockOnWipeOptionSelected).toHaveBeenCalledWith('secure_wipe')
	})

	it('should highlight selected option', () => {
		render(
			<DataWipeRequest
				deviceCount={2}
				onWipeOptionSelected={mockOnWipeOptionSelected}
				selectedOption="certified_wipe"
			/>,
		)

		const certifiedWipeButton = screen.getByText('Certified wipe').closest('button')
		expect(certifiedWipeButton).toHaveClass('border-primary')

		// Should show expanded details
		expect(screen.getByText('DoD 5220.22-M secure wipe included')).toBeInTheDocument()
		expect(screen.getByText('Certificate of data destruction provided')).toBeInTheDocument()
	})

	it('should show recommended badge for secure wipe', () => {
		render(<DataWipeRequest deviceCount={2} onWipeOptionSelected={mockOnWipeOptionSelected} selectedOption={null} />)

		expect(screen.getByText('Recommended')).toBeInTheDocument()
	})

	it('should show confirmation when option is selected', () => {
		render(
			<DataWipeRequest
				deviceCount={2}
				onWipeOptionSelected={mockOnWipeOptionSelected}
				selectedOption="standard_wipe"
			/>,
		)

		expect(screen.getByText('Data wipe will be tracked')).toBeInTheDocument()
		expect(screen.getByText(/Wipe status and completion will be recorded/)).toBeInTheDocument()
	})

	it('should always show security note', () => {
		render(<DataWipeRequest deviceCount={2} onWipeOptionSelected={mockOnWipeOptionSelected} selectedOption={null} />)

		expect(screen.getByText('Important Security Note')).toBeInTheDocument()
		expect(screen.getByText(/Data wipes will be performed after devices are returned/)).toBeInTheDocument()
	})

	it('should show all details for standard wipe', () => {
		render(
			<DataWipeRequest
				deviceCount={2}
				onWipeOptionSelected={mockOnWipeOptionSelected}
				selectedOption="standard_wipe"
			/>,
		)

		expect(screen.getByText('Factory reset to default settings')).toBeInTheDocument()
		expect(screen.getByText('All user data removed')).toBeInTheDocument()
		expect(screen.getByText('Operating system reinstalled')).toBeInTheDocument()
		expect(screen.getByText('Suitable for most use cases')).toBeInTheDocument()
	})

	it('should show all details for secure wipe', () => {
		render(
			<DataWipeRequest deviceCount={2} onWipeOptionSelected={mockOnWipeOptionSelected} selectedOption="secure_wipe" />,
		)

		expect(screen.getByText('DoD 5220.22-M standard compliant')).toBeInTheDocument()
		expect(screen.getByText('Multi-pass data overwriting')).toBeInTheDocument()
		expect(screen.getByText('Military-grade secure erasure')).toBeInTheDocument()
		expect(screen.getByText('Meets compliance requirements')).toBeInTheDocument()
	})

	it('should show all details for certified wipe', () => {
		render(
			<DataWipeRequest
				deviceCount={2}
				onWipeOptionSelected={mockOnWipeOptionSelected}
				selectedOption="certified_wipe"
			/>,
		)

		expect(screen.getByText('DoD 5220.22-M secure wipe included')).toBeInTheDocument()
		expect(screen.getByText('Certificate of data destruction provided')).toBeInTheDocument()
		expect(screen.getByText('Audit trail documentation')).toBeInTheDocument()
		expect(screen.getByText('Required for regulated industries')).toBeInTheDocument()
	})
})
