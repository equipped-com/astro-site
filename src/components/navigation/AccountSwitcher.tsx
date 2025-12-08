import { useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'

interface Account {
	id: string
	name: string
	short_name: string
	role: string
}

export function AccountSwitcher() {
	const { user } = useUser()
	const [accounts, setAccounts] = useState<Account[]>([])
	const [currentAccount, setCurrentAccount] = useState<Account | null>(null)

	useEffect(() => {
		if (user) {
			fetch('/api/user/accounts')
				.then(res => res.json())
				.then(data => setAccounts(data.accounts))
		}
	}, [user])

	async function switchAccount(accountId: string) {
		await fetch(`/api/user/accounts/${accountId}/switch`, { method: 'POST' })
		window.location.reload()
	}

	if (accounts.length <= 1) return null

	return (
		<div className="relative">
			<select
				value={currentAccount?.id ?? ''}
				onChange={e => switchAccount(e.target.value)}
				className="bg-background border border-border rounded-md px-3 py-1.5 text-sm"
			>
				{accounts.map(account => (
					<option key={account.id} value={account.id}>
						{account.name}
					</option>
				))}
			</select>
		</div>
	)
}
