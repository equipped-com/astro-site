'use client'

import { Check, Laptop, MonitorSmartphone, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DevicePackage } from '@/types'

interface DevicePackageSelectorProps {
	packages: DevicePackage[]
	selectedPackage: DevicePackage | null
	onSelect: (pkg: DevicePackage) => void
}

export default function DevicePackageSelector({ packages, selectedPackage, onSelect }: DevicePackageSelectorProps) {
	function getPackageIcon(packageName: string) {
		if (packageName.toLowerCase().includes('executive')) {
			return <MonitorSmartphone className="h-8 w-8 text-primary" />
		}
		if (packageName.toLowerCase().includes('sales')) {
			return <Laptop className="h-8 w-8 text-primary" />
		}
		return <Package className="h-8 w-8 text-primary" />
	}

	return (
		<div className="space-y-4">
			{packages.map(pkg => (
				<button
					key={pkg.id}
					type="button"
					onClick={() => onSelect(pkg)}
					className={cn(
						'w-full rounded-lg border-2 p-6 text-left transition-all',
						'hover:border-primary hover:bg-accent',
						selectedPackage?.id === pkg.id ? 'border-primary bg-accent' : 'border-border',
					)}
				>
					<div className="flex items-start gap-4">
						{/* Icon */}
						<div className="flex-shrink-0 mt-1">{getPackageIcon(pkg.name)}</div>

						{/* Content */}
						<div className="flex-1 min-w-0">
							<div className="flex items-start justify-between gap-4">
								<div>
									<h4 className="font-semibold text-base mb-1">{pkg.name}</h4>
									<p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>

									{/* Device list */}
									<div className="space-y-1">
										{pkg.devices.map(device => (
											<div key={device.name} className="flex items-center gap-2 text-sm">
												<Check className="h-3 w-3 text-primary flex-shrink-0" />
												<span>
													{device.quantity > 1 ? `${device.quantity}x ` : ''}
													{device.name}
												</span>
											</div>
										))}
									</div>
								</div>

								{/* Pricing */}
								<div className="text-right flex-shrink-0">
									<div className="font-bold text-lg">${pkg.totalCost.toLocaleString()}</div>
									{pkg.isLeasing && pkg.monthlyCost && (
										<div className="text-xs text-muted-foreground mt-1">or ${pkg.monthlyCost}/mo with leasing</div>
									)}
								</div>
							</div>
						</div>

						{/* Selected indicator */}
						{selectedPackage?.id === pkg.id && (
							<div className="flex-shrink-0">
								<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
									<Check className="h-4 w-4" />
								</div>
							</div>
						)}
					</div>
				</button>
			))}
		</div>
	)
}
