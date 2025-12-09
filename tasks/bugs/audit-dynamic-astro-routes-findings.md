# Audit Findings: Dynamic Astro Routes

## Audit Date
2025-12-09

## Audit Scope
Complete codebase audit for `[param].astro` files using `getStaticPaths` with dynamic/mock data.

## Commands Executed

```bash
# Find all dynamic route files
find src/pages/dashboard -name "\\[*\\].astro"
# Result: No files found

find src/pages -name "\\[*\\].astro"
# Result: No files found

# Find all files using getStaticPaths
find src/pages -name "*.astro" -exec grep -l "getStaticPaths" {} \;
# Result: Only src/pages/dashboard/orders/index.astro (false positive - in comment only)
```

## Findings Summary

**GOOD NEWS:** No dynamic routes need fixing!

### Routes Checked

| Route Pattern | Status | Notes |
|--------------|--------|-------|
| `/dashboard/orders/[id]` | ✅ FIXED | Already uses OrdersApp with client-side routing |
| `/dashboard/people/[id]` | ✅ N/A | No dynamic route exists - PeopleDirectory is list-only |
| `/dashboard/devices/[id]` | ✅ N/A | No dynamic route exists - DeviceInventory is list-only |
| `/dashboard/proposals/[id]` | ✅ N/A | Uses `/proposal?token=xxx` pattern (correct) |
| `/admin/**` | ✅ CLEAN | No dynamic routes found |

### Correct Implementations

1. **Orders** (`/dashboard/orders/index.astro`)
   - ✅ Single static page hosts `OrdersApp` React component
   - ✅ Client-side routing via URL search params (`?id=xxx`)
   - ✅ Follows `documentation/dynamic-routing-decision.md` pattern
   - ✅ No `getStaticPaths` usage

2. **Proposals** (`/pages/proposal.astro`)
   - ✅ Uses `/proposal?token=xxx` for public links
   - ✅ No dynamic Astro routes
   - ✅ Correct static + client-side pattern

3. **People** (`/dashboard/people.astro`)
   - ✅ Static page with `PeopleDirectory` component
   - ✅ List-only view (no detail pages yet)
   - ✅ No dynamic routes needed currently

4. **Devices** (`/dashboard/devices.astro`)
   - ✅ Static page with `DeviceInventory` component
   - ✅ List-only view (no detail pages yet)
   - ✅ No dynamic routes needed currently

## Conclusion

**No additional fix tasks needed.**

All existing routes either:
1. Already use the correct static + client-side routing pattern
2. Are list-only views without detail pages
3. Use URL search params correctly for dynamic content

The `bugs/order-details-static-routes` fix successfully converted the last problematic dynamic route. No other routes exhibit the anti-pattern described in `documentation/dynamic-routing-decision.md`.

## Recommendations

For future development:

1. **People Detail Pages**: If/when adding person detail views, use the OrdersApp pattern:
   - `/dashboard/people?id=xxx`
   - Client-side routing in `PeopleDirectory` component

2. **Device Detail Pages**: If/when adding device detail views, use the same pattern:
   - `/dashboard/devices?id=xxx`
   - Client-side routing in `DeviceInventory` component

3. **Vigilance**: When adding new dynamic content routes, always use:
   - Static `.astro` page at `/dashboard/{resource}/index.astro`
   - React component with URL search param routing
   - **NEVER** use `[id].astro` with `getStaticPaths` for runtime data

## Related Documents

- `documentation/dynamic-routing-decision.md` - Authoritative routing pattern
- `bugs/order-details-static-routes.md` - Reference implementation
- `bugs/dynamic-routing-poc.md` - Original POC and decision rationale
