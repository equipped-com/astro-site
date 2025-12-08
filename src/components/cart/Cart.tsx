import { Share2, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCart } from '@/lib/cart-context'
import { cn } from '@/lib/utils'
import { CartItem } from './CartItem'
import { CartSummary } from './CartSummary'
import { PaymentMethodToggle } from './PaymentMethodToggle'
import { PromoCodeInput } from './PromoCodeInput'

interface CartProps {
	className?: string
	showCheckoutButton?: boolean
	onCheckout?: () => void
}

export function Cart({ className, showCheckoutButton = true, onCheckout }: CartProps) {
	const { cart, updateQuantity, removeItem, setPaymentMethod, applyPromo, removePromo, isEmpty } = useCart()
	const [isSharing, setIsSharing] = useState(false)

	async function handleApplyPromo(code: string) {
		// Mock promo code validation - replace with API call
		const validPromoCodes: Record<string, number> = {
			FIRST10: 10, // $10 off
			SAVE20: 20, // $20 off
			WELCOME15: 15, // $15 off
		}

		const discount = validPromoCodes[code]

		if (discount) {
			applyPromo(code, discount)
			toast.success(`Promo code ${code} applied! $${discount} off`)
			return { success: true, discount }
		}

		return { success: false, error: 'Invalid promo code' }
	}

	function handleRemovePromo() {
		removePromo()
		toast.info('Promo code removed')
	}

	async function handleShareCart() {
		setIsSharing(true)
		try {
			// Mock share functionality - replace with API call
			await new Promise(resolve => setTimeout(resolve, 1000))
			toast.success('Cart link copied to clipboard!')
		} catch (error) {
			toast.error('Failed to share cart')
		} finally {
			setIsSharing(false)
		}
	}

	async function handleShareAsProposal() {
		setIsSharing(true)
		try {
			// Mock proposal functionality - replace with API call
			await new Promise(resolve => setTimeout(resolve, 1000))
			toast.success('Proposal created and shared!')
		} catch (error) {
			toast.error('Failed to create proposal')
		} finally {
			setIsSharing(false)
		}
	}

	if (isEmpty) {
		return (
			<div className={cn('flex flex-col items-center justify-center rounded-lg border bg-card p-12', className)}>
				<ShoppingCart className="h-16 w-16 text-muted-foreground" />
				<h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2>
				<p className="mt-2 text-muted-foreground">Add some products to get started</p>
				<a
					href="/store"
					className="mt-6 rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90"
				>
					Start shopping
				</a>
			</div>
		)
	}

	return (
		<div className={cn('space-y-6', className)}>
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Shopping Cart</h1>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={handleShareCart}
						disabled={isSharing}
						className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
					>
						<Share2 className="h-4 w-4" />
						Share cart
					</button>
					<button
						type="button"
						onClick={handleShareAsProposal}
						disabled={isSharing}
						className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
					>
						<Share2 className="h-4 w-4" />
						Share as proposal
					</button>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Cart Items */}
				<div className="lg:col-span-2 space-y-6">
					{/* Payment Method Toggle */}
					<PaymentMethodToggle value={cart.paymentMethod} onChange={setPaymentMethod} />

					{/* Items List */}
					<div className="rounded-lg border bg-card p-6">
						<h2 className="mb-4 text-lg font-semibold">Items ({cart.items.length})</h2>
						<div className="space-y-0">
							{cart.items.map(item => (
								<CartItem
									key={item.id}
									item={item}
									paymentMethod={cart.paymentMethod}
									onUpdateQuantity={quantity => updateQuantity(item.id, quantity)}
									onRemove={() => {
										removeItem(item.id)
										toast.success('Item removed from cart')
									}}
								/>
							))}
						</div>
					</div>

					{/* Promo Code */}
					<PromoCodeInput currentPromoCode={cart.promoCode} onApply={handleApplyPromo} onRemove={handleRemovePromo} />
				</div>

				{/* Cart Summary Sidebar */}
				<div className="space-y-4">
					<CartSummary cart={cart} />

					{showCheckoutButton && (
						<button
							type="button"
							onClick={onCheckout}
							className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
						>
							Proceed to Checkout
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
