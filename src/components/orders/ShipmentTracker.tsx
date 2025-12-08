import type { Order } from '@/lib/scoped-queries'

interface ShipmentTrackerProps {
	trackingNumber: string
	carrier?: string | null
	estimatedDelivery?: string | null
	status: Order['status']
}

export function ShipmentTracker({ trackingNumber, carrier, estimatedDelivery, status }: ShipmentTrackerProps) {
	function getCarrierName(): string {
		if (!carrier) return 'Unknown Carrier'
		return carrier.toUpperCase()
	}

	function getTrackingUrl(): string {
		const carrierName = carrier?.toLowerCase() || ''

		// Generate tracking URLs based on carrier
		switch (carrierName) {
			case 'ups':
				return `https://www.ups.com/track?tracknum=${trackingNumber}`
			case 'fedex':
				return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`
			case 'usps':
				return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`
			case 'dhl':
				return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`
			default:
				// Fallback to Google search
				return `https://www.google.com/search?q=${encodeURIComponent(getCarrierName() + ' ' + trackingNumber)}`
		}
	}

	function formatEstimatedDelivery(): string | null {
		if (!estimatedDelivery) return null

		const date = new Date(estimatedDelivery)
		const today = new Date()
		const tomorrow = new Date(today)
		tomorrow.setDate(tomorrow.getDate() + 1)

		// Check if it's today
		if (
			date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear()
		) {
			return 'Today'
		}

		// Check if it's tomorrow
		if (
			date.getDate() === tomorrow.getDate() &&
			date.getMonth() === tomorrow.getMonth() &&
			date.getFullYear() === tomorrow.getFullYear()
		) {
			return 'Tomorrow'
		}

		// Otherwise, format as date
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
		})
	}

	const formattedDelivery = formatEstimatedDelivery()
	const isDelivered = status === 'delivered'

	return (
		<div className="border border-border rounded-lg p-4 bg-muted/30">
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-2">
						<svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
							/>
						</svg>
						<h3 className="font-medium text-foreground">{getCarrierName()}</h3>
					</div>
					<p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
					<p className="font-mono text-sm text-foreground mb-3">{trackingNumber}</p>

					{formattedDelivery && !isDelivered && (
						<div className="flex items-center gap-2 text-sm">
							<svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							<span className="text-muted-foreground">
								Estimated delivery: <span className="font-medium text-foreground">{formattedDelivery}</span>
							</span>
						</div>
					)}

					{isDelivered && (
						<div className="flex items-center gap-2 text-sm text-green-600">
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clipRule="evenodd"
								/>
							</svg>
							<span className="font-medium">Delivered</span>
						</div>
					)}
				</div>

				<a
					href={getTrackingUrl()}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
				>
					Track shipment
					<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
						/>
					</svg>
				</a>
			</div>
		</div>
	)
}
