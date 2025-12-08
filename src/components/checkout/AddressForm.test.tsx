import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AddressData } from '@/lib/address-validation'
import AddressForm from './AddressForm'

describe('AddressForm', () => {
	const validAddress: AddressData = {
		firstName: 'Nicole',
		lastName: 'Haley',
		addressLine1: '1 Infinite Loop',
		city: 'Cupertino',
		state: 'CA',
		zipCode: '95014',
		country: 'US',
		email: 'nicole@example.com',
		phone: '5551234567',
	}

	describe('Form Fields', () => {
		it('should render all required fields', () => {
			render(<AddressForm address={{}} onChange={vi.fn()} />)

			expect(screen.getByLabelText(/First name/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/^Address/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/City/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/State/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/Zip code/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/Country/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument()
		})

		it('should render optional addressLine2 field', () => {
			render(<AddressForm address={{}} onChange={vi.fn()} />)

			expect(screen.getByLabelText(/Apartment, suite/i)).toBeInTheDocument()
		})

		it('should render business address checkbox', () => {
			render(<AddressForm address={{}} onChange={vi.fn()} />)

			expect(screen.getByLabelText(/This is a business address/i)).toBeInTheDocument()
		})

		it('should mark required fields with asterisk', () => {
			const { container } = render(<AddressForm address={{}} onChange={vi.fn()} />)

			// Check for destructive colored asterisks (required indicators)
			const requiredLabels = container.querySelectorAll('label')
			const requiredCount = Array.from(requiredLabels).filter(label =>
				label.querySelector('.text-destructive'),
			).length

			expect(requiredCount).toBeGreaterThanOrEqual(8) // 8 required fields
		})
	})

	describe('Field Updates', () => {
		it('should call onChange when field values change', () => {
			const onChange = vi.fn()
			render(<AddressForm address={{}} onChange={onChange} />)

			const firstNameInput = screen.getByLabelText(/First name/i)
			fireEvent.change(firstNameInput, { target: { value: 'Nicole' } })

			expect(onChange).toHaveBeenCalledWith({
				firstName: 'Nicole',
			})
		})

		it('should update all fields independently', () => {
			const onChange = vi.fn()
			render(<AddressForm address={{}} onChange={onChange} />)

			fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Nicole' } })
			fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Haley' } })
			fireEvent.change(screen.getByLabelText(/^Address/i), { target: { value: '1 Infinite Loop' } })

			expect(onChange).toHaveBeenCalledTimes(3)
		})

		it('should handle checkbox for business address', () => {
			const onChange = vi.fn()
			render(<AddressForm address={{}} onChange={onChange} />)

			const checkbox = screen.getByLabelText(/This is a business address/i)
			fireEvent.click(checkbox)

			expect(onChange).toHaveBeenCalledWith({
				isBusinessAddress: true,
			})
		})
	})

	describe('Phone Number Formatting', () => {
		it('should format phone number on blur', () => {
			const onChange = vi.fn()
			render(<AddressForm address={{}} onChange={onChange} />)

			const phoneInput = screen.getByLabelText(/Phone/i)
			fireEvent.change(phoneInput, { target: { value: '5551234567' } })
			fireEvent.blur(phoneInput)

			// Should format to (555) 123-4567
			expect(onChange).toHaveBeenLastCalledWith({
				phone: '(555) 123-4567',
			})
		})

		it('should handle 11-digit numbers with leading 1', () => {
			const onChange = vi.fn()
			render(<AddressForm address={{}} onChange={onChange} />)

			const phoneInput = screen.getByLabelText(/Phone/i)
			fireEvent.change(phoneInput, { target: { value: '15551234567' } })
			fireEvent.blur(phoneInput)

			// Should strip leading 1 and format
			expect(onChange).toHaveBeenLastCalledWith({
				phone: '(555) 123-4567',
			})
		})
	})

	describe('Validation Errors', () => {
		it('should show validation errors after field is touched', () => {
			render(<AddressForm address={{}} onChange={vi.fn()} />)

			const firstNameInput = screen.getByLabelText(/First name/i)
			fireEvent.focus(firstNameInput)
			fireEvent.blur(firstNameInput)

			expect(screen.getByText(/First name is required/i)).toBeInTheDocument()
		})

		it('should not show errors before field is touched', () => {
			render(<AddressForm address={{}} onChange={vi.fn()} />)

			expect(screen.queryByText(/First name is required/i)).not.toBeInTheDocument()
		})

		it('should show errors when showValidation is true', () => {
			render(<AddressForm address={{}} onChange={vi.fn()} showValidation={true} />)

			// Should show errors for all empty required fields
			expect(screen.getByText(/First name is required/i)).toBeInTheDocument()
			expect(screen.getByText(/Last name is required/i)).toBeInTheDocument()
			expect(screen.getByText(/Address is required/i)).toBeInTheDocument()
		})

		it('should validate email format', () => {
			render(<AddressForm address={{ email: 'invalid-email' }} onChange={vi.fn()} />)

			const emailInput = screen.getByLabelText(/Email/i)
			fireEvent.blur(emailInput)

			expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument()
		})

		it('should validate phone format', () => {
			render(<AddressForm address={{ phone: '123' }} onChange={vi.fn()} />)

			const phoneInput = screen.getByLabelText(/Phone/i)
			fireEvent.blur(phoneInput)

			expect(screen.getByText(/Invalid phone number format/i)).toBeInTheDocument()
		})

		it('should validate zip code format', () => {
			render(<AddressForm address={{ zipCode: 'INVALID' }} onChange={vi.fn()} />)

			const zipInput = screen.getByLabelText(/Zip code/i)
			fireEvent.blur(zipInput)

			expect(screen.getByText(/Invalid zip code format/i)).toBeInTheDocument()
		})
	})

	describe('Validation Callback', () => {
		it('should call onValidate with errors when validation fails', () => {
			const onValidate = vi.fn()
			render(<AddressForm address={{}} onChange={vi.fn()} onValidate={onValidate} />)

			const firstNameInput = screen.getByLabelText(/First name/i)
			fireEvent.change(firstNameInput, { target: { value: '' } })

			expect(onValidate).toHaveBeenCalled()
			const errors = onValidate.mock.calls[0][0]
			expect(errors.length).toBeGreaterThan(0)
		})

		it('should call onValidate with empty array for valid address', () => {
			const onValidate = vi.fn()
			render(<AddressForm address={validAddress} onChange={vi.fn()} onValidate={onValidate} />)

			const firstNameInput = screen.getByLabelText(/First name/i)
			fireEvent.change(firstNameInput, { target: { value: 'Nicole' } })

			expect(onValidate).toHaveBeenCalled()
			const errors = onValidate.mock.calls[onValidate.mock.calls.length - 1][0]
			expect(errors).toHaveLength(0)
		})
	})

	describe('Pre-populated Data', () => {
		it('should display pre-populated address data', () => {
			render(<AddressForm address={validAddress} onChange={vi.fn()} />)

			expect(screen.getByDisplayValue('Nicole')).toBeInTheDocument()
			expect(screen.getByDisplayValue('Haley')).toBeInTheDocument()
			expect(screen.getByDisplayValue('1 Infinite Loop')).toBeInTheDocument()
			expect(screen.getByDisplayValue('Cupertino')).toBeInTheDocument()
			expect(screen.getByDisplayValue('CA')).toBeInTheDocument()
			expect(screen.getByDisplayValue('95014')).toBeInTheDocument()
			expect(screen.getByDisplayValue('nicole@example.com')).toBeInTheDocument()
			expect(screen.getByDisplayValue('5551234567')).toBeInTheDocument()
		})

		it('should display checked business address checkbox', () => {
			render(
				<AddressForm
					address={{ ...validAddress, isBusinessAddress: true }}
					onChange={vi.fn()}
				/>
			)

			const checkbox = screen.getByLabelText(/This is a business address/i) as HTMLInputElement
			expect(checkbox.checked).toBe(true)
		})
	})

	describe('Country Selection', () => {
		it('should default to US country', () => {
			render(<AddressForm address={{}} onChange={vi.fn()} />)

			const countrySelect = screen.getByLabelText(/Country/i) as HTMLSelectElement
			expect(countrySelect.value).toBe('US')
		})

		it('should allow changing country', () => {
			const onChange = vi.fn()
			render(<AddressForm address={{}} onChange={onChange} />)

			const countrySelect = screen.getByLabelText(/Country/i)
			fireEvent.change(countrySelect, { target: { value: 'CA' } })

			expect(onChange).toHaveBeenCalledWith({
				country: 'CA',
			})
		})
	})

	describe('State Input', () => {
		it('should limit state field to 2 characters', () => {
			render(<AddressForm address={{}} onChange={vi.fn()} />)

			const stateInput = screen.getByLabelText(/State/i) as HTMLInputElement
			expect(stateInput.maxLength).toBe(2)
		})
	})
})
