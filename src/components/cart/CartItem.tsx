import { Minus, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CartItem as CartItemType, PaymentMethod } from '@/types/cart'

interface CartItemProps {
	item: CartItemType
	paymentMethod: PaymentMethod
	onUpdateQuantity: (quantity: number) => void
	onRemove: () => void
	className?: string
}

export function CartItem({ item, paymentMethod, onUpdateQuantity, onRemove, className }: CartItemProps) {
	const displayPrice =
		paymentMethod === '24-month'
			? item.monthlyPrice24
			: paymentMethod === '36-month'
				? item.monthlyPrice36
				: item.unitPrice

	const priceLabel = paymentMethod === '24-month' || paymentMethod === '36-month' ? '/mo' : ''

	function handleDecrement() {
		if (item.quantity > 1) {
			onUpdateQuantity(item.quantity - 1)
		}
	}

	function handleIncrement() {
		onUpdateQuantity(item.quantity + 1)
	}

	return (
		<div className={cn('flex gap-4 border-b py-4', className)}>
			{/* Product Image */}
			<div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
				{item.productImage ? (
					<img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
				) : (
					<div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
				)}
			</div>

			{/* Product Details */}
			<div className="flex flex-1 flex-col justify-between">
				<div>
					<h3 className="font-semibold">{item.productName}</h3>
					<p className="text-sm text-muted-foreground">SKU: {item.productSku}</p>

					{/* Specs */}
					{Object.keys(item.specs).length > 0 && (
						<div className="mt-1 flex flex-wrap gap-2">
							{Object.entries(item.specs).map(([key, value]) => (
								<span key={key} className="text-xs text-muted-foreground">
									{key}: {value}
								</span>
							))}
						</div>
					)}
				</div>

				{/* Quantity Controls & Price */}
				<div className="flex items-center justify-between">
					{/* Quantity Controls */}
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleDecrement}
							disabled={item.quantity <= 1}
							className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
							aria-label="Decrease quantity"
						>
							<Minus className="h-4 w-4" />
						</button>
						<span className="w-8 text-center font-medium">{item.quantity}</span>
						<button
							type="button"
							onClick={handleIncrement}
							className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted"
							aria-label="Increase quantity"
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>

					{/* Price & Remove */}
					<div className="flex items-center gap-4">
						<div className="text-right">
							<p className="font-semibold">
								${displayPrice?.toFixed(2)}
								{priceLabel}
							</p>
							{item.quantity > 1 && (
								<p className="text-xs text-muted-foreground">
									${((displayPrice || 0) * item.quantity).toFixed(2)} total
								</p>
							)}
						</div>
						<button
							type="button"
							onClick={onRemove}
							className="text-destructive hover:text-destructive/80"
							aria-label="Remove item"
						>
							<Trash2 className="h-5 w-5" />
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
