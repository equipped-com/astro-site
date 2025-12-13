# Task: Seed Brands and Products

## Description

Create seed data script to populate the product catalog with initial brands (Apple, Samsung) and common products (MacBook Pro, iPad, iPhone models). This provides a working catalog for development and testing.

## Acceptance Criteria

- [ ] Seed script creates Apple brand
- [ ] Seed script creates Samsung brand (optional)
- [ ] Seed at least 10 common Apple products
- [ ] Include current generation MacBooks, iPads, iPhones
- [ ] Products have realistic specs (JSON), MSRP, and images
- [ ] Seed data is idempotent (can run multiple times)
- [ ] Script runs as part of database setup

## Test Criteria

```gherkin
Feature: Catalog Seed Data
  As a developer
  I want pre-populated catalog data
  So that I can test the platform without manual data entry

  @REQ-SEED-001 @Brands
  Scenario: Apple brand seeded
    Given the seed script has run
    When I query the brands table
    Then I should find:
      | name  | slug  |
      | Apple | apple |
    And the brand should be active

  @REQ-SEED-002 @Products
  Scenario: Common Apple products seeded
    Given the seed script has run
    When I query products for brand "Apple"
    Then I should find at least these products:
      | Name                    | Type   |
      | MacBook Pro 14" M3 Pro  | laptop |
      | MacBook Pro 16" M3 Max  | laptop |
      | MacBook Air 13" M2      | laptop |
      | iPad Pro 12.9"          | tablet |
      | iPad Air                | tablet |
      | iPhone 15 Pro           | phone  |
      | iPhone 15               | phone  |
    And each product should have:
      | Field      | Populated |
      | name       | Yes       |
      | sku        | Yes       |
      | msrp       | Yes       |
      | specs      | Yes (JSON)|
      | is_active  | Yes       |

  @REQ-SEED-003 @Specs
  Scenario: Product specs are detailed
    Given the seed script has run
    When I query product "MacBook Pro 14\" M3 Pro"
    Then the specs JSON should include:
      | Field       | Example Value |
      | processor   | M3 Pro        |
      | memory      | 18GB          |
      | storage     | 512GB         |
      | screen      | 14.2"         |
      | color       | Space Gray    |

  @REQ-SEED-004 @Idempotent
  Scenario: Seed script is idempotent
    Given the seed script has run once
    When I run the seed script again
    Then no duplicate brands should be created
    And no duplicate products should be created
    And existing records should be updated if changed
```

## Dependencies

- catalog/catalog-schema (tables must exist)

## Seed Data Script

```typescript
// src/db/seed/catalog.ts
import { db } from '../db';
import { brands, products } from '../schema';

export async function seedCatalog() {
  // Upsert Apple brand
  await db.insert(brands)
    .values({
      id: 'brand_apple',
      name: 'Apple',
      slug: 'apple',
      logo_url: 'https://...',
      is_active: true
    })
    .onConflictDoUpdate({
      target: brands.slug,
      set: { updated_at: new Date() }
    });

  // Upsert products
  const appleProducts = [
    {
      id: 'prod_mbp14_m3pro',
      brand_id: 'brand_apple',
      name: 'MacBook Pro 14" M3 Pro',
      model_identifier: 'MacBookPro18,3',
      model_number: 'MKGR3LL/A',
      sku: 'MBP14-M3PRO-18GB-512GB',
      product_type: 'laptop',
      description: '14-inch MacBook Pro with M3 Pro chip',
      specs: JSON.stringify({
        processor: 'M3 Pro',
        memory: '18GB',
        storage: '512GB',
        screen: '14.2" Liquid Retina XDR',
        ports: '3x Thunderbolt 4, HDMI, SD card',
        color: 'Space Gray'
      }),
      msrp: 1999.00,
      image_url: 'https://...',
      is_active: true
    },
    {
      id: 'prod_mbp16_m3max',
      brand_id: 'brand_apple',
      name: 'MacBook Pro 16" M3 Max',
      model_identifier: 'MacBookPro18,4',
      model_number: 'MK1E3LL/A',
      sku: 'MBP16-M3MAX-36GB-1TB',
      product_type: 'laptop',
      description: '16-inch MacBook Pro with M3 Max chip',
      specs: JSON.stringify({
        processor: 'M3 Max',
        memory: '36GB',
        storage: '1TB',
        screen: '16.2" Liquid Retina XDR',
        ports: '3x Thunderbolt 4, HDMI, SD card',
        color: 'Space Black'
      }),
      msrp: 3499.00,
      image_url: 'https://...',
      is_active: true
    },
    // Add more products...
  ];

  for (const product of appleProducts) {
    await db.insert(products)
      .values(product)
      .onConflictDoUpdate({
        target: products.sku,
        set: { updated_at: new Date() }
      });
  }

  console.log('✅ Catalog seeded');
}
```

## Product List to Seed

**MacBooks:**
- MacBook Pro 14" M3 Pro (18GB, 512GB)
- MacBook Pro 16" M3 Max (36GB, 1TB)
- MacBook Air 13" M2 (8GB, 256GB)
- MacBook Air 15" M2 (8GB, 256GB)

**iPads:**
- iPad Pro 12.9" (M2, 128GB)
- iPad Air 10.9" (M1, 64GB)
- iPad 10.9" (64GB)

**iPhones:**
- iPhone 15 Pro Max (256GB)
- iPhone 15 Pro (128GB)
- iPhone 15 (128GB)

**Accessories:**
- Magic Keyboard
- Magic Mouse
- Apple Pencil (2nd generation)
- USB-C to MagSafe 3 Cable

## Files to Create

- `src/db/seed/catalog.ts` - Seed script

## Files to Modify

- `src/db/seed/index.ts` - Import and run catalog seed

## References

- PRD.md Database Schema section
- Apple website for current product specs and pricing
