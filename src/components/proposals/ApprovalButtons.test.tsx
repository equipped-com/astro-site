/**
 * ApprovalButtons Tests
 *
 * Tests for proposal approval/decline actions.
 * Follows Gherkin BDD format with @REQ tags for traceability.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApprovalButtons } from './ApprovalButtons'

// Mock fetch globally
global.fetch = vi.fn()

describe('ApprovalButtons', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * @REQ-PROP-007
	 * Feature: View and Approve Proposal
	 * Scenario: Approve proposal
	 */
	describe('@REQ-PROP-007: Approve proposal', () => {
		it('should call approve API and trigger callback when approved', async () => {
			// Mock API success
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, message: 'Proposal approved' }),
			})

			const onApprove = vi.fn()

			render(<ApprovalButtons token="abc123" isExpired={false} status="sent" onApprove={onApprove} />)

			// When I click "Approve"
			const approveButton = screen.getByText('Approve Proposal')
			fireEvent.click(approveButton)

			// Then API should be called
			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith('/api/proposals/public/abc123/approve', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
				})
			})

			// And callback should be triggered
			await waitFor(() => {
				expect(onApprove).toHaveBeenCalled()
			})
		})

		it('should show loading state while approving', async () => {
			;(global.fetch as any).mockImplementationOnce(
				() =>
					new Promise(resolve =>
						setTimeout(
							() =>
								resolve({
									ok: true,
									json: async () => ({ success: true }),
								}),
							100,
						),
					),
			)

			render(<ApprovalButtons token="abc123" isExpired={false} status="sent" />)

			const approveButton = screen.getByText('Approve Proposal')
			fireEvent.click(approveButton)

			// Should show loading text
			expect(screen.getByText('Approving...')).toBeInTheDocument()
		})

		it('should show error message when approval fails', async () => {
			;(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: async () => ({ message: 'Proposal has expired' }),
			})

			render(<ApprovalButtons token="abc123" isExpired={false} status="sent" />)

			const approveButton = screen.getByText('Approve Proposal')
			fireEvent.click(approveButton)

			await waitFor(() => {
				expect(screen.getByText('Proposal has expired')).toBeInTheDocument()
			})
		})
	})

	/**
	 * @REQ-PROP-008
	 * Feature: View and Approve Proposal
	 * Scenario: Decline proposal
	 */
	describe('@REQ-PROP-008: Decline proposal', () => {
		it('should show decline reason textarea when decline is clicked', () => {
			render(<ApprovalButtons token="abc123" isExpired={false} status="sent" />)

			// When I click "Decline"
			const declineButton = screen.getByText('Decline')
			fireEvent.click(declineButton)

			// Then decline reason textarea should appear
			expect(screen.getByLabelText(/Reason for declining/)).toBeInTheDocument()
			expect(screen.getByText('Confirm Decline')).toBeInTheDocument()
		})

		it('should call decline API with optional reason', async () => {
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, message: 'Proposal declined' }),
			})

			const onDecline = vi.fn()

			render(<ApprovalButtons token="abc123" isExpired={false} status="sent" onDecline={onDecline} />)

			// When I click "Decline"
			const declineButton = screen.getByText('Decline')
			fireEvent.click(declineButton)

			// And I optionally enter a reason
			const reasonInput = screen.getByLabelText(/Reason for declining/)
			fireEvent.change(reasonInput, { target: { value: 'Budget constraints' } })

			// And confirm decline
			const confirmButton = screen.getByText('Confirm Decline')
			fireEvent.click(confirmButton)

			// Then API should be called with reason
			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith(
					'/api/proposals/public/abc123/decline',
					expect.objectContaining({
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ reason: 'Budget constraints' }),
					}),
				)
			})

			// And callback should be triggered
			await waitFor(() => {
				expect(onDecline).toHaveBeenCalled()
			})
		})

		it('should allow declining without a reason', async () => {
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			})

			render(<ApprovalButtons token="abc123" isExpired={false} status="sent" />)

			const declineButton = screen.getByText('Decline')
			fireEvent.click(declineButton)

			// Don't enter a reason, just confirm
			const confirmButton = screen.getByText('Confirm Decline')
			fireEvent.click(confirmButton)

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith(
					'/api/proposals/public/abc123/decline',
					expect.objectContaining({
						method: 'POST',
						body: JSON.stringify({ reason: undefined }),
					}),
				)
			})
		})

		it('should allow canceling decline', () => {
			render(<ApprovalButtons token="abc123" isExpired={false} status="sent" />)

			const declineButton = screen.getByText('Decline')
			fireEvent.click(declineButton)

			expect(screen.getByText('Confirm Decline')).toBeInTheDocument()

			// Cancel
			const cancelButton = screen.getByText('Cancel')
			fireEvent.click(cancelButton)

			// Should go back to action buttons
			expect(screen.queryByText('Confirm Decline')).not.toBeInTheDocument()
			expect(screen.getByText('Approve Proposal')).toBeInTheDocument()
		})
	})

	describe('Status-based Display', () => {
		it('should show approved message when status is approved', () => {
			render(<ApprovalButtons token="abc123" isExpired={false} status="approved" />)

			expect(screen.getByText('Proposal Approved')).toBeInTheDocument()
			expect(screen.getByText(/This proposal has been approved and is being processed/)).toBeInTheDocument()
			expect(screen.queryByText('Approve Proposal')).not.toBeInTheDocument()
		})

		it('should show declined message when status is declined', () => {
			render(<ApprovalButtons token="abc123" isExpired={false} status="declined" />)

			expect(screen.getByText('Proposal Declined')).toBeInTheDocument()
			expect(screen.getByText(/This proposal has been declined/)).toBeInTheDocument()
			expect(screen.queryByText('Approve Proposal')).not.toBeInTheDocument()
		})
	})

	describe('Expired Proposals', () => {
		it('should disable buttons when proposal is expired', () => {
			render(<ApprovalButtons token="abc123" isExpired={true} status="sent" />)

			const approveButton = screen.getByText('Approve Proposal')
			const declineButton = screen.getByText('Decline')

			expect(approveButton).toBeDisabled()
			expect(declineButton).toBeDisabled()
		})

		it('should show expired notice', () => {
			render(<ApprovalButtons token="abc123" isExpired={true} status="sent" />)

			expect(screen.getByText('This proposal has expired')).toBeInTheDocument()
			expect(screen.getByText(/Contact the sender to request a new proposal/)).toBeInTheDocument()
		})
	})
})
