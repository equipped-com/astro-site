import { ArrowUpRight, Laptop, Package, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CardSkeleton } from './CardSkeleton'

interface Stats {
	deviceCount: number
	activeDevices: number
	peopleCount: number
	activePeople: number
	orderCount: number
	pendingOrders: number
}

interface QuickStatsProps {
	apiBaseUrl?: string
}

export function QuickStats({ apiBaseUrl = '/api' }: QuickStatsProps) {
	const [stats, setStats] = useState<Stats | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchStats() {
			try {
				setLoading(true)
				setError(null)

				// Fetch devices
				const devicesRes = await fetch(`${apiBaseUrl}/devices`)
				if (!devicesRes.ok) throw new Error('Failed to fetch devices')
				const devicesData = await devicesRes.json()

				// Fetch people
				const peopleRes = await fetch(`${apiBaseUrl}/people`)
				if (!peopleRes.ok) throw new Error('Failed to fetch people')
				const peopleData = await peopleRes.json()

				// Calculate stats
				const devices = devicesData.devices || []
				const people = peopleData.people || []

				const activeDevices = devices.filter(
					(d: { status: string }) => d.status === 'in_use' || d.status === 'assigned',
				).length

				const activePeople = people.filter((p: { status: string }) => p.status === 'active').length

				setStats({
					deviceCount: devices.length,
					activeDevices,
					peopleCount: people.length,
					activePeople,
					orderCount: 0, // TODO: Implement orders API
					pendingOrders: 0,
				})
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load stats')
			} finally {
				setLoading(false)
			}
		}

		fetchStats()
	}, [apiBaseUrl])

	if (loading) {
		return (
			<div className="grid gap-6 md:grid-cols-3">
				<CardSkeleton count={3} variant="stat" />
			</div>
		)
	}

	if (error) {
		return (
			<div className="rounded-lg border border-destructive bg-destructive/10 p-6">
				<p className="text-sm text-destructive">Error loading stats: {error}</p>
			</div>
		)
	}

	if (!stats) return null

	const statCards = [
		{
			label: 'Devices',
			value: stats.deviceCount,
			subtext: `${stats.activeDevices} active`,
			icon: Laptop,
			href: '/dashboard/devices',
		},
		{
			label: 'Team Members',
			value: stats.peopleCount,
			subtext: `${stats.activePeople} active`,
			icon: Users,
			href: '/dashboard/people',
		},
		{
			label: 'Orders',
			value: stats.orderCount,
			subtext: `${stats.pendingOrders} pending`,
			icon: Package,
			href: '/dashboard/orders',
		},
	]

	return (
		<div className="grid gap-6 md:grid-cols-3">
			{statCards.map(stat => (
				<a
					key={stat.label}
					href={stat.href}
					className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary"
				>
					<div className="flex items-start justify-between">
						<div>
							<p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
							<p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
							<p className="mt-1 text-xs text-muted-foreground">{stat.subtext}</p>
						</div>
						<div className="rounded-full bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
							<stat.icon className="h-5 w-5 text-primary" />
						</div>
					</div>
					<div className="mt-4 flex items-center text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
						<span>View all</span>
						<ArrowUpRight className="ml-1 h-4 w-4" />
					</div>
				</a>
			))}
		</div>
	)
}
