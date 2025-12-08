/**
 * Address Form - REGRESSION TESTS
 *
 * Tests for bugs discovered and fixed in address validation.
 * Each test prevents a known bug from reoccurring.
 *
 * @see tasks/testing/regression-tests.md
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AddressForm from './AddressForm'

vi.mock('sonner', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}))

describe('AddressForm [REGRESSION TESTS]', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * REGRESSION TEST
	 * Issue: ADDR-001 - PO Box addresses caused shipping failures
	 * Description: Form allowed PO Box addresses which shipping carriers reject
	 * Fix: Added validation to reject addresses containing "PO Box", "P.O. Box", etc.
	 * Verification: PO Box addresses show validation error
	 */
	it('should reject PO Box addresses', async () => {
		render(<AddressForm onSubmit={vi.fn()} />)

		const address1 = screen.getByLabelText('Address Line 1')
		const submitButton = screen.getByRole('button', { name: /continue/i })

		// Test various PO Box formats
		const poBoxFormats = ['PO Box 123', 'P.O. Box 456', 'P.O.Box 789', 'Post Office Box 321']

		for (const format of poBoxFormats) {
			fireEvent.change(address1, { target: { value: format } })
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(screen.getByText(/PO Box addresses are not allowed/i)).toBeInTheDocument()
			})
		}
	})

	/**
	 * REGRESSION TEST
	 * Issue: ADDR-002 - ZIP+4 format rejected as invalid
	 * Description: Form validation rejected valid ZIP+4 format (12345-6789)
	 * Fix: Updated regex to accept both 5-digit and ZIP+4 formats
	 * Verification: ZIP+4 format passes validation
	 */
	it('should accept ZIP+4 format (12345-6789)', async () => {
		const onSubmit = vi.fn()
		render(<AddressForm onSubmit={onSubmit} />)

		fireEvent.change(screen.getByLabelText('Address Line 1'), {
			target: { value: '123 Main St' },
		})
		fireEvent.change(screen.getByLabelText('City'), {
			target: { value: 'San Francisco' },
		})
		fireEvent.change(screen.getByLabelText('State'), {
			target: { value: 'CA' },
		})
		fireEvent.change(screen.getByLabelText('ZIP Code'), {
			target: { value: '94102-1234' },
		})

		const submitButton = screen.getByRole('button', { name: /continue/i })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalled()
		})

		// Should not show ZIP validation error
		expect(screen.queryByText(/invalid zip code/i)).not.toBeInTheDocument()
	})

	/**
	 * REGRESSION TEST
	 * Issue: ADDR-003 - Leading/trailing whitespace caused address mismatch
	 * Description: Addresses with extra spaces failed verification checks
	 * Fix: Trim all address fields before validation and submission
	 * Verification: Whitespace automatically stripped
	 */
	it('should trim whitespace from all address fields', async () => {
		const onSubmit = vi.fn()
		render(<AddressForm onSubmit={onSubmit} />)

		fireEvent.change(screen.getByLabelText('Address Line 1'), {
			target: { value: '  123 Main St  ' },
		})
		fireEvent.change(screen.getByLabelText('City'), {
			target: { value: '  San Francisco  ' },
		})
		fireEvent.change(screen.getByLabelText('State'), {
			target: { value: '  CA  ' },
		})
		fireEvent.change(screen.getByLabelText('ZIP Code'), {
			target: { value: '  94102  ' },
		})

		const submitButton = screen.getByRole('button', { name: /continue/i })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalled()
		})

		const submittedData = onSubmit.mock.calls[0][0]
		expect(submittedData.address1).toBe('123 Main St')
		expect(submittedData.city).toBe('San Francisco')
		expect(submittedData.state).toBe('CA')
		expect(submittedData.zip).toBe('94102')
	})

	/**
	 * REGRESSION TEST
	 * Issue: ADDR-004 - State dropdown allowed invalid selections
	 * Description: Keyboard input in state dropdown created invalid state codes
	 * Fix: Restrict state field to valid 2-letter codes only
	 * Verification: Only valid state codes accepted
	 */
	it('should only accept valid 2-letter state codes', async () => {
		render(<AddressForm onSubmit={vi.fn()} />)

		const stateField = screen.getByLabelText('State')
		const submitButton = screen.getByRole('button', { name: /continue/i })

		// Try invalid state codes
		fireEvent.change(stateField, { target: { value: 'California' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(screen.getByText(/invalid state/i)).toBeInTheDocument()
		})

		// Try valid state code
		fireEvent.change(stateField, { target: { value: 'CA' } })

		await waitFor(() => {
			expect(screen.queryByText(/invalid state/i)).not.toBeInTheDocument()
		})
	})

	/**
	 * REGRESSION TEST
	 * Issue: ADDR-005 - Apartment/Suite numbers lost on submission
	 * Description: Address Line 2 (optional) was dropped if empty string
	 * Fix: Preserve empty string vs undefined, allow optional Line 2
	 * Verification: Address Line 2 correctly included when provided
	 */
	it('should preserve Address Line 2 when provided', async () => {
		const onSubmit = vi.fn()
		render(<AddressForm onSubmit={onSubmit} />)

		fireEvent.change(screen.getByLabelText('Address Line 1'), {
			target: { value: '123 Main St' },
		})
		fireEvent.change(screen.getByLabelText('Address Line 2'), {
			target: { value: 'Apt 4B' },
		})
		fireEvent.change(screen.getByLabelText('City'), {
			target: { value: 'San Francisco' },
		})
		fireEvent.change(screen.getByLabelText('State'), {
			target: { value: 'CA' },
		})
		fireEvent.change(screen.getByLabelText('ZIP Code'), {
			target: { value: '94102' },
		})

		const submitButton = screen.getByRole('button', { name: /continue/i })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalled()
		})

		const submittedData = onSubmit.mock.calls[0][0]
		expect(submittedData.address2).toBe('Apt 4B')
	})

	/**
	 * REGRESSION TEST
	 * Issue: ADDR-006 - International characters in names rejected
	 * Description: Names with accents (José, Müller) failed validation
	 * Fix: Updated name validation to allow Unicode letters
	 * Verification: International characters accepted
	 */
	it('should accept international characters in name fields', async () => {
		const onSubmit = vi.fn()
		render(<AddressForm onSubmit={onSubmit} />)

		// Names with international characters
		fireEvent.change(screen.getByLabelText('First Name'), {
			target: { value: 'José' },
		})
		fireEvent.change(screen.getByLabelText('Last Name'), {
			target: { value: 'Müller-García' },
		})
		fireEvent.change(screen.getByLabelText('Address Line 1'), {
			target: { value: '123 Main St' },
		})
		fireEvent.change(screen.getByLabelText('City'), {
			target: { value: 'San Francisco' },
		})
		fireEvent.change(screen.getByLabelText('State'), {
			target: { value: 'CA' },
		})
		fireEvent.change(screen.getByLabelText('ZIP Code'), {
			target: { value: '94102' },
		})

		const submitButton = screen.getByRole('button', { name: /continue/i })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalled()
		})

		const submittedData = onSubmit.mock.calls[0][0]
		expect(submittedData.firstName).toBe('José')
		expect(submittedData.lastName).toBe('Müller-García')
	})

	/**
	 * REGRESSION TEST
	 * Issue: ADDR-007 - Form submission with Enter key skipped validation
	 * Description: Pressing Enter in any field submitted form without validation
	 * Fix: Ensure validation runs on both button click and Enter key
	 * Verification: Enter key triggers same validation as button click
	 */
	it('should validate form when submitted via Enter key', async () => {
		render(<AddressForm onSubmit={vi.fn()} />)

		const address1 = screen.getByLabelText('Address Line 1')

		// Leave fields empty and press Enter
		fireEvent.keyDown(address1, { key: 'Enter', code: 'Enter' })

		// Should show validation errors
		await waitFor(() => {
			expect(screen.getByText(/address is required/i)).toBeInTheDocument()
		})
	})
})
