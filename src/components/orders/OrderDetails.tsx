import type { OrderWithItems } from '@/lib/scoped-queries'
import { OrderActions } from './OrderActions'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderTimeline } from './OrderTimeline'
import { ShipmentTracker } from './ShipmentTracker'

interface OrderDetailsProps {
	order: OrderWithItems
	onCancel?: (orderId: string) => Promise<void>
	onReturn?: (orderId: string) => Promise<void>
	onReorder?: (orderId: string) => Promise<void>
	onDownloadInvoice?: (orderId: string) => Promise<void>
}

export function OrderDetails({ order, onCancel, onReturn, onReorder, onDownloadInvoice }: OrderDetailsProps) {
	function formatDate(dateString: string): string {
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(amount)
	}

	function getShippingAddress(): string {
		const parts = [
			order.shipping_address,
			order.shipping_city,
			order.shipping_state,
			order.shipping_zip,
			order.shipping_country,
		].filter(Boolean)

		return parts.length > 0 ? parts.join(', ') : 'No shipping address'
	}

	const isLeasing = order.payment_method === 'leasing'

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-card rounded-lg border border-border p-6">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-bold text-foreground">Order {order.id.slice(0, 8).toUpperCase()}</h1>
							<OrderStatusBadge status={order.status} />
						</div>
						<p className="text-muted-foreground mt-1">Placed on {formatDate(order.created_at)}</p>
						{order.creator_name && (
							<p className="text-sm text-muted-foreground mt-1">Created by {order.creator_name}</p>
						)}
					</div>
					<div className="flex flex-col items-end gap-2">
						<div className="text-right">
							<p className="text-sm text-muted-foreground">Total</p>
							<p className="text-2xl font-bold text-foreground">{formatCurrency(order.total)}</p>
						</div>
						{isLeasing && order.monthly_cost && (
							<p className="text-sm text-muted-foreground">{formatCurrency(order.monthly_cost)}/month</p>
						)}
					</div>
				</div>
			</div>

			{/* Line Items */}
			<div className="bg-card rounded-lg border border-border p-6">
				<h2 className="text-xl font-semibold text-foreground mb-4">Items</h2>
				<div className="space-y-4">
					{order.items && order.items.length > 0 ? (
						order.items.map(item => (
							<div key={item.id} className="flex items-center gap-4 py-4 border-b border-border last:border-b-0">
								{item.product_image_url ? (
									<img
										src={item.product_image_url}
										alt={item.product_name}
										className="w-20 h-20 object-cover rounded-lg"
									/>
								) : (
									<div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
										<span className="text-muted-foreground text-sm">No image</span>
									</div>
								)}
								<div className="flex-1">
									<h3 className="font-medium text-foreground">{item.product_name}</h3>
									{item.product_sku && <p className="text-sm text-muted-foreground mt-1">SKU: {item.product_sku}</p>}
									{item.specs && <p className="text-sm text-muted-foreground mt-1">{item.specs}</p>}
									<p className="text-sm text-muted-foreground mt-1">Quantity: {item.quantity}</p>
								</div>
								<div className="text-right">
									<p className="font-medium text-foreground">{formatCurrency(item.total_price)}</p>
									{isLeasing && item.monthly_price && (
										<p className="text-sm text-muted-foreground mt-1">{formatCurrency(item.monthly_price)}/month</p>
									)}
								</div>
							</div>
						))
					) : (
						<p className="text-muted-foreground">No items in this order</p>
					)}
				</div>

				{/* Summary */}
				<div className="mt-6 pt-6 border-t border-border">
					<div className="space-y-2 max-w-xs ml-auto">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Subtotal</span>
							<span className="text-foreground">{formatCurrency(order.subtotal)}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Shipping</span>
							<span className="text-foreground">
								{order.shipping_cost === 0 ? 'FREE' : formatCurrency(order.shipping_cost)}
							</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Tax</span>
							<span className="text-foreground">{formatCurrency(order.tax_amount)}</span>
						</div>
						<div className="flex justify-between text-lg font-semibold pt-2 border-t border-border">
							<span className="text-foreground">Total</span>
							<span className="text-foreground">{formatCurrency(order.total)}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Shipping Information */}
			{(order.shipping_address || order.tracking_number) && (
				<div className="bg-card rounded-lg border border-border p-6">
					<h2 className="text-xl font-semibold text-foreground mb-4">Shipping</h2>
					<div className="space-y-4">
						{order.shipping_address && (
							<div>
								<p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
								<p className="text-foreground">{getShippingAddress()}</p>
								{order.assignee_name && (
									<p className="text-sm text-muted-foreground mt-1">Recipient: {order.assignee_name}</p>
								)}
							</div>
						)}

						{order.tracking_number && (
							<ShipmentTracker
								trackingNumber={order.tracking_number}
								carrier={order.carrier}
								estimatedDelivery={order.estimated_delivery}
								status={order.status}
							/>
						)}
					</div>
				</div>
			)}

			{/* Payment Information */}
			<div className="bg-card rounded-lg border border-border p-6">
				<h2 className="text-xl font-semibold text-foreground mb-4">Payment</h2>
				<div className="space-y-2">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Method</span>
						<span className="text-foreground capitalize">
							{order.payment_method === 'leasing'
								? 'Leasing'
								: order.payment_method === 'card'
									? 'Credit Card'
									: order.payment_method || 'Not specified'}
						</span>
					</div>
					{isLeasing && order.monthly_cost && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Monthly Payment</span>
							<span className="text-foreground font-medium">{formatCurrency(order.monthly_cost)}</span>
						</div>
					)}
				</div>
			</div>

			{/* Timeline */}
			<OrderTimeline order={order} />

			{/* Actions */}
			<OrderActions
				order={order}
				onCancel={onCancel}
				onReturn={onReturn}
				onReorder={onReorder}
				onDownloadInvoice={onDownloadInvoice}
			/>
		</div>
	)
}
