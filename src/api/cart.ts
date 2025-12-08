import type { Cart, CartItem, PaymentMethod } from '@/types/cart'

/**
 * Cart API client for syncing cart state with backend
 * This provides integration points for API sync when backend is ready
 */

const API_BASE = '/api/cart'

/**
 * Fetch cart from API
 */
export async function fetchCart(accountId: string): Promise<Cart | null> {
	try {
		const response = await fetch(`${API_BASE}/${accountId}`)
		if (!response.ok) {
			if (response.status === 404) return null
			throw new Error('Failed to fetch cart')
		}
		return await response.json()
	} catch (error) {
		console.error('Failed to fetch cart:', error)
		return null
	}
}

/**
 * Save cart to API
 */
export async function saveCart(cart: Cart): Promise<boolean> {
	try {
		const response = await fetch(`${API_BASE}/${cart.accountId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(cart),
		})
		return response.ok
	} catch (error) {
		console.error('Failed to save cart:', error)
		return false
	}
}

/**
 * Add item to cart via API
 */
export async function addCartItem(
	accountId: string,
	item: Omit<CartItem, 'id'>
): Promise<Cart | null> {
	try {
		const response = await fetch(`${API_BASE}/${accountId}/items`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(item),
		})
		if (!response.ok) throw new Error('Failed to add item')
		return await response.json()
	} catch (error) {
		console.error('Failed to add cart item:', error)
		return null
	}
}

/**
 * Remove item from cart via API
 */
export async function removeCartItem(accountId: string, itemId: string): Promise<Cart | null> {
	try {
		const response = await fetch(`${API_BASE}/${accountId}/items/${itemId}`, {
			method: 'DELETE',
		})
		if (!response.ok) throw new Error('Failed to remove item')
		return await response.json()
	} catch (error) {
		console.error('Failed to remove cart item:', error)
		return null
	}
}

/**
 * Update item quantity via API
 */
export async function updateCartItemQuantity(
	accountId: string,
	itemId: string,
	quantity: number
): Promise<Cart | null> {
	try {
		const response = await fetch(`${API_BASE}/${accountId}/items/${itemId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ quantity }),
		})
		if (!response.ok) throw new Error('Failed to update quantity')
		return await response.json()
	} catch (error) {
		console.error('Failed to update cart item quantity:', error)
		return null
	}
}

/**
 * Update payment method via API
 */
export async function updateCartPaymentMethod(
	accountId: string,
	paymentMethod: PaymentMethod
): Promise<Cart | null> {
	try {
		const response = await fetch(`${API_BASE}/${accountId}/payment-method`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ paymentMethod }),
		})
		if (!response.ok) throw new Error('Failed to update payment method')
		return await response.json()
	} catch (error) {
		console.error('Failed to update payment method:', error)
		return null
	}
}

/**
 * Validate and apply promo code via API
 */
export async function validatePromoCode(
	accountId: string,
	code: string
): Promise<{ valid: boolean; discount?: number; error?: string }> {
	try {
		const response = await fetch(`${API_BASE}/${accountId}/promo`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code }),
		})

		if (!response.ok) {
			return { valid: false, error: 'Invalid promo code' }
		}

		const data = await response.json()
		return { valid: true, discount: data.discount }
	} catch (error) {
		console.error('Failed to validate promo code:', error)
		return { valid: false, error: 'Failed to validate promo code' }
	}
}

/**
 * Create shareable cart link
 */
export async function createShareableCartLink(accountId: string): Promise<string | null> {
	try {
		const response = await fetch(`${API_BASE}/${accountId}/share`, {
			method: 'POST',
		})
		if (!response.ok) throw new Error('Failed to create share link')
		const data = await response.json()
		return data.shareUrl
	} catch (error) {
		console.error('Failed to create shareable cart link:', error)
		return null
	}
}

/**
 * Share cart as proposal
 */
export async function shareCartAsProposal(
	accountId: string,
	recipientEmail: string
): Promise<boolean> {
	try {
		const response = await fetch(`${API_BASE}/${accountId}/proposal`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ recipientEmail }),
		})
		return response.ok
	} catch (error) {
		console.error('Failed to share cart as proposal:', error)
		return false
	}
}

/**
 * Clear cart via API
 */
export async function clearCart(accountId: string): Promise<boolean> {
	try {
		const response = await fetch(`${API_BASE}/${accountId}`, {
			method: 'DELETE',
		})
		return response.ok
	} catch (error) {
		console.error('Failed to clear cart:', error)
		return false
	}
}
