/**
 * Admin Dashboard Sidebar
 *
 * Navigation sidebar for the sys admin dashboard with global views.
 */
import { Building2, Flag, Package, Settings, ShoppingCart, Users } from 'lucide-react'
import { useState } from 'react'

interface NavItem {
	label: string
	href: string
	icon: React.ElementType
	active?: boolean
}

export default function AdminSidebar() {
	const [currentPath] = useState(
		typeof window !== 'undefined' ? window.location.pathname : '',
	)

	const navItems: NavItem[] = [
		{
			label: 'Customers',
			href: '/admin/customers',
			icon: Building2,
			active: currentPath.startsWith('/admin/customers'),
		},
		{
			label: 'Global Devices',
			href: '/admin/devices',
			icon: Package,
			active: currentPath.startsWith('/admin/devices'),
		},
		{
			label: 'Global Orders',
			href: '/admin/orders',
			icon: ShoppingCart,
			active: currentPath.startsWith('/admin/orders'),
		},
		{
			label: 'Users',
			href: '/admin/users',
			icon: Users,
			active: currentPath.startsWith('/admin/users'),
		},
		{
			label: 'Feature Flags',
			href: '/admin/flags',
			icon: Flag,
			active: currentPath.startsWith('/admin/flags'),
		},
		{
			label: 'System Settings',
			href: '/admin/settings',
			icon: Settings,
			active: currentPath.startsWith('/admin/settings'),
		},
	]

	return (
		<aside className="w-64 border-r border-border bg-card">
			<nav className="space-y-1 p-4">
				{navItems.map((item) => {
					const Icon = item.icon
					return (
						<a
							key={item.href}
							href={item.href}
							className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
								item.active
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
							}`}
						>
							<Icon className="h-4 w-4" />
							<span>{item.label}</span>
						</a>
					)
				})}
			</nav>

			<div className="border-t border-border p-4">
				<div className="rounded-md bg-amber-50 p-3 text-xs">
					<p className="font-medium text-amber-900">Admin Access</p>
					<p className="text-amber-700 mt-1">
						You have full access to all customer data. All actions are logged.
					</p>
				</div>
			</div>
		</aside>
	)
}
