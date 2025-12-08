/**
 * PublicProposalView Tests
 *
 * Tests for public proposal viewing component.
 * Follows Gherkin BDD format with @REQ tags for traceability.
 */

import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublicProposalView as PublicProposal } from '@/types/proposal'
import { PublicProposalView } from './PublicProposalView'

// Mock fetch globally
global.fetch = vi.fn()

const mockProposal: PublicProposal = {
	id: 'prop_1234',
	title: 'Q4 2025 Hardware Refresh',
	status: 'sent',
	recipient_name: 'John Doe',
	expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
	subtotal: 2499.0,
	notes: 'Proposed hardware for new hires',
	items: [
		{
			id: 'pitem_1',
			proposal_id: 'prop_1234',
			product_name: 'MacBook Pro 14"',
			product_sku: 'MBP14-M3-16GB',
			quantity: 2,
			unit_price: 1999.0,
			monthly_price: 83.29,
			specs: {
				Processor: 'M3 Pro',
				Memory: '16GB',
				Storage: '512GB SSD',
			},
		},
		{
			id: 'pitem_2',
			proposal_id: 'prop_1234',
			product_name: 'Magic Mouse',
			product_sku: 'MM-WHITE',
			quantity: 2,
			unit_price: 79.0,
			specs: {
				Color: 'White',
			},
		},
	],
	created_at: new Date().toISOString(),
	is_expired: false,
}

describe('PublicProposalView', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * @REQ-PROP-006
	 * Feature: View and Approve Proposal
	 * Scenario: View proposal without login
	 */
	describe('@REQ-PROP-006: View proposal without login', () => {
		it('should display proposal details without authentication', async () => {
			// Given a proposal exists with share_token "abc123"
			// And I access "proposals.tryequipped.com/abc123"
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ proposal: mockProposal }),
			})

			render(<PublicProposalView token="abc123" />)

			// Then I should see proposal details without authentication
			await waitFor(() => {
				expect(screen.getByText('Q4 2025 Hardware Refresh')).toBeInTheDocument()
			})

			// And I should see:
			// | Proposal title |
			expect(screen.getByText('Q4 2025 Hardware Refresh')).toBeInTheDocument()

			// | From: [sender name, company] |
			expect(screen.getByText('For: John Doe')).toBeInTheDocument()

			// | Items with specs and pricing |
			expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
			expect(screen.getByText('Magic Mouse')).toBeInTheDocument()
			expect(screen.getByText('SKU: MBP14-M3-16GB')).toBeInTheDocument()
			expect(screen.getByText('SKU: MM-WHITE')).toBeInTheDocument()

			// | Subtotal |
			expect(screen.getByText('$2499.00')).toBeInTheDocument()

			// | Monthly payment options |
			expect(screen.getByText('$83.29/month')).toBeInTheDocument()

			// | Notes from sender |
			expect(screen.getByText('Notes from sender')).toBeInTheDocument()
			expect(screen.getByText('Proposed hardware for new hires')).toBeInTheDocument()

			// | Expiration date |
			expect(screen.getByText(/Expires:/)).toBeInTheDocument()
		})

		it('should display specifications for each item', async () => {
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ proposal: mockProposal }),
			})

			render(<PublicProposalView token="abc123" />)

			await waitFor(() => {
				expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
			})

			// Check specs are displayed
			expect(screen.getByText('Processor:')).toBeInTheDocument()
			expect(screen.getByText('M3 Pro')).toBeInTheDocument()
			expect(screen.getByText('Memory:')).toBeInTheDocument()
			expect(screen.getByText('16GB')).toBeInTheDocument()
			expect(screen.getByText('Storage:')).toBeInTheDocument()
			expect(screen.getByText('512GB SSD')).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-PROP-009
	 * Feature: View and Approve Proposal
	 * Scenario: Expired proposal
	 */
	describe('@REQ-PROP-009: Expired proposal', () => {
		it('should show expired message when proposal has expired', async () => {
			// Given proposal has expired
			const expiredProposal: PublicProposal = {
				...mockProposal,
				expires_at: new Date(Date.now() - 1000).toISOString(), // 1 second ago
				is_expired: true,
			}

			// When I access the share link
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ proposal: expiredProposal }),
			})

			render(<PublicProposalView token="abc123" />)

			// Then I should see "This proposal has expired"
			await waitFor(() => {
				expect(screen.getByText('This proposal has expired')).toBeInTheDocument()
			})

			// And approve/decline buttons should be disabled
			const approveButton = screen.getByText('Approve Proposal')
			const declineButton = screen.getByText('Decline')

			expect(approveButton).toBeDisabled()
			expect(declineButton).toBeDisabled()

			// And I should see option to "Request new proposal"
			expect(screen.getByText(/Contact the sender to request a new proposal/)).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-PROP-010
	 * Feature: View and Approve Proposal
	 * Scenario: Track proposal views
	 */
	describe('@REQ-PROP-010: Track proposal views', () => {
		it('should fetch proposal when component mounts', async () => {
			// When recipient opens proposal link
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ proposal: mockProposal }),
			})

			render(<PublicProposalView token="test_token_123" />)

			// Then API should be called to fetch proposal (which triggers view tracking)
			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith('/api/proposals/public/test_token_123')
			})

			// Note: The actual status change from "sent" to "viewed" and viewed_at timestamp
			// recording happens in the API endpoint (tested in proposals.test.ts)
		})
	})

	describe('Error Handling', () => {
		it('should show error message when proposal fails to load', async () => {
			;(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: async () => ({ message: 'Proposal not found' }),
			})

			render(<PublicProposalView token="invalid" />)

			await waitFor(() => {
				expect(screen.getByText('Error Loading Proposal')).toBeInTheDocument()
				expect(screen.getByText('Proposal not found')).toBeInTheDocument()
			})
		})

		it('should show loading state while fetching', () => {
			;(global.fetch as any).mockImplementationOnce(
				() =>
					new Promise(resolve =>
						setTimeout(
							() =>
								resolve({
									ok: true,
									json: async () => ({ proposal: mockProposal }),
								}),
							100,
						),
					),
			)

			render(<PublicProposalView token="abc123" />)

			expect(screen.getByText('Loading proposal...')).toBeInTheDocument()
		})
	})

	describe('Status Display', () => {
		it('should show approved message when proposal is approved', async () => {
			const approvedProposal: PublicProposal = {
				...mockProposal,
				status: 'approved',
			}

			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ proposal: approvedProposal }),
			})

			render(<PublicProposalView token="abc123" />)

			await waitFor(() => {
				expect(screen.getByText('Proposal Approved')).toBeInTheDocument()
			})
		})

		it('should show declined message when proposal is declined', async () => {
			const declinedProposal: PublicProposal = {
				...mockProposal,
				status: 'declined',
			}

			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ proposal: declinedProposal }),
			})

			render(<PublicProposalView token="abc123" />)

			await waitFor(() => {
				expect(screen.getByText('Proposal Declined')).toBeInTheDocument()
			})
		})
	})
})
