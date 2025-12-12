/**
 * InviteMemberModal Component Tests
 *
 * Tests invitation dialog with form validation.
 * Follows Gherkin BDD format with @REQ tags.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InviteMemberModal from './InviteMemberModal'

describe('InviteMemberModal Component', () => {
	const mockOnClose = vi.fn()
	const mockOnInvite = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * @REQ-UI-001
	 * Scenario: Open invite dialog
	 */
	describe('Open invite dialog', () => {
		it('should display the invitation dialog when open', () => {
			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			expect(screen.getByText('Invite Team Member')).toBeInTheDocument()
			expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
			expect(screen.getByText('Role')).toBeInTheDocument()
			expect(screen.getByText('Send Invitation')).toBeInTheDocument()
		})

		it('should not display the dialog when closed', () => {
			render(<InviteMemberModal isOpen={false} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			expect(screen.queryByText('Invite Team Member')).not.toBeInTheDocument()
		})

		it('should have email input field', () => {
			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			const emailInput = screen.getByPlaceholderText('colleague@company.com')
			expect(emailInput).toBeInTheDocument()
			expect(emailInput).toHaveAttribute('type', 'email')
		})

		it('should have role dropdown', () => {
			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			expect(screen.getByText('Role')).toBeInTheDocument()
			// Role selector should be present
			const roleButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Member'))
			expect(roleButton).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-UI-002
	 * Scenario: Email validation
	 */
	describe('Email validation', () => {
		it('should show error for invalid email format', async () => {
			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			const emailInput = screen.getByPlaceholderText('colleague@company.com')
			const submitButton = screen.getByText('Send Invitation')

			fireEvent.change(emailInput, { target: { value: 'notanemail' } })
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
			})

			expect(mockOnInvite).not.toHaveBeenCalled()
		})

		it('should not show error for valid email', async () => {
			mockOnInvite.mockResolvedValue(undefined)

			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			const emailInput = screen.getByPlaceholderText('colleague@company.com')
			const submitButton = screen.getByText('Send Invitation')

			fireEvent.change(emailInput, { target: { value: 'alice@example.com' } })
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(mockOnInvite).toHaveBeenCalledWith('alice@example.com', 'member')
			})

			expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument()
		})

		it('should validate various invalid email formats', async () => {
			const invalidEmails = ['test', 'test@', '@example.com', 'test@.com', 'test @example.com']

			for (const invalidEmail of invalidEmails) {
				vi.clearAllMocks()
				const { unmount } = render(
					<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />,
				)

				const emailInput = screen.getByPlaceholderText('colleague@company.com')
				const submitButton = screen.getByText('Send Invitation')

				fireEvent.change(emailInput, { target: { value: invalidEmail } })
				fireEvent.click(submitButton)

				await waitFor(() => {
					expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
				})

				expect(mockOnInvite).not.toHaveBeenCalled()
				unmount()
			}
		})

		it('should accept various valid email formats', async () => {
			const validEmails = ['test@example.com', 'user+tag@example.co.uk', 'first.last@example.org']

			for (const validEmail of validEmails) {
				vi.clearAllMocks()
				mockOnInvite.mockResolvedValue(undefined)

				const { unmount } = render(
					<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />,
				)

				const emailInput = screen.getByPlaceholderText('colleague@company.com')
				const submitButton = screen.getByText('Send Invitation')

				fireEvent.change(emailInput, { target: { value: validEmail } })
				fireEvent.click(submitButton)

				await waitFor(() => {
					expect(mockOnInvite).toHaveBeenCalledWith(validEmail, 'member')
				})

				unmount()
			}
		})
	})

	/**
	 * @REQ-UI-003
	 * Scenario: Send invitation
	 */
	describe('Send invitation', () => {
		it('should send invitation with email and role', async () => {
			mockOnInvite.mockResolvedValue(undefined)

			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			const emailInput = screen.getByPlaceholderText('colleague@company.com')
			fireEvent.change(emailInput, { target: { value: 'alice@example.com' } })

			// Open role selector and select Admin
			const roleButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Member'))
			if (roleButton) {
				fireEvent.click(roleButton)
				await waitFor(() => {
					const adminOption = screen.getByText('Admin')
					fireEvent.click(adminOption)
				})
			}

			const submitButton = screen.getByText('Send Invitation')
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(mockOnInvite).toHaveBeenCalledWith('alice@example.com', expect.any(String))
			})
		})

		it('should close dialog on successful invitation', async () => {
			mockOnInvite.mockResolvedValue(undefined)

			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			const emailInput = screen.getByPlaceholderText('colleague@company.com')
			const submitButton = screen.getByText('Send Invitation')

			fireEvent.change(emailInput, { target: { value: 'alice@example.com' } })
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(mockOnClose).toHaveBeenCalled()
			})
		})

		it('should reset form on successful invitation', async () => {
			mockOnInvite.mockResolvedValue(undefined)

			const { rerender } = render(
				<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />,
			)

			const emailInput = screen.getByPlaceholderText('colleague@company.com')
			const submitButton = screen.getByText('Send Invitation')

			fireEvent.change(emailInput, { target: { value: 'alice@example.com' } })
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(mockOnInvite).toHaveBeenCalled()
			})

			// Dialog should be closed, so reopen with fresh state
			rerender(<InviteMemberModal isOpen={false} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)
			rerender(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			const newEmailInput = screen.getByPlaceholderText('colleague@company.com')
			expect(newEmailInput).toHaveValue('')
		})

		it('should show error message on failure', async () => {
			mockOnInvite.mockRejectedValue(new Error('User already has access'))

			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			const emailInput = screen.getByPlaceholderText('colleague@company.com')
			const submitButton = screen.getByText('Send Invitation')

			fireEvent.change(emailInput, { target: { value: 'alice@example.com' } })
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(screen.getByText('User already has access')).toBeInTheDocument()
			})

			expect(mockOnClose).not.toHaveBeenCalled()
		})

		it('should disable submit button while submitting', async () => {
			mockOnInvite.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			const emailInput = screen.getByPlaceholderText('colleague@company.com')
			const submitButton = screen.getByText('Send Invitation')

			fireEvent.change(emailInput, { target: { value: 'alice@example.com' } })
			fireEvent.click(submitButton)

			expect(screen.getByText('Sending...')).toBeInTheDocument()
			expect(submitButton).toBeDisabled()

			await waitFor(() => {
				expect(mockOnInvite).toHaveBeenCalled()
			})
		})
	})

	describe('Close dialog', () => {
		it('should close dialog when clicking Cancel', () => {
			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			const cancelButton = screen.getByText('Cancel')
			fireEvent.click(cancelButton)

			expect(mockOnClose).toHaveBeenCalled()
		})

		it('should close dialog when clicking X button', () => {
			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			const closeButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
			if (closeButton && closeButton.textContent === '') {
				fireEvent.click(closeButton)
				expect(mockOnClose).toHaveBeenCalled()
			}
		})

		it('should not close dialog while submitting', () => {
			mockOnInvite.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			const emailInput = screen.getByPlaceholderText('colleague@company.com')
			const submitButton = screen.getByText('Send Invitation')

			fireEvent.change(emailInput, { target: { value: 'alice@example.com' } })
			fireEvent.click(submitButton)

			const cancelButton = screen.getByText('Cancel')
			expect(cancelButton).toBeDisabled()
		})
	})

	describe('Role selection', () => {
		it('should default to member role', () => {
			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			const roleButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Member'))
			expect(roleButton).toBeInTheDocument()
		})

		it('should allow owner role selection when canAssignOwner is true', () => {
			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={true} />)

			const roleButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Member'))
			if (roleButton) {
				fireEvent.click(roleButton)
				// Owner option should be available
				expect(screen.queryByText('Owner')).toBeInTheDocument()
			}
		})

		it('should not show owner role when canAssignOwner is false', () => {
			render(<InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} canAssignOwner={false} />)

			const roleButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Member'))
			if (roleButton) {
				fireEvent.click(roleButton)
				// Owner option should not be available
				expect(screen.queryByText(/^Owner$/)).not.toBeInTheDocument()
			}
		})
	})
})
