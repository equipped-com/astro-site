import { FileText, Laptop, ShoppingCart, UserPlus } from 'lucide-react'

interface Action {
	label: string
	description: string
	icon: React.ComponentType<{ className?: string }>
	href: string
	variant?: 'primary' | 'secondary'
}

const actions: Action[] = [
	{
		label: 'Add Device',
		description: 'Register a new device to your fleet',
		icon: Laptop,
		href: '/dashboard/devices?action=add',
		variant: 'primary',
	},
	{
		label: 'Shop Devices',
		description: 'Browse and order new equipment',
		icon: ShoppingCart,
		href: '/dashboard/store',
		variant: 'primary',
	},
	{
		label: 'Add Team Member',
		description: 'Onboard a new employee',
		icon: UserPlus,
		href: '/dashboard/people?action=add',
		variant: 'secondary',
	},
	{
		label: 'Create Proposal',
		description: 'Generate a quote for approval',
		icon: FileText,
		href: '/dashboard/proposals/new',
		variant: 'secondary',
	},
]

export function QuickActions() {
	return (
		<div className="rounded-lg border border-border bg-card p-6">
			<h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
			<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{actions.map(action => {
					const isPrimary = action.variant === 'primary'

					return (
						<a
							key={action.label}
							href={action.href}
							className={`group flex flex-col gap-3 rounded-lg border p-4 transition-all ${
								isPrimary
									? 'border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10'
									: 'border-border bg-background hover:border-primary/50 hover:bg-primary/5'
							}`}
						>
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
									isPrimary ? 'bg-primary/20 group-hover:bg-primary/30' : 'bg-muted group-hover:bg-primary/20'
								}`}
							>
								<action.icon
									className={`h-5 w-5 ${isPrimary ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}
								/>
							</div>
							<div>
								<p className="font-medium text-foreground">{action.label}</p>
								<p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
							</div>
						</a>
					)
				})}
			</div>
		</div>
	)
}
