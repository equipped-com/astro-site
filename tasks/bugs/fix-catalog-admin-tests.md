# Fix Catalog Admin UI Tests

## Description

Fix failing tests for catalog/catalog-admin-ui. Admin catalog management component tests are failing across brand, product, and inventory table components.

## Original Task

- **Task ID:** catalog/catalog-admin-ui
- **Commit:** 654d3be
- **Status:** Marked incomplete due to test failures

## Failing Tests

- src/components/admin/catalog/BrandTable.test.tsx - multiple test failures
- src/components/admin/catalog/InventoryTable.test.tsx - multiple test failures
- src/components/admin/catalog/ProductTable.test.tsx - multiple test failures

## Root Cause

Catalog admin UI tests are failing, likely due to:
1. Catalog data not properly mocked
2. Table components not rendering expected elements
3. CRUD operations not properly tested
4. Admin permissions not properly mocked
5. Data grid/table library mocks incomplete

## Dependencies

- catalog/catalog-admin-ui - Original implementation (incomplete)
- catalog/catalog-api - Catalog API must be working
- sysadmin/admin-dashboard - Admin dashboard context required
- testing/fix-component-tests - General component test infrastructure

## Acceptance Criteria

- [ ] All tests in BrandTable.test.tsx pass
- [ ] All tests in InventoryTable.test.tsx pass
- [ ] All tests in ProductTable.test.tsx pass
- [ ] Catalog tables render with data
- [ ] CRUD operations work in tests
- [ ] Admin permissions properly enforced
- [ ] No regression in other admin tests
- [ ] Original task catalog/catalog-admin-ui can be marked done: true

## Test Criteria

```gherkin
Feature: Catalog Admin UI
	As a developer
	I want all catalog admin tests to pass
	So that catalog management interface is verified

	@REQ-CATALOG-ADMIN-001
	Scenario: Display brand list
		Given catalog brands exist
		When rendering BrandTable
		Then all brands should be displayed
		And each brand should show name and products
		And edit/delete buttons should be visible

	@REQ-CATALOG-ADMIN-002
	Scenario: Edit product details
		Given a product in ProductTable
		When clicking edit button
		Then edit form should open
		And saving changes should update product
		And table should reflect changes

	@REQ-CATALOG-ADMIN-003
	Scenario: Update inventory quantity
		Given inventory items in InventoryTable
		When updating quantity
		Then inventory should be updated
		And new quantity should be displayed
```

## Implementation

1. Review catalog admin test files and component files
2. Fix catalog data mocks (brands, products, inventory)
3. Fix table rendering and CRUD operation tests
4. Fix admin permission mocks
5. Verify table library (e.g., TanStack Table) properly mocked
6. Run tests:
   ```bash
   bun run test src/components/admin/catalog/BrandTable.test.tsx
   bun run test src/components/admin/catalog/ProductTable.test.tsx
   bun run test src/components/admin/catalog/InventoryTable.test.tsx
   ```

## Files to Modify

- src/components/admin/catalog/BrandTable.test.tsx
- src/components/admin/catalog/InventoryTable.test.tsx
- src/components/admin/catalog/ProductTable.test.tsx
- Potentially: component implementation files

## References

- test-failure-analysis-corrected.md (lines 38-40)
- Original task: tasks/catalog/catalog-admin-ui.md
- Original commit: 654d3be
- Related: tasks/catalog/catalog-api.md (commit: 2beacaf)
