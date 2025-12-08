/**
 * ProposalItems Component
 *
 * Displays proposal items with specs, pricing, and totals.
 * Used in both public proposal view and internal views.
 */

import type { ProposalItem } from '@/types/proposal'

interface ProposalItemsProps {
	items: ProposalItem[]
	subtotal?: number
	className?: string
}

export function ProposalItems({ items, subtotal, className }: ProposalItemsProps) {
	const calculatedSubtotal = subtotal ?? items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

	return (
		<div className={className}>
			<div className="space-y-4">
				{items.map(item => (
					<div key={item.id} className="border rounded-lg p-4">
						{/* Product Name and Quantity */}
						<div className="flex justify-between items-start mb-2">
							<div>
								<h3 className="font-semibold text-foreground">{item.product_name}</h3>
								{item.product_sku && <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>}
							</div>
							<div className="text-right">
								<p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
								<p className="font-semibold">${(item.unit_price * item.quantity).toFixed(2)}</p>
							</div>
						</div>

						{/* Specs */}
						{item.specs && Object.keys(item.specs).length > 0 && (
							<div className="mt-3 pt-3 border-t">
								<p className="text-sm font-medium text-muted-foreground mb-2">Specifications</p>
								<dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
									{Object.entries(item.specs).map(([key, value]) => (
										<div key={key} className="flex justify-between">
											<dt className="text-muted-foreground">{key}:</dt>
											<dd className="font-medium text-foreground">{value}</dd>
										</div>
									))}
								</dl>
							</div>
						)}

						{/* Monthly Price */}
						{item.monthly_price && (
							<div className="mt-3 pt-3 border-t">
								<div className="flex justify-between items-center text-sm">
									<span className="text-muted-foreground">Lease Option</span>
									<span className="font-medium text-foreground">${item.monthly_price.toFixed(2)}/month</span>
								</div>
							</div>
						)}
					</div>
				))}
			</div>

			{/* Subtotal */}
			<div className="mt-6 pt-4 border-t">
				<div className="flex justify-between items-center">
					<span className="text-lg font-semibold">Subtotal</span>
					<span className="text-xl font-bold">${calculatedSubtotal.toFixed(2)}</span>
				</div>
			</div>
		</div>
	)
}
