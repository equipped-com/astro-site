/**
 * Catalog Seed Script
 *
 * Populates the product catalog with initial brands (Apple, Samsung) and common products.
 * Script is idempotent - can be run multiple times safely using upsert operations.
 *
 * Usage: Run as part of database setup
 * Features:
 *   - Creates Apple and Samsung brands
 *   - Seeds 10+ common Apple products with realistic specs, MSRP, and pricing
 *   - Includes current generation MacBooks, iPads, iPhones, and accessories
 *   - Uses upsert to avoid duplicate conflicts (REQ-SEED-004)
 *   - All specs stored as JSON for rich product data (REQ-SEED-003)
 */

import type { Database } from '@/db'
import { brands, products } from '@/db/schema'

/**
 * Seed catalog with brands and products
 *
 * @param db - Drizzle database instance
 * @throws Error if database operations fail
 */
export async function seedCatalog(db: Database): Promise<void> {
	const now = new Date().toISOString()

	// Upsert Apple brand (REQ-SEED-001)
	const appleInsert = db
		.insert(brands)
		.values({
			id: 'brand_apple',
			name: 'Apple',
			slug: 'apple',
			logoUrl: 'https://www.apple.com/ac/structured-data/images/open_graph_logo.194e8786.png',
			isActive: true,
		})
		.onConflictDoUpdate({
			target: brands.slug,
			set: { updatedAt: now },
		})

	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	await appleInsert

	// Upsert Samsung brand (REQ-SEED-002 - optional)
	const samsungInsert = db
		.insert(brands)
		.values({
			id: 'brand_samsung',
			name: 'Samsung',
			slug: 'samsung',
			logoUrl: 'https://www.samsung.com/etc.clientlibs/samsung/clientlibs/consumer/global/clientlib-common/resources/images/logo.svg',
			isActive: true,
		})
		.onConflictDoUpdate({
			target: brands.slug,
			set: { updatedAt: now },
		})

	await samsungInsert

	// Apple Products - At least 10 common products with specs, MSRP, and images (REQ-SEED-002, REQ-SEED-003)
	const appleProducts = [
		// MacBooks (Current Gen)
		{
			id: 'prod_mbp14_m3pro',
			brandId: 'brand_apple',
			name: 'MacBook Pro 14" M3 Pro',
			modelIdentifier: 'MacBookPro18,3',
			modelNumber: 'MK1F3LL/A',
			sku: 'MBP14-M3PRO-18GB-512GB',
			productType: 'laptop' as const,
			description: '14-inch MacBook Pro with M3 Pro chip, 18GB unified memory, 512GB storage',
			specs: JSON.stringify({
				processor: 'M3 Pro',
				memory: '18GB',
				storage: '512GB',
				screen: '14.2" Liquid Retina XDR',
				ports: '3x Thunderbolt 4, HDMI, SD card',
				color: 'Space Gray',
				battery: '18 hours',
				weight: '3.5 lbs',
			}),
			msrp: 1999.0,
			imageUrl: 'https://www.apple.com/macbook-pro/images/overview/hero_14__frrde0jworaa_large.jpg',
			isActive: true,
		},
		{
			id: 'prod_mbp16_m3max',
			brandId: 'brand_apple',
			name: 'MacBook Pro 16" M3 Max',
			modelIdentifier: 'MacBookPro18,4',
			modelNumber: 'MK1E3LL/A',
			sku: 'MBP16-M3MAX-36GB-1TB',
			productType: 'laptop' as const,
			description: '16-inch MacBook Pro with M3 Max chip, 36GB unified memory, 1TB storage',
			specs: JSON.stringify({
				processor: 'M3 Max',
				memory: '36GB',
				storage: '1TB',
				screen: '16.2" Liquid Retina XDR',
				ports: '3x Thunderbolt 4, HDMI, SD card',
				color: 'Space Black',
				battery: '22 hours',
				weight: '4.7 lbs',
			}),
			msrp: 3499.0,
			imageUrl: 'https://www.apple.com/macbook-pro/images/overview/hero_16__frrde0jworaa_large.jpg',
			isActive: true,
		},
		{
			id: 'prod_mba13_m2',
			brandId: 'brand_apple',
			name: 'MacBook Air 13" M2',
			modelIdentifier: 'MacBookAir13,2',
			modelNumber: 'MLY13LL/A',
			sku: 'MBA13-M2-8GB-256GB',
			productType: 'laptop' as const,
			description: '13-inch MacBook Air with M2 chip, 8GB unified memory, 256GB storage',
			specs: JSON.stringify({
				processor: 'M2',
				memory: '8GB',
				storage: '256GB',
				screen: '13.3" Liquid Retina',
				ports: '2x Thunderbolt 3',
				color: 'Midnight',
				battery: '18 hours',
				weight: '2.7 lbs',
			}),
			msrp: 1199.0,
			imageUrl: 'https://www.apple.com/macbook-air/images/overview/hero__d6fcrvnbveia_large.jpg',
			isActive: true,
		},
		{
			id: 'prod_mba15_m2',
			brandId: 'brand_apple',
			name: 'MacBook Air 15" M2',
			modelIdentifier: 'MacBookAir15,3',
			modelNumber: 'MLYD3LL/A',
			sku: 'MBA15-M2-8GB-256GB',
			productType: 'laptop' as const,
			description: '15-inch MacBook Air with M2 chip, 8GB unified memory, 256GB storage',
			specs: JSON.stringify({
				processor: 'M2',
				memory: '8GB',
				storage: '256GB',
				screen: '15.3" Liquid Retina',
				ports: '2x Thunderbolt 3',
				color: 'Starlight',
				battery: '18 hours',
				weight: '3.3 lbs',
			}),
			msrp: 1499.0,
			imageUrl: 'https://www.apple.com/macbook-air/images/overview/hero_15__d6fcrvnbveia_large.jpg',
			isActive: true,
		},

		// iPads
		{
			id: 'prod_ipad_pro_129',
			brandId: 'brand_apple',
			name: 'iPad Pro 12.9"',
			modelIdentifier: 'iPad14,10',
			modelNumber: 'MQDC3LL/A',
			sku: 'IPAD-PRO129-M2-128GB',
			productType: 'tablet' as const,
			description: '12.9-inch iPad Pro with M2 chip, 128GB storage',
			specs: JSON.stringify({
				processor: 'M2',
				memory: '8GB',
				storage: '128GB',
				screen: '12.9" Liquid Retina XDR',
				ports: 'Thunderbolt 3',
				color: 'Silver',
				battery: '10 hours',
				weight: '1.51 lbs',
			}),
			msrp: 1099.0,
			imageUrl: 'https://www.apple.com/ipad-pro/images/overview/hero__cpe4z5bvzw6e_large.jpg',
			isActive: true,
		},
		{
			id: 'prod_ipad_air',
			brandId: 'brand_apple',
			name: 'iPad Air 10.9"',
			modelIdentifier: 'iPad14,8',
			modelNumber: 'MYAN3LL/A',
			sku: 'IPAD-AIR109-M1-64GB',
			productType: 'tablet' as const,
			description: '10.9-inch iPad Air with M1 chip, 64GB storage',
			specs: JSON.stringify({
				processor: 'M1',
				memory: '8GB',
				storage: '64GB',
				screen: '10.9" Liquid Retina',
				ports: 'USB-C',
				color: 'Space Gray',
				battery: '10 hours',
				weight: '1.03 lbs',
			}),
			msrp: 599.0,
			imageUrl: 'https://www.apple.com/ipad-air/images/overview/hero__fhd28b4ksmea_large.jpg',
			isActive: true,
		},
		{
			id: 'prod_ipad_standard',
			brandId: 'brand_apple',
			name: 'iPad 10.9"',
			modelIdentifier: 'iPad12,2',
			modelNumber: 'MNEA3LL/A',
			sku: 'IPAD-STD109-A14-64GB',
			productType: 'tablet' as const,
			description: '10.9-inch iPad with A14 Bionic chip, 64GB storage',
			specs: JSON.stringify({
				processor: 'A14 Bionic',
				memory: '4GB',
				storage: '64GB',
				screen: '10.9" Liquid Retina',
				ports: 'USB-C',
				color: 'Blue',
				battery: '10 hours',
				weight: '1.08 lbs',
			}),
			msrp: 349.0,
			imageUrl: 'https://www.apple.com/ipad/images/overview/hero__fhd28b4ksmea_large.jpg',
			isActive: true,
		},

		// iPhones
		{
			id: 'prod_iphone15_pro_max',
			brandId: 'brand_apple',
			name: 'iPhone 15 Pro Max',
			modelIdentifier: 'iPhone17,1',
			modelNumber: 'A3111',
			sku: 'IPHONE15PROMAX-256GB',
			productType: 'phone' as const,
			description: 'iPhone 15 Pro Max with A17 Pro chip, 256GB storage',
			specs: JSON.stringify({
				processor: 'A17 Pro',
				memory: '8GB',
				storage: '256GB',
				screen: '6.7" Super Retina XDR',
				camera: '48MP main, 12MP ultra-wide, 12MP 5x telephoto',
				color: 'Titanium White',
				battery: '29 hours',
			}),
			msrp: 1199.0,
			imageUrl: 'https://www.apple.com/iphone-15-pro/images/overview/hero__c3z0j7vm5bci_large.jpg',
			isActive: true,
		},
		{
			id: 'prod_iphone15_pro',
			brandId: 'brand_apple',
			name: 'iPhone 15 Pro',
			modelIdentifier: 'iPhone17,2',
			modelNumber: 'A3110',
			sku: 'IPHONE15PRO-128GB',
			productType: 'phone' as const,
			description: 'iPhone 15 Pro with A17 Pro chip, 128GB storage',
			specs: JSON.stringify({
				processor: 'A17 Pro',
				memory: '8GB',
				storage: '128GB',
				screen: '6.1" Super Retina XDR',
				camera: '48MP main, 12MP ultra-wide, 12MP 3x telephoto',
				color: 'Titanium Black',
				battery: '23 hours',
			}),
			msrp: 999.0,
			imageUrl: 'https://www.apple.com/iphone-15-pro/images/overview/hero__c3z0j7vm5bci_large.jpg',
			isActive: true,
		},
		{
			id: 'prod_iphone15',
			brandId: 'brand_apple',
			name: 'iPhone 15',
			modelIdentifier: 'iPhone16,1',
			modelNumber: 'A3094',
			sku: 'IPHONE15-128GB',
			productType: 'phone' as const,
			description: 'iPhone 15 with A16 Bionic chip, 128GB storage',
			specs: JSON.stringify({
				processor: 'A16 Bionic',
				memory: '6GB',
				storage: '128GB',
				screen: '6.1" Liquid Retina',
				camera: '48MP main, 12MP ultra-wide',
				color: 'Black',
				battery: '20 hours',
			}),
			msrp: 799.0,
			imageUrl: 'https://www.apple.com/iphone-15/images/overview/hero__dhbhccj27dci_large.jpg',
			isActive: true,
		},

		// Accessories
		{
			id: 'prod_magic_keyboard',
			brandId: 'brand_apple',
			name: 'Magic Keyboard',
			modelIdentifier: 'A2449',
			modelNumber: 'MLA22LL/A',
			sku: 'MAGIC-KEYBOARD',
			productType: 'accessory' as const,
			description: 'Wireless keyboard with rechargeable battery',
			specs: JSON.stringify({
				connectivity: 'Wireless',
				battery: '1 month',
				charging: 'USB-C',
				compatibility: 'Mac, iPad, iPhone',
				color: 'Silver',
			}),
			msrp: 299.0,
			imageUrl: 'https://www.apple.com/magickeyboard/images/hero__b6bgpq8o8eq2_large.jpg',
			isActive: true,
		},
		{
			id: 'prod_magic_mouse',
			brandId: 'brand_apple',
			name: 'Magic Mouse',
			modelIdentifier: 'A2449',
			modelNumber: 'MULA2LL/A',
			sku: 'MAGIC-MOUSE-3',
			productType: 'accessory' as const,
			description: 'Multi-touch wireless mouse with rechargeable battery',
			specs: JSON.stringify({
				connectivity: 'Wireless',
				battery: '1 month',
				charging: 'USB-C',
				compatibility: 'Mac',
				color: 'Silver',
			}),
			msrp: 79.0,
			imageUrl: 'https://www.apple.com/magicmouse/images/hero__7pxz8o0z3wui_large.jpg',
			isActive: true,
		},
		{
			id: 'prod_apple_pencil_2',
			brandId: 'brand_apple',
			name: 'Apple Pencil (2nd generation)',
			modelIdentifier: 'A1603',
			modelNumber: 'MU8F2LL/A',
			sku: 'APPLE-PENCIL-2ND',
			productType: 'accessory' as const,
			description: 'Precision input device for iPad Pro and iPad Air',
			specs: JSON.stringify({
				connectivity: 'Bluetooth',
				battery: '12 hours usage',
				charging: 'Magnetic attachment to iPad',
				compatibility: 'iPad Pro, iPad Air',
				pressure: '4096 pressure levels',
			}),
			msrp: 119.0,
			imageUrl: 'https://www.apple.com/applepencil/images/hero__y68tyr68mz6e_large.jpg',
			isActive: true,
		},
		{
			id: 'prod_usb_c_magsafe',
			brandId: 'brand_apple',
			name: 'USB-C to MagSafe 3 Cable',
			modelIdentifier: 'A3269',
			modelNumber: 'MQKJ3AM/A',
			sku: 'USBC-MAGSAFE3',
			productType: 'accessory' as const,
			description: '2m USB-C to MagSafe 3 charging cable for MacBook Pro',
			specs: JSON.stringify({
				length: '2 meters',
				connector: 'USB-C to MagSafe 3',
				compatibility: 'MacBook Pro 14" and 16"',
				charging: 'Fast charging support',
				color: 'Black',
			}),
			msrp: 39.0,
			imageUrl: 'https://www.apple.com/shop/accessories/all/cables/images/hero__z6t2ytkj17m2_large.jpg',
			isActive: true,
		},
	]

	// Upsert all Apple products
	for (const product of appleProducts) {
		const productInsert = db
			.insert(products)
			.values(product)
			.onConflictDoUpdate({
				target: products.sku,
				set: { updatedAt: now },
			})
		await productInsert
	}

	console.log('✅ Catalog seeded successfully')
	console.log(`   - Brands: Apple, Samsung`)
	console.log(`   - Products: ${appleProducts.length} Apple products (4 MacBooks, 3 iPads, 3 iPhones, 5 Accessories)`)
}
