import { cn } from '@/lib/utils'
import type { Cart } from '@/types/cart'

interface CartSummaryProps {
	cart: Cart
	className?: string
}

export function CartSummary({ cart, className }: CartSummaryProps) {
	const isLeasing = cart.paymentMethod === '24-month' || cart.paymentMethod === '36-month'

	return (
		<div className={cn('space-y-4 rounded-lg border bg-card p-6', className)}>
			<h2 className="text-lg font-semibold">Order Summary</h2>

			<div className="space-y-2">
				{/* Subtotal */}
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">Subtotal</span>
					<span className="font-medium">${cart.subtotal.toFixed(2)}</span>
				</div>

				{/* Promo Discount */}
				{cart.promoCode && cart.promoDiscount && (
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Discount ({cart.promoCode})</span>
						<span className="font-medium text-green-600">-${cart.promoDiscount.toFixed(2)}</span>
					</div>
				)}

				{/* Shipping */}
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">Shipping</span>
					<span className="text-muted-foreground">Calculated at checkout</span>
				</div>

				{/* Taxes */}
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">Taxes</span>
					<span className="text-muted-foreground">Calculated at checkout</span>
				</div>
			</div>

			<div className="border-t pt-4">
				{isLeasing ? (
					<>
						{/* Monthly Payment */}
						<div className="flex justify-between">
							<span className="font-semibold">Monthly Payment</span>
							<span className="text-xl font-bold">${cart.monthlyTotal?.toFixed(2)}/mo</span>
						</div>
						{/* Total Value */}
						<div className="mt-2 flex justify-between text-sm">
							<span className="text-muted-foreground">Total value</span>
							<span className="text-muted-foreground">${cart.subtotal.toFixed(2)}</span>
						</div>
					</>
				) : (
					/* One-Time Total */
					<div className="flex justify-between">
						<span className="font-semibold">Total</span>
						<span className="text-xl font-bold">${cart.subtotal.toFixed(2)}</span>
					</div>
				)}
			</div>

			{/* Item Count */}
			<div className="text-xs text-muted-foreground">
				{cart.items.reduce((count, item) => count + item.quantity, 0)} item(s) in cart
			</div>
		</div>
	)
}
