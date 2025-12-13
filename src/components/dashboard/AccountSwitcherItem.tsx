'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Account } from './AccountSwitcher'

interface AccountSwitcherItemProps {
	account: Account
	isCurrent: boolean
	onSelect: (account: Account) => void
}

export function AccountSwitcherItem({ account, isCurrent, onSelect }: AccountSwitcherItemProps) {
	return (
		<button
			type="button"
			onClick={() => onSelect(account)}
			disabled={isCurrent}
			data-account-item
			className={cn(
				'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left',
				'hover:bg-muted/50 focus:bg-muted/50 focus:outline-none',
				'transition-colors duration-150',
				isCurrent && 'bg-muted/70 cursor-default'
			)}
			role="option"
			aria-selected={isCurrent}
		>
			{/* Account logo or initials */}
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
				{account.logo_url ? (
					<img src={account.logo_url} alt={account.name} className="h-full w-full rounded-full object-cover" />
				) : (
					<span className="text-sm font-semibold">
						{account.name
							.split(' ')
							.map((word) => word[0])
							.join('')
							.toUpperCase()
							.slice(0, 2)}
					</span>
				)}
			</div>

			{/* Account details */}
			<div className="flex flex-1 flex-col">
				<span className="text-sm font-medium text-foreground">{account.name}</span>
				<span className="text-xs text-muted-foreground capitalize">{account.role}</span>
			</div>

			{/* Check mark for current account */}
			{isCurrent && <Check className="h-4 w-4 shrink-0 text-primary" aria-label="Current account" />}
		</button>
	)
}
