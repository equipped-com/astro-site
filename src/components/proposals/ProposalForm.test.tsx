/**
 * Tests for ProposalForm Component
 *
 * @REQ-PROP-001: Create proposal from cart
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProposalForm, type ProposalFormData } from './ProposalForm'

describe('ProposalForm Component', () => {
	const mockOnSubmit = vi.fn()
	const mockOnCancel = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
	})

	function renderForm(props = {}) {
		return render(<ProposalForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} {...props} />)
	}

	describe('@REQ-PROP-001 - Form fields', () => {
		it('should render all required form fields', () => {
			renderForm()

			expect(screen.getByLabelText(/Proposal Title/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/Recipient Name/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/Recipient Email/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/Expiration Date/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument()
		})

		it('should show required field indicators', () => {
			renderForm()

			// Check for asterisks indicating required fields
			const titleLabel = screen.getByText(/Proposal Title/)
			const nameLabel = screen.getByText(/Recipient Name/)
			const emailLabel = screen.getByText(/Recipient Email/)

			expect(titleLabel.closest('label')).toHaveTextContent('*')
			expect(nameLabel.closest('label')).toHaveTextContent('*')
			expect(emailLabel.closest('label')).toHaveTextContent('*')
		})
	})

	describe('@REQ-PROP-001 - Form validation', () => {
		it('should validate required title field', async () => {
			renderForm()

			const submitButton = screen.getByText('Create Proposal')
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(screen.getByText('Title is required')).toBeInTheDocument()
			})

			expect(mockOnSubmit).not.toHaveBeenCalled()
		})

		it('should validate required recipient name field', async () => {
			renderForm()

			const titleInput = screen.getByLabelText(/Proposal Title/i)
			fireEvent.change(titleInput, { target: { value: 'Test Proposal' } })

			const submitButton = screen.getByText('Create Proposal')
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(screen.getByText('Recipient name is required')).toBeInTheDocument()
			})

			expect(mockOnSubmit).not.toHaveBeenCalled()
		})

		it('should validate required recipient email field', async () => {
			renderForm()

			const titleInput = screen.getByLabelText(/Proposal Title/i)
			const nameInput = screen.getByLabelText(/Recipient Name/i)

			fireEvent.change(titleInput, { target: { value: 'Test Proposal' } })
			fireEvent.change(nameInput, { target: { value: 'John Doe' } })

			const submitButton = screen.getByText('Create Proposal')
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(screen.getByText('Recipient email is required')).toBeInTheDocument()
			})

			expect(mockOnSubmit).not.toHaveBeenCalled()
		})

		it('should validate email format', () => {
			renderForm()

			const titleInput = screen.getByLabelText(/Proposal Title/i)
			const nameInput = screen.getByLabelText(/Recipient Name/i)
			const emailInput = screen.getByLabelText(/Recipient Email/i)

			fireEvent.change(titleInput, { target: { value: 'Test Proposal' } })
			fireEvent.change(nameInput, { target: { value: 'John Doe' } })
			fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

			const submitButton = screen.getByText('Create Proposal')
			fireEvent.click(submitButton)

			// Validation is synchronous, no need for waitFor
			expect(screen.getByText('Invalid email address')).toBeInTheDocument()
			expect(mockOnSubmit).not.toHaveBeenCalled()
		})

		it('should clear error when user starts typing', async () => {
			renderForm()

			const submitButton = screen.getByText('Create Proposal')
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(screen.getByText('Title is required')).toBeInTheDocument()
			})

			const titleInput = screen.getByLabelText(/Proposal Title/i)
			fireEvent.change(titleInput, { target: { value: 'Test' } })

			await waitFor(() => {
				expect(screen.queryByText('Title is required')).not.toBeInTheDocument()
			})
		})
	})

	describe('@REQ-PROP-001 - Form submission', () => {
		it('should submit form with valid data', async () => {
			renderForm()

			const titleInput = screen.getByLabelText(/Proposal Title/i)
			const nameInput = screen.getByLabelText(/Recipient Name/i)
			const emailInput = screen.getByLabelText(/Recipient Email/i)
			const notesInput = screen.getByLabelText(/Notes/i)

			fireEvent.change(titleInput, { target: { value: 'Q4 2025 Device Refresh' } })
			fireEvent.change(nameInput, { target: { value: 'Sarah Johnson' } })
			fireEvent.change(emailInput, { target: { value: 'sarah@example.com' } })
			fireEvent.change(notesInput, { target: { value: 'Please review and approve' } })

			const submitButton = screen.getByText('Create Proposal')
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith(
					expect.objectContaining({
						title: 'Q4 2025 Device Refresh',
						recipient_name: 'Sarah Johnson',
						recipient_email: 'sarah@example.com',
						notes: 'Please review and approve',
					}),
				)
			})
		})

		it('should set default expiration if not provided', async () => {
			renderForm()

			const titleInput = screen.getByLabelText(/Proposal Title/i)
			const nameInput = screen.getByLabelText(/Recipient Name/i)
			const emailInput = screen.getByLabelText(/Recipient Email/i)

			fireEvent.change(titleInput, { target: { value: 'Test Proposal' } })
			fireEvent.change(nameInput, { target: { value: 'John Doe' } })
			fireEvent.change(emailInput, { target: { value: 'john@example.com' } })

			const submitButton = screen.getByText('Create Proposal')
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith(
					expect.objectContaining({
						expires_at: expect.any(String),
					}),
				)
			})

			// Verify expiration is in the future
			const call = mockOnSubmit.mock.calls[0][0] as ProposalFormData
			if (call.expires_at) {
				const expiresAt = new Date(call.expires_at)
				expect(expiresAt.getTime()).toBeGreaterThan(Date.now())
			}
		})
	})

	describe('@REQ-PROP-005 - Expiration date', () => {
		it('should allow setting custom expiration date', async () => {
			renderForm()

			const titleInput = screen.getByLabelText(/Proposal Title/i)
			const nameInput = screen.getByLabelText(/Recipient Name/i)
			const emailInput = screen.getByLabelText(/Recipient Email/i)
			const expirationInput = screen.getByLabelText(/Expiration Date/i)

			fireEvent.change(titleInput, { target: { value: 'Test Proposal' } })
			fireEvent.change(nameInput, { target: { value: 'John Doe' } })
			fireEvent.change(emailInput, { target: { value: 'john@example.com' } })

			// Set expiration to 14 days from now
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 14)
			const dateString = futureDate.toISOString().split('T')[0]

			fireEvent.change(expirationInput, { target: { value: dateString } })

			const submitButton = screen.getByText('Create Proposal')
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith(
					expect.objectContaining({
						expires_at: expect.stringContaining(dateString),
					}),
				)
			})
		})

		it('should show default expiration hint', () => {
			renderForm()

			expect(screen.getByText(/Defaults to 30 days if not set/i)).toBeInTheDocument()
		})
	})

	describe('Form actions', () => {
		it('should call onCancel when cancel button is clicked', () => {
			renderForm()

			const cancelButton = screen.getByText('Cancel')
			fireEvent.click(cancelButton)

			expect(mockOnCancel).toHaveBeenCalledTimes(1)
		})

		it('should disable all inputs when isSubmitting is true', () => {
			renderForm({ isSubmitting: true })

			const titleInput = screen.getByLabelText(/Proposal Title/i)
			const nameInput = screen.getByLabelText(/Recipient Name/i)
			const emailInput = screen.getByLabelText(/Recipient Email/i)
			const notesInput = screen.getByLabelText(/Notes/i)

			expect(titleInput).toBeDisabled()
			expect(nameInput).toBeDisabled()
			expect(emailInput).toBeDisabled()
			expect(notesInput).toBeDisabled()
		})

		it('should disable buttons when isSubmitting is true', () => {
			renderForm({ isSubmitting: true })

			const submitButton = screen.getByText('Creating...')
			const cancelButton = screen.getByText('Cancel')

			expect(submitButton).toBeDisabled()
			expect(cancelButton).toBeDisabled()
		})

		it('should show "Creating..." text when submitting', () => {
			renderForm({ isSubmitting: true })

			expect(screen.getByText('Creating...')).toBeInTheDocument()
			expect(screen.queryByText('Create Proposal')).not.toBeInTheDocument()
		})
	})
})
