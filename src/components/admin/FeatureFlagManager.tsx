/**
 * Feature Flag Manager Component
 *
 * Allows sys admins to manage feature flags across all accounts.
 */
import { Flag, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Spinner } from '../dashboard/Spinner'

interface FeatureFlag {
	key: string
	name: string
	description: string
	enabled_globally: boolean
}

interface AccountFlag {
	account_id: string
	account_name: string
	flags: Record<string, boolean>
}

export default function FeatureFlagManager() {
	const [flags, setFlags] = useState<FeatureFlag[]>([])
	const [accountFlags, setAccountFlags] = useState<AccountFlag[]>([])
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [saveError, setSaveError] = useState<string | null>(null)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	useEffect(() => {
		async function fetchFlags() {
			try {
				const response = await fetch('/api/admin/flags')
				if (!response.ok) {
					throw new Error('Failed to fetch feature flags')
				}
				const data = await response.json()
				setFlags(data.flags)
				setAccountFlags(data.accountFlags)
			} catch (err) {
				setLoadError(err instanceof Error ? err.message : 'Unknown error')
			} finally {
				setLoading(false)
			}
		}

		fetchFlags()
	}, [])

	function toggleAccountFlag(accountId: string, flagKey: string) {
		setAccountFlags(prev =>
			prev.map(account =>
				account.account_id === accountId
					? {
							...account,
							flags: {
								...account.flags,
								[flagKey]: !account.flags[flagKey],
							},
						}
					: account,
			),
		)
	}

	async function handleSave() {
		setSaving(true)
		setSaveError(null)
		setSuccessMessage(null)

		try {
			const response = await fetch('/api/admin/flags', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ accountFlags }),
			})

			if (!response.ok) {
				throw new Error('Failed to save feature flags')
			}

			setSuccessMessage('Feature flags updated successfully')
			setTimeout(() => setSuccessMessage(null), 3000)
		} catch (err) {
			setSaveError(err instanceof Error ? err.message : 'Unknown error')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className="flex justify-center py-12">
				<Spinner />
			</div>
		)
	}

	if (loadError) {
		return (
			<div className="rounded-md bg-red-50 p-4 text-red-900">
				<p className="font-medium">Error loading feature flags</p>
				<p className="text-sm">{loadError}</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Success message */}
			{successMessage && (
				<div className="rounded-md bg-green-50 p-4 text-green-900">
					<p className="font-medium">{successMessage}</p>
				</div>
			)}

			{/* Error message */}
			{saveError && (
				<div className="rounded-md bg-red-50 p-4 text-red-900">
					<p className="font-medium">Error saving flags</p>
					<p className="text-sm">{saveError}</p>
				</div>
			)}

			{/* Available flags */}
			<div className="rounded-lg border border-border bg-card p-6">
				<h2 className="text-lg font-semibold mb-4">Available Feature Flags</h2>
				<div className="space-y-3">
					{flags.map(flag => (
						<div key={flag.key} className="flex items-start gap-3">
							<Flag className="h-5 w-5 text-muted-foreground mt-0.5" />
							<div>
								<p className="font-medium">{flag.name}</p>
								<p className="text-sm text-muted-foreground">{flag.description}</p>
								<p className="text-xs text-muted-foreground mt-1">Key: {flag.key}</p>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Account-level flags */}
			<div className="rounded-lg border border-border bg-card p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold">Account Feature Flags</h2>
					<button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
					>
						<Save className="h-4 w-4" />
						{saving ? 'Saving...' : 'Save Changes'}
					</button>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Account
								</th>
								{flags.map(flag => (
									<th
										key={flag.key}
										className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
									>
										{flag.name}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{accountFlags.map(account => (
								<tr key={account.account_id} className="hover:bg-muted/50">
									<td className="px-4 py-3 text-sm font-medium">{account.account_name}</td>
									{flags.map(flag => (
										<td key={flag.key} className="px-4 py-3 text-center">
											<button
												type="button"
												onClick={() => toggleAccountFlag(account.account_id, flag.key)}
												className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
													account.flags[flag.key] ? 'bg-primary' : 'bg-muted'
												}`}
											>
												<span
													className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
														account.flags[flag.key] ? 'translate-x-6' : 'translate-x-1'
													}`}
												/>
											</button>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
