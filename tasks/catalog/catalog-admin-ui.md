# Task: Catalog Admin UI (Sys Admin Only)

## Description

Create admin UI pages at `admin.tryequipped.com` for sys admins to manage the global product catalog. Includes brand management, product CRUD, and inventory tracking.

## Acceptance Criteria

- [ ] `/admin/catalog/brands` - Brand list and creation
- [ ] `/admin/catalog/products` - Product list with search/filter
- [ ] `/admin/catalog/products/new` - Create product form
- [ ] `/admin/catalog/products/:id/edit` - Edit product
- [ ] `/admin/catalog/inventory` - Inventory list and management
- [ ] Only accessible to sys_admins (@tryequipped.com, @getupgraded.com, @cogzero.com)
- [ ] Data tables with sorting, filtering, pagination
- [ ] Inline editing for quick updates
- [ ] Bulk upload capability (CSV import)

## Test Criteria

```gherkin
Feature: Catalog Admin UI
  As a sys admin
  I want a UI to manage the product catalog
  So that I can maintain accurate inventory without SQL

  @REQ-UI-001 @Access
  Scenario: Only sys admins can access
    Given I am logged in as a regular user (not sys_admin)
    When I navigate to "/admin/catalog/brands"
    Then I should see 403 Forbidden
    Given I am logged in as sys_admin (@tryequipped.com)
    When I navigate to "/admin/catalog/brands"
    Then I should see the brands management page

  @REQ-UI-002 @Brands
  Scenario: Manage brands
    Given I am on the brands management page
    When I view the page
    Then I should see all brands in a table
    And I should see "Add Brand" button
    When I click "Add Brand"
    Then I should see a form with fields:
      | Field    | Type   | Required |
      | Name     | Input  | Yes      |
      | Slug     | Input  | Yes      |
      | Logo URL | Input  | No       |
    When I submit the form
    Then the brand should be created
    And I should see it in the brands list

  @REQ-UI-003 @Products
  Scenario: Browse products
    Given I am on the products page
    Then I should see all products in a data table
    And I should be able to:
      | Action         | Available |
      | Sort columns   | Yes       |
      | Filter by brand| Yes       |
      | Filter by type | Yes       |
      | Search by name | Yes       |
      | Paginate       | Yes       |

  @REQ-UI-004 @Products @Create
  Scenario: Create new product
    Given I am on the products page
    When I click "Add Product"
    Then I should see the create product form
    And the form should have fields:
      | Field             | Type        | Required |
      | Brand             | Dropdown    | Yes      |
      | Name              | Input       | Yes      |
      | Model Identifier  | Input       | No       |
      | SKU               | Input       | Yes      |
      | Product Type      | Dropdown    | Yes      |
      | Description       | Textarea    | No       |
      | MSRP              | Number      | Yes      |
      | Image URL         | Input       | No       |
      | Specs (JSON)      | Code Editor | No       |
    When I fill all required fields
    And I click "Create Product"
    Then the product should be created
    And I should be redirected to the products list

  @REQ-UI-005 @Products @Edit
  Scenario: Edit existing product
    Given a product exists with SKU "MBP14-M3-512"
    When I click "Edit" next to the product
    Then I should see the edit form pre-populated
    When I change the MSRP to 2099
    And I click "Save Changes"
    Then the product should be updated
    And I should see success notification

  @REQ-UI-006 @Inventory
  Scenario: Manage inventory
    Given I am on the inventory page
    Then I should see all inventory items
    And each item should show:
      | Field          | Visible |
      | Product name   | Yes     |
      | Serial number  | Yes     |
      | Condition      | Yes     |
      | Status         | Yes     |
      | Location       | Yes     |
      | Actions        | Yes     |

  @REQ-UI-007 @Inventory @QuickEdit
  Scenario: Quick edit inventory status
    Given an inventory item with status "available"
    When I click the status dropdown
    And I select "sold"
    Then the status should update immediately
    And I should see success notification

  @REQ-UI-008 @Bulk
  Scenario: Bulk import products
    Given I am on the products page
    When I click "Import CSV"
    And I upload a CSV file with product data
    Then the system should validate the CSV
    And show a preview of products to import
    When I confirm the import
    Then all valid products should be created
    And I should see summary of import results
```

## Dependencies

- catalog/catalog-api (API endpoints must exist)
- sysadmin/admin-dashboard (admin subdomain must be configured)

## Pages to Create

### /admin/catalog/brands
```tsx
// Brand management page
- Table with all brands
- Add brand button → dialog
- Edit/delete actions per row
```

### /admin/catalog/products
```tsx
// Product list with filters
- Data table (TanStack Table)
- Filters: brand, type, active status
- Search by name or SKU
- Sort by any column
- "Add Product" button
```

### /admin/catalog/products/new
```tsx
// Create product form
- Brand selector
- Product details
- Specs JSON editor (Monaco or CodeMirror)
- Image upload/URL
- Submit → creates product
```

### /admin/catalog/products/:id/edit
```tsx
// Edit product form
- Same as create but pre-populated
- Delete product button
- Archive/deactivate option
```

### /admin/catalog/inventory
```tsx
// Inventory management
- Data table with all inventory items
- Filter by product, status, condition
- Inline status editing
- "Add Inventory" button
```

## Components to Create

- `BrandTable.tsx` - Brand list table
- `ProductTable.tsx` - Product list with filters
- `ProductForm.tsx` - Create/edit product
- `InventoryTable.tsx` - Inventory list
- `BulkImportDialog.tsx` - CSV import modal

## Files to Create

- `src/pages/admin/catalog/brands.astro`
- `src/pages/admin/catalog/products/index.astro`
- `src/pages/admin/catalog/products/new.astro`
- `src/pages/admin/catalog/products/[id]/edit.astro`
- `src/pages/admin/catalog/inventory.astro`
- `src/components/admin/catalog/*.tsx` - UI components

## References

- PRD.md Section 10: Sys Admin Dashboard
- PRD.md Database Schema section
- TanStack Table documentation
