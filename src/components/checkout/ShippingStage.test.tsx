import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TeamMember } from '@/types'
import ShippingStage from './ShippingStage'

describe('ShippingStage', () => {
	const mockTeamMember: TeamMember = {
		id: '1',
		name: 'Nicole Haley',
		email: 'nicole@company.com',
		hasAddress: true,
		hasPhone: true,
	}

	const mockTeamMemberNoAddress: TeamMember = {
		id: '2',
		name: 'Leon Quigley',
		email: 'leon@company.com',
		hasAddress: false,
		hasPhone: false,
	}

	describe('@REQ-COM-SHIP-001: Use assignee existing address', () => {
		it('should show assignee address option when assignee has address', () => {
			render(
				<ShippingStage
					assignedPerson={mockTeamMember}
					onContinue={vi.fn()}
				/>
			)

			expect(screen.getByText(/To Nicole's address/i)).toBeInTheDocument()
		})

		it('should enable Continue button when assignee address is selected', () => {
			render(
				<ShippingStage
					assignedPerson={mockTeamMember}
					onContinue={vi.fn()}
				/>
			)

			const assigneeButton = screen.getByText(/To Nicole's address/i).closest('button')
			fireEvent.click(assigneeButton!)

			const continueButton = screen.getByRole('button', { name: /Continue/i })
			expect(continueButton).toBeEnabled()
		})

		it('should call onContinue with useAssigneeAddress=true', () => {
			const onContinue = vi.fn()
			render(
				<ShippingStage
					assignedPerson={mockTeamMember}
					onContinue={onContinue}
				/>
			)

			const assigneeButton = screen.getByText(/To Nicole's address/i).closest('button')
			fireEvent.click(assigneeButton!)

			const continueButton = screen.getByRole('button', { name: /Continue/i })
			fireEvent.click(continueButton)

			expect(onContinue).toHaveBeenCalledWith({
				useAssigneeAddress: true,
				address: undefined,
			})
		})
	})

	describe('@REQ-COM-SHIP-002: Enter different shipping address', () => {
		it('should show address form fields when "To another address" is selected', () => {
			render(
				<ShippingStage
					assignedPerson={mockTeamMember}
					onContinue={vi.fn()}
				/>
			)

			const otherButton = screen.getByText(/To another address/i).closest('button')
			fireEvent.click(otherButton!)

			// Should show address input (autocomplete initially)
			expect(screen.getByPlaceholderText(/Start typing an address/i)).toBeInTheDocument()
		})

		it('should show manual entry link', () => {
			render(
				<ShippingStage
					assignedPerson={mockTeamMember}
					onContinue={vi.fn()}
				/>
			)

			const otherButton = screen.getByText(/To another address/i).closest('button')
			fireEvent.click(otherButton!)

			expect(screen.getByText(/Enter address manually/i)).toBeInTheDocument()
		})

		it('should display all required form fields after clicking manual entry', () => {
			render(
				<ShippingStage
					assignedPerson={mockTeamMember}
					onContinue={vi.fn()}
				/>
			)

			const otherButton = screen.getByText(/To another address/i).closest('button')
			fireEvent.click(otherButton!)

			const manualLink = screen.getByText(/Enter address manually/i)
			fireEvent.click(manualLink)

			// Check for all required fields
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
	})

	describe('@REQ-COM-SHIP-004: Manual address entry fallback', () => {
		it('should allow toggling between autocomplete and manual entry', () => {
			render(
				<ShippingStage
					assignedPerson={mockTeamMember}
					onContinue={vi.fn()}
				/>
			)

			const otherButton = screen.getByText(/To another address/i).closest('button')
			fireEvent.click(otherButton!)

			// Switch to manual entry
			const manualLink = screen.getByText(/Enter address manually/i)
			fireEvent.click(manualLink)

			expect(screen.getByLabelText(/First name/i)).toBeInTheDocument()

			// Switch back to autocomplete
			const lookupLink = screen.getByText(/Use address lookup/i)
			fireEvent.click(lookupLink)

			expect(screen.getByPlaceholderText(/Start typing an address/i)).toBeInTheDocument()
		})
	})

	describe('@REQ-COM-SHIP-005: Request missing contact info via email', () => {
		it('should show RequestInfoEmail when assignee lacks address', () => {
			const onSendEmail = vi.fn()
			render(
				<ShippingStage
					assignedPerson={mockTeamMemberNoAddress}
					onContinue={vi.fn()}
					onSendEmailRequest={onSendEmail}
				/>
			)

			// Click on assignee option (should be disabled but clickable)
			const assigneeButton = screen.getByText(/To Leon's address/i).closest('button')
			fireEvent.click(assigneeButton!)

			// Should show request info component
			expect(screen.getByText(/Address info needed/i)).toBeInTheDocument()
		})

		it('should disable assignee option when address info is missing', () => {
			render(
				<ShippingStage
					assignedPerson={mockTeamMemberNoAddress}
					onContinue={vi.fn()}
				/>
			)

			const assigneeButton = screen.getByText(/To Leon's address/i).closest('button')
			expect(assigneeButton).toBeDisabled()
		})
	})

	describe('@REQ-COM-SHIP-006: Dual email notification', () => {
		it('should show dual email notice when shipping to different email', () => {
			render(
				<ShippingStage
					assignedPerson={mockTeamMember}
					onContinue={vi.fn()}
					buyerEmail="buyer@company.com"
				/>
			)

			const otherButton = screen.getByText(/To another address/i).closest('button')
			fireEvent.click(otherButton!)

			const manualLink = screen.getByText(/Enter address manually/i)
			fireEvent.click(manualLink)

			// Fill in email field with different email
			const emailInput = screen.getByLabelText(/Email/i)
			fireEvent.change(emailInput, { target: { value: 'recipient@example.com' } })
			fireEvent.blur(emailInput)

			// Should show dual notification notice
			waitFor(() => {
				expect(screen.getByText(/Order updates will be sent to/i)).toBeInTheDocument()
				expect(screen.getByText(/buyer@company.com/i)).toBeInTheDocument()
			})
		})

		it('should not show dual email notice when emails match', () => {
			render(
				<ShippingStage
					assignedPerson={mockTeamMember}
					onContinue={vi.fn()}
					buyerEmail="buyer@company.com"
				/>
			)

			const otherButton = screen.getByText(/To another address/i).closest('button')
			fireEvent.click(otherButton!)

			const manualLink = screen.getByText(/Enter address manually/i)
			fireEvent.click(manualLink)

			// Fill in email field with same email
			const emailInput = screen.getByLabelText(/Email/i)
			fireEvent.change(emailInput, { target: { value: 'buyer@company.com' } })
			fireEvent.blur(emailInput)

			// Should NOT show dual notification
			expect(screen.queryByText(/Order updates will be sent to/i)).not.toBeInTheDocument()
		})
	})

	describe('@REQ-COM-SHIP-007: Validate address before continuing', () => {
		it('should disable Continue button when no address mode selected', () => {
			render(
				<ShippingStage
					assignedPerson={mockTeamMember}
					onContinue={vi.fn()}
				/>
			)

			const continueButton = screen.getByRole('button', { name: /Continue/i })
			expect(continueButton).toBeDisabled()
		})

		it('should not proceed with incomplete address', () => {
			const onContinue = vi.fn()
			render(
				<ShippingStage
					assignedPerson={mockTeamMember}
					onContinue={onContinue}
				/>
			)

			const otherButton = screen.getByText(/To another address/i).closest('button')
			fireEvent.click(otherButton!)

			const manualLink = screen.getByText(/Enter address manually/i)
			fireEvent.click(manualLink)

			// Fill only one field
			const firstNameInput = screen.getByLabelText(/First name/i)
			fireEvent.change(firstNameInput, { target: { value: 'John' } })
			fireEvent.blur(firstNameInput)

			const continueButton = screen.getByRole('button', { name: /Continue/i })
			expect(continueButton).toBeDisabled()

			// Should not call onContinue
			fireEvent.click(continueButton)
			expect(onContinue).not.toHaveBeenCalled()
		})

		it('should show validation errors when Continue clicked with incomplete data', () => {
			render(
				<ShippingStage
					assignedPerson={mockTeamMember}
					onContinue={vi.fn()}
				/>
			)

			const otherButton = screen.getByText(/To another address/i).closest('button')
			fireEvent.click(otherButton!)

			const manualLink = screen.getByText(/Enter address manually/i)
			fireEvent.click(manualLink)

			// Try to continue without filling form
			const continueButton = screen.getByRole('button', { name: /Continue/i })
			fireEvent.click(continueButton)

			// Should show validation error summary
			waitFor(() => {
				expect(screen.getByText(/Please fix the following errors/i)).toBeInTheDocument()
			})
		})

		it('should enable Continue button when address is complete', () => {
			render(
				<ShippingStage
					assignedPerson={mockTeamMember}
					onContinue={vi.fn()}
				/>
			)

			const otherButton = screen.getByText(/To another address/i).closest('button')
			fireEvent.click(otherButton!)

			const manualLink = screen.getByText(/Enter address manually/i)
			fireEvent.click(manualLink)

			// Fill all required fields
			fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'John' } })
			fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Doe' } })
			fireEvent.change(screen.getByLabelText(/^Address/i), { target: { value: '1 Infinite Loop' } })
			fireEvent.change(screen.getByLabelText(/City/i), { target: { value: 'Cupertino' } })
			fireEvent.change(screen.getByLabelText(/State/i), { target: { value: 'CA' } })
			fireEvent.change(screen.getByLabelText(/Zip code/i), { target: { value: '95014' } })
			fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } })
			fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '5551234567' } })

			// Blur to trigger validation
			fireEvent.blur(screen.getByLabelText(/Phone/i))

			waitFor(() => {
				const continueButton = screen.getByRole('button', { name: /Continue/i })
				expect(continueButton).toBeEnabled()
			})
		})
	})

	describe('Stage Header', () => {
		it('should display stage number and title', () => {
			render(
				<ShippingStage
					assignedPerson={mockTeamMember}
					onContinue={vi.fn()}
				/>
			)

			expect(screen.getByText('2')).toBeInTheDocument()
			expect(screen.getByText('Shipping Details')).toBeInTheDocument()
			expect(screen.getByText('Where should we send the order?')).toBeInTheDocument()
		})
	})
})
