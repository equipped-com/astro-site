# Task: Catalog CRUD API Endpoints

## Description

Create API endpoints for managing the product catalog. Sys admins can CRUD brands, products, and inventory. Regular tenants have read-only access to browse products.

## Acceptance Criteria

- [ ] `GET /api/catalog/brands` - List all brands (public)
- [ ] `POST /api/catalog/brands` - Create brand (sys_admin only)
- [ ] `GET /api/catalog/products` - List products with filters (public)
- [ ] `POST /api/catalog/products` - Create product (sys_admin only)
- [ ] `GET /api/catalog/inventory` - List inventory items (sys_admin only)
- [ ] `POST /api/catalog/inventory` - Add inventory (sys_admin only)
- [ ] `PUT /api/catalog/inventory/:id` - Update inventory status (sys_admin only)
- [ ] Proper RBAC: only sys_admins can mutate catalog
- [ ] Filter products by brand, type, active status
- [ ] Search products by name or SKU

## Test Criteria

```gherkin
Feature: Catalog CRUD API Endpoints
  As a sys admin
  I want to manage the product catalog via API
  So that I can maintain accurate inventory

  @REQ-API-001 @Brands @Public
  Scenario: List all brands (public access)
    Given I am any authenticated user
    When I GET "/api/catalog/brands"
    Then the response status should be 200
    And I should see all active brands
    And each brand should include:
      | Field    | Type   |
      | id       | string |
      | name     | string |
      | slug     | string |
      | logo_url | string |

  @REQ-API-002 @Brands @SysAdmin
  Scenario: Create brand (sys_admin only)
    Given I am a sys_admin
    When I POST to "/api/catalog/brands" with:
      | name    | slug    | logo_url        |
      | Samsung | samsung | https://...     |
    Then the response status should be 201
    And a new brand should be created

  @REQ-API-003 @Brands @RBAC
  Scenario: Regular user cannot create brands
    Given I am a regular account owner (not sys_admin)
    When I POST to "/api/catalog/brands"
    Then the response status should be 403
    And the error should be "Sys admin access required"

  @REQ-API-004 @Products @List
  Scenario: List products with filters
    Given the catalog has 20 products
    When I GET "/api/catalog/products?brand=apple&type=laptop"
    Then I should see only Apple laptops
    And results should be paginated

  @REQ-API-005 @Products @Create
  Scenario: Create product (sys_admin only)
    Given I am a sys_admin
    When I POST to "/api/catalog/products" with:
      | name              | brand_id    | sku            | msrp   |
      | MacBook Pro 14"   | brand_apple | MBP14-M3-512   | 1999   |
    Then the response status should be 201
    And the product should be created with specs

  @REQ-API-006 @Products @Search
  Scenario: Search products by name or SKU
    Given products exist with names "MacBook Pro", "MacBook Air"
    When I GET "/api/catalog/products?search=MacBook"
    Then I should see both products
    When I GET "/api/catalog/products?search=MBP14"
    Then I should see only "MacBook Pro 14""

  @REQ-API-007 @Inventory @List
  Scenario: List inventory items (sys_admin only)
    Given I am a sys_admin
    When I GET "/api/catalog/inventory?status=available"
    Then I should see all available inventory items
    And each should include serial_number, condition, location

  @REQ-API-008 @Inventory @Create
  Scenario: Add inventory item
    Given I am a sys_admin
    And product "MacBook Pro 14"" exists
    When I POST to "/api/catalog/inventory" with:
      | product_id | serial_number | condition | status    |
      | prod_123   | C02XYZ123ABC  | new       | available |
    Then the response status should be 201
    And the inventory item should be created

  @REQ-API-009 @Inventory @Update
  Scenario: Update inventory status
    Given an inventory item with status "available"
    When I PUT "/api/catalog/inventory/:id" with status "sold"
    Then the status should update to "sold"
    And updated_at should be refreshed
```

## Dependencies

- catalog/catalog-schema (tables must exist)
- api/auth-middleware (for RBAC checks)

## API Endpoints

### GET /api/catalog/brands
```typescript
// Public - list all active brands
Response: Array<{ id, name, slug, logo_url }>
```

### POST /api/catalog/brands
```typescript
// Sys admin only - create brand
Request: { name: string, slug: string, logo_url?: string }
Response: { id, name, slug, logo_url }
```

### GET /api/catalog/products
```typescript
// Public - list products with filters
Query: { brand?, type?, search?, active?, page?, limit? }
Response: {
  products: Array<Product>,
  pagination: { page, limit, total }
}
```

### POST /api/catalog/products
```typescript
// Sys admin only - create product
Request: {
  brand_id: string,
  name: string,
  sku: string,
  product_type: string,
  specs: object,
  msrp: number,
  image_url?: string
}
Response: Product
```

### GET /api/catalog/inventory
```typescript
// Sys admin only - list inventory
Query: { product_id?, status?, condition? }
Response: Array<InventoryItem>
```

### POST /api/catalog/inventory
```typescript
// Sys admin only - add inventory
Request: {
  product_id: string,
  serial_number?: string,
  condition: string,
  status: string,
  purchase_cost?: number,
  sale_price?: number
}
Response: InventoryItem
```

### PUT /api/catalog/inventory/:id
```typescript
// Sys admin only - update inventory
Request: { status?, condition?, notes?, warehouse_location? }
Response: InventoryItem
```

## RBAC Logic

```typescript
function isSysAdmin(user: User): boolean {
  const sysAdminDomains = [
    'tryequipped.com',
    'getupgraded.com',
    'cogzero.com'
  ];
  const domain = user.email.split('@')[1];
  return sysAdminDomains.includes(domain);
}
```

## Files to Create

- `src/api/catalog/brands.ts` - Brand endpoints
- `src/api/catalog/products.ts` - Product endpoints
- `src/api/catalog/inventory.ts` - Inventory endpoints

## References

- PRD.md Database Schema section
- PRD.md Section 10: Sys Admin Dashboard
- PRD.md Section 16: Multi-Tenancy (REQ-MT-003)
