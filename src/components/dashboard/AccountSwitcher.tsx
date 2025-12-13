'use client'

import { Check, ChevronDown, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export interface Account {
	id: string
	name: string
	short_name: string
	logo_url?: string
	role: 'owner' | 'admin' | 'member' | 'buyer'
}

interface AccountSwitcherProps {
	currentAccount: Account
	accounts: Account[]
	onSwitch?: (account: Account) => void
	isLoading?: boolean
}

export function AccountSwitcher({ currentAccount, accounts, onSwitch, isLoading = false }: AccountSwitcherProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [isSwitching, setIsSwitching] = useState(false)

	// Hide switcher if user has only one account
	if (accounts.length <= 1) {
		return null
	}

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as HTMLElement
			if (!target.closest('[data-account-switcher]')) {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('click', handleClickOutside)
			return () => document.removeEventListener('click', handleClickOutside)
		}
	}, [isOpen])

	// Handle keyboard navigation
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (!isOpen) return

			if (event.key === 'Escape') {
				setIsOpen(false)
			} else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault()
				const items = document.querySelectorAll('[data-account-item]')
				const currentIndex = Array.from(items).findIndex((item) => item === document.activeElement)

				let nextIndex: number
				if (event.key === 'ArrowDown') {
					nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
				} else {
					nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
				}

				;(items[nextIndex] as HTMLElement)?.focus()
			} else if (event.key === 'Enter') {
				event.preventDefault()
				const activeItem = document.activeElement as HTMLElement
				activeItem?.click()
			}
		}

		if (isOpen) {
			document.addEventListener('keydown', handleKeyDown)
			return () => document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen])

	function handleSwitch(account: Account) {
		if (account.id === currentAccount.id || isSwitching) return

		setIsSwitching(true)
		setIsOpen(false)

		if (onSwitch) {
			onSwitch(account)
		} else {
			// Default navigation to subdomain
			const protocol = window.location.protocol
			const baseDomain = window.location.hostname.split('.').slice(-2).join('.')
			const newUrl = `${protocol}//${account.short_name}.${baseDomain}`
			window.location.href = newUrl
		}
	}

	const disabled = isSwitching || isLoading

	return (
		<div className="relative" data-account-switcher>
			{/* Trigger button */}
			<button
				type="button"
				onClick={() => !disabled && setIsOpen(!isOpen)}
				disabled={disabled}
				className={cn(
					'flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2',
					'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
					'transition-colors duration-200',
					disabled && 'cursor-not-allowed opacity-50'
				)}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
			>
				{/* Account logo or initials */}
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
					{currentAccount.logo_url ? (
						<img
							src={currentAccount.logo_url}
							alt={currentAccount.name}
							className="h-full w-full rounded-full object-cover"
						/>
					) : (
						<span className="text-sm font-semibold">
							{currentAccount.name
								.split(' ')
								.map((word) => word[0])
								.join('')
								.toUpperCase()
								.slice(0, 2)}
						</span>
					)}
				</div>

				{/* Account name */}
				<div className="flex flex-col items-start">
					<span className="text-sm font-medium text-foreground">{currentAccount.name}</span>
					<span className="text-xs text-muted-foreground capitalize">{currentAccount.role}</span>
				</div>

				{/* Dropdown icon or loading spinner */}
				{isSwitching ? (
					<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
				) : (
					<ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
				)}
			</button>

			{/* Dropdown menu */}
			{isOpen && !disabled && (
				<div
					className={cn(
						'absolute left-0 top-full z-50 mt-2 min-w-[280px] rounded-md border border-border bg-background shadow-lg',
						'animate-in fade-in-0 zoom-in-95'
					)}
					role="listbox"
					aria-label="Switch account"
				>
					<div className="p-2">
						{accounts.map((account) => {
							const isCurrent = account.id === currentAccount.id

							return (
								<button
									key={account.id}
									type="button"
									onClick={() => handleSwitch(account)}
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
											<img
												src={account.logo_url}
												alt={account.name}
												className="h-full w-full rounded-full object-cover"
											/>
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
						})}
					</div>
				</div>
			)}
		</div>
	)
}
