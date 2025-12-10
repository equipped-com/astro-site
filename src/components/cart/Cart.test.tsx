import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CartProvider } from '@/lib/cart-context'
import { Cart } from './Cart'

// Mock sonner toast
vi.mock('sonner', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	},
}))

describe('Cart Component', () => {
	beforeEach(() => {
		localStorage.clear()
		vi.clearAllMocks()
	})

	function renderCart() {
		return render(
			<CartProvider accountId="test-account" userId="test-user">
				<Cart />
			</CartProvider>,
		)
	}

	describe('@REQ-COM-CART-007 - Empty cart state', () => {
		it('should show empty cart message when cart is empty', () => {
			renderCart()

			expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
			expect(screen.getByText('Add some products to get started')).toBeInTheDocument()
			expect(screen.getByText('Start shopping')).toBeInTheDocument()
		})
	})

	describe('@REQ-COM-CART-001 - Add product to cart', () => {
		it('should display item when added to cart', async () => {
			// Pre-populate cart in localStorage before mounting
			const cart = {
				id: 'test-cart',
				accountId: 'test-account',
				userId: 'test-user',
				paymentMethod: 'buy' as const,
				items: [
					{
						id: 'item-1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
				subtotal: 1199,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			localStorage.setItem('equipped_cart', JSON.stringify(cart))

			// Render with pre-populated cart
			renderCart()

			await waitFor(() => {
				expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
			})

			// Check that price is displayed (formatted as currency)
			// Multiple instances of the price exist (item price, subtotal, total)
			expect(screen.getAllByText(/1,?199\.00/).length).toBeGreaterThan(0)
		})
	})

	describe('@REQ-COM-CART-002 - Toggle payment method', () => {
		it('should toggle between Buy and 24-month payment methods', async () => {
			const cart = {
				id: 'test-cart',
				accountId: 'test-account',
				userId: 'test-user',
				paymentMethod: 'buy' as const,
				items: [
					{
						id: 'item-1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
						monthlyPrice24: 49.96,
						monthlyPrice36: 33.31,
					},
				],
				subtotal: 1199,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			localStorage.setItem('equipped_cart', JSON.stringify(cart))

			renderCart()

			await waitFor(() => {
				expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
			})

			// Initially shows Buy total
			expect(screen.getAllByText(/1,?199\.00/).length).toBeGreaterThan(0)

			// Click 24-month button
			const monthButton24 = screen.getByRole('button', { name: /24-month/i })
			fireEvent.click(monthButton24)

			await waitFor(() => {
				// Should show monthly payment
				expect(screen.getAllByText(/49\.96/).length).toBeGreaterThan(0)
			})

			// Click 36-month button
			const monthButton36 = screen.getByRole('button', { name: /36-month/i })
			fireEvent.click(monthButton36)

			await waitFor(() => {
				// Monthly should decrease
				expect(screen.getAllByText(/33\.31/).length).toBeGreaterThan(0)
			})
		})
	})

	describe('@REQ-COM-CART-003 - Real-time cart calculations', () => {
		it('should display correct cart summary with subtotal and calculated fields', async () => {
			const cart = {
				id: 'test-cart',
				accountId: 'test-account',
				userId: 'test-user',
				paymentMethod: 'buy' as const,
				items: [
					{
						id: 'item-1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
					{
						id: 'item-2',
						productSku: 'IP-15',
						productName: 'iPhone 15',
						productImage: '',
						specs: {},
						quantity: 2,
						unitPrice: 799.5,
					},
				],
				subtotal: 2798,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			localStorage.setItem('equipped_cart', JSON.stringify(cart))

			renderCart()

			await waitFor(() => {
				expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
			})

			// Check cart summary
			expect(screen.getByText('Subtotal')).toBeInTheDocument()
			expect(screen.getAllByText(/2,?798\.00/).length).toBeGreaterThan(0)
			expect(screen.getByText('Shipping')).toBeInTheDocument()
			expect(screen.getByText('Calculated at checkout')).toBeInTheDocument()
			expect(screen.getByText('Taxes')).toBeInTheDocument()
		})
	})

	describe('@REQ-COM-CART-004 - Apply promo code', () => {
		it('should apply valid promo code and show discount', async () => {
			const cart = {
				id: 'test-cart',
				accountId: 'test-account',
				userId: 'test-user',
				paymentMethod: 'buy' as const,
				items: [
					{
						id: 'item-1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
				subtotal: 1199,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			localStorage.setItem('equipped_cart', JSON.stringify(cart))

			renderCart()

			await waitFor(() => {
				expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
			})

			// Find promo code input
			const promoInput = screen.getByPlaceholderText('Enter code')
			const applyButton = screen.getByRole('button', { name: /apply/i })

			// Enter valid promo code
			fireEvent.change(promoInput, { target: { value: 'FIRST10' } })
			fireEvent.click(applyButton)

			await waitFor(() => {
				expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('FIRST10'))
			})

			// Should show discount applied
			await waitFor(() => {
				expect(screen.getByText(/FIRST10/i)).toBeInTheDocument()
			})
		})

		it('should show error for invalid promo code', async () => {
			const cart = {
				id: 'test-cart',
				accountId: 'test-account',
				userId: 'test-user',
				paymentMethod: 'buy' as const,
				items: [
					{
						id: 'item-1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
				subtotal: 1199,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			localStorage.setItem('equipped_cart', JSON.stringify(cart))

			renderCart()

			await waitFor(() => {
				expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
			})

			const promoInput = screen.getByPlaceholderText('Enter code')
			const applyButton = screen.getByRole('button', { name: /apply/i })

			fireEvent.change(promoInput, { target: { value: 'INVALID' } })
			fireEvent.click(applyButton)

			await waitFor(() => {
				expect(screen.getByText('Invalid promo code')).toBeInTheDocument()
			})
		})
	})

	describe('Item quantity updates', () => {
		it('should increase item quantity when plus button clicked', async () => {
			const cart = {
				id: 'test-cart',
				accountId: 'test-account',
				userId: 'test-user',
				paymentMethod: 'buy' as const,
				items: [
					{
						id: 'item-1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
				subtotal: 1199,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			localStorage.setItem('equipped_cart', JSON.stringify(cart))

			renderCart()

			await waitFor(() => {
				expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
			})

			// Find and click increase button
			const increaseButton = screen.getByLabelText('Increase quantity')
			fireEvent.click(increaseButton)

			await waitFor(() => {
				expect(screen.getByText('2')).toBeInTheDocument() // Quantity display
			})
		})

		it('should decrease item quantity when minus button clicked', async () => {
			const cart = {
				id: 'test-cart',
				accountId: 'test-account',
				userId: 'test-user',
				paymentMethod: 'buy' as const,
				items: [
					{
						id: 'item-1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 3,
						unitPrice: 1199,
					},
				],
				subtotal: 3597,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			localStorage.setItem('equipped_cart', JSON.stringify(cart))

			renderCart()

			await waitFor(() => {
				expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
			})

			const decreaseButton = screen.getByLabelText('Decrease quantity')
			fireEvent.click(decreaseButton)

			await waitFor(() => {
				expect(screen.getByText('2')).toBeInTheDocument()
			})
		})

		it('should not decrease quantity below 1', async () => {
			const cart = {
				id: 'test-cart',
				accountId: 'test-account',
				userId: 'test-user',
				paymentMethod: 'buy' as const,
				items: [
					{
						id: 'item-1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
				subtotal: 1199,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			localStorage.setItem('equipped_cart', JSON.stringify(cart))

			renderCart()

			await waitFor(() => {
				expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
			})

			const decreaseButton = screen.getByLabelText('Decrease quantity')
			expect(decreaseButton).toBeDisabled()
		})
	})

	describe('Item removal', () => {
		it('should remove item when trash icon clicked', async () => {
			const cart = {
				id: 'test-cart',
				accountId: 'test-account',
				userId: 'test-user',
				paymentMethod: 'buy' as const,
				items: [
					{
						id: 'item-1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
				subtotal: 1199,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			localStorage.setItem('equipped_cart', JSON.stringify(cart))

			renderCart()

			await waitFor(() => {
				expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
			})

			const removeButton = screen.getByLabelText('Remove item')
			fireEvent.click(removeButton)

			await waitFor(() => {
				expect(toast.success).toHaveBeenCalledWith('Item removed from cart')
			})

			await waitFor(() => {
				expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
			})
		})
	})

	describe('@REQ-COM-CART-005 - Share cart functionality', () => {
		it('should show share cart button', async () => {
			const cart = {
				id: 'test-cart',
				accountId: 'test-account',
				userId: 'test-user',
				paymentMethod: 'buy' as const,
				items: [
					{
						id: 'item-1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
				subtotal: 1199,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			localStorage.setItem('equipped_cart', JSON.stringify(cart))

			renderCart()

			await waitFor(() => {
				expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
			})

			expect(screen.getByRole('button', { name: /share cart/i })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /share as proposal/i })).toBeInTheDocument()
		})

		it('should handle share cart action', async () => {
			const cart = {
				id: 'test-cart',
				accountId: 'test-account',
				userId: 'test-user',
				paymentMethod: 'buy' as const,
				items: [
					{
						id: 'item-1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
				subtotal: 1199,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			localStorage.setItem('equipped_cart', JSON.stringify(cart))

			renderCart()

			await waitFor(() => {
				expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
			})

			const shareButton = screen.getByRole('button', { name: /share cart/i })
			fireEvent.click(shareButton)

			await waitFor(
				() => {
					expect(toast.success).toHaveBeenCalledWith('Cart link copied to clipboard!')
				},
				{ timeout: 2000 },
			)
		})

		it('should handle share as proposal action', async () => {
			const cart = {
				id: 'test-cart',
				accountId: 'test-account',
				userId: 'test-user',
				paymentMethod: 'buy' as const,
				items: [
					{
						id: 'item-1',
						productSku: 'MB-M2',
						productName: 'MacBook Air M2',
						productImage: '',
						specs: {},
						quantity: 1,
						unitPrice: 1199,
					},
				],
				subtotal: 1199,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			localStorage.setItem('equipped_cart', JSON.stringify(cart))

			renderCart()

			await waitFor(() => {
				expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
			})

			const proposalButton = screen.getByRole('button', { name: /share as proposal/i })
			fireEvent.click(proposalButton)

			await waitFor(
				() => {
					expect(toast.success).toHaveBeenCalledWith('Proposal created and shared!')
				},
				{ timeout: 2000 },
			)
		})
	})
})
