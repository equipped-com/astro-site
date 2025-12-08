import type { OrderWithItems } from '@/lib/scoped-queries'

interface OrderTimelineProps {
	order: OrderWithItems
}

interface TimelineStep {
	label: string
	status: 'completed' | 'current' | 'pending'
	date?: string
}

export function OrderTimeline({ order }: OrderTimelineProps) {
	function getTimelineSteps(): TimelineStep[] {
		const isLeasing = order.payment_method === 'leasing'
		const steps: TimelineStep[] = []

		// Order placed (always completed)
		steps.push({
			label: 'Order placed',
			status: 'completed',
			date: order.created_at,
		})

		// Leasing approval (only for leasing orders)
		if (isLeasing) {
			if (order.status === 'pending_leasing_approval') {
				steps.push({
					label: 'Pending leasing approval',
					status: 'current',
				})
			} else if (order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') {
				steps.push({
					label: 'Leasing approved',
					status: 'completed',
				})
			} else {
				steps.push({
					label: 'Pending leasing approval',
					status: 'pending',
				})
			}
		}

		// Processing/Payment
		if (order.status === 'cancelled') {
			steps.push({
				label: 'Order cancelled',
				status: 'completed',
				date: order.updated_at,
			})
			return steps
		}

		if (order.status === 'returned') {
			steps.push({
				label: 'Order returned',
				status: 'completed',
				date: order.updated_at,
			})
			return steps
		}

		if (order.status === 'processing') {
			steps.push({
				label: 'Preparing to ship',
				status: 'current',
			})
		} else if (order.status === 'shipped' || order.status === 'delivered') {
			steps.push({
				label: 'Prepared for shipment',
				status: 'completed',
			})
		} else {
			steps.push({
				label: 'Preparing to ship',
				status: 'pending',
			})
		}

		// Shipped
		if (order.status === 'shipped') {
			steps.push({
				label: 'Shipped',
				status: 'current',
			})
		} else if (order.status === 'delivered') {
			steps.push({
				label: 'Shipped',
				status: 'completed',
			})
		} else {
			steps.push({
				label: 'Shipped',
				status: 'pending',
			})
		}

		// Delivered
		if (order.status === 'delivered') {
			steps.push({
				label: 'Delivered',
				status: 'completed',
				date: order.delivered_at,
			})
		} else {
			steps.push({
				label: 'Delivered',
				status: 'pending',
			})
		}

		return steps
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	const steps = getTimelineSteps()

	return (
		<div className="bg-card rounded-lg border border-border p-6">
			<h2 className="text-xl font-semibold text-foreground mb-6">Order Timeline</h2>
			<div className="space-y-4">
				{steps.map((step, index) => (
					<div key={index} className="flex gap-4">
						{/* Icon/Status indicator */}
						<div className="flex flex-col items-center">
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center ${
									step.status === 'completed'
										? 'bg-primary text-primary-foreground'
										: step.status === 'current'
											? 'bg-primary/20 border-2 border-primary'
											: 'bg-muted text-muted-foreground'
								}`}
							>
								{step.status === 'completed' ? (
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
										<path
											fillRule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clipRule="evenodd"
										/>
									</svg>
								) : step.status === 'current' ? (
									<div className="w-3 h-3 rounded-full bg-primary" />
								) : (
									<div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
								)}
							</div>
							{index < steps.length - 1 && (
								<div className={`w-0.5 h-12 mt-2 ${step.status === 'completed' ? 'bg-primary' : 'bg-muted'}`} />
							)}
						</div>

						{/* Content */}
						<div className="flex-1 pb-8">
							<p
								className={`font-medium ${
									step.status === 'completed' || step.status === 'current' ? 'text-foreground' : 'text-muted-foreground'
								}`}
							>
								{step.label}
							</p>
							{step.date && <p className="text-sm text-muted-foreground mt-1">{formatDate(step.date)}</p>}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
