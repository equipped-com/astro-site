/**
 * @REQ-PPL-ONBOARD-004: Configure delivery for start date
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import OnboardingStep3 from './OnboardingStep3'

describe('OnboardingStep3', () => {
	const mockOnContinue = vi.fn()
	const mockOnBack = vi.fn()

	const startDate = new Date('2025-12-15')

	it('should display start date', () => {
		render(<OnboardingStep3 startDate={startDate} onContinue={mockOnContinue} onBack={mockOnBack} />)

		expect(screen.getByText(/Employee Start Date/i)).toBeInTheDocument()
		expect(screen.getByText(/Monday, December 15, 2025/i)).toBeInTheDocument()
	})

	it('should default delivery date to before start date', () => {
		render(<OnboardingStep3 startDate={startDate} onContinue={mockOnContinue} onBack={mockOnBack} />)

		const deliveryDateInput = screen.getByLabelText(/delivery date/i) as HTMLInputElement
		const deliveryDate = new Date(deliveryDateInput.value)

		// Delivery should be before start date
		expect(deliveryDate.getTime()).toBeLessThan(startDate.getTime())
	})

	it('should show warning when delivery is after start date', () => {
		render(<OnboardingStep3 startDate={startDate} onContinue={mockOnContinue} onBack={mockOnBack} />)

		// Set delivery date to after start date
		const laterDate = new Date('2025-12-16')
		const deliveryDateInput = screen.getByLabelText(/delivery date/i)
		fireEvent.change(deliveryDateInput, {
			target: { value: laterDate.toISOString().split('T')[0] },
		})

		// Should show warning
		expect(screen.getByText(/Delivery after start date/i)).toBeInTheDocument()
		expect(screen.getByText(/may not arrive in time/i)).toBeInTheDocument()
	})

	it('should render shipping address form', () => {
		render(<OnboardingStep3 startDate={startDate} onContinue={mockOnContinue} onBack={mockOnBack} />)

		expect(screen.getByText(/Shipping Address/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/^address \*/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/zip/i)).toBeInTheDocument()
	})

	it('should validate address before continuing', () => {
		render(<OnboardingStep3 startDate={startDate} onContinue={mockOnContinue} onBack={mockOnBack} />)

		const continueButton = screen.getByRole('button', { name: /continue/i })
		fireEvent.click(continueButton)

		// Should not call onContinue without valid address
		expect(mockOnContinue).not.toHaveBeenCalled()
	})

	it('should call onContinue with delivery data when valid', () => {
		render(<OnboardingStep3 startDate={startDate} onContinue={mockOnContinue} onBack={mockOnBack} />)

		// Fill address (all required fields)
		fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Alice' } })
		fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } })
		fireEvent.change(screen.getByLabelText(/^address \*/i), { target: { value: '123 Main St' } })
		fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'San Francisco' } })
		fireEvent.change(screen.getByLabelText(/state/i), { target: { value: 'CA' } })
		fireEvent.change(screen.getByLabelText(/zip/i), { target: { value: '94105' } })
		fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'US' } })
		fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@company.com' } })
		fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '5551234567' } })

		const continueButton = screen.getByRole('button', { name: /continue/i })
		fireEvent.click(continueButton)

		expect(mockOnContinue).toHaveBeenCalledWith(
			expect.objectContaining({
				startDate: expect.any(Date),
				deliveryDate: expect.any(Date),
				shippingAddress: expect.objectContaining({
					addressLine1: '123 Main St',
					city: 'San Francisco',
					state: 'CA',
					zipCode: '94105',
					country: 'US',
				}),
			}),
		)
	})

	it('should call onBack when back button clicked', () => {
		render(<OnboardingStep3 startDate={startDate} onContinue={mockOnContinue} onBack={mockOnBack} />)

		const backButton = screen.getByRole('button', { name: /back/i })
		fireEvent.click(backButton)

		expect(mockOnBack).toHaveBeenCalled()
	})

	it('should show recommended delivery timing', () => {
		render(<OnboardingStep3 startDate={startDate} onContinue={mockOnContinue} onBack={mockOnBack} />)

		expect(screen.getByText(/2-3 business days before start date/i)).toBeInTheDocument()
	})
})
