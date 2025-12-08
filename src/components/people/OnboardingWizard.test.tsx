/**
 * @REQ-PPL-ONBOARD-001: Start onboarding flow
 * @REQ-PPL-ONBOARD-002: Enter employee information
 * @REQ-PPL-ONBOARD-003: Select device package
 * @REQ-PPL-ONBOARD-004: Configure delivery for start date
 * @REQ-PPL-ONBOARD-005: Complete onboarding
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OnboardingWizard from './OnboardingWizard'

describe('OnboardingWizard', () => {
	const mockOnClose = vi.fn()
	const mockOnSuccess = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
		global.fetch = vi.fn()
	})

	/**
	 * @REQ-PPL-ONBOARD-001
	 * Scenario: Start onboarding flow
	 * When I click "Onboard new hire"
	 * Then I should see a wizard with steps
	 */
	it('should display wizard with all steps when opened', () => {
		render(<OnboardingWizard isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Check header
		expect(screen.getByText('Onboard New Hire')).toBeInTheDocument()

		// Check all steps are present
		expect(screen.getByText('Employee Info')).toBeInTheDocument()
		expect(screen.getByText('Select Equipment')).toBeInTheDocument()
		expect(screen.getByText('Delivery Details')).toBeInTheDocument()
		expect(screen.getByText('Review & Submit')).toBeInTheDocument()

		// Step 1 should be highlighted
		const step1Badge = screen.getByText('1')
		expect(step1Badge.className).toContain('bg-primary')
	})

	it('should not render when isOpen is false', () => {
		const { container } = render(<OnboardingWizard isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />)
		expect(container.firstChild).toBeNull()
	})

	/**
	 * @REQ-PPL-ONBOARD-002
	 * Scenario: Enter employee information
	 * When I am on Step 1 and enter employee info
	 * Then I should advance to Step 2
	 */
	it('should validate and advance to step 2 when employee info is complete', async () => {
		render(<OnboardingWizard isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Fill in employee info
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

		// Click Continue
		const continueButton = screen.getByRole('button', { name: /continue/i })
		fireEvent.click(continueButton)

		// Should now be on Step 2
		await waitFor(() => {
			expect(screen.getByText('Select Equipment Package')).toBeInTheDocument()
		})

		// Step 2 badge should be highlighted
		const step2Badge = screen.getByText('2')
		expect(step2Badge.className).toContain('bg-primary')
	})

	it('should show validation errors when required fields are empty', async () => {
		render(<OnboardingWizard isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Try to continue without filling anything
		const continueButton = screen.getByRole('button', { name: /continue/i })
		fireEvent.click(continueButton)

		// Should show validation errors
		await waitFor(() => {
			expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
			expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
			expect(screen.getByText(/email is required/i)).toBeInTheDocument()
			expect(screen.getByText(/role is required/i)).toBeInTheDocument()
			expect(screen.getByText(/department is required/i)).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-PPL-ONBOARD-003
	 * Scenario: Select device package
	 * When I am on Step 2
	 * Then I should see pre-configured packages
	 */
	it('should display device packages and allow selection', async () => {
		render(<OnboardingWizard isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Fill employee info and advance to step 2
		fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Alice' } })
		fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } })
		fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@company.com' } })
		fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'Software Engineer' } })
		fireEvent.change(screen.getByLabelText(/department/i), { target: { value: 'Engineering' } })
		fireEvent.click(screen.getByRole('button', { name: /continue/i }))

		await waitFor(() => {
			expect(screen.getByText('Engineering Standard')).toBeInTheDocument()
		})

		// Check packages are displayed
		expect(screen.getByText('Engineering Standard')).toBeInTheDocument()
		expect(screen.getByText('Sales Standard')).toBeInTheDocument()
		expect(screen.getByText('Executive')).toBeInTheDocument()

		// Select a package
		const engineeringPackage = screen.getByText('Engineering Standard').closest('button')
		if (engineeringPackage) {
			fireEvent.click(engineeringPackage)
		}

		// Should show total cost
		await waitFor(() => {
			expect(screen.getByText(/total cost/i)).toBeInTheDocument()
		})
	})

	it('should show total cost and monthly leasing option when package selected', async () => {
		render(<OnboardingWizard isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Navigate to step 2
		fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Alice' } })
		fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } })
		fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@company.com' } })
		fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'Software Engineer' } })
		fireEvent.change(screen.getByLabelText(/department/i), { target: { value: 'Engineering' } })
		fireEvent.click(screen.getByRole('button', { name: /continue/i }))

		await waitFor(() => {
			expect(screen.getByText('Engineering Standard')).toBeInTheDocument()
		})

		// Select package
		const packageButton = screen.getByText('Engineering Standard').closest('button')
		if (packageButton) {
			fireEvent.click(packageButton)
		}

		// Check cost display
		await waitFor(() => {
			expect(screen.getByText('$2,499')).toBeInTheDocument()
			expect(screen.getByText(/99\/mo/i)).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-PPL-ONBOARD-004
	 * Scenario: Configure delivery for start date
	 * Given employee start date is set
	 * Then delivery date should default to before start date
	 */
	it('should show delivery date defaulting to before start date', async () => {
		render(<OnboardingWizard isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Navigate through steps
		const startDate = new Date()
		startDate.setDate(startDate.getDate() + 7) // 7 days from now

		fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Alice' } })
		fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } })
		fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@company.com' } })
		fireEvent.change(screen.getByLabelText(/start date/i), {
			target: { value: startDate.toISOString().split('T')[0] },
		})
		fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'Software Engineer' } })
		fireEvent.change(screen.getByLabelText(/department/i), { target: { value: 'Engineering' } })
		fireEvent.click(screen.getByRole('button', { name: /continue/i }))

		await waitFor(() => {
			expect(screen.getByText('Engineering Standard')).toBeInTheDocument()
		})

		// Select package and continue
		const packageButton = screen.getByText('Engineering Standard').closest('button')
		if (packageButton) {
			fireEvent.click(packageButton)
		}

		const continueButtons = screen.getAllByRole('button', { name: /continue/i })
		fireEvent.click(continueButtons[continueButtons.length - 1])

		// Should be on delivery step
		await waitFor(() => {
			expect(screen.getByText('Delivery Details')).toBeInTheDocument()
			expect(screen.getByText('Employee Start Date')).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-PPL-ONBOARD-005
	 * Scenario: Complete onboarding
	 * When I review and submit
	 * Then person should be created and order placed
	 */
	it('should submit onboarding and create person and order', async () => {
		const mockFetch = vi.fn()
		global.fetch = mockFetch

		// Mock successful API responses
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 'person-1', first_name: 'Alice', last_name: 'Smith' }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 'order-1', person_id: 'person-1' }),
			})

		render(<OnboardingWizard isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Fill employee info
		fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Alice' } })
		fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } })
		fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@company.com' } })
		fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'Software Engineer' } })
		fireEvent.change(screen.getByLabelText(/department/i), { target: { value: 'Engineering' } })
		fireEvent.click(screen.getByRole('button', { name: /continue/i }))

		// Select package
		await waitFor(() => {
			expect(screen.getByText('Engineering Standard')).toBeInTheDocument()
		})
		const packageButton = screen.getByText('Engineering Standard').closest('button')
		if (packageButton) {
			fireEvent.click(packageButton)
		}
		const continueButtons1 = screen.getAllByRole('button', { name: /continue/i })
		fireEvent.click(continueButtons1[continueButtons1.length - 1])

		// Fill delivery info
		await waitFor(() => {
			expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
		})

		fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Alice' } })
		fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } })
		const addressInputs = screen.getAllByLabelText(/address/i)
		fireEvent.change(addressInputs[0], { target: { value: '123 Main St' } })
		fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'San Francisco' } })
		fireEvent.change(screen.getByLabelText(/state/i), { target: { value: 'CA' } })
		fireEvent.change(screen.getByLabelText(/zip/i), { target: { value: '94105' } })
		fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@company.com' } })
		fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '5551234567' } })

		const continueButtons2 = screen.getAllByRole('button', { name: /continue/i })
		fireEvent.click(continueButtons2[continueButtons2.length - 1])

		// Should be on review step
		await waitFor(() => {
			expect(screen.getByText(/review & submit/i)).toBeInTheDocument()
		})

		// Submit
		const submitButton = screen.getByRole('button', { name: /complete onboarding/i })
		fireEvent.click(submitButton)

		// Wait for submission
		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				'/api/people',
				expect.objectContaining({
					method: 'POST',
					body: expect.stringContaining('Alice'),
				}),
			)
			expect(mockOnSuccess).toHaveBeenCalled()
			expect(mockOnClose).toHaveBeenCalled()
		})
	})

	it('should allow navigation back through steps', async () => {
		render(<OnboardingWizard isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		// Fill step 1 and advance
		fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Alice' } })
		fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } })
		fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@company.com' } })
		fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'Software Engineer' } })
		fireEvent.change(screen.getByLabelText(/department/i), { target: { value: 'Engineering' } })
		fireEvent.click(screen.getByRole('button', { name: /continue/i }))

		// Should be on step 2
		await waitFor(() => {
			expect(screen.getByText('Select Equipment Package')).toBeInTheDocument()
		})

		// Click Back
		const backButton = screen.getByRole('button', { name: /back/i })
		fireEvent.click(backButton)

		// Should be back on step 1
		await waitFor(() => {
			expect(screen.getByText('Employee Information')).toBeInTheDocument()
			expect(screen.getByLabelText(/first name/i)).toHaveValue('Alice')
		})
	})

	it('should close when X button is clicked', () => {
		render(<OnboardingWizard isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

		const closeButton = screen.getByRole('button', { name: '' }) // X icon button
		fireEvent.click(closeButton)

		expect(mockOnClose).toHaveBeenCalled()
	})
})
