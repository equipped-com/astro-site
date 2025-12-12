/**
 * Product Catalog Schema Tests
 *
 * Tests for brands, products, and inventory_items table structure,
 * foreign key relationships, indexes, and unique constraints.
 *
 * @REQ-SCHEMA-001 - Brands table structure
 * @REQ-SCHEMA-002 - Products table structure
 * @REQ-SCHEMA-003 - Inventory items table structure
 * @REQ-SCHEMA-004 - Foreign key relationships
 * @REQ-SCHEMA-005 - Performance indexes
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { createTestDatabase } from '@/test/drizzle-helpers'
import { brands, inventoryItems, products } from './schema'

// In-memory D1 database for testing
let db: ReturnType<typeof createTestDatabase>['db']
let d1: ReturnType<typeof createTestDatabase>['d1']

// Setup in-memory database
beforeEach(() => {
	const result = createTestDatabase()
	db = result.db
	d1 = result.d1
})

/**
 * Feature: Product Catalog Schema
 *   As a database administrator
 *   I want a global product catalog
 *   So that we can manage inventory across all tenants
 */
describe('Product Catalog Schema', () => {
	/**
	 * @REQ-SCHEMA-001 @Brands
	 * Scenario: Brands table structure
	 *   Given the migrations have been run
	 *   When I query the brands table
	 *   Then it should have the correct columns and constraints
	 */
	describe('Brands table structure', () => {
		it('should create a brand with all required fields', async () => {
			const brandId = 'brand_apple'
			const brand = {
				id: brandId,
				name: 'Apple',
				slug: 'apple',
				logoUrl: 'https://example.com/apple.png',
				isActive: true,
			}

			await db.insert(brands).values(brand)

			const result = await db.select().from(brands).where(eq(brands.id, brandId))
			expect(result).toHaveLength(1)
			expect(result[0].name).toBe('Apple')
			expect(result[0].slug).toBe('apple')
			expect(result[0].isActive).toBe(true) // Drizzle returns boolean with mode: 'boolean'
		})

		it('should enforce unique constraint on name', async () => {
			await db.insert(brands).values({
				id: 'brand_1',
				name: 'Apple',
				slug: 'apple',
			})

			await expect(
				db.insert(brands).values({
					id: 'brand_2',
					name: 'Apple', // Duplicate name
					slug: 'apple-2',
				}),
			).rejects.toThrow()
		})

		it('should enforce unique constraint on slug', async () => {
			await db.insert(brands).values({
				id: 'brand_1',
				name: 'Apple',
				slug: 'apple',
			})

			await expect(
				db.insert(brands).values({
					id: 'brand_2',
					name: 'Apple Inc',
					slug: 'apple', // Duplicate slug
				}),
			).rejects.toThrow()
		})

		it('should set default values for is_active and timestamps', async () => {
			const brandId = 'brand_default'
			await db.insert(brands).values({
				id: brandId,
				name: 'Default Brand',
				slug: 'default',
			})

			const result = await db.select().from(brands).where(eq(brands.id, brandId))
			expect(result[0].isActive).toBe(true) // Drizzle returns boolean with mode: 'boolean'
			expect(result[0].createdAt).toBeTruthy()
			expect(result[0].updatedAt).toBeTruthy()
		})
	})

	/**
	 * @REQ-SCHEMA-002 @Products
	 * Scenario: Products table structure
	 *   Given the migrations have been run
	 *   When I query the products table
	 *   Then it should have the correct columns and constraints
	 */
	describe('Products table structure', () => {
		beforeEach(async () => {
			// Create a brand for foreign key tests
			await db.insert(brands).values({
				id: 'brand_apple',
				name: 'Apple',
				slug: 'apple',
			})
		})

		it('should create a product with all required fields', async () => {
			const productId = 'prod_macbook_pro'
			const product = {
				id: productId,
				brandId: 'brand_apple',
				name: 'MacBook Pro 16"',
				modelIdentifier: 'MacBookPro18,1',
				modelNumber: 'MK1E3LL/A',
				sku: 'MBP-16-M1-PRO-512',
				productType: 'laptop',
				description: '16-inch MacBook Pro with M1 Pro chip',
				specs: JSON.stringify({ cpu: 'M1 Pro', memory: '16GB', storage: '512GB' }),
				msrp: 2499.0,
				imageUrl: 'https://example.com/mbp.jpg',
				isActive: true,
			}

			await db.insert(products).values(product)

			const result = await db.select().from(products).where(eq(products.id, productId))
			expect(result).toHaveLength(1)
			expect(result[0].name).toBe('MacBook Pro 16"')
			expect(result[0].brandId).toBe('brand_apple')
			expect(result[0].sku).toBe('MBP-16-M1-PRO-512')
			expect(result[0].productType).toBe('laptop')
		})

		it('should enforce unique constraint on SKU', async () => {
			await db.insert(products).values({
				id: 'prod_1',
				brandId: 'brand_apple',
				name: 'Product 1',
				sku: 'SKU-123',
				productType: 'laptop',
			})

			await expect(
				db.insert(products).values({
					id: 'prod_2',
					brandId: 'brand_apple',
					name: 'Product 2',
					sku: 'SKU-123', // Duplicate SKU
					productType: 'laptop',
				}),
			).rejects.toThrow()
		})

		it('should set default values for is_active and timestamps', async () => {
			const productId = 'prod_default'
			await db.insert(products).values({
				id: productId,
				brandId: 'brand_apple',
				name: 'Default Product',
				productType: 'laptop',
			})

			const result = await db.select().from(products).where(eq(products.id, productId))
			expect(result[0].isActive).toBe(true) // Drizzle returns boolean with mode: 'boolean'
			expect(result[0].createdAt).toBeTruthy()
			expect(result[0].updatedAt).toBeTruthy()
		})

		it('should support all product types', async () => {
			const types = ['laptop', 'desktop', 'tablet', 'phone', 'accessory', 'display']

			for (const type of types) {
				await db.insert(products).values({
					id: `prod_${type}`,
					brandId: 'brand_apple',
					name: `Test ${type}`,
					productType: type,
				})
			}

			const result = await db.select().from(products)
			expect(result).toHaveLength(types.length)
		})
	})

	/**
	 * @REQ-SCHEMA-003 @Inventory
	 * Scenario: Inventory items table structure
	 *   Given the migrations have been run
	 *   When I query the inventory_items table
	 *   Then it should have the correct columns and constraints
	 */
	describe('Inventory items table structure', () => {
		beforeEach(async () => {
			// Create brand and product for foreign key tests
			await db.insert(brands).values({
				id: 'brand_apple',
				name: 'Apple',
				slug: 'apple',
			})
			await db.insert(products).values({
				id: 'prod_macbook',
				brandId: 'brand_apple',
				name: 'MacBook Pro',
				productType: 'laptop',
			})
		})

		it('should create an inventory item with all required fields', async () => {
			const itemId = 'inv_item_1'
			const item = {
				id: itemId,
				productId: 'prod_macbook',
				serialNumber: 'C02XJ0XHJG5H',
				condition: 'new',
				status: 'available',
				purchaseCost: 2000.0,
				salePrice: 2499.0,
				notes: 'Brand new in box',
				warehouseLocation: 'A1-B2-C3',
			}

			await db.insert(inventoryItems).values(item)

			const result = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId))
			expect(result).toHaveLength(1)
			expect(result[0].productId).toBe('prod_macbook')
			expect(result[0].serialNumber).toBe('C02XJ0XHJG5H')
			expect(result[0].condition).toBe('new')
			expect(result[0].status).toBe('available')
		})

		it('should enforce unique constraint on serial_number', async () => {
			await db.insert(inventoryItems).values({
				id: 'item_1',
				productId: 'prod_macbook',
				serialNumber: 'SERIAL123',
			})

			await expect(
				db.insert(inventoryItems).values({
					id: 'item_2',
					productId: 'prod_macbook',
					serialNumber: 'SERIAL123', // Duplicate serial number
				}),
			).rejects.toThrow()
		})

		it('should set default values for condition, status, and timestamps', async () => {
			const itemId = 'item_default'
			await db.insert(inventoryItems).values({
				id: itemId,
				productId: 'prod_macbook',
			})

			const result = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId))
			expect(result[0].condition).toBe('new') // Default 'new'
			expect(result[0].status).toBe('available') // Default 'available'
			expect(result[0].createdAt).toBeTruthy()
			expect(result[0].updatedAt).toBeTruthy()
		})

		it('should support all inventory conditions', async () => {
			const conditions = ['new', 'like_new', 'good', 'fair', 'refurbished']

			for (const condition of conditions) {
				await db.insert(inventoryItems).values({
					id: `item_${condition}`,
					productId: 'prod_macbook',
					condition: condition,
				})
			}

			const result = await db.select().from(inventoryItems)
			expect(result).toHaveLength(conditions.length)
		})

		it('should support all inventory statuses', async () => {
			const statuses = ['available', 'reserved', 'sold', 'allocated']

			for (const status of statuses) {
				await db.insert(inventoryItems).values({
					id: `item_${status}`,
					productId: 'prod_macbook',
					status: status,
				})
			}

			const result = await db.select().from(inventoryItems)
			expect(result).toHaveLength(statuses.length)
		})
	})

	/**
	 * @REQ-SCHEMA-004 @ForeignKeys
	 * Scenario: Foreign key relationships
	 *   When I try to insert product with invalid brand_id
	 *   Then the insert should fail with foreign key error
	 *   When I try to insert inventory_item with invalid product_id
	 *   Then the insert should fail with foreign key error
	 */
	describe('Foreign key relationships', () => {
		it('should reject product with invalid brand_id', async () => {
			await expect(
				db.insert(products).values({
					id: 'prod_invalid',
					brandId: 'brand_nonexistent', // Invalid foreign key
					name: 'Invalid Product',
					productType: 'laptop',
				}),
			).rejects.toThrow()
		})

		it('should reject inventory_item with invalid product_id', async () => {
			await expect(
				db.insert(inventoryItems).values({
					id: 'item_invalid',
					productId: 'prod_nonexistent', // Invalid foreign key
				}),
			).rejects.toThrow()
		})

		it('should allow valid foreign key relationships', async () => {
			// Create brand
			await db.insert(brands).values({
				id: 'brand_dell',
				name: 'Dell',
				slug: 'dell',
			})

			// Create product with valid brand_id
			await db.insert(products).values({
				id: 'prod_xps',
				brandId: 'brand_dell',
				name: 'XPS 13',
				productType: 'laptop',
			})

			// Create inventory item with valid product_id
			await db.insert(inventoryItems).values({
				id: 'item_xps_1',
				productId: 'prod_xps',
			})

			const items = await db.select().from(inventoryItems).where(eq(inventoryItems.productId, 'prod_xps'))
			expect(items).toHaveLength(1)
		})
	})

	/**
	 * @REQ-SCHEMA-005 @Indexes
	 * Scenario: Performance indexes exist
	 *   Then the following indexes should exist:
	 *   - brands: slug, is_active
	 *   - products: brand_id, sku, product_type, is_active
	 *   - inventory_items: product_id, status, condition, serial_number
	 */
	describe('Performance indexes', () => {
		it('should have indexes on brands table', async () => {
			const result = await d1
				.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='brands' ORDER BY name")
				.all()

			const indexNames = result.results.map((row: { name: string }) => row.name)
			expect(indexNames).toContain('idx_brands_slug')
			expect(indexNames).toContain('idx_brands_is_active')
		})

		it('should have indexes on products table', async () => {
			const result = await d1
				.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='products' ORDER BY name")
				.all()

			const indexNames = result.results.map((row: { name: string }) => row.name)
			expect(indexNames).toContain('idx_products_brand')
			expect(indexNames).toContain('idx_products_sku')
			expect(indexNames).toContain('idx_products_type')
			expect(indexNames).toContain('idx_products_is_active')
		})

		it('should have indexes on inventory_items table', async () => {
			const result = await d1
				.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='inventory_items' ORDER BY name")
				.all()

			const indexNames = result.results.map((row: { name: string }) => row.name)
			expect(indexNames).toContain('idx_inventory_product')
			expect(indexNames).toContain('idx_inventory_status')
			expect(indexNames).toContain('idx_inventory_condition')
			expect(indexNames).toContain('idx_inventory_serial')
		})
	})

	/**
	 * Integration test: Complete workflow
	 *   Given I have a brand
	 *   When I create a product for that brand
	 *   And I create inventory items for that product
	 *   Then I should be able to query the complete hierarchy
	 */
	describe('Complete catalog workflow', () => {
		it('should support complete brand -> product -> inventory workflow', async () => {
			// Create brand
			await db.insert(brands).values({
				id: 'brand_lenovo',
				name: 'Lenovo',
				slug: 'lenovo',
				logoUrl: 'https://example.com/lenovo.png',
			})

			// Create product
			await db.insert(products).values({
				id: 'prod_thinkpad',
				brandId: 'brand_lenovo',
				name: 'ThinkPad X1 Carbon',
				sku: 'TP-X1C-GEN10',
				productType: 'laptop',
				msrp: 1899.0,
			})

			// Create multiple inventory items
			await db.insert(inventoryItems).values([
				{
					id: 'item_tp_1',
					productId: 'prod_thinkpad',
					serialNumber: 'TP001',
					condition: 'new',
					status: 'available',
					purchaseCost: 1500.0,
					salePrice: 1899.0,
				},
				{
					id: 'item_tp_2',
					productId: 'prod_thinkpad',
					serialNumber: 'TP002',
					condition: 'new',
					status: 'reserved',
					purchaseCost: 1500.0,
					salePrice: 1899.0,
				},
			])

			// Query hierarchy
			const brandResult = await db.select().from(brands).where(eq(brands.slug, 'lenovo'))
			expect(brandResult).toHaveLength(1)

			const productResult = await db.select().from(products).where(eq(products.brandId, 'brand_lenovo'))
			expect(productResult).toHaveLength(1)

			const inventoryResult = await db.select().from(inventoryItems).where(eq(inventoryItems.productId, 'prod_thinkpad'))
			expect(inventoryResult).toHaveLength(2)

			// Verify available inventory
			const availableItems = inventoryResult.filter(item => item.status === 'available')
			expect(availableItems).toHaveLength(1)
		})
	})
})
