import { act, render, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { CartProvider, useCart } from './cart-context'

describe('cart-context', () => {
	beforeEach(() => {
		localStorage.clear()
	})

	function wrapper({ children }: { children: ReactNode }) {
		return (
			<CartProvider accountId="test-account" userId="test-user">
				{children}
			</CartProvider>
		)
	}

	it('should provide cart context', () => {
		const { result } = renderHook(() => useCart(), { wrapper })

		expect(result.current.cart).toBeDefined()
		expect(result.current.isEmpty).toBe(true)
		expect(result.current.itemCount).toBe(0)
	})

	it('should throw error when used outside provider', () => {
		expect(() => {
			renderHook(() => useCart())
		}).toThrow('useCart must be used within a CartProvider')
	})

	it('should add item to cart', async () => {
		const { result } = renderHook(() => useCart(), { wrapper })

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})

		act(() => {
			result.current.addItem({
				productSku: 'MB-M2',
				productName: 'MacBook Air M2',
				productImage: '',
				specs: { storage: '256GB', color: 'Silver' },
				quantity: 1,
				unitPrice: 1199,
			})
		})

		expect(result.current.cart.items).toHaveLength(1)
		expect(result.current.cart.items[0].productSku).toBe('MB-M2')
		expect(result.current.isEmpty).toBe(false)
		expect(result.current.itemCount).toBe(1)
	})

	it('should remove item from cart', async () => {
		const { result } = renderHook(() => useCart(), { wrapper })

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})

		act(() => {
			result.current.addItem({
				productSku: 'MB-M2',
				productName: 'MacBook Air M2',
				productImage: '',
				specs: {},
				quantity: 1,
				unitPrice: 1199,
			})
		})

		const itemId = result.current.cart.items[0].id

		act(() => {
			result.current.removeItem(itemId)
		})

		expect(result.current.cart.items).toHaveLength(0)
		expect(result.current.isEmpty).toBe(true)
	})

	it('should update item quantity', async () => {
		const { result } = renderHook(() => useCart(), { wrapper })

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})

		act(() => {
			result.current.addItem({
				productSku: 'MB-M2',
				productName: 'MacBook Air M2',
				productImage: '',
				specs: {},
				quantity: 1,
				unitPrice: 1199,
			})
		})

		const itemId = result.current.cart.items[0].id

		act(() => {
			result.current.updateQuantity(itemId, 3)
		})

		expect(result.current.cart.items[0].quantity).toBe(3)
		expect(result.current.itemCount).toBe(3)
	})

	it('should update payment method', async () => {
		const { result } = renderHook(() => useCart(), { wrapper })

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})

		act(() => {
			result.current.setPaymentMethod('24-month')
		})

		expect(result.current.cart.paymentMethod).toBe('24-month')
	})

	it('should apply promo code', async () => {
		const { result } = renderHook(() => useCart(), { wrapper })

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})

		act(() => {
			result.current.applyPromo('FIRST10', 10)
		})

		expect(result.current.cart.promoCode).toBe('FIRST10')
		expect(result.current.cart.promoDiscount).toBe(10)
	})

	it('should remove promo code', async () => {
		const { result } = renderHook(() => useCart(), { wrapper })

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})

		act(() => {
			result.current.applyPromo('FIRST10', 10)
		})

		act(() => {
			result.current.removePromo()
		})

		expect(result.current.cart.promoCode).toBeUndefined()
		expect(result.current.cart.promoDiscount).toBeUndefined()
	})

	it('should clear cart', async () => {
		const { result } = renderHook(() => useCart(), { wrapper })

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})

		act(() => {
			result.current.addItem({
				productSku: 'MB-M2',
				productName: 'MacBook Air M2',
				productImage: '',
				specs: {},
				quantity: 1,
				unitPrice: 1199,
			})
		})

		expect(result.current.cart.items).toHaveLength(1)

		act(() => {
			result.current.clearCart()
		})

		expect(result.current.cart.items).toHaveLength(0)
		expect(result.current.isEmpty).toBe(true)
	})

	it('should persist cart to localStorage', async () => {
		const { result } = renderHook(() => useCart(), { wrapper })

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})

		act(() => {
			result.current.addItem({
				productSku: 'MB-M2',
				productName: 'MacBook Air M2',
				productImage: '',
				specs: {},
				quantity: 1,
				unitPrice: 1199,
			})
		})

		await waitFor(() => {
			const stored = localStorage.getItem('equipped_cart')
			expect(stored).toBeTruthy()

			const parsed = JSON.parse(stored!)
			expect(parsed.items).toHaveLength(1)
		})
	})

	it('should load cart from localStorage on mount', async () => {
		// Pre-populate localStorage
		const cart = {
			id: 'test-cart',
			accountId: 'test-account',
			userId: 'test-user',
			paymentMethod: 'buy',
			items: [
				{
					id: 'item-1',
					productSku: 'MB-M2',
					productName: 'MacBook Air M2',
					productImage: '',
					specs: {},
					quantity: 2,
					unitPrice: 1199,
				},
			],
			subtotal: 2398,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}
		localStorage.setItem('equipped_cart', JSON.stringify(cart))

		const { result } = renderHook(() => useCart(), { wrapper })

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})

		expect(result.current.cart.items).toHaveLength(1)
		expect(result.current.cart.items[0].productSku).toBe('MB-M2')
		expect(result.current.itemCount).toBe(2)
	})
})
