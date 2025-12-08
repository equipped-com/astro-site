/**
 * Organization Form Component
 *
 * Allows editing organization profile, billing info, and address.
 * Includes danger zone for account deletion.
 */

import { AlertTriangle, Building2, Mail, MapPin, Trash2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Spinner } from '@/components/dashboard/Spinner'

interface Organization {
	id: string
	short_name: string
	name: string
	billing_email?: string
	address?: string
	logo_url?: string
	created_at: string
	updated_at?: string
}

interface OrganizationFormProps {
	accountId: string
	role: 'owner' | 'admin' | 'member' | 'buyer' | 'noaccess'
}

function OrganizationForm({ accountId, role }: OrganizationFormProps) {
	const [organization, setOrganization] = useState<Organization | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)

	// Form state
	const [name, setName] = useState('')
	const [billingEmail, setBillingEmail] = useState('')
	const [address, setAddress] = useState('')
	const [logoUrl, setLogoUrl] = useState('')

	// Deletion state
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [deleteConfirmName, setDeleteConfirmName] = useState('')
	const [deleting, setDeleting] = useState(false)

	const canEdit = role === 'owner' || role === 'admin'
	const canDelete = role === 'owner'

	useEffect(() => {
		async function fetchOrganization() {
			try {
				const response = await fetch('/api/organization')
				if (!response.ok) throw new Error('Failed to fetch organization')

				const data = await response.json()
				setOrganization(data.organization)
				setName(data.organization.name || '')
				setBillingEmail(data.organization.billing_email || '')
				setAddress(data.organization.address || '')
				setLogoUrl(data.organization.logo_url || '')
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load organization')
			} finally {
				setLoading(false)
			}
		}

		fetchOrganization()
	}, [])

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!canEdit) return

		setSaving(true)
		setError(null)
		setSuccess(false)

		try {
			const response = await fetch('/api/organization', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					billing_email: billingEmail,
					address,
					logo_url: logoUrl,
				}),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.message || 'Failed to update organization')
			}

			const data = await response.json()
			setOrganization(data.organization)
			setSuccess(true)

			setTimeout(() => setSuccess(false), 3000)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update organization')
		} finally {
			setSaving(false)
		}
	}

	async function handleDelete() {
		if (!canDelete || deleteConfirmName !== organization?.name) return

		setDeleting(true)
		setError(null)

		try {
			const response = await fetch('/api/organization', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ confirm_name: deleteConfirmName }),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.message || 'Failed to delete organization')
			}

			// Redirect to sign-out after deletion
			window.location.href = '/sign-out'
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete organization')
			setDeleting(false)
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Spinner size="lg" />
			</div>
		)
	}

	if (!organization) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">Organization not found</p>
			</div>
		)
	}

	return (
		<div className="space-y-8">
			{/* Organization Profile */}
			<form onSubmit={handleSubmit} className="space-y-6">
				<div>
					<h2 className="text-2xl font-bold">Organization Profile</h2>
					<p className="text-muted-foreground mt-1">Update your company information and billing details</p>
				</div>

				{error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

				{success && (
					<div className="p-4 bg-green-500/10 text-green-600 rounded-lg text-sm">
						Organization updated successfully!
					</div>
				)}

				<div className="space-y-4">
					{/* Company Name */}
					<div>
						<label htmlFor="name" className="block text-sm font-medium mb-2">
							<Building2 size={16} className="inline-block mr-2" />
							Company Name
						</label>
						<input
							id="name"
							type="text"
							value={name}
							onChange={e => setName(e.target.value)}
							disabled={!canEdit}
							required
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
						/>
					</div>

					{/* Billing Email */}
					<div>
						<label htmlFor="billing-email" className="block text-sm font-medium mb-2">
							<Mail size={16} className="inline-block mr-2" />
							Billing Email
						</label>
						<input
							id="billing-email"
							type="email"
							value={billingEmail}
							onChange={e => setBillingEmail(e.target.value)}
							disabled={!canEdit}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
						/>
					</div>

					{/* Address */}
					<div>
						<label htmlFor="address" className="block text-sm font-medium mb-2">
							<MapPin size={16} className="inline-block mr-2" />
							Address
						</label>
						<textarea
							id="address"
							value={address}
							onChange={e => setAddress(e.target.value)}
							disabled={!canEdit}
							rows={3}
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
						/>
					</div>

					{/* Logo URL */}
					<div>
						<label htmlFor="logo-url" className="block text-sm font-medium mb-2">
							<Upload size={16} className="inline-block mr-2" />
							Logo URL
						</label>
						<input
							id="logo-url"
							type="url"
							value={logoUrl}
							onChange={e => setLogoUrl(e.target.value)}
							disabled={!canEdit}
							placeholder="https://example.com/logo.png"
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
						/>
						{logoUrl && (
							<div className="mt-3">
								<img
									src={logoUrl}
									alt="Company logo"
									className="h-16 w-auto rounded border"
									onError={e => {
										;(e.target as HTMLImageElement).style.display = 'none'
									}}
								/>
							</div>
						)}
					</div>
				</div>

				{canEdit && (
					<div className="flex gap-3">
						<button
							type="submit"
							disabled={saving}
							className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{saving ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				)}

				{!canEdit && (
					<div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
						You do not have permission to edit organization settings. Contact your account owner.
					</div>
				)}
			</form>

			{/* Danger Zone */}
			{canDelete && (
				<div id="danger-zone" className="border border-destructive/50 rounded-lg p-6 bg-destructive/5">
					<div className="flex items-start gap-4">
						<div className="p-2 rounded-lg bg-destructive/10 text-destructive">
							<AlertTriangle size={24} />
						</div>
						<div className="flex-1">
							<h3 className="text-xl font-bold text-destructive">Danger Zone</h3>
							<p className="text-sm text-muted-foreground mt-1">
								Permanently delete this organization and all associated data.
							</p>

							{!showDeleteConfirm ? (
								<button
									type="button"
									onClick={() => setShowDeleteConfirm(true)}
									className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90"
								>
									<Trash2 size={16} className="inline-block mr-2" />
									Delete Organization
								</button>
							) : (
								<div className="mt-4 space-y-4">
									<div className="p-4 bg-background rounded-lg border border-destructive">
										<p className="text-sm font-medium mb-3">
											This action cannot be undone. Type <strong>{organization.name}</strong> to confirm:
										</p>
										<input
											type="text"
											value={deleteConfirmName}
											onChange={e => setDeleteConfirmName(e.target.value)}
											placeholder="Organization name"
											className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
										/>
									</div>
									<div className="flex gap-3">
										<button
											type="button"
											onClick={handleDelete}
											disabled={deleting || deleteConfirmName !== organization.name}
											className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{deleting ? 'Deleting...' : 'Confirm Deletion'}
										</button>
										<button
											type="button"
											onClick={() => {
												setShowDeleteConfirm(false)
												setDeleteConfirmName('')
											}}
											disabled={deleting}
											className="px-4 py-2 border rounded-lg font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Cancel
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default OrganizationForm
