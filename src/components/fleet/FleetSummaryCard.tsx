'use client'

import { DollarSign, Laptop, TrendingDown, TrendingUp } from 'lucide-react'
import type { Device } from '@/lib/scoped-queries'

interface FleetSummaryCardProps {
	devices: Device[]
}

export default function FleetSummaryCard({ devices }: FleetSummaryCardProps) {
	// Calculate fleet statistics
	const totalDevices = devices.length

	// Mock trade-in value calculation - in reality this would come from Alchemy API
	const mockTradeInValue = (_device: Device): number => {
		// Simple mock: newer devices worth more
		const baseValue = 500
		const randomMultiplier = 0.5 + Math.random() * 1.0 // 0.5x to 1.5x
		return Math.floor(baseValue * randomMultiplier)
	}

	const totalFleetValue = devices.reduce((sum, device) => {
		return sum + mockTradeInValue(device)
	}, 0)

	// Mock depreciation (would be calculated from historical data)
	const depreciationRate = -5.2 // -5.2% over last quarter

	// Status breakdown
	const statusCounts = devices.reduce(
		(acc, device) => {
			acc[device.status] = (acc[device.status] || 0) + 1
			return acc
		},
		{} as Record<Device['status'], number>,
	)

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount)
	}

	function formatStatus(status: Device['status']): string {
		return status
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ')
	}

	return (
		<div className="rounded-lg border border-border bg-card p-6">
			<div className="grid gap-6 md:grid-cols-3">
				{/* Total Fleet Value */}
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<DollarSign className="h-4 w-4" />
						<span>Total Fleet Value</span>
					</div>
					<p className="text-3xl font-bold">{formatCurrency(totalFleetValue)}</p>
					<div className="flex items-center gap-1 text-sm">
						{depreciationRate < 0 ? (
							<>
								<TrendingDown className="h-4 w-4 text-red-600" />
								<span className="text-red-600">{Math.abs(depreciationRate)}%</span>
								<span className="text-muted-foreground">vs. last quarter</span>
							</>
						) : (
							<>
								<TrendingUp className="h-4 w-4 text-green-600" />
								<span className="text-green-600">+{depreciationRate}%</span>
								<span className="text-muted-foreground">vs. last quarter</span>
							</>
						)}
					</div>
				</div>

				{/* Total Devices */}
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Laptop className="h-4 w-4" />
						<span>Total Devices</span>
					</div>
					<p className="text-3xl font-bold">{totalDevices}</p>
					<p className="text-sm text-muted-foreground">across all locations</p>
				</div>

				{/* Status Breakdown */}
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Laptop className="h-4 w-4" />
						<span>Status Breakdown</span>
					</div>
					<div className="space-y-1">
						{Object.entries(statusCounts)
							.sort((a, b) => b[1] - a[1])
							.slice(0, 3)
							.map(([status, count]) => (
								<div key={status} className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">{formatStatus(status as Device['status'])}</span>
									<span className="font-semibold">{count}</span>
								</div>
							))}
					</div>
				</div>
			</div>
		</div>
	)
}
