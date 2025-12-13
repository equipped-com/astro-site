# Task: Product Catalog Schema Migration

## Description

Create the global product catalog schema with `brands`, `products`, and `inventory_items` tables. These are global (not tenant-scoped) and managed exclusively by sys_admins.

## Acceptance Criteria

- [ ] `brands` table created (id, name, slug, logo_url, is_active)
- [ ] `products` table created with full specifications
- [ ] `inventory_items` table created for stocked units
- [ ] Foreign key relationships established
- [ ] Indexes on frequently queried columns
- [ ] Unique constraints on SKU and serial numbers
- [ ] Migration follows Drizzle ORM conventions

## Test Criteria

```gherkin
Feature: Product Catalog Schema
  As a database administrator
  I want a global product catalog
  So that we can manage inventory across all tenants

  @REQ-SCHEMA-001 @Brands
  Scenario: Brands table structure
    Given the migrations have been run
    When I query the brands table
    Then it should have columns:
      | Column     | Type    | Constraints        |
      | id         | TEXT    | PRIMARY KEY        |
      | name       | TEXT    | NOT NULL, UNIQUE   |
      | slug       | TEXT    | NOT NULL, UNIQUE   |
      | logo_url   | TEXT    | NULL               |
      | is_active  | BOOLEAN | DEFAULT TRUE       |
      | created_at | DATETIME| DEFAULT CURRENT    |
      | updated_at | DATETIME| DEFAULT CURRENT    |

  @REQ-SCHEMA-002 @Products
  Scenario: Products table structure
    Given the migrations have been run
    When I query the products table
    Then it should have columns:
      | Column            | Type     | Constraints      |
      | id                | TEXT     | PRIMARY KEY      |
      | brand_id          | TEXT     | NOT NULL, FK     |
      | name              | TEXT     | NOT NULL         |
      | model_identifier  | TEXT     | NULL             |
      | model_number      | TEXT     | NULL             |
      | sku               | TEXT     | UNIQUE           |
      | product_type      | TEXT     | NOT NULL         |
      | description       | TEXT     | NULL             |
      | specs             | TEXT     | NULL (JSON)      |
      | msrp              | DECIMAL  | NULL             |
      | image_url         | TEXT     | NULL             |
      | is_active         | BOOLEAN  | DEFAULT TRUE     |
      | created_at        | DATETIME | DEFAULT CURRENT  |
      | updated_at        | DATETIME | DEFAULT CURRENT  |

  @REQ-SCHEMA-003 @Inventory
  Scenario: Inventory items table structure
    Given the migrations have been run
    When I query the inventory_items table
    Then it should have columns:
      | Column            | Type     | Constraints           |
      | id                | TEXT     | PRIMARY KEY           |
      | product_id        | TEXT     | NOT NULL, FK          |
      | serial_number     | TEXT     | UNIQUE, NULL          |
      | condition         | TEXT     | NOT NULL, DEFAULT new |
      | status            | TEXT     | NOT NULL, DEFAULT available |
      | purchase_cost     | DECIMAL  | NULL                  |
      | sale_price        | DECIMAL  | NULL                  |
      | notes             | TEXT     | NULL                  |
      | warehouse_location| TEXT     | NULL                  |
      | created_at        | DATETIME | DEFAULT CURRENT       |
      | updated_at        | DATETIME | DEFAULT CURRENT       |

  @REQ-SCHEMA-004 @ForeignKeys
  Scenario: Foreign key relationships
    When I try to insert product with invalid brand_id
    Then the insert should fail with foreign key error
    When I try to insert inventory_item with invalid product_id
    Then the insert should fail with foreign key error

  @REQ-SCHEMA-005 @Indexes
  Scenario: Performance indexes exist
    Then the following indexes should exist:
      | Table            | Column       |
      | products         | brand_id     |
      | inventory_items  | product_id   |
      | inventory_items  | status       |
```

## Dependencies

- database/initial-schema (database must exist)

## Schema Definition

```sql
-- Brands table (global)
CREATE TABLE brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products table (global)
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

-- Inventory items table (global)
CREATE TABLE inventory_items (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id),
    serial_number TEXT UNIQUE,
    condition TEXT NOT NULL DEFAULT 'new',
    status TEXT NOT NULL DEFAULT 'available',
    purchase_cost DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    notes TEXT,
    warehouse_location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_inventory_product ON inventory_items(product_id);
CREATE INDEX idx_inventory_status ON inventory_items(status);
```

## Enums/Types

**product_type:**
- laptop
- desktop
- tablet
- phone
- accessory
- display

**condition:**
- new
- like_new
- good
- fair
- refurbished

**status:**
- available
- reserved
- sold
- allocated

## Files to Create

- `src/db/migrations/XXXX_create_product_catalog.sql`

## References

- PRD.md Database Schema section
- PRD.md Section 16: Multi-Tenancy Architecture (REQ-MT-003)
