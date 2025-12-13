/**
 * Pending Invitations Component
 *
 * Displays list of pending team invitations with resend and revoke functionality.
 */

import { Clock, Mail, RefreshCw, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import type { Role } from './RoleSelector'

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired'

interface PendingInvitation {
	id: string
	email: string
	role: Role
	invited_by: string
	created_at: string
	status: InvitationStatus
	expires_at?: string
}

interface PendingInvitationsProps {
	invitations: PendingInvitation[]
	onRevoke?: (invitationId: string) => Promise<void>
	onResend?: (invitationId: string) => Promise<void>
	showEmptyState?: boolean
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr)
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

	if (diffDays === 0) return 'Today'
	if (diffDays === 1) return 'Yesterday'
	if (diffDays < 7) return `${diffDays} days ago`

	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getRoleLabel(role: Role): string {
	const labels: Record<Role, string> = {
		owner: 'Owner',
		admin: 'Admin',
		member: 'Member',
		buyer: 'Buyer',
		viewer: 'Viewer',
		noaccess: 'No Access',
	}
	return labels[role]
}

function getStatusBadge(status: InvitationStatus) {
	const statusConfig = {
		pending: {
			label: 'Pending',
			className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
		},
		accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
		declined: { label: 'Declined', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
		revoked: { label: 'Revoked', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
		expired: {
			label: 'Expired',
			className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
		},
	}

	const config = statusConfig[status]
	return <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>{config.label}</span>
}

function PendingInvitations({ invitations, onRevoke, onResend, showEmptyState = true }: PendingInvitationsProps) {
	const [resendingId, setResendingId] = useState<string | null>(null)
	const [revokingId, setRevokingId] = useState<string | null>(null)

	// Filter only pending invitations
	const pendingInvitations = invitations.filter(inv => inv.status === 'pending')

	async function handleResend(invitationId: string) {
		if (!onResend) return

		setResendingId(invitationId)
		try {
			await onResend(invitationId)
		} catch (error) {
			console.error('Failed to resend invitation:', error)
		} finally {
			setResendingId(null)
		}
	}

	async function handleRevoke(invitationId: string) {
		if (!onRevoke) return

		// Confirmation dialog
		const confirmed = confirm('Are you sure you want to revoke this invitation?')
		if (!confirmed) return

		setRevokingId(invitationId)
		try {
			await onRevoke(invitationId)
		} catch (error) {
			console.error('Failed to revoke invitation:', error)
		} finally {
			setRevokingId(null)
		}
	}

	// Empty state
	if (pendingInvitations.length === 0) {
		if (!showEmptyState) return null

		return (
			<div className="border rounded-lg overflow-hidden">
				<div className="bg-muted px-6 py-3 border-b">
					<h3 className="font-semibold flex items-center gap-2">
						<Clock size={16} />
						Pending Invitations
					</h3>
				</div>
				<div className="px-6 py-12 text-center">
					<div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
						<UserPlus size={24} className="text-muted-foreground" />
					</div>
					<p className="text-muted-foreground mb-2">No pending invitations</p>
					<p className="text-sm text-muted-foreground">Invite team members to collaborate on your account</p>
				</div>
			</div>
		)
	}

	return (
		<div className="border rounded-lg overflow-hidden">
			<div className="bg-muted px-6 py-3 border-b">
				<h3 className="font-semibold flex items-center gap-2">
					<Clock size={16} />
					Pending Invitations ({pendingInvitations.length})
				</h3>
			</div>

			<div className="divide-y">
				{pendingInvitations.map(invitation => (
					<div key={invitation.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/50">
						<div className="flex items-center gap-4 flex-1">
							<div className="p-2 rounded-full bg-primary/10 text-primary">
								<Mail size={16} />
							</div>
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<span className="font-medium">{invitation.email}</span>
									{getStatusBadge(invitation.status)}
								</div>
								<div className="text-sm text-muted-foreground">
									Invited {formatDate(invitation.created_at)} as {getRoleLabel(invitation.role)}
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2">
							{onResend && (
								<button
									type="button"
									onClick={() => handleResend(invitation.id)}
									disabled={resendingId === invitation.id}
									className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-50"
									title="Resend invitation"
								>
									<RefreshCw size={16} className={resendingId === invitation.id ? 'animate-spin' : ''} />
								</button>
							)}

							{onRevoke && (
								<button
									type="button"
									onClick={() => handleRevoke(invitation.id)}
									disabled={revokingId === invitation.id}
									className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
									title="Revoke invitation"
								>
									<X size={16} />
								</button>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default PendingInvitations
