/**
 * @REQ-ORD-009: Download invoice
 * @REQ-ORD-010: Cancel order
 * @REQ-ORD-011: Request return
 * Tests order action buttons and modals
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { OrderWithItems } from '@/lib/scoped-queries'
import { OrderActions } from './OrderActions'

describe('OrderActions', () => {
	const baseOrder: OrderWithItems = {
		id: 'ord_test',
		account_id: 'acc_demo',
		created_by_user_id: 'user_test',
		status: 'processing',
		payment_method: 'card',
		subtotal: 1000,
		shipping_cost: 0,
		tax_amount: 90,
		total: 1090,
		created_at: '2025-12-01T10:00:00Z',
	}

	/**
	 * @REQ-ORD-009: Download invoice
	 * Scenario: Download invoice
	 * When I click "Download invoice"
	 * Then a PDF should be generated
	 */
	it('should display "Download invoice" button', () => {
		render(<OrderActions order={baseOrder} />)

		expect(screen.getByText('Download invoice')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-009: Download invoice
	 * Then a PDF should be generated
	 */
	it('should call onDownloadInvoice when button is clicked', async () => {
		const mockDownload = vi.fn().mockResolvedValue(undefined)
		render(<OrderActions order={baseOrder} onDownloadInvoice={mockDownload} />)

		const downloadButton = screen.getByText('Download invoice')
		fireEvent.click(downloadButton)

		await waitFor(() => {
			expect(mockDownload).toHaveBeenCalledWith('ord_test')
		})
	})

	/**
	 * @REQ-ORD-009: Download invoice
	 * Edge case: Cancelled orders should not have invoice download
	 */
	it('should not display "Download invoice" for cancelled orders', () => {
		const cancelledOrder: OrderWithItems = {
			...baseOrder,
			status: 'cancelled',
		}

		render(<OrderActions order={cancelledOrder} />)

		expect(screen.queryByText('Download invoice')).not.toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-010: Cancel order
	 * Scenario: Cancel order
	 * Given order status is "Pending" or "Processing"
	 * When I click "Cancel order"
	 */
	it('should display "Cancel order" button for pending orders', () => {
		const pendingOrder: OrderWithItems = {
			...baseOrder,
			status: 'pending',
		}

		render(<OrderActions order={pendingOrder} />)

		expect(screen.getByText('Cancel order')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-010: Cancel order
	 * Given order status is "Pending" or "Processing"
	 */
	it('should display "Cancel order" button for processing orders', () => {
		const processingOrder: OrderWithItems = {
			...baseOrder,
			status: 'processing',
		}

		render(<OrderActions order={processingOrder} />)

		expect(screen.getByText('Cancel order')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-010: Cancel order
	 * Given order status is "Pending" or "Processing"
	 */
	it('should display "Cancel order" button for pending_leasing_approval orders', () => {
		const leasingOrder: OrderWithItems = {
			...baseOrder,
			status: 'pending_leasing_approval',
		}

		render(<OrderActions order={leasingOrder} />)

		expect(screen.getByText('Cancel order')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-010: Cancel order
	 * Edge case: Shipped orders cannot be cancelled
	 */
	it('should not display "Cancel order" button for shipped orders', () => {
		const shippedOrder: OrderWithItems = {
			...baseOrder,
			status: 'shipped',
		}

		render(<OrderActions order={shippedOrder} />)

		expect(screen.queryByText('Cancel order')).not.toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-010: Cancel order
	 * Scenario: Cancel order
	 * When I click "Cancel order"
	 * And I confirm cancellation
	 */
	it('should show confirmation modal when "Cancel order" is clicked', () => {
		const pendingOrder: OrderWithItems = {
			...baseOrder,
			status: 'pending',
		}

		render(<OrderActions order={pendingOrder} />)

		const cancelButton = screen.getByText('Cancel order')
		fireEvent.click(cancelButton)

		expect(screen.getByText('Cancel Order?')).toBeInTheDocument()
		expect(screen.getByText(/Are you sure you want to cancel this order/i)).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-010: Cancel order
	 * And I confirm cancellation
	 * Then order status should change to "Cancelled"
	 * And refund should be initiated (if paid)
	 */
	it('should call onCancel when cancellation is confirmed', async () => {
		const mockCancel = vi.fn().mockResolvedValue(undefined)
		const pendingOrder: OrderWithItems = {
			...baseOrder,
			status: 'pending',
		}

		render(<OrderActions order={pendingOrder} onCancel={mockCancel} />)

		// Open modal
		const cancelButton = screen.getByText('Cancel order')
		fireEvent.click(cancelButton)

		// Confirm cancellation
		const confirmButton = screen.getAllByText('Cancel order')[1] // Second one is in modal
		fireEvent.click(confirmButton)

		await waitFor(() => {
			expect(mockCancel).toHaveBeenCalledWith('ord_test')
		})
	})

	/**
	 * @REQ-ORD-010: Cancel order
	 * Edge case: User can dismiss cancellation modal
	 */
	it('should close modal when "Keep order" is clicked', () => {
		const pendingOrder: OrderWithItems = {
			...baseOrder,
			status: 'pending',
		}

		render(<OrderActions order={pendingOrder} />)

		// Open modal
		const cancelButton = screen.getByText('Cancel order')
		fireEvent.click(cancelButton)

		// Click "Keep order"
		const keepButton = screen.getByText('Keep order')
		fireEvent.click(keepButton)

		// Modal should be closed
		expect(screen.queryByText('Cancel Order?')).not.toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-010: Cancel order
	 * And refund should be initiated (if paid)
	 */
	it('should mention refund in cancellation modal for card payments', () => {
		const paidOrder: OrderWithItems = {
			...baseOrder,
			status: 'processing',
			payment_method: 'card',
		}

		render(<OrderActions order={paidOrder} />)

		const cancelButton = screen.getByText('Cancel order')
		fireEvent.click(cancelButton)

		expect(screen.getByText(/A refund will be initiated/i)).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-011: Request return
	 * Scenario: Request return
	 * Given order status is "Delivered"
	 * And return window has not expired
	 * When I click "Request return"
	 */
	it('should display "Request return" button for delivered orders within return window', () => {
		const deliveredOrder: OrderWithItems = {
			...baseOrder,
			status: 'delivered',
			delivered_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
		}

		render(<OrderActions order={deliveredOrder} />)

		expect(screen.getByText('Request return')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-011: Request return
	 * And return window has not expired (30 days)
	 */
	it('should not display "Request return" button for delivered orders outside return window', () => {
		const oldOrder: OrderWithItems = {
			...baseOrder,
			status: 'delivered',
			delivered_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
		}

		render(<OrderActions order={oldOrder} />)

		expect(screen.queryByText('Request return')).not.toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-011: Request return
	 * Then I should see return form
	 * And I should select reason for return
	 */
	it('should show return form modal when "Request return" is clicked', () => {
		const deliveredOrder: OrderWithItems = {
			...baseOrder,
			status: 'delivered',
			delivered_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		}

		render(<OrderActions order={deliveredOrder} />)

		const returnButton = screen.getByText('Request return')
		fireEvent.click(returnButton)

		expect(screen.getByText('Request Return')).toBeInTheDocument()
		expect(screen.getByText(/Please select a reason for returning/i)).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-011: Request return
	 * And I should select reason for return
	 */
	it('should display return reason options', () => {
		const deliveredOrder: OrderWithItems = {
			...baseOrder,
			status: 'delivered',
			delivered_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		}

		render(<OrderActions order={deliveredOrder} />)

		const returnButton = screen.getByText('Request return')
		fireEvent.click(returnButton)

		expect(screen.getByText('Defective or damaged item')).toBeInTheDocument()
		expect(screen.getByText('Wrong item received')).toBeInTheDocument()
		expect(screen.getByText('No longer needed')).toBeInTheDocument()
		expect(screen.getByText('Item not as described')).toBeInTheDocument()
		expect(screen.getByText('Changed my mind')).toBeInTheDocument()
		expect(screen.getByText('Other')).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-011: Request return
	 * And I should receive return shipping label
	 */
	it('should mention prepaid return shipping label in return form', () => {
		const deliveredOrder: OrderWithItems = {
			...baseOrder,
			status: 'delivered',
			delivered_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		}

		render(<OrderActions order={deliveredOrder} />)

		const returnButton = screen.getByText('Request return')
		fireEvent.click(returnButton)

		expect(screen.getByText(/prepaid return shipping label/i)).toBeInTheDocument()
	})

	/**
	 * @REQ-ORD-011: Request return
	 * Submit button should be disabled until reason is selected
	 */
	it('should disable submit button until return reason is selected', () => {
		const deliveredOrder: OrderWithItems = {
			...baseOrder,
			status: 'delivered',
			delivered_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		}

		render(<OrderActions order={deliveredOrder} />)

		const returnButton = screen.getByText('Request return')
		fireEvent.click(returnButton)

		const submitButton = screen.getByText('Submit return request')
		expect(submitButton).toBeDisabled()

		// Select a reason
		const reasonRadio = screen.getByLabelText('Defective or damaged item')
		fireEvent.click(reasonRadio)

		expect(submitButton).toBeEnabled()
	})

	/**
	 * @REQ-ORD-011: Request return
	 * Should call onReturn when return is submitted
	 */
	it('should call onReturn when return request is submitted', async () => {
		const mockReturn = vi.fn().mockResolvedValue(undefined)
		const deliveredOrder: OrderWithItems = {
			...baseOrder,
			status: 'delivered',
			delivered_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		}

		render(<OrderActions order={deliveredOrder} onReturn={mockReturn} />)

		// Open return form
		const returnButton = screen.getByText('Request return')
		fireEvent.click(returnButton)

		// Select a reason
		const reasonRadio = screen.getByLabelText('Defective or damaged item')
		fireEvent.click(reasonRadio)

		// Submit
		const submitButton = screen.getByText('Submit return request')
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(mockReturn).toHaveBeenCalledWith('ord_test')
		})
	})

	/**
	 * Reorder button should always be available
	 */
	it('should display "Reorder" button for all orders', () => {
		render(<OrderActions order={baseOrder} />)

		expect(screen.getByText('Reorder')).toBeInTheDocument()
	})

	/**
	 * Should call onReorder when reorder button is clicked
	 */
	it('should call onReorder when "Reorder" is clicked', async () => {
		const mockReorder = vi.fn().mockResolvedValue(undefined)

		render(<OrderActions order={baseOrder} onReorder={mockReorder} />)

		const reorderButton = screen.getByText('Reorder')
		fireEvent.click(reorderButton)

		await waitFor(() => {
			expect(mockReorder).toHaveBeenCalledWith('ord_test')
		})
	})

	/**
	 * Edge case: Buttons should be disabled during loading
	 */
	it('should disable buttons during loading', async () => {
		const mockDownload = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))

		render(<OrderActions order={baseOrder} onDownloadInvoice={mockDownload} />)

		const downloadButton = screen.getByText('Download invoice')
		fireEvent.click(downloadButton)

		// Buttons should be disabled during loading
		expect(downloadButton).toBeDisabled()

		await waitFor(() => {
			expect(mockDownload).toHaveBeenCalled()
		})
	})
})
