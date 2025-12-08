/**
 * Shopify Integration
 *
 * Exports for Shopify Store API integration.
 */

export { createShopifyClient, ShopifyClient } from './client'
export type { ShopifyClientConfig } from './client'

export { normalizeOrder, normalizeProduct } from './mock-data'

export type {
	// API types
	ShopifyApiError,
	ShopifyApiResponse,
	ShopifyApiSuccess,
	// Request/Response types
	ShopifyCreateOrderParams,
	ShopifyInventoryResponse,
	ShopifyOrderListParams,
	ShopifyOrdersResponse,
	ShopifyPaginatedResponse,
	ShopifyPaginationInfo,
	ShopifyProductListParams,
	ShopifyProductsResponse,
	// Core types
	ShopifyAddress,
	ShopifyCustomer,
	ShopifyFulfillment,
	ShopifyInventoryItem,
	ShopifyInventoryLevel,
	ShopifyMoney,
	ShopifyOrder,
	ShopifyOrderLineItem,
	ShopifyOrderShippingLine,
	ShopifyPriceSet,
	ShopifyProduct,
	ShopifyProductImage,
	ShopifyProductOption,
	ShopifyProductVariant,
	// Normalized types
	NormalizedOrder,
	NormalizedProduct,
} from './types'
