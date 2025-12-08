/**
 * Pending Invitations Component
 *
 * Displays list of pending team invitations.
 */

import { Clock, Mail, X } from 'lucide-react'
import type { Role } from './RoleSelector'

interface PendingInvitation {
	id: string
	email: string
	role: Role
	invited_by: string
	created_at: string
}

interface PendingInvitationsProps {
	invitations: PendingInvitation[]
	onRevoke?: (invitationId: string) => Promise<void>
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

function PendingInvitations({ invitations, onRevoke }: PendingInvitationsProps) {
	if (invitations.length === 0) {
		return null
	}

	return (
		<div className="border rounded-lg overflow-hidden">
			<div className="bg-muted px-6 py-3 border-b">
				<h3 className="font-semibold flex items-center gap-2">
					<Clock size={16} />
					Pending Invitations ({invitations.length})
				</h3>
			</div>

			<div className="divide-y">
				{invitations.map(invitation => (
					<div key={invitation.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/50">
						<div className="flex items-center gap-4">
							<div className="p-2 rounded-full bg-primary/10 text-primary">
								<Mail size={16} />
							</div>
							<div>
								<div className="font-medium">{invitation.email}</div>
								<div className="text-sm text-muted-foreground">
									Invited {formatDate(invitation.created_at)} as {getRoleLabel(invitation.role)}
								</div>
							</div>
						</div>

						{onRevoke && (
							<button
								type="button"
								onClick={() => onRevoke(invitation.id)}
								className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
								title="Revoke invitation"
							>
								<X size={16} />
							</button>
						)}
					</div>
				))}
			</div>
		</div>
	)
}

export default PendingInvitations
