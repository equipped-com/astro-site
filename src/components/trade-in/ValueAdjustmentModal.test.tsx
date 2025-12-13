/**
 * @REQ-TRADE-011 Value adjustment
 * Tests for ValueAdjustmentModal component covering accept/dispute/return options
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TradeInItem, ValueAdjustment } from '@/lib/alchemy/types'
import { ValueAdjustmentModal } from './ValueAdjustmentModal'

const mockTradeIn: TradeInItem = {
	id: 'TI-123',
	serial: 'C02XG0FDH05N',
	model: 'MacBook Pro 16-inch',
	year: 2021,
	color: 'Space Gray',
	conditionGrade: 'good',
	estimatedValue: 450,
	valuationId: 'VAL-123',
	expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
	status: 'inspecting',
}

const mockAdjustment: ValueAdjustment = {
	adjustmentId: 'ADJ-789',
	originalValue: 450,
	newValue: 350,
	reason: 'Minor screen scratches found during inspection',
	createdAt: new Date().toISOString(),
	status: 'pending_approval',
}

describe('ValueAdjustmentModal Component', () => {
	beforeEach(() => {
		global.fetch = vi.fn()
		global.confirm = vi.fn()
		global.alert = vi.fn()
	})

	describe('@REQ-TRADE-011 Value adjustment notification', () => {
		it('should notify customer of value adjustment', () => {
			render(
				<ValueAdjustmentModal tradeIn={mockTradeIn} adjustment={mockAdjustment} isOpen={true} onClose={() => {}} />,
			)

			expect(screen.getByText('Trade-In Value Adjustment')).toBeInTheDocument()
			expect(screen.getByText('Inspection found issues not disclosed')).toBeInTheDocument()
			expect(screen.getByText('Minor screen scratches found during inspection')).toBeInTheDocument()
		})

		it('should display original and new values with difference', () => {
			render(
				<ValueAdjustmentModal tradeIn={mockTradeIn} adjustment={mockAdjustment} isOpen={true} onClose={() => {}} />,
			)

			expect(screen.getByText('$450')).toBeInTheDocument() // Original value (crossed out)
			expect(screen.getByText('$350')).toBeInTheDocument() // New value
			expect(screen.getByText('-$100')).toBeInTheDocument() // Difference
			expect(screen.getByText(/22.2% reduction/)).toBeInTheDocument()
		})

		it('should show reason for adjustment', () => {
			render(
				<ValueAdjustmentModal tradeIn={mockTradeIn} adjustment={mockAdjustment} isOpen={true} onClose={() => {}} />,
			)

			expect(screen.getByText('Reason for Adjustment')).toBeInTheDocument()
			expect(screen.getByText('Minor screen scratches found during inspection')).toBeInTheDocument()
		})
	})

	describe('Customer Options', () => {
		it('should show three options: Accept, Dispute, Request Return', () => {
			render(
				<ValueAdjustmentModal tradeIn={mockTradeIn} adjustment={mockAdjustment} isOpen={true} onClose={() => {}} />,
			)

			expect(screen.getByText('Accept New Value')).toBeInTheDocument()
			expect(screen.getByText('Dispute Adjustment')).toBeInTheDocument()
			expect(screen.getByText('Request Device Return')).toBeInTheDocument()
		})

		it('should allow customer to accept new value', async () => {
			const onAccept = vi.fn()
			const onClose = vi.fn()
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			})

			render(
				<ValueAdjustmentModal
					tradeIn={mockTradeIn}
					adjustment={mockAdjustment}
					isOpen={true}
					onClose={onClose}
					onAccept={onAccept}
				/>,
			)

			const acceptButton = screen.getByText('Accept New Value')
			fireEvent.click(acceptButton)

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith(
					'/api/trade-in/adjustment/accept',
					expect.objectContaining({
						method: 'POST',
						body: JSON.stringify({
							tradeInId: 'TI-123',
							adjustmentId: 'ADJ-789',
						}),
					}),
				)
			})

			await waitFor(() => {
				expect(onAccept).toHaveBeenCalledWith('ADJ-789')
				expect(onClose).toHaveBeenCalled()
			})
		})

		it('should allow customer to dispute adjustment with reason', async () => {
			const onDispute = vi.fn()
			const onClose = vi.fn()
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			})

			render(
				<ValueAdjustmentModal
					tradeIn={mockTradeIn}
					adjustment={mockAdjustment}
					isOpen={true}
					onClose={onClose}
					onDispute={onDispute}
				/>,
			)

			// Click Dispute button to show form
			const disputeButton = screen.getByText('Dispute Adjustment')
			fireEvent.click(disputeButton)

			// Fill in dispute reason
			const textarea = screen.getByPlaceholderText(/Please explain why you believe the adjustment is incorrect/)
			fireEvent.change(textarea, {
				target: { value: 'The screen had no scratches when I shipped it' },
			})

			// Submit dispute
			const submitButton = screen.getByText('Submit Dispute')
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith(
					'/api/trade-in/adjustment/dispute',
					expect.objectContaining({
						method: 'POST',
						body: JSON.stringify({
							tradeInId: 'TI-123',
							adjustmentId: 'ADJ-789',
							reason: 'The screen had no scratches when I shipped it',
						}),
					}),
				)
			})

			await waitFor(() => {
				expect(onDispute).toHaveBeenCalledWith('ADJ-789', 'The screen had no scratches when I shipped it')
				expect(onClose).toHaveBeenCalled()
			})
		})

		it('should not allow empty dispute reason', () => {
			render(
				<ValueAdjustmentModal tradeIn={mockTradeIn} adjustment={mockAdjustment} isOpen={true} onClose={() => {}} />,
			)

			// Click Dispute button to show form
			const disputeButton = screen.getByText('Dispute Adjustment')
			fireEvent.click(disputeButton)

			// Submit button should be disabled without reason
			const submitButton = screen.getByText('Submit Dispute')
			expect(submitButton).toBeDisabled()
		})

		it('should allow customer to request device return with shipping cost warning', () => {
			const confirmMock = vi.fn(() => true)
			const alertMock = vi.fn()
			window.confirm = confirmMock
			window.alert = alertMock

			render(
				<ValueAdjustmentModal tradeIn={mockTradeIn} adjustment={mockAdjustment} isOpen={true} onClose={() => {}} />,
			)

			const returnButton = screen.getByText('Request Device Return')
			fireEvent.click(returnButton)

			expect(confirmMock).toHaveBeenCalledWith(
				'Are you sure you want to request device return? You will be responsible for return shipping costs.',
			)
			expect(alertMock).toHaveBeenCalledWith(
				'Return request submitted. We will contact you with shipping instructions.',
			)
		})
	})

	describe('Modal Behavior', () => {
		it('should not render when isOpen is false', () => {
			const { container } = render(
				<ValueAdjustmentModal tradeIn={mockTradeIn} adjustment={mockAdjustment} isOpen={false} onClose={() => {}} />,
			)

			expect(container.firstChild).toBeNull()
		})

		it('should close when overlay is clicked', () => {
			const onClose = vi.fn()

			const { container } = render(
				<ValueAdjustmentModal tradeIn={mockTradeIn} adjustment={mockAdjustment} isOpen={true} onClose={onClose} />,
			)

			const overlay = container.querySelector('.fixed.inset-0')
			if (overlay) {
				fireEvent.click(overlay)
				expect(onClose).toHaveBeenCalled()
			}
		})

		it('should close when X button is clicked', () => {
			const onClose = vi.fn()

			render(<ValueAdjustmentModal tradeIn={mockTradeIn} adjustment={mockAdjustment} isOpen={true} onClose={onClose} />)

			const closeButton = screen.getByLabelText('Close modal')
			fireEvent.click(closeButton)

			expect(onClose).toHaveBeenCalled()
		})
	})

	describe('Dispute Form', () => {
		it('should show dispute form when dispute button is clicked', () => {
			render(
				<ValueAdjustmentModal tradeIn={mockTradeIn} adjustment={mockAdjustment} isOpen={true} onClose={() => {}} />,
			)

			const disputeButton = screen.getByText('Dispute Adjustment')
			fireEvent.click(disputeButton)

			expect(screen.getByText('Reason for Dispute')).toBeInTheDocument()
			expect(
				screen.getByPlaceholderText(/Please explain why you believe the adjustment is incorrect/),
			).toBeInTheDocument()
		})

		it('should allow canceling dispute form', () => {
			render(
				<ValueAdjustmentModal tradeIn={mockTradeIn} adjustment={mockAdjustment} isOpen={true} onClose={() => {}} />,
			)

			// Open dispute form
			const disputeButton = screen.getByText('Dispute Adjustment')
			fireEvent.click(disputeButton)

			// Cancel form
			const cancelButton = screen.getByText('Cancel')
			fireEvent.click(cancelButton)

			// Should be back to main options
			expect(screen.getByText('Accept New Value')).toBeInTheDocument()
			expect(screen.queryByText('Reason for Dispute')).not.toBeInTheDocument()
		})
	})

	describe('Device Information', () => {
		it('should display device details', () => {
			render(
				<ValueAdjustmentModal tradeIn={mockTradeIn} adjustment={mockAdjustment} isOpen={true} onClose={() => {}} />,
			)

			expect(screen.getByText('MacBook Pro 16-inch')).toBeInTheDocument()
			expect(screen.getByText(/2021 - Space Gray/)).toBeInTheDocument()
			expect(screen.getByText('C02XG0FDH05N')).toBeInTheDocument()
		})
	})

	describe('Error Handling', () => {
		it('should handle accept errors gracefully', async () => {
			const alertMock = vi.fn()
			global.alert = alertMock
			;(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500,
			})

			render(
				<ValueAdjustmentModal tradeIn={mockTradeIn} adjustment={mockAdjustment} isOpen={true} onClose={() => {}} />,
			)

			const acceptButton = screen.getByText('Accept New Value')
			fireEvent.click(acceptButton)

			await waitFor(() => {
				expect(alertMock).toHaveBeenCalledWith('Failed to accept adjustment. Please try again.')
			})
		})

		it('should handle dispute errors gracefully', async () => {
			const alertMock = vi.fn()
			global.alert = alertMock
			;(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500,
			})

			render(
				<ValueAdjustmentModal tradeIn={mockTradeIn} adjustment={mockAdjustment} isOpen={true} onClose={() => {}} />,
			)

			// Open dispute form and fill reason
			const disputeButton = screen.getByText('Dispute Adjustment')
			fireEvent.click(disputeButton)

			const textarea = screen.getByPlaceholderText(/Please explain why you believe the adjustment is incorrect/)
			fireEvent.change(textarea, { target: { value: 'Test reason' } })

			const submitButton = screen.getByText('Submit Dispute')
			fireEvent.click(submitButton)

			await waitFor(() => {
				expect(alertMock).toHaveBeenCalledWith('Failed to submit dispute. Please try again.')
			})
		})
	})
})
