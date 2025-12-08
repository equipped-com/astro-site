'use client'

import { Building2, CheckCircle2, Package, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Person {
	first_name: string
	last_name: string
	location: string | null
}

interface DeviceCollectionSchedulerProps {
	person: Person
	deviceCount: number
	onMethodSelected: (method: string) => void
	selectedMethod: string | null
}

interface CollectionMethod {
	id: string
	label: string
	description: string
	icon: React.ReactNode
	details: string[]
}

const collectionMethods: CollectionMethod[] = [
	{
		id: 'return_label',
		label: 'Ship return label to employee',
		description: 'Send prepaid shipping label via email or mail',
		icon: <Package className="h-6 w-6" />,
		details: [
			'Prepaid shipping label sent to employee',
			'Employee packages and ships devices',
			'Tracking provided for return shipment',
			'Typical turnaround: 3-5 business days',
		],
	},
	{
		id: 'pickup',
		label: 'Schedule pickup at address',
		description: 'Courier picks up devices from employee location',
		icon: <Truck className="h-6 w-6" />,
		details: [
			'Courier scheduled to employee address',
			'Pickup window coordinated with employee',
			'Devices packaged and collected on-site',
			'Typical turnaround: 2-3 business days',
		],
	},
	{
		id: 'in_person',
		label: 'Mark as returned in person',
		description: 'Employee returns devices directly to office',
		icon: <Building2 className="h-6 w-6" />,
		details: [
			'Employee brings devices to office',
			'In-person handoff and verification',
			'Immediate processing of return',
			'No shipping costs or delays',
		],
	},
]

export default function DeviceCollectionScheduler({
	person,
	deviceCount,
	onMethodSelected,
	selectedMethod,
}: DeviceCollectionSchedulerProps) {
	return (
		<div className="space-y-4">
			<div>
				<h3 className="font-semibold text-lg">Schedule Device Collection</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					Choose how {person.first_name} {person.last_name} will return {deviceCount}{' '}
					{deviceCount === 1 ? 'device' : 'devices'}
					{person.location && <span className="ml-1">from {person.location}</span>}
				</p>
			</div>

			<div className="space-y-3">
				{collectionMethods.map(method => (
					<button
						key={method.id}
						type="button"
						onClick={() => onMethodSelected(method.id)}
						className={cn(
							'w-full rounded-lg border-2 p-4 text-left transition-all hover:border-primary/50',
							selectedMethod === method.id ? 'border-primary bg-primary/5' : 'border-border bg-background',
						)}
					>
						<div className="flex items-start gap-4">
							<div
								className={cn(
									'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg',
									selectedMethod === method.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
								)}
							>
								{method.icon}
							</div>

							<div className="flex-1">
								<div className="flex items-start justify-between">
									<div>
										<p className="font-semibold">{method.label}</p>
										<p className="mt-1 text-sm text-muted-foreground">{method.description}</p>
									</div>
									{selectedMethod === method.id && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 ml-2" />}
								</div>

								{selectedMethod === method.id && (
									<ul className="mt-3 space-y-1.5 border-t border-border pt-3">
										{method.details.map((detail, index) => (
											<li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
												<span className="text-primary mt-0.5">•</span>
												<span>{detail}</span>
											</li>
										))}
									</ul>
								)}
							</div>
						</div>
					</button>
				))}
			</div>

			{selectedMethod && (
				<div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
					<p className="font-medium">Collection method selected</p>
					<p className="text-xs mt-1">You can coordinate the details after completing the offboarding process</p>
				</div>
			)}
		</div>
	)
}
