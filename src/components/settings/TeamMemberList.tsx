/**
 * Team Member List Component
 *
 * Displays team members in a table with role management and removal actions.
 */

import { Crown, Shield, Trash2, User } from 'lucide-react'
import { useState } from 'react'
import RoleSelector, { type Role } from './RoleSelector'

interface TeamMember {
	id: string
	user_id: string
	email: string
	first_name?: string
	last_name?: string
	role: Role
	created_at: string
}

interface TeamMemberListProps {
	members: TeamMember[]
	currentUserId?: string
	currentUserRole: Role
	onChangeRole: (accessId: string, newRole: Role) => Promise<void>
	onRemoveMember: (accessId: string, memberEmail: string) => Promise<void>
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr)
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getFullName(member: TeamMember): string {
	if (member.first_name && member.last_name) {
		return `${member.first_name} ${member.last_name}`
	}
	if (member.first_name) return member.first_name
	if (member.last_name) return member.last_name
	return member.email.split('@')[0] || 'Unknown'
}

function getRoleIcon(role: Role) {
	switch (role) {
		case 'owner':
			return <Crown size={16} className="text-amber-500" />
		case 'admin':
			return <Shield size={16} className="text-primary" />
		default:
			return <User size={16} className="text-muted-foreground" />
	}
}

function TeamMemberList({
	members,
	currentUserId,
	currentUserRole,
	onChangeRole,
	onRemoveMember,
}: TeamMemberListProps) {
	const [changingRole, setChangingRole] = useState<string | null>(null)
	const [removing, setRemoving] = useState<string | null>(null)

	const canManage = currentUserRole === 'owner' || currentUserRole === 'admin'
	const canAssignOwner = currentUserRole === 'owner'

	async function handleRoleChange(accessId: string, newRole: Role) {
		setChangingRole(accessId)
		try {
			await onChangeRole(accessId, newRole)
		} finally {
			setChangingRole(null)
		}
	}

	async function handleRemove(accessId: string, memberEmail: string) {
		if (!confirm(`Remove ${memberEmail} from this account? They will no longer have access.`)) {
			return
		}

		setRemoving(accessId)
		try {
			await onRemoveMember(accessId, memberEmail)
		} catch (err) {
			// Error is handled by the parent component or silently ignored
		} finally {
			setRemoving(null)
		}
	}

	return (
		<div className="border rounded-lg overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-muted border-b">
						<tr>
							<th className="text-left px-6 py-3 font-semibold text-sm">Name</th>
							<th className="text-left px-6 py-3 font-semibold text-sm">Email</th>
							<th className="text-left px-6 py-3 font-semibold text-sm">Role</th>
							<th className="text-left px-6 py-3 font-semibold text-sm">Joined</th>
							<th className="text-left px-6 py-3 font-semibold text-sm">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y">
						{members.map(member => {
							const isCurrentUser = currentUserId === member.user_id
							const canEdit = canManage && !isCurrentUser

							return (
								<tr key={member.id} className="hover:bg-muted/50">
									<td className="px-6 py-4">
										<div className="flex items-center gap-2">
											{getRoleIcon(member.role)}
											<span className="font-medium">
												{getFullName(member)}
												{isCurrentUser && <span className="text-muted-foreground ml-2">(You)</span>}
											</span>
										</div>
									</td>
									<td className="px-6 py-4 text-sm text-muted-foreground">{member.email}</td>
									<td className="px-6 py-4">
										{canEdit ? (
											<RoleSelector
												value={member.role}
												onChange={newRole => handleRoleChange(member.id, newRole)}
												disabled={changingRole === member.id}
												canAssignOwner={canAssignOwner}
											/>
										) : (
											<span className="px-3 py-1 bg-muted rounded-full text-sm font-medium capitalize">
												{member.role}
											</span>
										)}
									</td>
									<td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(member.created_at)}</td>
									<td className="px-6 py-4">
										{canEdit ? (
											<button
												type="button"
												onClick={() => handleRemove(member.id, member.email)}
												disabled={removing === member.id}
												className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												title="Remove member"
											>
												<Trash2 size={16} />
											</button>
										) : (
											<span className="text-sm text-muted-foreground">--</span>
										)}
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default TeamMemberList
