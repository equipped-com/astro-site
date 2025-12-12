/**
 * PendingInvitations Component Tests
 *
 * Tests invitation list with resend and revoke functionality.
 * Follows Gherkin BDD format with @REQ tags.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PendingInvitations from './PendingInvitations'

describe('PendingInvitations Component', () => {
	const mockOnRevoke = vi.fn()
	const mockOnResend = vi.fn()

	const mockInvitations = [
		{
			id: 'inv-1',
			email: 'alice@example.com',
			role: 'admin' as const,
			invited_by: 'owner@example.com',
			created_at: '2025-01-01T00:00:00Z',
			status: 'pending' as const,
			expires_at: '2025-01-08T00:00:00Z',
		},
		{
			id: 'inv-2',
			email: 'bob@example.com',
			role: 'member' as const,
			invited_by: 'owner@example.com',
			created_at: '2025-01-02T00:00:00Z',
			status: 'pending' as const,
			expires_at: '2025-01-09T00:00:00Z',
		},
		{
			id: 'inv-3',
			email: 'charlie@example.com',
			role: 'viewer' as const,
			invited_by: 'owner@example.com',
			created_at: '2025-01-03T00:00:00Z',
			status: 'pending' as const,
			expires_at: '2025-01-10T00:00:00Z',
		},
	]

	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * @REQ-UI-004
	 * Scenario: View pending invitations
	 */
	describe('View pending invitations', () => {
		it('should display all pending invitations', () => {
			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			expect(screen.getByText('alice@example.com')).toBeInTheDocument()
			expect(screen.getByText('bob@example.com')).toBeInTheDocument()
			expect(screen.getByText('charlie@example.com')).toBeInTheDocument()
		})

		it('should show email for each invitation', () => {
			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			expect(screen.getByText('alice@example.com')).toBeInTheDocument()
		})

		it('should show role for each invitation', () => {
			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			expect(screen.getByText(/Admin/i)).toBeInTheDocument()
			expect(screen.getByText(/Member/i)).toBeInTheDocument()
			expect(screen.getByText(/Viewer/i)).toBeInTheDocument()
		})

		it('should show sent date for each invitation', () => {
			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			// Check that dates are displayed (format varies)
			const dateElements = screen.getAllByText(/Invited/i)
			expect(dateElements.length).toBeGreaterThan(0)
		})

		it('should show status badge for each invitation', () => {
			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			const pendingBadges = screen.getAllByText('Pending')
			expect(pendingBadges).toHaveLength(3)
		})

		it('should show action buttons for each invitation', () => {
			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			const resendButtons = screen.getAllByTitle('Resend invitation')
			const revokeButtons = screen.getAllByTitle('Revoke invitation')

			expect(resendButtons).toHaveLength(3)
			expect(revokeButtons).toHaveLength(3)
		})

		it('should display invitation count in header', () => {
			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			expect(screen.getByText(/Pending Invitations \(3\)/i)).toBeInTheDocument()
		})
	})

	/**
	 * @REQ-UI-005
	 * Scenario: Revoke pending invitation
	 */
	describe('Revoke pending invitation', () => {
		it('should call onRevoke when clicking revoke button', async () => {
			mockOnRevoke.mockResolvedValue(undefined)

			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			const revokeButtons = screen.getAllByTitle('Revoke invitation')
			fireEvent.click(revokeButtons[0])

			await waitFor(() => {
				expect(mockOnRevoke).toHaveBeenCalledWith('inv-1')
			})
		})

		it('should show confirmation dialog before revoking', async () => {
			vi.mocked(global.confirm).mockReturnValue(true)

			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			const revokeButtons = screen.getAllByTitle('Revoke invitation')
			fireEvent.click(revokeButtons[0])

			expect(vi.mocked(global.confirm)).toHaveBeenCalledWith('Are you sure you want to revoke this invitation?')
		})

		it('should not revoke if confirmation is cancelled', async () => {
			vi.mocked(global.confirm).mockReturnValue(false)

			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			const revokeButtons = screen.getAllByTitle('Revoke invitation')
			fireEvent.click(revokeButtons[0])

			expect(mockOnRevoke).not.toHaveBeenCalled()
		})

		it('should disable revoke button while revoking', async () => {
			mockOnRevoke.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			const revokeButtons = screen.getAllByTitle('Revoke invitation')
			fireEvent.click(revokeButtons[0])

			await waitFor(() => {
				expect(revokeButtons[0]).toBeDisabled()
			})
		})

		it('should not show revoke button if onRevoke is not provided', () => {
			render(<PendingInvitations invitations={mockInvitations} onResend={mockOnResend} />)

			const revokeButtons = screen.queryAllByTitle('Revoke invitation')
			expect(revokeButtons).toHaveLength(0)
		})
	})

	/**
	 * @REQ-UI-006
	 * Scenario: Resend invitation
	 */
	describe('Resend invitation', () => {
		it('should call onResend when clicking resend button', async () => {
			mockOnResend.mockResolvedValue(undefined)

			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			const resendButtons = screen.getAllByTitle('Resend invitation')
			fireEvent.click(resendButtons[0])

			await waitFor(() => {
				expect(mockOnResend).toHaveBeenCalledWith('inv-1')
			})
		})

		it('should disable resend button while resending', async () => {
			mockOnResend.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			const resendButtons = screen.getAllByTitle('Resend invitation')
			fireEvent.click(resendButtons[0])

			await waitFor(() => {
				expect(resendButtons[0]).toBeDisabled()
			})
		})

		it('should show loading indicator while resending', async () => {
			mockOnResend.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			const resendButtons = screen.getAllByTitle('Resend invitation')
			fireEvent.click(resendButtons[0])

			// Check for spinning animation class
			const icon = resendButtons[0].querySelector('svg')
			await waitFor(() => {
				expect(icon).toHaveClass('animate-spin')
			})
		})

		it('should not show resend button if onResend is not provided', () => {
			render(<PendingInvitations invitations={mockInvitations} onRevoke={mockOnRevoke} />)

			const resendButtons = screen.queryAllByTitle('Resend invitation')
			expect(resendButtons).toHaveLength(0)
		})
	})

	/**
	 * @REQ-UI-007
	 * Scenario: Empty state
	 */
	describe('Empty state', () => {
		it('should show empty state when no pending invitations', () => {
			render(<PendingInvitations invitations={[]} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			expect(screen.getByText('No pending invitations')).toBeInTheDocument()
			expect(screen.getByText(/Invite team members to collaborate/i)).toBeInTheDocument()
		})

		it('should hide empty state if showEmptyState is false', () => {
			const { container } = render(
				<PendingInvitations invitations={[]} onRevoke={mockOnRevoke} onResend={mockOnResend} showEmptyState={false} />,
			)

			expect(container.firstChild).toBeNull()
		})

		it('should show Invite Team Member CTA in empty state', () => {
			render(<PendingInvitations invitations={[]} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			expect(screen.getByText(/Invite team members/i)).toBeInTheDocument()
		})
	})

	describe('Status filtering', () => {
		it('should only display pending invitations', () => {
			const mixedInvitations = [
				...mockInvitations,
				{
					id: 'inv-4',
					email: 'accepted@example.com',
					role: 'member' as const,
					invited_by: 'owner@example.com',
					created_at: '2025-01-04T00:00:00Z',
					status: 'accepted' as const,
					expires_at: '2025-01-11T00:00:00Z',
				},
				{
					id: 'inv-5',
					email: 'declined@example.com',
					role: 'member' as const,
					invited_by: 'owner@example.com',
					created_at: '2025-01-05T00:00:00Z',
					status: 'declined' as const,
					expires_at: '2025-01-12T00:00:00Z',
				},
			]

			render(<PendingInvitations invitations={mixedInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			// Should only show 3 pending invitations
			expect(screen.getByText(/Pending Invitations \(3\)/i)).toBeInTheDocument()
			expect(screen.queryByText('accepted@example.com')).not.toBeInTheDocument()
			expect(screen.queryByText('declined@example.com')).not.toBeInTheDocument()
		})

		it('should show empty state when all invitations are non-pending', () => {
			const nonPendingInvitations = [
				{
					id: 'inv-1',
					email: 'accepted@example.com',
					role: 'member' as const,
					invited_by: 'owner@example.com',
					created_at: '2025-01-01T00:00:00Z',
					status: 'accepted' as const,
					expires_at: '2025-01-08T00:00:00Z',
				},
			]

			render(<PendingInvitations invitations={nonPendingInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			expect(screen.getByText('No pending invitations')).toBeInTheDocument()
		})
	})

	describe('Status badges', () => {
		it('should display correct status badge styles', () => {
			const statusInvitations = [
				{
					id: 'inv-1',
					email: 'pending@example.com',
					role: 'member' as const,
					invited_by: 'owner@example.com',
					created_at: '2025-01-01T00:00:00Z',
					status: 'pending' as const,
				},
			]

			render(<PendingInvitations invitations={statusInvitations} onRevoke={mockOnRevoke} onResend={mockOnResend} />)

			const badge = screen.getByText('Pending')
			expect(badge).toHaveClass('px-2', 'py-1', 'text-xs', 'font-medium', 'rounded-full')
		})
	})
})
