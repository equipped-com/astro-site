import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { addBusinessDays } from '@/lib/delivery-dates'
import DeliveryStage from './DeliveryStage'

describe('DeliveryStage', () => {
	const mockOnContinue = vi.fn()
	const mockOnCartUpdate = vi.fn()

	// Helper to get expected dates
	const baseDate = new Date('2024-05-13') // Monday for consistent testing
	const standardDate = addBusinessDays(baseDate, 5) // Friday May 18
	const expressDate = addBusinessDays(baseDate, 3) // Wednesday May 17

	// Helper to safely click a button
	function clickButton(button: HTMLElement | null) {
		if (!button) throw new Error('Button not found')
		fireEvent.click(button)
	}

	beforeEach(() => {
		vi.clearAllMocks()
		// Mock Date to return consistent date for testing
		vi.setSystemTime(baseDate)
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	describe('Stage Header', () => {
		it('should display stage number and title', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			expect(screen.getByText('3')).toBeInTheDocument()
			expect(screen.getByText('Delivery')).toBeInTheDocument()
			expect(screen.getByText('When would you like to get your order?')).toBeInTheDocument()
		})
	})

	describe('@REQ-COM-DEL-001: Select standard delivery', () => {
		it('should show standard delivery option with "Free" cost', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			// Standard delivery is 5 business days from May 13 (Mon) = May 20 (Mon)
			expect(screen.getByText(/By.*May 20/i)).toBeInTheDocument()
			expect(screen.getByText('Standard Delivery')).toBeInTheDocument()
			expect(screen.getAllByText('Free').length).toBeGreaterThan(0)
		})

		it('should enable Continue button when standard is selected', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const standardOption = screen.getByText('Standard Delivery').closest('button')
			clickButton(standardOption)

			const continueButton = screen.getByRole('button', { name: /Continue/i })
			expect(continueButton).toBeEnabled()
		})

		it('should not change cart total for standard delivery', () => {
			render(<DeliveryStage onContinue={mockOnContinue} onCartUpdate={mockOnCartUpdate} cartSubtotal={1199} />)

			const standardOption = screen.getByText('Standard Delivery').closest('button')
			clickButton(standardOption)

			waitFor(() => {
				// Shipping should be 0, taxes calculated on subtotal only
				expect(mockOnCartUpdate).toHaveBeenCalledWith(0, expect.any(Number))
			})
		})

		it('should call onContinue with correct standard delivery data', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const standardOption = screen.getByText('Standard Delivery').closest('button')
			clickButton(standardOption)

			const continueButton = screen.getByRole('button', { name: /Continue/i })
			fireEvent.click(continueButton)

			expect(mockOnContinue).toHaveBeenCalledWith({
				speed: 'standard',
				estimatedDate: expect.any(Date),
				cost: 0,
				customDate: undefined,
			})
		})
	})

	describe('@REQ-COM-DEL-002: Select express delivery', () => {
		it('should show express delivery option with $9.00 cost', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			// Express delivery is 3 business days from May 13 (Mon) = May 16 (Thu)
			expect(screen.getByText(/By.*May 16/i)).toBeInTheDocument()
			expect(screen.getByText('Express Delivery')).toBeInTheDocument()
			expect(screen.getByText('$9.00')).toBeInTheDocument()
		})

		it('should enable Continue button when express is selected', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const expressOption = screen.getByText('Express Delivery').closest('button')
			clickButton(expressOption)

			const continueButton = screen.getByRole('button', { name: /Continue/i })
			expect(continueButton).toBeEnabled()
		})

		it('should increase cart total by $9.00 and recalculate taxes', () => {
			render(<DeliveryStage onContinue={mockOnContinue} onCartUpdate={mockOnCartUpdate} cartSubtotal={1199} />)

			const expressOption = screen.getByText('Express Delivery').closest('button')
			clickButton(expressOption)

			waitFor(() => {
				// Shipping should be 9, taxes calculated on subtotal + shipping
				expect(mockOnCartUpdate).toHaveBeenCalledWith(9, expect.any(Number))
			})
		})

		it('should call onContinue with correct express delivery data', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const expressOption = screen.getByText('Express Delivery').closest('button')
			clickButton(expressOption)

			const continueButton = screen.getByRole('button', { name: /Continue/i })
			fireEvent.click(continueButton)

			expect(mockOnContinue).toHaveBeenCalledWith({
				speed: 'express',
				estimatedDate: expect.any(Date),
				cost: 9.0,
				customDate: undefined,
			})
		})
	})

	describe('@REQ-COM-DEL-003: Select custom delivery date', () => {
		it('should show "Select a date" option', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			// getAllByText because there are 2 instances: one in the option label, one in the button
			expect(screen.getAllByText('Select a date').length).toBeGreaterThan(0)
		})

		it('should open calendar when "Select a date" is clicked', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const customOption = screen.getAllByText('Select a date')[0].closest('button')
			clickButton(customOption)

			// Calendar should be visible
			waitFor(() => {
				expect(screen.getByLabelText('Previous month')).toBeInTheDocument()
				expect(screen.getByLabelText('Next month')).toBeInTheDocument()
			})
		})

		it('should disable Continue until a date is selected', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const customOption = screen.getAllByText('Select a date')[0].closest('button')
			clickButton(customOption)

			const continueButton = screen.getByRole('button', { name: /Continue/i })
			expect(continueButton).toBeDisabled()
		})

		it('should enable Continue after selecting a date', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const customOption = screen.getAllByText('Select a date')[0].closest('button')
			clickButton(customOption)

			// Click on May 30 (available date)
			waitFor(() => {
				const dateButton = screen.getByText('30')
				fireEvent.click(dateButton)

				const continueButton = screen.getByRole('button', { name: /Continue/i })
				expect(continueButton).toBeEnabled()
			})
		})

		it('should show helper text about selecting later dates', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const customOption = screen.getAllByText('Select a date')[0].closest('button')
			clickButton(customOption)

			waitFor(() => {
				expect(screen.getByText(/Select a later date that suits the person/i)).toBeInTheDocument()
			})
		})

		it('should update label when custom date is selected', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const customOption = screen.getAllByText('Select a date')[0].closest('button')
			clickButton(customOption)

			waitFor(() => {
				const dateButton = screen.getByText('30')
				fireEvent.click(dateButton)

				// Label should update
				expect(screen.getByText(/Select a date: May 30/i)).toBeInTheDocument()
			})
		})
	})

	describe('@REQ-COM-DEL-004: Real-time cart updates', () => {
		it('should calculate correct shipping and taxes for standard delivery', () => {
			render(<DeliveryStage onContinue={mockOnContinue} onCartUpdate={mockOnCartUpdate} cartSubtotal={1199} />)

			const standardOption = screen.getByText('Standard Delivery').closest('button')
			clickButton(standardOption)

			waitFor(() => {
				expect(mockOnCartUpdate).toHaveBeenCalledWith(
					0, // shipping
					95.92, // taxes (1199 * 0.08)
				)
			})
		})

		it('should calculate correct shipping and taxes for express delivery', () => {
			render(<DeliveryStage onContinue={mockOnContinue} onCartUpdate={mockOnCartUpdate} cartSubtotal={1199} />)

			const expressOption = screen.getByText('Express Delivery').closest('button')
			clickButton(expressOption)

			waitFor(() => {
				expect(mockOnCartUpdate).toHaveBeenCalledWith(
					9, // shipping
					96.64, // taxes ((1199 + 9) * 0.08)
				)
			})
		})

		it('should update cart in real-time when toggling between options', () => {
			render(<DeliveryStage onContinue={mockOnContinue} onCartUpdate={mockOnCartUpdate} cartSubtotal={1199} />)

			// Select standard
			const standardOption = screen.getByText('Standard Delivery').closest('button')
			clickButton(standardOption)

			waitFor(() => {
				expect(mockOnCartUpdate).toHaveBeenCalledWith(0, 95.92)
			})

			// Switch to express
			const expressOption = screen.getByText('Express Delivery').closest('button')
			clickButton(expressOption)

			waitFor(() => {
				expect(mockOnCartUpdate).toHaveBeenCalledWith(9, 96.64)
			})

			// Switch back to standard
			clickButton(standardOption)

			waitFor(() => {
				expect(mockOnCartUpdate).toHaveBeenLastCalledWith(0, 95.92)
			})
		})
	})

	describe('@REQ-COM-DEL-005: Calendar navigation', () => {
		it('should show current month when calendar opens', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const customOption = screen.getAllByText('Select a date')[0].closest('button')
			clickButton(customOption)

			waitFor(() => {
				expect(screen.getByText(/May 2024/i)).toBeInTheDocument()
			})
		})

		it('should navigate to next month', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const customOption = screen.getAllByText('Select a date')[0].closest('button')
			clickButton(customOption)

			waitFor(() => {
				const nextButton = screen.getByLabelText('Next month')
				fireEvent.click(nextButton)

				expect(screen.getByText(/June 2024/i)).toBeInTheDocument()
			})
		})

		it('should navigate to previous month', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const customOption = screen.getAllByText('Select a date')[0].closest('button')
			clickButton(customOption)

			waitFor(() => {
				const nextButton = screen.getByLabelText('Next month')
				fireEvent.click(nextButton) // Go to June

				const prevButton = screen.getByLabelText('Previous month')
				fireEvent.click(prevButton) // Back to May

				expect(screen.getByText(/May 2024/i)).toBeInTheDocument()
			})
		})

		it('should highlight selected date', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const customOption = screen.getAllByText('Select a date')[0].closest('button')
			clickButton(customOption)

			waitFor(() => {
				const dateButton = screen.getByText('30')
				fireEvent.click(dateButton)

				// Selected date should have primary background
				expect(dateButton).toHaveClass('bg-primary')
			})
		})

		it('should disable past dates', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const customOption = screen.getAllByText('Select a date')[0].closest('button')
			clickButton(customOption)

			waitFor(() => {
				// May 10 is before today (May 13)
				const pastDateButton = screen.getByText('10')
				expect(pastDateButton).toBeDisabled()
				expect(pastDateButton).toHaveClass('opacity-30')
			})
		})

		it('should disable dates before standard delivery', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const customOption = screen.getAllByText('Select a date')[0].closest('button')
			clickButton(customOption)

			waitFor(() => {
				// May 17 is before standard delivery (May 18)
				const earlyDateButton = screen.getByText('17')
				expect(earlyDateButton).toBeDisabled()
			})
		})
	})

	describe('Delivery Summary', () => {
		it('should show delivery summary when option is selected', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const standardOption = screen.getByText('Standard Delivery').closest('button')
			clickButton(standardOption)

			waitFor(() => {
				expect(screen.getByText(/Standard delivery selected/i)).toBeInTheDocument()
				expect(screen.getByText(/Shipping cost: Free/i)).toBeInTheDocument()
			})
		})

		it('should show correct shipping cost for express', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const expressOption = screen.getByText('Express Delivery').closest('button')
			clickButton(expressOption)

			waitFor(() => {
				expect(screen.getByText(/Express delivery selected/i)).toBeInTheDocument()
				expect(screen.getByText(/Shipping cost: \$9.00/i)).toBeInTheDocument()
			})
		})
	})

	describe('Initial State', () => {
		it('should disable Continue button when no option is selected', () => {
			render(<DeliveryStage onContinue={mockOnContinue} />)

			const continueButton = screen.getByRole('button', { name: /Continue/i })
			expect(continueButton).toBeDisabled()
		})

		it('should restore initial delivery selection if provided', () => {
			const initialDelivery = {
				speed: 'express' as const,
				estimatedDate: expressDate,
				cost: 9.0,
			}

			render(<DeliveryStage onContinue={mockOnContinue} initialDelivery={initialDelivery} />)

			waitFor(() => {
				const expressOption = screen.getByText('Express Delivery').closest('button')
				expect(expressOption).toHaveClass('border-primary')

				const continueButton = screen.getByRole('button', { name: /Continue/i })
				expect(continueButton).toBeEnabled()
			})
		})
	})
})
