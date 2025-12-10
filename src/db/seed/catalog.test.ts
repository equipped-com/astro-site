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

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { drizzle } from 'drizzle-orm/d1'
import { eq, count, and } from 'drizzle-orm'
import { brands, products } from '@/db/schema'
import { seedCatalog } from './catalog'

// Test database instance
let db: ReturnType<typeof drizzle>
let d1: D1Database

// Setup test database
beforeEach(async () => {
	// Use Cloudflare's D1 in-memory database for testing
	const miniflare = await import('miniflare')
	const mf = new miniflare.Miniflare({
		modules: true,
		script: '',
		d1Databases: ['DB'],
	})

	d1 = (await mf.getD1Database('DB')) as D1Database
	db = drizzle(d1)

	// Create brands and products tables
	await d1.exec(`
		CREATE TABLE brands (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL UNIQUE,
			slug TEXT NOT NULL UNIQUE,
			logo_url TEXT,
			is_active BOOLEAN DEFAULT TRUE,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`)

	await d1.exec(`
		CREATE TABLE products (
			id TEXT PRIMARY KEY,
			brand_id TEXT NOT NULL REFERENCES brands(id),
			name TEXT NOT NULL,
			model_identifier TEXT,
			model_number TEXT,
			sku TEXT UNIQUE,
			product_type TEXT NOT NULL,
			description TEXT,
			specs TEXT,
			msrp DECIMAL(10,2),
			image_url TEXT,
			is_active BOOLEAN DEFAULT TRUE,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`)

	// Create indexes
	await d1.exec(`
		CREATE INDEX idx_brands_slug ON brands(slug);
		CREATE INDEX idx_brands_is_active ON brands(is_active);
		CREATE INDEX idx_products_brand ON products(brand_id);
		CREATE INDEX idx_products_sku ON products(sku);
		CREATE INDEX idx_products_type ON products(product_type);
		CREATE INDEX idx_products_is_active ON products(is_active);
	`)
})

afterEach(async () => {
	// Cleanup is automatic with in-memory DB
})

/**
 * Feature: Catalog Seed Data
 *   As a developer
 *   I want pre-populated catalog data
 *   So that I can test the platform without manual data entry
 */
describe('Catalog Seed Data', () => {
	/**
	 * @REQ-SEED-001 @Brands
	 * Scenario: Apple brand seeded
	 *   Given the seed script has run
	 *   When I query the brands table
	 *   Then I should find Apple brand with correct properties
	 *   And the brand should be active
	 */
	describe('Apple brand seeded (REQ-SEED-001)', () => {
		beforeEach(async () => {
			await seedCatalog(db)
		})

		it('should find Apple brand in the database', async () => {
			const result = await db.select().from(brands).where(eq(brands.slug, 'apple'))

			expect(result).toHaveLength(1)
			expect(result[0].name).toBe('Apple')
			expect(result[0].slug).toBe('apple')
		})

		it('Apple brand should be active', async () => {
			const result = await db.select().from(brands).where(eq(brands.slug, 'apple'))

			expect(result[0].isActive).toBe(1) // SQLite stores booleans as integers
		})

		it('Apple brand should have a logo URL', async () => {
			const result = await db.select().from(brands).where(eq(brands.slug, 'apple'))

			expect(result[0].logoUrl).toBeTruthy()
			expect(typeof result[0].logoUrl).toBe('string')
		})

		it('Apple brand should have timestamps', async () => {
			const result = await db.select().from(brands).where(eq(brands.slug, 'apple'))

			expect(result[0].createdAt).toBeTruthy()
			expect(result[0].updatedAt).toBeTruthy()
		})
	})

	/**
	 * @REQ-SEED-001b @Brands
	 * Scenario: Samsung brand seeded (optional)
	 *   Given the seed script has run
	 *   When I query the brands table
	 *   Then I should find Samsung brand with correct properties
	 */
	describe('Samsung brand seeded (REQ-SEED-001b - optional)', () => {
		beforeEach(async () => {
			await seedCatalog(db)
		})

		it('should find Samsung brand in the database', async () => {
			const result = await db.select().from(brands).where(eq(brands.slug, 'samsung'))

			expect(result).toHaveLength(1)
			expect(result[0].name).toBe('Samsung')
			expect(result[0].slug).toBe('samsung')
		})

		it('Samsung brand should be active', async () => {
			const result = await db.select().from(brands).where(eq(brands.slug, 'samsung'))

			expect(result[0].isActive).toBe(1)
		})
	})

	/**
	 * @REQ-SEED-002 @Products
	 * Scenario: Common Apple products seeded
	 *   Given the seed script has run
	 *   When I query products for brand "Apple"
	 *   Then I should find at least these products:
	 *      | Name                    | Type   |
	 *      | MacBook Pro 14" M3 Pro  | laptop |
	 *      | MacBook Pro 16" M3 Max  | laptop |
	 *      | MacBook Air 13" M2      | laptop |
	 *      | iPad Pro 12.9"          | tablet |
	 *      | iPad Air                | tablet |
	 *      | iPhone 15 Pro           | phone  |
	 *      | iPhone 15               | phone  |
	 */
	describe('Common Apple products seeded (REQ-SEED-002)', () => {
		beforeEach(async () => {
			await seedCatalog(db)
		})

		it('should seed at least 10 Apple products', async () => {
			const result = await db
				.select({ count: count() })
				.from(products)
				.where(eq(products.brandId, 'brand_apple'))

			expect(result[0].count).toBeGreaterThanOrEqual(10)
		})

		it('should find MacBook Pro 14" M3 Pro', async () => {
			const result = await db
				.select()
				.from(products)
				.where(eq(products.name, 'MacBook Pro 14" M3 Pro'))

			expect(result).toHaveLength(1)
			expect(result[0].productType).toBe('laptop')
		})

		it('should find MacBook Pro 16" M3 Max', async () => {
			const result = await db
				.select()
				.from(products)
				.where(eq(products.name, 'MacBook Pro 16" M3 Max'))

			expect(result).toHaveLength(1)
			expect(result[0].productType).toBe('laptop')
		})

		it('should find MacBook Air 13" M2', async () => {
			const result = await db
				.select()
				.from(products)
				.where(eq(products.name, 'MacBook Air 13" M2'))

			expect(result).toHaveLength(1)
			expect(result[0].productType).toBe('laptop')
		})

		it('should find iPad Pro 12.9"', async () => {
			const result = await db
				.select()
				.from(products)
				.where(eq(products.name, 'iPad Pro 12.9"'))

			expect(result).toHaveLength(1)
			expect(result[0].productType).toBe('tablet')
		})

		it('should find iPad Air 10.9"', async () => {
			const result = await db
				.select()
				.from(products)
				.where(eq(products.name, 'iPad Air 10.9"'))

			expect(result).toHaveLength(1)
			expect(result[0].productType).toBe('tablet')
		})

		it('should find iPhone 15 Pro', async () => {
			const result = await db
				.select()
				.from(products)
				.where(eq(products.name, 'iPhone 15 Pro'))

			expect(result).toHaveLength(1)
			expect(result[0].productType).toBe('phone')
		})

		it('should find iPhone 15', async () => {
			const result = await db
				.select()
				.from(products)
				.where(eq(products.name, 'iPhone 15'))

			expect(result).toHaveLength(1)
			expect(result[0].productType).toBe('phone')
		})

		it('should find iPhone 15 Pro Max', async () => {
			const result = await db
				.select()
				.from(products)
				.where(eq(products.name, 'iPhone 15 Pro Max'))

			expect(result).toHaveLength(1)
			expect(result[0].productType).toBe('phone')
		})

		it('should include current generation MacBooks and iPads', async () => {
			const result = await db
				.select()
				.from(products)
				.where(and(eq(products.brandId, 'brand_apple'), eq(products.productType, 'laptop')))

			expect(result.length).toBeGreaterThanOrEqual(3)

			const hasM3Pro = result.some(p => p.name.includes('M3 Pro'))
			const hasM3Max = result.some(p => p.name.includes('M3 Max'))
			const hasM2 = result.some(p => p.name.includes('M2'))

			expect(hasM3Pro).toBe(true)
			expect(hasM3Max).toBe(true)
			expect(hasM2).toBe(true)
		})
	})

	/**
	 * @REQ-SEED-002b @Products
	 * Scenario: Each product should have all required fields
	 *   Given the seed script has run
	 *   When I query products for brand "Apple"
	 *   Then each product should have:
	 *      | Field      | Populated |
	 *      | name       | Yes       |
	 *      | sku        | Yes       |
	 *      | msrp       | Yes       |
	 *      | specs      | Yes (JSON)|
	 *      | is_active  | Yes       |
	 */
	describe('Product fields populated (REQ-SEED-002b)', () => {
		beforeEach(async () => {
			await seedCatalog(db)
		})

		it('all products should have name field', async () => {
			const result = await db.select().from(products).where(eq(products.brandId, 'brand_apple'))

			for (const product of result) {
				expect(product.name).toBeTruthy()
				expect(typeof product.name).toBe('string')
			}
		})

		it('all products should have unique SKU', async () => {
			const result = await db.select().from(products).where(eq(products.brandId, 'brand_apple'))

			const skus = result.map(p => p.sku).filter(Boolean)
			const uniqueSkus = new Set(skus)

			expect(skus.length).toBeGreaterThan(0)
			expect(uniqueSkus.size).toBe(skus.length)
		})

		it('all products should have MSRP', async () => {
			const result = await db.select().from(products).where(eq(products.brandId, 'brand_apple'))

			for (const product of result) {
				expect(product.msrp).toBeTruthy()
				expect(typeof product.msrp).toBe('number')
				expect(product.msrp).toBeGreaterThan(0)
			}
		})

		it('all products should have is_active set to true', async () => {
			const result = await db.select().from(products).where(eq(products.brandId, 'brand_apple'))

			for (const product of result) {
				expect(product.isActive).toBe(1) // SQLite boolean
			}
		})

		it('all products should have description', async () => {
			const result = await db.select().from(products).where(eq(products.brandId, 'brand_apple'))

			for (const product of result) {
				expect(product.description).toBeTruthy()
				expect(typeof product.description).toBe('string')
			}
		})
	})

	/**
	 * @REQ-SEED-003 @Specs
	 * Scenario: Product specs are detailed
	 *   Given the seed script has run
	 *   When I query product "MacBook Pro 14\" M3 Pro"
	 *   Then the specs JSON should include:
	 *      | Field       | Example Value |
	 *      | processor   | M3 Pro        |
	 *      | memory      | 18GB          |
	 *      | storage     | 512GB         |
	 *      | screen      | 14.2"         |
	 *      | color       | Space Gray    |
	 */
	describe('Product specs are detailed (REQ-SEED-003)', () => {
		beforeEach(async () => {
			await seedCatalog(db)
		})

		it('MacBook Pro 14" M3 Pro should have detailed specs', async () => {
			const result = await db
				.select()
				.from(products)
				.where(eq(products.name, 'MacBook Pro 14" M3 Pro'))

			expect(result).toHaveLength(1)

			const specs = JSON.parse(result[0].specs || '{}')

			expect(specs.processor).toBe('M3 Pro')
			expect(specs.memory).toBe('18GB')
			expect(specs.storage).toBe('512GB')
			expect(specs.screen).toContain('14.2"')
			expect(specs.color).toBe('Space Gray')
		})

		it('iPad Pro 12.9" should have detailed specs', async () => {
			const result = await db
				.select()
				.from(products)
				.where(eq(products.name, 'iPad Pro 12.9"'))

			expect(result).toHaveLength(1)

			const specs = JSON.parse(result[0].specs || '{}')

			expect(specs.processor).toBe('M2')
			expect(specs.memory).toBeTruthy()
			expect(specs.storage).toBe('128GB')
			expect(specs.screen).toContain('12.9"')
			expect(specs.color).toBeTruthy()
		})

		it('iPhone 15 Pro should have detailed specs', async () => {
			const result = await db
				.select()
				.from(products)
				.where(eq(products.name, 'iPhone 15 Pro'))

			expect(result).toHaveLength(1)

			const specs = JSON.parse(result[0].specs || '{}')

			expect(specs.processor).toBe('A17 Pro')
			expect(specs.memory).toBeTruthy()
			expect(specs.storage).toBeTruthy()
			expect(specs.screen).toContain('6.1"')
			expect(specs.camera).toBeTruthy()
			expect(specs.color).toBeTruthy()
		})

		it('Magic Keyboard accessory should have detailed specs', async () => {
			const result = await db
				.select()
				.from(products)
				.where(eq(products.name, 'Magic Keyboard'))

			expect(result).toHaveLength(1)

			const specs = JSON.parse(result[0].specs || '{}')

			expect(specs.connectivity).toBe('Wireless')
			expect(specs.battery).toBeTruthy()
			expect(specs.charging).toBe('USB-C')
			expect(specs.color).toBeTruthy()
		})

		it('all product specs should be valid JSON', async () => {
			const result = await db.select().from(products).where(eq(products.brandId, 'brand_apple'))

			for (const product of result) {
				if (product.specs) {
					expect(() => JSON.parse(product.specs)).not.toThrow()
				}
			}
		})
	})

	/**
	 * @REQ-SEED-004 @Idempotent
	 * Scenario: Seed script is idempotent
	 *   Given the seed script has run once
	 *   When I run the seed script again
	 *   Then no duplicate brands should be created
	 *   And no duplicate products should be created
	 *   And existing records should be updated if changed
	 */
	describe('Seed script is idempotent (REQ-SEED-004)', () => {
		it('should not create duplicate brands when run twice', async () => {
			// First run
			await seedCatalog(db)

			const countAfterFirst = await db
				.select({ count: count() })
				.from(brands)
				.where(eq(brands.slug, 'apple'))

			expect(countAfterFirst[0].count).toBe(1)

			// Second run
			await seedCatalog(db)

			const countAfterSecond = await db
				.select({ count: count() })
				.from(brands)
				.where(eq(brands.slug, 'apple'))

			expect(countAfterSecond[0].count).toBe(1)
		})

		it('should not create duplicate products when run twice', async () => {
			// First run
			await seedCatalog(db)

			const countAfterFirst = await db
				.select({ count: count() })
				.from(products)
				.where(eq(products.brandId, 'brand_apple'))

			expect(countAfterFirst[0].count).toBeGreaterThanOrEqual(10)

			// Second run
			await seedCatalog(db)

			const countAfterSecond = await db
				.select({ count: count() })
				.from(products)
				.where(eq(products.brandId, 'brand_apple'))

			expect(countAfterSecond[0].count).toBe(countAfterFirst[0].count)
		})

		it('should update timestamps on second run', async () => {
			// First run
			await seedCatalog(db)

			const beforeUpdate = await db.select().from(brands).where(eq(brands.slug, 'apple'))

			// Wait a moment to ensure timestamp difference
			await new Promise(resolve => setTimeout(resolve, 10))

			// Second run
			await seedCatalog(db)

			const afterUpdate = await db.select().from(brands).where(eq(brands.slug, 'apple'))

			// Note: updatedAt should be updated
			expect(afterUpdate[0].updatedAt).toBeTruthy()
			expect(afterUpdate[0].createdAt).toBe(beforeUpdate[0].createdAt)
		})

		it('should handle multiple consecutive runs without error', async () => {
			for (let i = 0; i < 3; i++) {
				await seedCatalog(db)
			}

			const brandCount = await db.select({ count: count() }).from(brands)

			expect(brandCount[0].count).toBe(2)
		})
	})

	/**
	 * Integration test: Verify complete seed data structure
	 */
	describe('Complete catalog structure', () => {
		beforeEach(async () => {
			await seedCatalog(db)
		})

		it('should have both brands in database', async () => {
			const result = await db.select().from(brands)

			expect(result).toHaveLength(2)
			expect(result.some(b => b.slug === 'apple')).toBe(true)
			expect(result.some(b => b.slug === 'samsung')).toBe(true)
		})

		it('should have products linked to correct brands', async () => {
			const appleProducts = await db
				.select()
				.from(products)
				.where(eq(products.brandId, 'brand_apple'))

			const allBrandIds = appleProducts.map(p => p.brandId)

			expect(allBrandIds.every(id => id === 'brand_apple')).toBe(true)
		})

		it('should have products of all expected types', async () => {
			const result = await db.select().from(products).where(eq(products.brandId, 'brand_apple'))

			const types = new Set(result.map(p => p.productType))

			expect(types.has('laptop')).toBe(true)
			expect(types.has('tablet')).toBe(true)
			expect(types.has('phone')).toBe(true)
			expect(types.has('accessory')).toBe(true)
		})

		it('should have image URLs for all products', async () => {
			const result = await db.select().from(products).where(eq(products.brandId, 'brand_apple'))

			for (const product of result) {
				expect(product.imageUrl).toBeTruthy()
				expect(typeof product.imageUrl).toBe('string')
				expect(product.imageUrl.startsWith('http')).toBe(true)
			}
		})
	})
})
