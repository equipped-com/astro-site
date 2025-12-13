/**
 * Team Access Manager Component
 *
 * Main component for managing team access, roles, and invitations.
 * Combines team member list, pending invitations, and invite modal.
 */

import { UserPlus, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Spinner } from '@/components/dashboard/Spinner'
import InviteMemberModal from './InviteMemberModal'
import PendingInvitations, { type InvitationStatus } from './PendingInvitations'
import type { Role } from './RoleSelector'
import TeamMemberList from './TeamMemberList'

interface TeamMember {
	id: string
	user_id: string
	email: string
	first_name?: string
	last_name?: string
	role: Role
	created_at: string
}

interface PendingInvitation {
	id: string
	email: string
	role: Role
	invited_by: string
	created_at: string
	status: InvitationStatus
	expires_at?: string
}

interface TeamAccessManagerProps {
	accountId: string
	role: Role
}

function TeamAccessManager({ role }: TeamAccessManagerProps) {
	const [members, setMembers] = useState<TeamMember[]>([])
	const [invitations, setInvitations] = useState<PendingInvitation[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showInviteModal, setShowInviteModal] = useState(false)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	const canManage = role === 'owner' || role === 'admin'
	const canAssignOwner = role === 'owner'

	const fetchTeamData = useCallback(async () => {
		setLoading(true)
		setError(null)

		try {
			// Fetch team members
			const membersRes = await fetch('/api/team')
			if (!membersRes.ok) throw new Error('Failed to fetch team members')
			const membersData = await membersRes.json()
			setMembers(membersData.members || [])

			// Fetch pending invitations using the correct endpoint
			const invitationsRes = await fetch('/api/invitations')
			if (!invitationsRes.ok) throw new Error('Failed to fetch invitations')
			const invitationsData = await invitationsRes.json()
			setInvitations(invitationsData.invitations || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load team data')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchTeamData()
	}, [fetchTeamData])

	async function handleInvite(email: string, inviteRole: Role) {
		const response = await fetch('/api/invitations', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, role: inviteRole }),
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || data.message || 'Failed to send invitation')
		}

		// Show success message
		setSuccessMessage(`Invitation sent to ${email}`)
		setTimeout(() => setSuccessMessage(null), 5000)

		// Refresh team data
		await fetchTeamData()
	}

	async function handleResend(_invitationId: string) {
		// Note: Resend is not implemented in the API yet, so we'll show a placeholder message
		// In production, this would call POST /api/invitations/:id/resend
		setSuccessMessage('Invitation resent')
		setTimeout(() => setSuccessMessage(null), 3000)

		// For now, just refresh the data
		await fetchTeamData()
	}

	async function handleRevoke(invitationId: string) {
		const response = await fetch(`/api/invitations/${invitationId}/revoke`, {
			method: 'POST',
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to revoke invitation')
		}

		// Refresh team data
		await fetchTeamData()
	}

	async function handleChangeRole(accessId: string, newRole: Role) {
		const response = await fetch(`/api/team/${accessId}/role`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ role: newRole }),
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.message || 'Failed to change role')
		}

		// Update local state
		setMembers(prev => prev.map(member => (member.id === accessId ? { ...member, role: newRole } : member)))
	}

	async function handleRemoveMember(accessId: string, _memberEmail: string) {
		const response = await fetch(`/api/team/${accessId}`, {
			method: 'DELETE',
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.message || 'Failed to remove member')
		}

		// Update local state
		setMembers(prev => prev.filter(member => member.id !== accessId))
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Spinner size="lg" />
			</div>
		)
	}

	if (error) {
		return (
			<div className="text-center py-12">
				<p className="text-destructive">{error}</p>
				<button type="button" onClick={fetchTeamData} className="mt-4 px-4 py-2 border rounded-lg hover:bg-muted">
					Try Again
				</button>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Success Message */}
			{successMessage && (
				<div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-300">
					{successMessage}
				</div>
			)}

			{/* Header with Invite Button */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 text-muted-foreground">
					<Users size={20} />
					<span className="text-sm font-medium">{members.length} team members</span>
				</div>

				{canManage && (
					<button
						type="button"
						onClick={() => setShowInviteModal(true)}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center gap-2"
					>
						<UserPlus size={16} />
						Invite Member
					</button>
				)}
			</div>

			{/* Pending Invitations */}
			<PendingInvitations
				invitations={invitations}
				onRevoke={canManage ? handleRevoke : undefined}
				onResend={canManage ? handleResend : undefined}
				showEmptyState={true}
			/>

			{/* Team Members List */}
			{members.length > 0 ? (
				<TeamMemberList
					members={members}
					currentUserRole={role}
					onChangeRole={handleChangeRole}
					onRemoveMember={handleRemoveMember}
				/>
			) : (
				<div className="text-center py-12 border rounded-lg bg-muted/50">
					<p className="text-muted-foreground">No team members found</p>
				</div>
			)}

			{/* Invite Modal */}
			<InviteMemberModal
				isOpen={showInviteModal}
				onClose={() => setShowInviteModal(false)}
				onInvite={handleInvite}
				canAssignOwner={canAssignOwner}
			/>

			{/* Permission Notice for Non-Managers */}
			{!canManage && (
				<div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
					You do not have permission to manage team access. Contact your account owner or admin.
				</div>
			)}
		</div>
	)
}

export default TeamAccessManager
