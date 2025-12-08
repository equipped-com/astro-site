/**
 * @REQ-PPL-ONBOARD-002: Enter employee information
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { EmployeeInfo } from '@/types'
import OnboardingStep1 from './OnboardingStep1'

describe('OnboardingStep1', () => {
	const mockOnContinue = vi.fn()

	const initialData: EmployeeInfo = {
		firstName: '',
		lastName: '',
		email: '',
		startDate: new Date(),
		role: '',
		department: '',
	}

	it('should render all required fields', () => {
		render(<OnboardingStep1 initialData={initialData} onContinue={mockOnContinue} />)

		expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/department/i)).toBeInTheDocument()
	})

	it('should validate required fields before continuing', () => {
		render(<OnboardingStep1 initialData={initialData} onContinue={mockOnContinue} />)

		const continueButton = screen.getByRole('button', { name: /continue/i })
		fireEvent.click(continueButton)

		// Should show validation errors
		expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
		expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
		expect(screen.getByText(/email is required/i)).toBeInTheDocument()
		expect(screen.getByText(/role is required/i)).toBeInTheDocument()
		expect(screen.getByText(/department is required/i)).toBeInTheDocument()

		// Should not call onContinue
		expect(mockOnContinue).not.toHaveBeenCalled()
	})

	it('should validate email format', () => {
		render(<OnboardingStep1 initialData={initialData} onContinue={mockOnContinue} />)

		fireEvent.change(screen.getByLabelText(/email/i), {
			target: { value: 'invalid-email' },
		})

		const continueButton = screen.getByRole('button', { name: /continue/i })
		fireEvent.click(continueButton)

		expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
		expect(mockOnContinue).not.toHaveBeenCalled()
	})

	it('should call onContinue with valid data', () => {
		render(<OnboardingStep1 initialData={initialData} onContinue={mockOnContinue} />)

		fireEvent.change(screen.getByLabelText(/first name/i), {
			target: { value: 'Alice' },
		})
		fireEvent.change(screen.getByLabelText(/last name/i), {
			target: { value: 'Smith' },
		})
		fireEvent.change(screen.getByLabelText(/email/i), {
			target: { value: 'alice@company.com' },
		})
		fireEvent.change(screen.getByLabelText(/role/i), {
			target: { value: 'Software Engineer' },
		})
		fireEvent.change(screen.getByLabelText(/department/i), {
			target: { value: 'Engineering' },
		})

		const continueButton = screen.getByRole('button', { name: /continue/i })
		fireEvent.click(continueButton)

		expect(mockOnContinue).toHaveBeenCalledWith(
			expect.objectContaining({
				firstName: 'Alice',
				lastName: 'Smith',
				email: 'alice@company.com',
				role: 'Software Engineer',
				department: 'Engineering',
			}),
		)
	})

	it('should clear errors when user starts typing', () => {
		render(<OnboardingStep1 initialData={initialData} onContinue={mockOnContinue} />)

		// Trigger validation
		const continueButton = screen.getByRole('button', { name: /continue/i })
		fireEvent.click(continueButton)

		expect(screen.getByText(/first name is required/i)).toBeInTheDocument()

		// Start typing
		fireEvent.change(screen.getByLabelText(/first name/i), {
			target: { value: 'Alice' },
		})

		// Error should be cleared
		expect(screen.queryByText(/first name is required/i)).not.toBeInTheDocument()
	})

	it('should preserve initial data when provided', () => {
		const existingData: EmployeeInfo = {
			firstName: 'Bob',
			lastName: 'Jones',
			email: 'bob@company.com',
			startDate: new Date('2025-01-15'),
			role: 'Designer',
			department: 'Design',
			title: 'Senior Designer',
			phone: '5551234567',
		}

		render(<OnboardingStep1 initialData={existingData} onContinue={mockOnContinue} />)

		expect(screen.getByLabelText(/first name/i)).toHaveValue('Bob')
		expect(screen.getByLabelText(/last name/i)).toHaveValue('Jones')
		expect(screen.getByLabelText(/email/i)).toHaveValue('bob@company.com')
		expect(screen.getByLabelText(/role/i)).toHaveValue('Designer')
		expect(screen.getByLabelText(/department/i)).toHaveValue('Design')
		expect(screen.getByLabelText(/job title/i)).toHaveValue('Senior Designer')
		expect(screen.getByLabelText(/phone/i)).toHaveValue('5551234567')
	})
})
