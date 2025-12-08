import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Cart, CartItem } from '@/types/cart'
import {
	addItemToCart,
	applyPromoCode,
	calculateCartTotals,
	calculateMonthlyPrice,
	clearCartStorage,
	createEmptyCart,
	generateCartId,
	generateCartItemId,
	getCartItemCount,
	isCartEmpty,
	loadCartFromStorage,
	removeItemFromCart,
	removePromoCode,
	saveCartToStorage,
	updateItemQuantity,
	updatePaymentMethod,
} from './cart-storage'

describe('cart-storage', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear()
	})

	describe('ID generation', () => {
		it('should generate unique cart IDs', () => {
			const id1 = generateCartId()
			const id2 = generateCartId()
			expect(id1).toMatch(/^cart_/)
			expect(id2).toMatch(/^cart_/)
			expect(id1).not.toBe(id2)
		})

		it('should generate unique cart item IDs', () => {
			const id1 = generateCartItemId()
			const id2 = generateCartItemId()
			expect(id1).toMatch(/^cart_item_/)
			expect(id2).toMatch(/^cart_item_/)
			expect(id1).not.toBe(id2)
		})
	})

	describe('calculateMonthlyPrice', () => {
		it('should calculate 24-month price correctly', () => {
			const price = calculateMonthlyPrice(1200, 24)
			expect(price).toBe(50)
		})

		it('should calculate 36-month price correctly', () => {
			const price = calculateMonthlyPrice(1200, 36)
			expect(price).toBeCloseTo(33.33, 2)
		})

		it('should round to 2 decimal places', () => {
			const price = calculateMonthlyPrice(1199, 24)
			expect(price).toBe(49.96)
		})
	})

	describe('createEmptyCart', () => {
		it('should create empty cart with default values', () => {
			const cart = createEmptyCart()
			expect(cart.items).toEqual([])
			expect(cart.paymentMethod).toBe('buy')
			expect(cart.subtotal).toBe(0)
			expect(cart.accountId).toBe('')
			expect(cart.userId).toBe('')
		})

		it('should create cart with provided accountId and userId', () => {
			const cart = createEmptyCart('acc123', 'user456')
			expect(cart.accountId).toBe('acc123')
			expect(cart.userId).toBe('user456')
		})
	})

	describe('calculateCartTotals', () => {
		it('should calculate subtotal for buy payment method', () => {
			const cart: Cart = {
				...createEmptyCart(),
				items: [
					{
						id: '1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 2,
						unitPrice: 1199,
					},
				],
			}

			const result = calculateCartTotals(cart)
			expect(result.subtotal).toBe(2398)
			expect(result.monthlyTotal).toBeUndefined()
		})

		it('should calculate monthly total for 24-month lease', () => {
			const cart: Cart = {
				...createEmptyCart(),
				paymentMethod: '24-month',
				items: [
					{
						id: '1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1200,
						monthlyPrice24: 50,
					},
				],
			}

			const result = calculateCartTotals(cart)
			expect(result.monthlyTotal).toBe(50)
		})

		it('should calculate monthly total for 36-month lease', () => {
			const cart: Cart = {
				...createEmptyCart(),
				paymentMethod: '36-month',
				items: [
					{
						id: '1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1200,
						monthlyPrice36: 33.33,
					},
				],
			}

			const result = calculateCartTotals(cart)
			expect(result.monthlyTotal).toBe(33.33)
		})

		it('should apply promo discount', () => {
			const cart: Cart = {
				...createEmptyCart(),
				promoDiscount: 100,
				items: [
					{
						id: '1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
			}

			const result = calculateCartTotals(cart)
			expect(result.subtotal).toBe(1099)
		})
	})

	describe('localStorage operations', () => {
		it('should save cart to localStorage', () => {
			const cart = createEmptyCart('acc123', 'user456')
			saveCartToStorage(cart)

			const stored = localStorage.getItem('equipped_cart')
			expect(stored).toBeTruthy()

			const parsed = JSON.parse(stored!)
			expect(parsed.accountId).toBe('acc123')
			expect(parsed.userId).toBe('user456')
		})

		it('should load cart from localStorage', () => {
			const cart = createEmptyCart('acc123', 'user456')
			saveCartToStorage(cart)

			const loaded = loadCartFromStorage()
			expect(loaded).toBeTruthy()
			expect(loaded?.accountId).toBe('acc123')
			expect(loaded?.userId).toBe('user456')
		})

		it('should return null when no cart in localStorage', () => {
			const loaded = loadCartFromStorage()
			expect(loaded).toBeNull()
		})

		it('should clear cart from localStorage', () => {
			const cart = createEmptyCart()
			saveCartToStorage(cart)
			expect(localStorage.getItem('equipped_cart')).toBeTruthy()

			clearCartStorage()
			expect(localStorage.getItem('equipped_cart')).toBeNull()
		})

		it('should handle corrupted localStorage data', () => {
			localStorage.setItem('equipped_cart', 'invalid json')
			const loaded = loadCartFromStorage()
			expect(loaded).toBeNull()
		})
	})

	describe('addItemToCart', () => {
		it('should add new item to empty cart', () => {
			const cart = createEmptyCart()
			const newItem: Omit<CartItem, 'id'> = {
				productSku: 'MB-M2',
				productName: 'MacBook Air M2',
				productImage: '',
				specs: {},
				quantity: 1,
				unitPrice: 1199,
			}

			const result = addItemToCart(cart, newItem)
			expect(result.items).toHaveLength(1)
			expect(result.items[0].productSku).toBe('MB-M2')
			expect(result.subtotal).toBe(1199)
		})

		it('should update quantity when item already exists', () => {
			const cart: Cart = {
				...createEmptyCart(),
				items: [
					{
						id: '1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
			}

			const newItem: Omit<CartItem, 'id'> = {
				productSku: 'MB-M2',
				productName: 'MacBook Air M2',
				productImage: '',
				specs: {},
				quantity: 2,
				unitPrice: 1199,
			}

			const result = addItemToCart(cart, newItem)
			expect(result.items).toHaveLength(1)
			expect(result.items[0].quantity).toBe(3)
			expect(result.subtotal).toBe(3597)
		})
	})

	describe('removeItemFromCart', () => {
		it('should remove item by ID', () => {
			const cart: Cart = {
				...createEmptyCart(),
				items: [
					{
						id: '1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
					{
						id: '2',
						productSku: 'IP-15',
						productName: 'iPhone 15',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 799,
					},
				],
			}

			const result = removeItemFromCart(cart, '1')
			expect(result.items).toHaveLength(1)
			expect(result.items[0].productSku).toBe('IP-15')
		})
	})

	describe('updateItemQuantity', () => {
		it('should update item quantity', () => {
			const cart: Cart = {
				...createEmptyCart(),
				items: [
					{
						id: '1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
			}

			const result = updateItemQuantity(cart, '1', 3)
			expect(result.items[0].quantity).toBe(3)
			expect(result.subtotal).toBe(3597)
		})

		it('should remove item when quantity is 0', () => {
			const cart: Cart = {
				...createEmptyCart(),
				items: [
					{
						id: '1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
			}

			const result = updateItemQuantity(cart, '1', 0)
			expect(result.items).toHaveLength(0)
		})

		it('should remove item when quantity is negative', () => {
			const cart: Cart = {
				...createEmptyCart(),
				items: [
					{
						id: '1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
			}

			const result = updateItemQuantity(cart, '1', -1)
			expect(result.items).toHaveLength(0)
		})
	})

	describe('updatePaymentMethod', () => {
		it('should update payment method and recalculate totals', () => {
			const cart: Cart = {
				...createEmptyCart(),
				paymentMethod: 'buy',
				items: [
					{
						id: '1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1200,
						monthlyPrice24: 50,
					},
				],
			}

			const result = updatePaymentMethod(cart, '24-month')
			expect(result.paymentMethod).toBe('24-month')
			expect(result.monthlyTotal).toBe(50)
		})
	})

	describe('promo code operations', () => {
		it('should apply promo code', () => {
			const cart = createEmptyCart()
			const result = applyPromoCode(cart, 'FIRST10', 10)

			expect(result.promoCode).toBe('FIRST10')
			expect(result.promoDiscount).toBe(10)
		})

		it('should remove promo code', () => {
			const cart: Cart = {
				...createEmptyCart(),
				promoCode: 'FIRST10',
				promoDiscount: 10,
			}

			const result = removePromoCode(cart)
			expect(result.promoCode).toBeUndefined()
			expect(result.promoDiscount).toBeUndefined()
		})
	})

	describe('cart utility functions', () => {
		it('should get cart item count', () => {
			const cart: Cart = {
				...createEmptyCart(),
				items: [
					{
						id: '1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 2,
						unitPrice: 1199,
					},
					{
						id: '2',
						productSku: 'IP-15',
						productName: 'iPhone 15',
						productImage: '',
						specs: {},
						quantity: 3,
						unitPrice: 799,
					},
				],
			}

			const count = getCartItemCount(cart)
			expect(count).toBe(5)
		})

		it('should check if cart is empty', () => {
			const emptyCart = createEmptyCart()
			expect(isCartEmpty(emptyCart)).toBe(true)

			const nonEmptyCart: Cart = {
				...createEmptyCart(),
				items: [
					{
						id: '1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
			}
			expect(isCartEmpty(nonEmptyCart)).toBe(false)
		})
	})
})
