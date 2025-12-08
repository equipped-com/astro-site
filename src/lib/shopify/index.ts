/**
 * Shopify Integration
 *
 * Exports for Shopify Store API integration.
 */

export type { ShopifyClientConfig } from './client'
export { createShopifyClient, ShopifyClient } from './client'

export { normalizeOrder, normalizeProduct } from './mock-data'

export type {
	// Normalized types
	NormalizedOrder,
	NormalizedProduct,
	// Core types
	ShopifyAddress,
	// API types
	ShopifyApiError,
	ShopifyApiResponse,
	ShopifyApiSuccess,
	// Request/Response types
	ShopifyCreateOrderParams,
	ShopifyCustomer,
	ShopifyFulfillment,
	ShopifyInventoryItem,
	ShopifyInventoryLevel,
	ShopifyInventoryResponse,
	ShopifyMoney,
	ShopifyOrder,
	ShopifyOrderLineItem,
	ShopifyOrderListParams,
	ShopifyOrderShippingLine,
	ShopifyOrdersResponse,
	ShopifyPaginatedResponse,
	ShopifyPaginationInfo,
	ShopifyPriceSet,
	ShopifyProduct,
	ShopifyProductImage,
	ShopifyProductListParams,
	ShopifyProductOption,
	ShopifyProductsResponse,
	ShopifyProductVariant,
} from './types'
