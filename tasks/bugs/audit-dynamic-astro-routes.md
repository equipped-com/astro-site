# Bug: Audit All Dynamic Astro Routes

## Priority: HIGH

## Prerequisites

**READ FIRST:** `documentation/dynamic-routing-decision.md`

This task depends on:
1. `bugs/dynamic-routing-poc` - Establishes the correct pattern
2. `bugs/order-details-static-routes` - First implementation of the pattern

Use the orders fix as the reference implementation for all other routes.

## Problem

Multiple pages in the dashboard may be using Astro's static `[param].astro` routes for dynamic, runtime data. This is architecturally incorrect.

### The Rule

**Astro routes are for STATIC content only:**
- Landing pages
- Blog posts (if pre-rendered)
- Documentation
- Legal pages (privacy, terms)

**React components are for DYNAMIC content:**
- Orders (created at runtime)
- People/employees (added dynamically)
- Devices (assigned/unassigned)
- Proposals (generated per customer)
- Any data that changes after build

## Audit Required

Check these directories for `[param].astro` files that should be React-based:

```
src/pages/dashboard/orders/[id].astro      # KNOWN BAD - orders are dynamic
src/pages/dashboard/people/[id].astro      # CHECK - people are dynamic
src/pages/dashboard/devices/[id].astro     # CHECK - devices are dynamic
src/pages/dashboard/proposals/[id].astro   # CHECK - proposals are dynamic
src/pages/admin/**/*.astro                 # CHECK - admin views
```

## Solution Pattern

For each dynamic route found:

1. **Delete** the `[id].astro` file
2. **Modify** the parent `index.astro` to host a React app
3. **Use query params or React state** for detail views: `/dashboard/orders?id=xxx`
4. **Fetch from API** at runtime, not build time

### Example Conversion

**Before (Wrong):**
```
src/pages/dashboard/orders/
  index.astro       # List page
  [id].astro        # Detail page (STATIC - BAD)
```

**After (Correct):**
```
src/pages/dashboard/orders/
  index.astro       # Hosts <OrdersApp client:only="react" />
                    # React app handles list AND detail views internally
```

## Acceptance Criteria

```gherkin
Feature: Dynamic Dashboard Routes

  Scenario: No static routes for dynamic data
    Given I search for [param].astro files in src/pages/dashboard/
    Then none of them should use getStaticPaths with mock data
    And all dynamic data should be fetched from APIs at runtime

  Scenario: All detail views work for new records
    Given I create a new order/person/device/proposal
    When I navigate to view its details
    Then the page should load correctly
    And I should see the data from the API
```

## Files to Audit

Run this command to find potential issues:
```bash
find src/pages/dashboard -name "\\[*\\].astro" -exec grep -l "getStaticPaths" {} \\;
```

## Dependencies

- `bugs/order-details-static-routes` (fix this first as the pattern)

## Notes

This is a follow-up audit task after fixing the orders route. The fix for orders establishes the correct pattern that should be applied to all other dynamic routes.
