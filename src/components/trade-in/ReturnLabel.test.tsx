/**
 * @REQ-TRADE-007 Generate return label
 * Tests for ReturnLabel component covering label generation, email, and PDF download
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShippingLabel, TradeInItem } from '@/lib/alchemy/types'
import { ReturnLabel } from './ReturnLabel'

const mockTradeIn: TradeInItem = {
	id: 'TI-123',
	serial: 'C02XG0FDH05N',
	model: 'MacBook Pro 16-inch',
	year: 2021,
	color: 'Space Gray',
	conditionGrade: 'good',
	estimatedValue: 850,
	valuationId: 'VAL-123',
	expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
	status: 'quote',
}

const mockLabel: ShippingLabel = {
	labelId: 'LBL-789',
	trackingNumber: '1Z999AA10123456789',
	carrier: 'FedEx',
	labelUrl: 'https://example.com/label.pdf',
	createdAt: new Date().toISOString(),
	expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
}

describe('ReturnLabel Component', () => {
	beforeEach(() => {
		// Reset fetch mocks
		global.fetch = vi.fn()
		// Mock window.open for print
		global.window.open = vi.fn()
		// Mock URL.createObjectURL for PDF download
		global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
		global.URL.revokeObjectURL = vi.fn()
	})

	describe('@REQ-TRADE-007 Generate return label', () => {
		it('should show generate label button when no label exists', () => {
			render(<ReturnLabel tradeIn={mockTradeIn} />)

			expect(screen.getByText('Get Return Label')).toBeInTheDocument()
			expect(screen.getByText('Ready to Ship?')).toBeInTheDocument()
		})

		it('should generate prepaid shipping label when clicked', async () => {
			const onLabelGenerated = vi.fn()
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ label: mockLabel }),
			})

			render(<ReturnLabel tradeIn={mockTradeIn} onLabelGenerated={onLabelGenerated} />)

			const generateButton = screen.getByText('Get Return Label')
			fireEvent.click(generateButton)

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith(
					'/api/trade-in/generate-label',
					expect.objectContaining({
						method: 'POST',
						body: JSON.stringify({ tradeInId: 'TI-123' }),
					}),
				)
				expect(onLabelGenerated).toHaveBeenCalledWith(mockLabel)
			})
		})

		it('should display label information after generation', () => {
			const tradeInWithLabel = {
				...mockTradeIn,
				shippingLabel: mockLabel,
			}

			render(<ReturnLabel tradeIn={tradeInWithLabel} />)

			expect(screen.getByText('Shipping Label Ready!')).toBeInTheDocument()
			expect(screen.getByText(mockLabel.carrier)).toBeInTheDocument()
			expect(screen.getByText(mockLabel.trackingNumber)).toBeInTheDocument()
		})

		it('should be downloadable as PDF', async () => {
			const tradeInWithLabel = {
				...mockTradeIn,
				shippingLabel: mockLabel,
			}
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				blob: async () => new Blob(['pdf content'], { type: 'application/pdf' }),
			})

			render(<ReturnLabel tradeIn={tradeInWithLabel} />)

			const downloadButton = screen.getByText('Download PDF')
			fireEvent.click(downloadButton)

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith(`/api/trade-in/label-pdf/${mockLabel.labelId}`)
				expect(URL.createObjectURL).toHaveBeenCalled()
			})
		})

		it('should be emailed to customer', async () => {
			const tradeInWithLabel = {
				...mockTradeIn,
				shippingLabel: mockLabel,
			}
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			})

			render(<ReturnLabel tradeIn={tradeInWithLabel} />)

			const emailButton = screen.getByText('Email Label')
			fireEvent.click(emailButton)

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith(
					'/api/trade-in/email-label',
					expect.objectContaining({
						method: 'POST',
						body: JSON.stringify({ tradeInId: 'TI-123' }),
					}),
				)
			})

			await waitFor(() => {
				expect(screen.getByText('Sent!')).toBeInTheDocument()
			})
		})

		it('should show packing instructions', () => {
			const tradeInWithLabel = {
				...mockTradeIn,
				shippingLabel: mockLabel,
			}

			render(<ReturnLabel tradeIn={tradeInWithLabel} />)

			expect(screen.getByText('Packing Instructions')).toBeInTheDocument()
			expect(screen.getByText('Back up your data')).toBeInTheDocument()
			expect(screen.getByText('Disable Find My')).toBeInTheDocument()
			expect(screen.getByText('Factory reset')).toBeInTheDocument()
			expect(screen.getByText('Pack securely')).toBeInTheDocument()
			expect(screen.getByText(/Attach label and ship/)).toBeInTheDocument()
		})

		it('should show expiration warning when label expires soon', () => {
			const expiringLabel = {
				...mockLabel,
				expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
			}
			const tradeInWithLabel = {
				...mockTradeIn,
				shippingLabel: expiringLabel,
			}

			render(<ReturnLabel tradeIn={tradeInWithLabel} />)

			expect(screen.getByText(/Label expires in 5 days/)).toBeInTheDocument()
		})

		it('should handle label generation errors gracefully', async () => {
			const alertMock = vi.fn()
			global.alert = alertMock
			;(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500,
			})

			render(<ReturnLabel tradeIn={mockTradeIn} />)

			const generateButton = screen.getByText('Get Return Label')
			fireEvent.click(generateButton)

			await waitFor(() => {
				expect(alertMock).toHaveBeenCalledWith('Failed to generate shipping label. Please try again.')
			})
		})

		it('should allow printing label', () => {
			const tradeInWithLabel = {
				...mockTradeIn,
				shippingLabel: mockLabel,
			}

			render(<ReturnLabel tradeIn={tradeInWithLabel} />)

			const printButton = screen.getByText('Print')
			fireEvent.click(printButton)

			expect(window.open).toHaveBeenCalledWith(mockLabel.labelUrl, '_blank')
		})
	})

	describe('Label Information Display', () => {
		it('should display device information', () => {
			const tradeInWithLabel = {
				...mockTradeIn,
				shippingLabel: mockLabel,
			}

			render(<ReturnLabel tradeIn={tradeInWithLabel} />)

			expect(screen.getByText(/MacBook Pro 16-inch/)).toBeInTheDocument()
			expect(screen.getByText(/2021/)).toBeInTheDocument()
			expect(screen.getByText(mockTradeIn.serial)).toBeInTheDocument()
		})

		it('should display trade-in value', () => {
			const tradeInWithLabel = {
				...mockTradeIn,
				shippingLabel: mockLabel,
			}

			render(<ReturnLabel tradeIn={tradeInWithLabel} />)

			expect(screen.getByText('$850')).toBeInTheDocument()
		})
	})

	describe('What to Expect Section', () => {
		it('should show preparation instructions before label generation', () => {
			render(<ReturnLabel tradeIn={mockTradeIn} />)

			expect(screen.getByText('What to expect:')).toBeInTheDocument()
			expect(screen.getByText(/Free prepaid shipping label/)).toBeInTheDocument()
			expect(screen.getByText(/Label will be emailed and available for download/)).toBeInTheDocument()
			expect(screen.getByText(/Package your device securely/)).toBeInTheDocument()
		})
	})
})
