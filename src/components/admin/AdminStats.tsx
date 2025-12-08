/**
 * Admin Stats Component
 *
 * Displays global platform statistics for sys admins.
 */
import { Building2, Package, ShoppingCart, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Spinner } from '../dashboard/Spinner'

interface Stats {
	totalCustomers: number
	totalDevices: number
	totalOrders: number
	totalUsers: number
}

export default function AdminStats() {
	const [stats, setStats] = useState<Stats | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchStats() {
			try {
				const response = await fetch('/api/admin/stats')
				if (!response.ok) {
					throw new Error('Failed to fetch stats')
				}
				const data = await response.json()
				setStats(data)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error')
			} finally {
				setLoading(false)
			}
		}

		fetchStats()
	}, [])

	if (loading) {
		return (
			<div className="flex justify-center py-12">
				<Spinner />
			</div>
		)
	}

	if (error) {
		return (
			<div className="rounded-md bg-red-50 p-4 text-red-900">
				<p className="font-medium">Error loading stats</p>
				<p className="text-sm">{error}</p>
			</div>
		)
	}

	if (!stats) {
		return null
	}

	const statCards = [
		{
			label: 'Total Customers',
			value: stats.totalCustomers,
			icon: Building2,
			href: '/admin/customers',
		},
		{
			label: 'Total Devices',
			value: stats.totalDevices,
			icon: Package,
			href: '/admin/devices',
		},
		{
			label: 'Total Orders',
			value: stats.totalOrders,
			icon: ShoppingCart,
			href: '/admin/orders',
		},
		{
			label: 'Total Users',
			value: stats.totalUsers,
			icon: Users,
			href: '/admin/users',
		},
	]

	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{statCards.map(stat => {
				const Icon = stat.icon
				return (
					<a
						key={stat.label}
						href={stat.href}
						className="rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md"
					>
						<div className="flex items-center gap-4">
							<div className="rounded-full bg-primary/10 p-3">
								<Icon className="h-6 w-6 text-primary" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">{stat.label}</p>
								<p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
							</div>
						</div>
					</a>
				)
			})}
		</div>
	)
}
