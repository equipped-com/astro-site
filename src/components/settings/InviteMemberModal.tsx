/**
 * Invite Member Modal Component
 *
 * Modal for inviting new team members by email with role selection.
 */

import { Mail, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import RoleSelector, { type Role } from './RoleSelector'

interface InviteMemberModalProps {
	isOpen: boolean
	onClose: () => void
	onInvite: (email: string, role: Role) => Promise<void>
	canAssignOwner: boolean
}

function InviteMemberModal({ isOpen, onClose, onInvite, canAssignOwner }: InviteMemberModalProps) {
	const [email, setEmail] = useState('')
	const [role, setRole] = useState<Role>('member')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	if (!isOpen) return null

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		setIsSubmitting(true)

		try {
			await onInvite(email, role)
			// Reset form on success
			setEmail('')
			setRole('member')
			onClose()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to send invitation')
		} finally {
			setIsSubmitting(false)
		}
	}

	function handleClose() {
		if (!isSubmitting) {
			setEmail('')
			setRole('member')
			setError(null)
			onClose()
		}
	}

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} onKeyDown={() => {}} />

			{/* Modal */}
			<div className="fixed inset-0 flex items-center justify-center z-50 p-4">
				<div className="bg-background border rounded-lg shadow-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-primary/10 text-primary">
								<UserPlus size={20} />
							</div>
							<h2 className="text-xl font-bold">Invite Team Member</h2>
						</div>
						<button
							type="button"
							onClick={handleClose}
							disabled={isSubmitting}
							className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
						>
							<X size={20} />
						</button>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="p-6 space-y-4">
						{error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

						{/* Email Input */}
						<div>
							<label htmlFor="invite-email" className="block text-sm font-medium mb-2">
								<Mail size={16} className="inline-block mr-2" />
								Email Address
							</label>
							<input
								id="invite-email"
								type="email"
								value={email}
								onChange={e => setEmail(e.target.value)}
								disabled={isSubmitting}
								required
								placeholder="colleague@company.com"
								className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
							/>
						</div>

						{/* Role Selector */}
						<div>
							<label htmlFor="invite-role" className="block text-sm font-medium mb-2">
								Role
							</label>
							<RoleSelector value={role} onChange={setRole} disabled={isSubmitting} canAssignOwner={canAssignOwner} />
						</div>

						{/* Info */}
						<div className="p-4 bg-muted rounded-lg text-sm">
							<p className="text-muted-foreground">
								An invitation email will be sent to <strong>{email || 'the email address'}</strong> with instructions to
								join your account.
							</p>
						</div>

						{/* Actions */}
						<div className="flex gap-3 pt-2">
							<button
								type="submit"
								disabled={isSubmitting || !email}
								className="flex-1 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isSubmitting ? 'Sending...' : 'Send Invitation'}
							</button>
							<button
								type="button"
								onClick={handleClose}
								disabled={isSubmitting}
								className="px-6 py-2 border rounded-lg font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			</div>
		</>
	)
}

export default InviteMemberModal
