import type { Cart, CartItem, PaymentMethod } from '@/types/cart'

const CART_STORAGE_KEY = 'equipped_cart'

/**
 * Generate a unique ID for cart items
 */
export function generateCartItemId(): string {
	return `cart_item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Generate a unique ID for carts
 */
export function generateCartId(): string {
	return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Calculate monthly price based on unit price and lease term
 */
export function calculateMonthlyPrice(unitPrice: number, months: 24 | 36): number {
	// Simple calculation: divide by months (real implementation would include interest)
	return Number((unitPrice / months).toFixed(2))
}

/**
 * Create an empty cart
 */
export function createEmptyCart(accountId = '', userId = ''): Cart {
	return {
		id: generateCartId(),
		accountId,
		userId,
		paymentMethod: 'buy',
		items: [],
		subtotal: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	}
}

/**
 * Calculate cart totals based on items and payment method
 */
export function calculateCartTotals(cart: Cart): Cart {
	const subtotal = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

	let monthlyTotal: number | undefined

	if (cart.paymentMethod === '24-month' || cart.paymentMethod === '36-month') {
		const months = cart.paymentMethod === '24-month' ? 24 : 36
		monthlyTotal = cart.items.reduce((sum, item) => {
			const itemMonthly = cart.paymentMethod === '24-month' ? item.monthlyPrice24 : item.monthlyPrice36
			return sum + (itemMonthly || calculateMonthlyPrice(item.unitPrice, months)) * item.quantity
		}, 0)
		monthlyTotal = Number(monthlyTotal.toFixed(2))
	}

	// Apply promo discount if exists
	const finalSubtotal = cart.promoDiscount ? subtotal - cart.promoDiscount : subtotal

	return {
		...cart,
		subtotal: Number(finalSubtotal.toFixed(2)),
		monthlyTotal,
		updatedAt: new Date(),
	}
}

/**
 * Load cart from localStorage
 */
export function loadCartFromStorage(): Cart | null {
	if (typeof window === 'undefined') return null

	try {
		const stored = localStorage.getItem(CART_STORAGE_KEY)
		if (!stored) return null

		const cart = JSON.parse(stored) as Cart
		// Convert date strings back to Date objects
		cart.createdAt = new Date(cart.createdAt)
		cart.updatedAt = new Date(cart.updatedAt)

		return cart
	} catch (error) {
		console.error('Failed to load cart from storage:', error)
		return null
	}
}

/**
 * Save cart to localStorage
 */
export function saveCartToStorage(cart: Cart): void {
	if (typeof window === 'undefined') return

	try {
		localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
	} catch (error) {
		console.error('Failed to save cart to storage:', error)
	}
}

/**
 * Clear cart from localStorage
 */
export function clearCartStorage(): void {
	if (typeof window === 'undefined') return

	try {
		localStorage.removeItem(CART_STORAGE_KEY)
	} catch (error) {
		console.error('Failed to clear cart storage:', error)
	}
}

/**
 * Add item to cart or update quantity if already exists
 */
export function addItemToCart(cart: Cart, newItem: Omit<CartItem, 'id'>): Cart {
	const existingItemIndex = cart.items.findIndex(item => item.productSku === newItem.productSku)

	let updatedItems: CartItem[]

	if (existingItemIndex >= 0) {
		// Item exists, update quantity
		updatedItems = cart.items.map((item, index) =>
			index === existingItemIndex ? { ...item, quantity: item.quantity + newItem.quantity } : item,
		)
	} else {
		// New item, add to cart
		updatedItems = [...cart.items, { ...newItem, id: generateCartItemId() }]
	}

	const updatedCart = {
		...cart,
		items: updatedItems,
	}

	return calculateCartTotals(updatedCart)
}

/**
 * Remove item from cart by ID
 */
export function removeItemFromCart(cart: Cart, itemId: string): Cart {
	const updatedCart = {
		...cart,
		items: cart.items.filter(item => item.id !== itemId),
	}

	return calculateCartTotals(updatedCart)
}

/**
 * Update item quantity in cart
 */
export function updateItemQuantity(cart: Cart, itemId: string, quantity: number): Cart {
	if (quantity <= 0) {
		return removeItemFromCart(cart, itemId)
	}

	const updatedCart = {
		...cart,
		items: cart.items.map(item => (item.id === itemId ? { ...item, quantity } : item)),
	}

	return calculateCartTotals(updatedCart)
}

/**
 * Update payment method
 */
export function updatePaymentMethod(cart: Cart, paymentMethod: PaymentMethod): Cart {
	const updatedCart = {
		...cart,
		paymentMethod,
	}

	return calculateCartTotals(updatedCart)
}

/**
 * Apply promo code discount
 */
export function applyPromoCode(cart: Cart, code: string, discount: number): Cart {
	const updatedCart = {
		...cart,
		promoCode: code,
		promoDiscount: discount,
	}

	return calculateCartTotals(updatedCart)
}

/**
 * Remove promo code
 */
export function removePromoCode(cart: Cart): Cart {
	const updatedCart = {
		...cart,
		promoCode: undefined,
		promoDiscount: undefined,
	}

	return calculateCartTotals(updatedCart)
}

/**
 * Get cart item count
 */
export function getCartItemCount(cart: Cart): number {
	return cart.items.reduce((count, item) => count + item.quantity, 0)
}

/**
 * Check if cart is empty
 */
export function isCartEmpty(cart: Cart): boolean {
	return cart.items.length === 0
}
