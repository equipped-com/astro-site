export type PaymentMethod = 'buy' | '24-month' | '36-month'

export interface CartItem {
	id: string
	productSku: string
	productName: string
	productImage: string
	specs: Record<string, string>
	quantity: number
	unitPrice: number
	monthlyPrice24?: number
	monthlyPrice36?: number
}

export interface Cart {
	id: string
	accountId: string
	userId: string
	paymentMethod: PaymentMethod
	items: CartItem[]
	promoCode?: string
	promoDiscount?: number
	subtotal: number
	monthlyTotal?: number
	createdAt: Date
	updatedAt: Date
}

export interface PromoCode {
	code: string
	discount: number
	type: 'percentage' | 'fixed'
	description?: string
}

export interface CartCalculations {
	subtotal: number
	discount: number
	total: number
	monthlyTotal?: number
}
