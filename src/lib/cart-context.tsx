import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import type { Cart, CartItem, PaymentMethod } from '@/types/cart'
import {
	addItemToCart,
	applyPromoCode,
	clearCartStorage,
	createEmptyCart,
	getCartItemCount,
	isCartEmpty,
	loadCartFromStorage,
	removeItemFromCart,
	removePromoCode,
	saveCartToStorage,
	updateItemQuantity,
	updatePaymentMethod,
} from './cart-storage'

interface CartContextValue {
	cart: Cart
	addItem: (item: Omit<CartItem, 'id'>) => void
	removeItem: (itemId: string) => void
	updateQuantity: (itemId: string, quantity: number) => void
	setPaymentMethod: (method: PaymentMethod) => void
	applyPromo: (code: string, discount: number) => void
	removePromo: () => void
	clearCart: () => void
	itemCount: number
	isEmpty: boolean
	isLoading: boolean
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

interface CartProviderProps {
	children: ReactNode
	accountId?: string
	userId?: string
}

export function CartProvider({ children, accountId = '', userId = '' }: CartProviderProps) {
	const [cart, setCart] = useState<Cart>(createEmptyCart(accountId, userId))
	const [isLoading, setIsLoading] = useState(true)

	// Load cart from storage on mount
	useEffect(() => {
		const storedCart = loadCartFromStorage()
		// Clear cart if accountId changes (different account)
		if (storedCart && storedCart.accountId === accountId) {
			setCart(storedCart)
		} else {
			// Account changed or no cart - create new empty cart
			clearCartStorage()
			setCart(createEmptyCart(accountId, userId))
		}
		setIsLoading(false)
	}, [accountId, userId])

	// Save cart to storage whenever it changes
	useEffect(() => {
		if (!isLoading) {
			saveCartToStorage(cart)
		}
	}, [cart, isLoading])

	function handleAddItem(item: Omit<CartItem, 'id'>) {
		setCart(prevCart => addItemToCart(prevCart, item))
	}

	function handleRemoveItem(itemId: string) {
		setCart(prevCart => removeItemFromCart(prevCart, itemId))
	}

	function handleUpdateQuantity(itemId: string, quantity: number) {
		setCart(prevCart => updateItemQuantity(prevCart, itemId, quantity))
	}

	function handleSetPaymentMethod(method: PaymentMethod) {
		setCart(prevCart => updatePaymentMethod(prevCart, method))
	}

	function handleApplyPromo(code: string, discount: number) {
		setCart(prevCart => applyPromoCode(prevCart, code, discount))
	}

	function handleRemovePromo() {
		setCart(prevCart => removePromoCode(prevCart))
	}

	function handleClearCart() {
		clearCartStorage()
		setCart(createEmptyCart(accountId, userId))
	}

	const value: CartContextValue = {
		cart,
		addItem: handleAddItem,
		removeItem: handleRemoveItem,
		updateQuantity: handleUpdateQuantity,
		setPaymentMethod: handleSetPaymentMethod,
		applyPromo: handleApplyPromo,
		removePromo: handleRemovePromo,
		clearCart: handleClearCart,
		itemCount: getCartItemCount(cart),
		isEmpty: isCartEmpty(cart),
		isLoading,
	}

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
	const context = useContext(CartContext)
	if (context === undefined) {
		throw new Error('useCart must be used within a CartProvider')
	}
	return context
}
