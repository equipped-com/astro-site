/**
 * Catalog Seed Script Tests
 *
 * Tests for the catalog seed data script.
 * Validates that brands and products are seeded correctly, specs are populated,
 * and the seed operation is idempotent.
 *
 * Feature: Catalog Seed Data
 *   As a developer
 *   I want pre-populated catalog data
 *   So that I can test the platform without manual data entry
 *
 * Test Scenarios (Gherkin BDD):
 * @REQ-SEED-001 - Apple brand seeded
 * @REQ-SEED-002 - Common Apple products seeded
 * @REQ-SEED-003 - Product specs are detailed
 * @REQ-SEED-004 - Seed script is idempotent
 */

import { describe, expect, it } from 'vitest'
import { seedCatalog } from './catalog'

/**
 * Mock Database for Unit Testing
 * Captures all insert operations and provides idempotent behavior
 */
class MockDatabase {
	private insertedBrands: Map<string, any> = new Map()
	private insertedProducts: Map<string, any> = new Map()
	private insertCount = 0

	insert(table: any) {
		const self = this
		return {
			values: function(value: any) {
				const thisValue = value
				return {
					onConflictDoUpdate({ target, set }: any) {
						// Determine which table and key based on target column
						// target can be either a string or a column object with name property
						const targetName = typeof target === 'string' ? target : target?.name || target?.['name']

						if (targetName === 'slug') {
							// Brands table - use slug as key
							self.insertedBrands.set(thisValue.slug, thisValue)
						} else if (targetName === 'sku') {
							// Products table - use sku as key
							self.insertedProducts.set(thisValue.sku, thisValue)
						}
						self.insertCount++
						// Return a promise that resolves immediately
						return Promise.resolve()
					},
				}
			},
		}
	}

	getBrands() {
		return Array.from(this.insertedBrands.values())
	}

	getProducts() {
		return Array.from(this.insertedProducts.values())
	}

	getBrandCount() {
		return this.insertedBrands.size
	}

	getProductCount() {
		return this.insertedProducts.size
	}

	getInsertCount() {
		return this.insertCount
	}

	reset() {
		this.insertedBrands.clear()
		this.insertedProducts.clear()
		this.insertCount = 0
	}
}

/**
 * Feature: Catalog Seed Data
 *   As a developer
 *   I want pre-populated catalog data
 *   So that I can test the platform without manual data entry
 */
describe('Catalog Seed Data', () => {
	let mockDb: MockDatabase

	/**
	 * @REQ-SEED-001 @Brands
	 * Scenario: Apple brand seeded
	 *   Given the seed script has run
	 *   When I query the brands table
	 *   Then I should find Apple brand with correct properties
	 *   And the brand should be active
	 */
	describe('Apple brand seeded (REQ-SEED-001)', () => {
		it('should seed Apple brand with correct name', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const brands = mockDb.getBrands()
			const apple = brands.find(b => b.slug === 'apple')

			expect(apple).toBeDefined()
			expect(apple?.name).toBe('Apple')
			expect(apple?.slug).toBe('apple')
		})

		it('Apple brand should be active', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const brands = mockDb.getBrands()
			const apple = brands.find(b => b.slug === 'apple')

			expect(apple?.isActive).toBe(true)
		})

		it('Apple brand should have a logo URL', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const brands = mockDb.getBrands()
			const apple = brands.find(b => b.slug === 'apple')

			expect(apple?.logoUrl).toBeTruthy()
			expect(typeof apple?.logoUrl).toBe('string')
		})

		it('Apple brand should have correct ID', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const brands = mockDb.getBrands()
			const apple = brands.find(b => b.slug === 'apple')

			expect(apple?.id).toBe('brand_apple')
		})
	})

	/**
	 * @REQ-SEED-002 @Brands
	 * Scenario: Samsung brand seeded (optional)
	 *   Given the seed script has run
	 *   When I query the brands table
	 *   Then I should find Samsung brand
	 */
	describe('Samsung brand seeded (REQ-SEED-002 - optional)', () => {
		it('should seed Samsung brand', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const brands = mockDb.getBrands()
			const samsung = brands.find(b => b.slug === 'samsung')

			expect(samsung).toBeDefined()
			expect(samsung?.name).toBe('Samsung')
			expect(samsung?.slug).toBe('samsung')
		})

		it('Samsung brand should be active', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const brands = mockDb.getBrands()
			const samsung = brands.find(b => b.slug === 'samsung')

			expect(samsung?.isActive).toBe(true)
		})
	})

	/**
	 * @REQ-SEED-003 @Products
	 * Scenario: Common Apple products seeded
	 *   Given the seed script has run
	 *   When I query products for brand "Apple"
	 *   Then I should find at least 10 common Apple products
	 *   Including current generation MacBooks, iPads, iPhones
	 */
	describe('Common Apple products seeded (REQ-SEED-003)', () => {
		it('should seed at least 10 Apple products', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()

			expect(products.length).toBeGreaterThanOrEqual(10)
		})

		it('should find MacBook Pro 14" M3 Pro', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const product = products.find(p => p.name === 'MacBook Pro 14" M3 Pro')

			expect(product).toBeDefined()
			expect(product?.productType).toBe('laptop')
			expect(product?.brandId).toBe('brand_apple')
		})

		it('should find MacBook Pro 16" M3 Max', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const product = products.find(p => p.name === 'MacBook Pro 16" M3 Max')

			expect(product).toBeDefined()
			expect(product?.productType).toBe('laptop')
		})

		it('should find MacBook Air 13" M2', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const product = products.find(p => p.name === 'MacBook Air 13" M2')

			expect(product).toBeDefined()
			expect(product?.productType).toBe('laptop')
		})

		it('should find MacBook Air 15" M2', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const product = products.find(p => p.name === 'MacBook Air 15" M2')

			expect(product).toBeDefined()
			expect(product?.productType).toBe('laptop')
		})

		it('should find iPad Pro 12.9"', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const product = products.find(p => p.name === 'iPad Pro 12.9"')

			expect(product).toBeDefined()
			expect(product?.productType).toBe('tablet')
		})

		it('should find iPad Air 10.9"', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const product = products.find(p => p.name === 'iPad Air 10.9"')

			expect(product).toBeDefined()
			expect(product?.productType).toBe('tablet')
		})

		it('should find iPad 10.9"', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const product = products.find(p => p.name === 'iPad 10.9"')

			expect(product).toBeDefined()
			expect(product?.productType).toBe('tablet')
		})

		it('should find iPhone 15 Pro Max', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const product = products.find(p => p.name === 'iPhone 15 Pro Max')

			expect(product).toBeDefined()
			expect(product?.productType).toBe('phone')
		})

		it('should find iPhone 15 Pro', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const product = products.find(p => p.name === 'iPhone 15 Pro')

			expect(product).toBeDefined()
			expect(product?.productType).toBe('phone')
		})

		it('should find iPhone 15', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const product = products.find(p => p.name === 'iPhone 15')

			expect(product).toBeDefined()
			expect(product?.productType).toBe('phone')
		})

		it('should have accessories like Magic Keyboard', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const accessory = products.find(p => p.productType === 'accessory')

			expect(accessory).toBeDefined()
		})
	})

	/**
	 * @REQ-SEED-004 @ProductFields
	 * Scenario: Each product should have all required fields
	 *   Given the seed script has run
	 *   When I query products
	 *   Then each product should have:
	 *      | Field      | Populated |
	 *      | name       | Yes       |
	 *      | sku        | Yes       |
	 *      | msrp       | Yes       |
	 *      | specs      | Yes (JSON)|
	 *      | is_active  | Yes       |
	 */
	describe('Product fields populated (REQ-SEED-004)', () => {
		it('all products should have name field', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()

			for (const product of products) {
				expect(product.name).toBeTruthy()
				expect(typeof product.name).toBe('string')
			}
		})

		it('all products should have unique SKU', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const skus = products.map(p => p.sku).filter(Boolean)
			const uniqueSkus = new Set(skus)

			expect(skus.length).toBeGreaterThan(0)
			expect(uniqueSkus.size).toBe(skus.length)
		})

		it('all products should have MSRP', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()

			for (const product of products) {
				expect(product.msrp).toBeTruthy()
				expect(typeof product.msrp).toBe('number')
				expect(product.msrp).toBeGreaterThan(0)
			}
		})

		it('all products should have is_active set to true', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()

			for (const product of products) {
				expect(product.isActive).toBe(true)
			}
		})

		it('all products should have description', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()

			for (const product of products) {
				expect(product.description).toBeTruthy()
				expect(typeof product.description).toBe('string')
			}
		})

		it('all products should have productType', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const types = new Set(products.map(p => p.productType))

			expect(types.has('laptop')).toBe(true)
			expect(types.has('tablet')).toBe(true)
			expect(types.has('phone')).toBe(true)
			expect(types.has('accessory')).toBe(true)
		})
	})

	/**
	 * @REQ-SEED-005 @Specs
	 * Scenario: Product specs are detailed
	 *   Given the seed script has run
	 *   When I query product specs
	 *   Then specs JSON should include processor, memory, storage, screen, color
	 */
	describe('Product specs are detailed (REQ-SEED-005)', () => {
		it('MacBook Pro 14" M3 Pro should have detailed specs', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const product = products.find(p => p.name === 'MacBook Pro 14" M3 Pro')

			expect(product?.specs).toBeTruthy()

			const specs = JSON.parse(product?.specs || '{}')

			expect(specs.processor).toBe('M3 Pro')
			expect(specs.memory).toBe('18GB')
			expect(specs.storage).toBe('512GB')
			expect(specs.screen).toContain('14.2"')
			expect(specs.color).toBe('Space Gray')
		})

		it('iPad Pro 12.9" should have detailed specs', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const product = products.find(p => p.name === 'iPad Pro 12.9"')

			expect(product?.specs).toBeTruthy()

			const specs = JSON.parse(product?.specs || '{}')

			expect(specs.processor).toBe('M2')
			expect(specs.memory).toBeTruthy()
			expect(specs.storage).toBe('128GB')
			expect(specs.screen).toContain('12.9"')
		})

		it('iPhone 15 Pro should have detailed specs', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const product = products.find(p => p.name === 'iPhone 15 Pro')

			expect(product?.specs).toBeTruthy()

			const specs = JSON.parse(product?.specs || '{}')

			expect(specs.processor).toBe('A17 Pro')
			expect(specs.memory).toBeTruthy()
			expect(specs.storage).toBeTruthy()
			expect(specs.screen).toContain('6.1"')
			expect(specs.camera).toBeTruthy()
			expect(specs.color).toBeTruthy()
		})

		it('Magic Keyboard accessory should have detailed specs', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const product = products.find(p => p.name === 'Magic Keyboard')

			expect(product?.specs).toBeTruthy()

			const specs = JSON.parse(product?.specs || '{}')

			expect(specs.connectivity).toBe('Wireless')
			expect(specs.battery).toBeTruthy()
			expect(specs.charging).toBe('USB-C')
			expect(specs.color).toBeTruthy()
		})

		it('all product specs should be valid JSON', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()

			for (const product of products) {
				if (product.specs) {
					expect(() => JSON.parse(product.specs)).not.toThrow()
				}
			}
		})
	})

	/**
	 * @REQ-SEED-006 @Idempotent
	 * Scenario: Seed script is idempotent
	 *   Given the seed script has run once
	 *   When I run the seed script again
	 *   Then no duplicate brands should be created
	 *   And no duplicate products should be created
	 *   And existing records should be updated if changed
	 */
	describe('Seed script is idempotent (REQ-SEED-006)', () => {
		it('should not create duplicate brands when run twice', async () => {
			mockDb = new MockDatabase()

			// First run
			await seedCatalog(mockDb as any)
			const countAfterFirst = mockDb.getBrandCount()

			expect(countAfterFirst).toBe(2)

			// Second run - should use onConflictDoUpdate to update, not duplicate
			await seedCatalog(mockDb as any)
			const countAfterSecond = mockDb.getBrandCount()

			expect(countAfterSecond).toBe(2)
		})

		it('should not create duplicate products when run twice', async () => {
			mockDb = new MockDatabase()

			// First run
			await seedCatalog(mockDb as any)
			const countAfterFirst = mockDb.getProductCount()

			expect(countAfterFirst).toBeGreaterThanOrEqual(10)

			// Second run
			await seedCatalog(mockDb as any)
			const countAfterSecond = mockDb.getProductCount()

			expect(countAfterSecond).toBe(countAfterFirst)
		})

		it('should call insert operations for each product on every run', async () => {
			mockDb = new MockDatabase()

			await seedCatalog(mockDb as any)

			const insertCountFirst = mockDb.getInsertCount()
			// Total expected inserts = Brands + Products
			// Should be greater than 15 (2 brands + at least 13-14 products)
			expect(insertCountFirst).toBeGreaterThanOrEqual(15)
		})

		it('should handle multiple consecutive runs without error', async () => {
			mockDb = new MockDatabase()

			// Run three times
			for (let i = 0; i < 3; i++) {
				await seedCatalog(mockDb as any)
			}

			const brandCount = mockDb.getBrandCount()
			const productCount = mockDb.getProductCount()

			expect(brandCount).toBe(2)
			expect(productCount).toBeGreaterThanOrEqual(10)
		})
	})

	/**
	 * @REQ-SEED-007 @Images
	 * Scenario: Products have image URLs
	 */
	describe('Product images populated (REQ-SEED-007)', () => {
		it('all products should have image URLs', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()

			for (const product of products) {
				expect(product.imageUrl).toBeTruthy()
				expect(typeof product.imageUrl).toBe('string')
				expect(product.imageUrl.startsWith('http')).toBe(true)
			}
		})
	})

	/**
	 * @REQ-SEED-008 @BrandRelations
	 * Scenario: Products are linked to correct brands
	 */
	describe('Product-Brand relationships (REQ-SEED-008)', () => {
		it('all Apple products should reference brand_apple', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()

			for (const product of products) {
				expect(product.brandId).toBe('brand_apple')
			}
		})

		it('should have products of all expected types', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()
			const types = new Set(products.map(p => p.productType))

			expect(types.has('laptop')).toBe(true)
			expect(types.has('tablet')).toBe(true)
			expect(types.has('phone')).toBe(true)
			expect(types.has('accessory')).toBe(true)
		})
	})

	/**
	 * Integration test: Verify complete seed data structure
	 */
	describe('Complete catalog structure', () => {
		it('should seed both brands and all products in single call', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const brands = mockDb.getBrands()
			const products = mockDb.getProducts()

			expect(brands).toHaveLength(2)
			expect(products.length).toBeGreaterThanOrEqual(10)
		})

		it('should have realistic MSRP values for products', async () => {
			mockDb = new MockDatabase()
			await seedCatalog(mockDb as any)

			const products = mockDb.getProducts()

			// Check that products have varying prices
			const prices = products.map(p => p.msrp)
			const minPrice = Math.min(...prices)
			const maxPrice = Math.max(...prices)

			expect(minPrice).toBeGreaterThan(0)
			expect(maxPrice).toBeGreaterThan(minPrice)

			// Laptops should be more expensive than accessories
			const macbookPro = products.find(p => p.name === 'MacBook Pro 14" M3 Pro')
			const magicKeyboard = products.find(p => p.name === 'Magic Keyboard')

			expect(macbookPro?.msrp).toBeGreaterThan(magicKeyboard?.msrp || 0)
		})
	})
})
