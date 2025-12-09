# POC: Dynamic Routing Strategy for Astro + CloudFlare Workers

## Priority: HIGH (Blocker for other bug fixes)

## Problem Statement

We need to establish the correct pattern for handling dynamic data (orders, people, devices, proposals) in an Astro static site deployed to CloudFlare Workers.

### Current Situation
- Astro is configured for `output: 'static'` - pages are pre-built at build time
- Dynamic routes like `[id].astro` use `getStaticPaths()` which requires knowing all IDs at build time
- This doesn't work for runtime data (orders created after deployment)

### Questions to Answer

1. **Should we switch to SSR?**
   - Astro supports `output: 'server'` or `output: 'hybrid'`
   - CloudFlare Workers adapter exists: `@astrojs/cloudflare`
   - Trade-off: More complexity, but true dynamic routes

2. **Or keep static + client-side routing?**
   - Keep `output: 'static'`
   - Use React Router or query params for dynamic views
   - All data fetched client-side from API
   - Trade-off: Simpler deployment, but no SEO for dynamic pages (acceptable for dashboard)

3. **How do we handle direct links?**
   - User bookmarks `/dashboard/orders/ord_abc123`
   - User shares link to a specific order
   - Options:
     a. Query params: `/dashboard/orders?id=ord_abc123`
     b. Hash routing: `/dashboard/orders#ord_abc123`
     c. SSR catch-all route
     d. CloudFlare Worker redirect rule

4. **What about the existing Hono API worker?**
   - We have `src/worker.ts` with Hono routes
   - How does this interact with Astro SSR if we go that route?
   - Can we keep API and pages separate?

## POC Requirements

### Option A: Static + Client-Side Routing

Test this approach:
1. Single Astro page: `src/pages/dashboard/orders.astro`
2. React app with internal routing: `<OrdersApp client:only="react" />`
3. Use URL search params: `/dashboard/orders?view=detail&id=xxx`
4. CloudFlare Worker rule to handle `/dashboard/orders/*` -> `/dashboard/orders`

**Deliverables:**
- Working prototype with order list + detail views
- Direct link support (copy URL, paste, works)
- Document the pattern for other routes

### Option B: Hybrid SSR

Test this approach:
1. Configure Astro for `output: 'hybrid'`
2. Mark dynamic pages with `export const prerender = false`
3. Use `@astrojs/cloudflare` adapter
4. Test deployment to CloudFlare Workers

**Deliverables:**
- Working prototype with true `/dashboard/orders/[id]` routes
- Verify API worker still works alongside
- Document deployment requirements

## Acceptance Criteria

```gherkin
Feature: Dynamic Route POC

  Scenario: Establish routing pattern
    Given we need to support dynamic dashboard routes
    When we complete the POC
    Then we have a documented, tested pattern
    And we know which approach (static+client vs SSR) to use
    And we have a working prototype to reference

  Scenario: Direct links work
    Given a user has a direct link to /dashboard/orders/{id}
    When they paste the URL in a new browser tab
    Then they should see the order details (not 404)
    And no special browser extensions or setup required

  Scenario: New records are immediately accessible
    Given I create a new order via the API
    When I navigate to view that order
    Then I should see the order details
    And I should NOT need to redeploy the site

  Scenario: Pattern is documented
    Given we complete the POC
    Then there is a clear document explaining:
      - Which approach we chose and why
      - How to implement new dynamic routes
      - How to handle direct links
      - Any CloudFlare Worker configuration needed
```

## Output

This POC must produce:

1. **Decision Document** (`documentation/dynamic-routing-decision.md`)
   - Chosen approach with rationale
   - Trade-offs considered
   - Implementation guide for future routes

2. **Working Prototype**
   - At least one dynamic route working end-to-end
   - Can be orders, or a simpler test case

3. **CloudFlare Configuration** (if needed)
   - Worker routes or redirects
   - wrangler.toml updates

## Dependencies

None - this is a blocker for other tasks.

## Blocked By This Task

- `bugs/order-details-static-routes`
- `bugs/audit-dynamic-astro-routes`

## Research Resources

- [Astro SSR Guide](https://docs.astro.build/en/guides/server-side-rendering/)
- [Astro CloudFlare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Astro Hybrid Rendering](https://docs.astro.build/en/guides/server-side-rendering/#hybrid-rendering)
- [CloudFlare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)

## Notes

This is exploratory work. The goal is to make an informed decision, not to implement everything. Keep the POC minimal but functional.

Once complete, update the dependent task files (`order-details-static-routes.md`, `audit-dynamic-astro-routes.md`) to reference the decision document and follow the established pattern.
