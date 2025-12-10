/**
 * @REQ-PPL-ONBOARD-003: Select device package
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import OnboardingStep2 from './OnboardingStep2'

describe('OnboardingStep2', () => {
	const mockOnContinue = vi.fn()
	const mockOnBack = vi.fn()

	it('should render all device packages', () => {
		render(<OnboardingStep2 onContinue={mockOnContinue} onBack={mockOnBack} />)

		expect(screen.getByText('Engineering Standard')).toBeInTheDocument()
		expect(screen.getByText('Sales Standard')).toBeInTheDocument()
		expect(screen.getByText('Executive')).toBeInTheDocument()
		expect(screen.getByText('Design Standard')).toBeInTheDocument()
	})

	it('should show package contents and pricing', () => {
		render(<OnboardingStep2 onContinue={mockOnContinue} onBack={mockOnBack} />)

		// Engineering Standard package
		expect(screen.getByText(/MacBook Pro 14"/i)).toBeInTheDocument()
		expect(screen.getByText(/Magic Keyboard/i)).toBeInTheDocument()
		expect(screen.getByText(/Magic Mouse/i)).toBeInTheDocument()
		expect(screen.getByText('$2,499')).toBeInTheDocument()
	})

	it('should select a package when clicked', () => {
		render(<OnboardingStep2 onContinue={mockOnContinue} onBack={mockOnBack} />)

		const packageButton = screen.getByText('Engineering Standard').closest('button')
		expect(packageButton).not.toBeNull()

		if (packageButton) {
			fireEvent.click(packageButton)
		}

		// Should show cost summary
		expect(screen.getByText(/Total Cost/i)).toBeInTheDocument()
	})

	it('should disable continue button when no package selected', () => {
		render(<OnboardingStep2 onContinue={mockOnContinue} onBack={mockOnBack} />)

		const continueButton = screen.getByRole('button', { name: /continue/i })
		expect(continueButton).toBeDisabled()
	})

	it('should enable continue button when package selected', () => {
		render(<OnboardingStep2 onContinue={mockOnContinue} onBack={mockOnBack} />)

		const packageButton = screen.getByText('Engineering Standard').closest('button')
		if (packageButton) {
			fireEvent.click(packageButton)
		}

		const continueButton = screen.getByRole('button', { name: /continue/i })
		expect(continueButton).toBeEnabled()
	})

	it('should call onContinue with selected package', () => {
		render(<OnboardingStep2 onContinue={mockOnContinue} onBack={mockOnBack} />)

		// Select package
		const packageButton = screen.getByText('Sales Standard').closest('button')
		if (packageButton) {
			fireEvent.click(packageButton)
		}

		// Click continue
		const continueButton = screen.getByRole('button', { name: /continue/i })
		fireEvent.click(continueButton)

		expect(mockOnContinue).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'sales-standard',
				name: 'Sales Standard',
				totalCost: 1899,
			}),
		)
	})

	it('should call onBack when back button clicked', () => {
		render(<OnboardingStep2 onContinue={mockOnContinue} onBack={mockOnBack} />)

		const backButton = screen.getByRole('button', { name: /back/i })
		fireEvent.click(backButton)

		expect(mockOnBack).toHaveBeenCalled()
	})

	it('should show leasing information for packages', () => {
		render(<OnboardingStep2 onContinue={mockOnContinue} onBack={mockOnBack} />)

		expect(screen.getByText(/99\/mo with leasing/i)).toBeInTheDocument()
		expect(screen.getByText(/79\/mo with leasing/i)).toBeInTheDocument()
	})

	it('should preserve initial package selection', () => {
		const initialPackage = {
			id: 'executive',
			name: 'Executive',
			description: 'Premium setup for leadership and executive roles',
			devices: [
				{ name: 'MacBook Pro 16"', quantity: 1 },
				{ name: 'Studio Display', quantity: 1 },
			],
			totalCost: 3999,
			monthlyCost: 149,
			isLeasing: true,
		}

		render(<OnboardingStep2 initialPackage={initialPackage} onContinue={mockOnContinue} onBack={mockOnBack} />)

		// Should show cost summary for initial selection
		expect(screen.getByText(/Total Cost/i)).toBeInTheDocument()
		const prices = screen.getAllByText('$3,999')
		expect(prices.length).toBeGreaterThan(0)
	})
})
