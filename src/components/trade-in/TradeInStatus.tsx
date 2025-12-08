'use client'

import {
	AlertCircle,
	ArrowRight,
	Check,
	CheckCircle,
	Clock,
	DollarSign,
	MapPin,
	Package,
	Search,
	Truck,
} from 'lucide-react'
import type { TradeInStatus as Status, TrackingEvent, TradeInItem } from '@/lib/alchemy/types'
import { cn } from '@/lib/utils'

interface TradeInStatusProps {
	tradeIn: TradeInItem
	onViewAdjustment?: () => void
	className?: string
}

interface StatusStep {
	id: Status
	label: string
	icon: typeof Package
	description: string
}

const STATUS_STEPS: StatusStep[] = [
	{
		id: 'quote',
		label: 'Quote Accepted',
		icon: DollarSign,
		description: 'Trade-in quote has been accepted',
	},
	{
		id: 'label_sent',
		label: 'Label Sent',
		icon: Package,
		description: 'Shipping label has been generated',
	},
	{
		id: 'in_transit',
		label: 'In Transit',
		icon: Truck,
		description: 'Device is on its way to our facility',
	},
	{
		id: 'received',
		label: 'Received',
		icon: CheckCircle,
		description: 'Device has arrived at our warehouse',
	},
	{
		id: 'inspecting',
		label: 'Inspecting',
		icon: Search,
		description: 'Device is being inspected and tested',
	},
	{
		id: 'credited',
		label: 'Credited',
		icon: Check,
		description: 'Trade-in credit has been applied',
	},
]

export function TradeInStatus({ tradeIn, onViewAdjustment, className }: TradeInStatusProps) {
	const currentStepIndex = STATUS_STEPS.findIndex(step => step.id === tradeIn.status)
	const isDisputed = tradeIn.status === 'disputed'
	const hasAdjustment = !!tradeIn.adjustment && tradeIn.adjustment.status === 'pending_approval'

	function getStepState(stepIndex: number): 'completed' | 'current' | 'upcoming' {
		if (isDisputed && stepIndex >= currentStepIndex) {
			return 'upcoming'
		}
		if (stepIndex < currentStepIndex) return 'completed'
		if (stepIndex === currentStepIndex) return 'current'
		return 'upcoming'
	}

	return (
		<div className={cn('space-y-6', className)}>
			{/* Header Card */}
			<div className="rounded-xl border border-border bg-card p-6">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-lg font-semibold text-foreground">Trade-In Status</h3>
						<p className="text-sm text-muted-foreground mt-1">
							{tradeIn.model} ({tradeIn.year})
						</p>
						<p className="text-xs text-muted-foreground font-mono mt-1">{tradeIn.serial}</p>
					</div>
					<div className="text-right">
						<p className="text-sm text-muted-foreground">Trade-In Value</p>
						<p className="text-2xl font-bold text-primary">${tradeIn.estimatedValue.toLocaleString()}</p>
						{tradeIn.finalValue !== undefined && tradeIn.finalValue !== tradeIn.estimatedValue && (
							<p className="text-sm text-muted-foreground line-through">${tradeIn.estimatedValue}</p>
						)}
					</div>
				</div>

				{/* Adjustment Alert */}
				{hasAdjustment && (
					<div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
						<div className="flex items-start gap-3">
							<AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
							<div className="flex-1">
								<p className="font-medium text-amber-900">Value Adjustment Required</p>
								<p className="text-sm text-amber-700 mt-1">{tradeIn.adjustment?.reason}</p>
								<p className="text-sm text-amber-900 font-medium mt-2">
									New value: ${tradeIn.adjustment?.newValue.toLocaleString()}
								</p>
							</div>
							<button
								type="button"
								onClick={onViewAdjustment}
								className="text-sm font-medium text-amber-900 hover:text-amber-700 transition-colors"
							>
								Review
								<ArrowRight className="h-4 w-4 inline ml-1" />
							</button>
						</div>
					</div>
				)}

				{/* Disputed Status */}
				{isDisputed && (
					<div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
						<div className="flex items-start gap-3">
							<AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
							<div>
								<p className="font-medium text-red-900">Trade-In Disputed</p>
								<p className="text-sm text-red-700 mt-1">
									We're reviewing your dispute. Our team will contact you within 1-2 business days.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Credited Success */}
				{tradeIn.status === 'credited' && tradeIn.creditedAt && (
					<div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4">
						<div className="flex items-start gap-3">
							<CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
							<div>
								<p className="font-medium text-green-900">Credit Applied!</p>
								<p className="text-sm text-green-700 mt-1">
									${tradeIn.creditAmount?.toLocaleString()} has been applied to your account on{' '}
									{new Date(tradeIn.creditedAt).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
										year: 'numeric',
									})}
									.
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Progress Timeline */}
			<div className="rounded-xl border border-border bg-card p-6">
				<h4 className="font-medium text-foreground mb-6">Progress</h4>
				<div className="space-y-4">
					{STATUS_STEPS.map((step, index) => {
						const state = getStepState(index)
						const Icon = step.icon
						const isLast = index === STATUS_STEPS.length - 1

						return (
							<div key={step.id} className="flex gap-4">
								{/* Timeline Icon */}
								<div className="flex flex-col items-center">
									<div
										className={cn(
											'flex items-center justify-center w-10 h-10 rounded-full transition-colors',
											state === 'completed'
												? 'bg-primary text-primary-foreground'
												: state === 'current'
													? 'bg-primary/20 text-primary border-2 border-primary'
													: 'bg-muted text-muted-foreground',
										)}
									>
										{state === 'completed' ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
									</div>
									{!isLast && (
										<div className={cn('w-0.5 h-12 mt-2', state === 'completed' ? 'bg-primary' : 'bg-border')} />
									)}
								</div>

								{/* Timeline Content */}
								<div className="flex-1 pb-8">
									<p
										className={cn(
											'font-medium',
											state === 'current'
												? 'text-foreground'
												: state === 'completed'
													? 'text-primary'
													: 'text-muted-foreground',
										)}
									>
										{step.label}
									</p>
									<p className="text-sm text-muted-foreground mt-1">{step.description}</p>

									{/* Show timestamp for completed steps */}
									{state === 'completed' && step.id === 'received' && tradeIn.tracking && (
										<div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
											<Clock className="h-3 w-3" />
											<span>
												{new Date(
													tradeIn.tracking.events[tradeIn.tracking.events.length - 1]?.timestamp || '',
												).toLocaleDateString('en-US', {
													month: 'short',
													day: 'numeric',
													hour: 'numeric',
													minute: '2-digit',
												})}
											</span>
										</div>
									)}

									{state === 'completed' && step.id === 'credited' && tradeIn.creditedAt && (
										<div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
											<Clock className="h-3 w-3" />
											<span>
												{new Date(tradeIn.creditedAt).toLocaleDateString('en-US', {
													month: 'short',
													day: 'numeric',
													hour: 'numeric',
													minute: '2-digit',
												})}
											</span>
										</div>
									)}
								</div>
							</div>
						)
					})}
				</div>
			</div>

			{/* Tracking Information */}
			{tradeIn.tracking && (
				<div className="rounded-xl border border-border bg-card p-6">
					<h4 className="font-medium text-foreground mb-4">Tracking Information</h4>

					<div className="space-y-4">
						{/* Tracking Header */}
						<div className="flex items-center justify-between pb-4 border-b border-border">
							<div>
								<p className="text-xs text-muted-foreground">Carrier</p>
								<p className="font-medium text-foreground">{tradeIn.tracking.carrier}</p>
							</div>
							<div className="text-right">
								<p className="text-xs text-muted-foreground">Tracking Number</p>
								<p className="font-mono text-sm font-medium text-foreground">{tradeIn.tracking.trackingNumber}</p>
							</div>
						</div>

						{/* Current Status */}
						<div className="rounded-lg bg-muted/50 p-4">
							<div className="flex items-start gap-3">
								<div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
									{tradeIn.tracking.status === 'delivered' ? (
										<CheckCircle className="h-5 w-5 text-primary" />
									) : tradeIn.tracking.status === 'exception' ? (
										<AlertCircle className="h-5 w-5 text-amber-600" />
									) : (
										<Truck className="h-5 w-5 text-primary" />
									)}
								</div>
								<div className="flex-1">
									<p className="font-medium text-foreground capitalize">{tradeIn.tracking.status.replace('_', ' ')}</p>
									{tradeIn.tracking.currentLocation && (
										<div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
											<MapPin className="h-3 w-3" />
											<span>{tradeIn.tracking.currentLocation}</span>
										</div>
									)}
									{tradeIn.tracking.estimatedDelivery && tradeIn.tracking.status !== 'delivered' && (
										<p className="text-sm text-muted-foreground mt-1">
											Estimated delivery:{' '}
											{new Date(tradeIn.tracking.estimatedDelivery).toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric',
											})}
										</p>
									)}
								</div>
							</div>
						</div>

						{/* Tracking Events */}
						{tradeIn.tracking.events.length > 0 && (
							<div>
								<p className="text-sm font-medium text-foreground mb-3">Shipment History</p>
								<div className="space-y-3">
									{tradeIn.tracking.events.map((event, index) => (
										<TrackingEventItem key={index} event={event} isLatest={index === 0} />
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Inspection Results */}
			{tradeIn.inspection && (
				<div className="rounded-xl border border-border bg-card p-6">
					<h4 className="font-medium text-foreground mb-4">Inspection Results</h4>

					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-xs text-muted-foreground">Inspected On</p>
								<p className="text-sm font-medium text-foreground">
									{new Date(tradeIn.inspection.inspectedAt).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
										year: 'numeric',
									})}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Condition Grade</p>
								<p className="text-sm font-medium text-foreground capitalize">{tradeIn.inspection.actualCondition}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Estimated Value</p>
								<p className="text-sm font-medium text-foreground">
									${tradeIn.inspection.estimatedValue.toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Final Value</p>
								<p className="text-sm font-medium text-primary">${tradeIn.inspection.finalValue.toLocaleString()}</p>
							</div>
						</div>

						{tradeIn.inspection.adjustmentReason && (
							<div className="rounded-lg bg-muted/50 p-4">
								<p className="text-sm font-medium text-foreground mb-1">Adjustment Notes</p>
								<p className="text-sm text-muted-foreground">{tradeIn.inspection.adjustmentReason}</p>
							</div>
						)}

						{tradeIn.inspection.inspector && (
							<div className="text-xs text-muted-foreground">Inspected by: {tradeIn.inspection.inspector}</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

interface TrackingEventItemProps {
	event: TrackingEvent
	isLatest: boolean
}

function TrackingEventItem({ event, isLatest }: TrackingEventItemProps) {
	return (
		<div
			className={cn(
				'flex items-start gap-3 rounded-lg p-3 transition-colors',
				isLatest ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30',
			)}
		>
			<div className="flex items-center justify-center w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1">
						<p className={cn('text-sm font-medium', isLatest ? 'text-foreground' : 'text-muted-foreground')}>
							{event.status}
						</p>
						<p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
					</div>
					<div className="text-right shrink-0">
						<p className="text-xs text-muted-foreground">
							{new Date(event.timestamp).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
							})}
						</p>
						<p className="text-xs text-muted-foreground">
							{new Date(event.timestamp).toLocaleTimeString('en-US', {
								hour: 'numeric',
								minute: '2-digit',
							})}
						</p>
					</div>
				</div>
				{event.location && (
					<div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
						<MapPin className="h-3 w-3" />
						<span>{event.location}</span>
					</div>
				)}
			</div>
		</div>
	)
}
