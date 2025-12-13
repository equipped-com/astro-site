/**
 * Primary Account Selector Component
 *
 * Allows users to set their default/primary account.
 * Only shows accounts the user has access to.
 */

import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Spinner } from '@/components/dashboard/Spinner'

interface Account {
	id: string
	name: string
	short_name: string
	logo_url?: string
	role: string
	is_primary: boolean
	account_access_id: string
}

interface User {
	id: string
	email: string
	first_name?: string
	last_name?: string
	primary_account_id?: string
}

interface PrimaryAccountSelectorProps {
	userId?: string
}

function PrimaryAccountSelector({ userId }: PrimaryAccountSelectorProps) {
	const [accounts, setAccounts] = useState<Account[]>([])
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

	useEffect(() => {
		async function fetchData() {
			try {
				setLoading(true)
				setError(null)

				// Fetch user profile
				const userRes = await fetch('/api/user')
				if (!userRes.ok) throw new Error('Failed to fetch user profile')
				const userData = await userRes.json()
				setUser(userData.user)
				setSelectedAccountId(userData.user.primary_account_id || null)

				// Fetch accessible accounts
				const accountsRes = await fetch('/api/user/accounts')
				if (!accountsRes.ok) throw new Error('Failed to fetch accounts')
				const accountsData = await accountsRes.json()
				setAccounts(accountsData.accounts)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load data')
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [])

	async function handleSetPrimary(accountId: string) {
		setSaving(true)
		setError(null)
		setSuccess(false)

		try {
			const response = await fetch('/api/user/primary-account', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ account_id: accountId }),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to update primary account')
			}

			const data = await response.json()
			setSelectedAccountId(data.user.primary_account_id)
			setSuccess(true)

			setTimeout(() => setSuccess(false), 3000)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update primary account')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Spinner size="md" />
			</div>
		)
	}

	if (!user) {
		return (
			<div className="text-center py-8">
				<p className="text-muted-foreground">User not found</p>
			</div>
		)
	}

	if (accounts.length === 0) {
		return (
			<div className="text-center py-8">
				<p className="text-muted-foreground">No accessible accounts</p>
			</div>
		)
	}

	if (accounts.length === 1) {
		// Only one account, show read-only view
		const account = accounts[0]
		return (
			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-semibold">Default Account</h3>
					<p className="text-sm text-muted-foreground mt-1">
						You have access to one account, which is set as your default
					</p>
				</div>

				<div className="p-4 border rounded-lg bg-muted/50">
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<h4 className="font-medium">{account.name}</h4>
							<p className="text-sm text-muted-foreground">{account.role}</p>
						</div>
						<div className="text-primary">
							<CheckCircle2 size={24} />
						</div>
					</div>
				</div>
			</div>
		)
	}

	// Multiple accounts, show selector
	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-lg font-semibold">Default Account</h3>
				<p className="text-sm text-muted-foreground mt-1">
					Select which account you want to land on after login
				</p>
			</div>

			{error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

			{success && (
				<div className="p-4 bg-green-500/10 text-green-600 rounded-lg text-sm">
					Default account updated successfully!
				</div>
			)}

			<div className="space-y-2">
				{accounts.map(account => (
					<button
						key={account.id}
						onClick={() => handleSetPrimary(account.id)}
						disabled={saving || selectedAccountId === account.id}
						className="w-full p-4 border rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<div className="flex items-center gap-3">
									{account.logo_url && (
										<img
											src={account.logo_url}
											alt={account.name}
											className="h-8 w-8 rounded object-contain"
											onError={e => {
												;(e.target as HTMLImageElement).style.display = 'none'
											}}
										/>
									)}
									<div>
										<h4 className="font-medium">{account.name}</h4>
										<p className="text-sm text-muted-foreground">{account.role}</p>
									</div>
								</div>
							</div>
							{selectedAccountId === account.id && (
								<div className="text-primary">
									<CheckCircle2 size={20} />
								</div>
							)}
						</div>
					</button>
				))}
			</div>
		</div>
	)
}

export default PrimaryAccountSelector
