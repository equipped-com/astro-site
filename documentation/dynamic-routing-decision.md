# Dynamic Routing Decision: Static + Client-Side Routing

## Decision

**Chosen approach:** Static site generation + client-side routing via URL search params

**Alternative considered:** Hybrid SSR with Astro CloudFlare adapter (rejected)

## Rationale

### Why NOT Hybrid SSR

1. **Complexity** - SSR adds deployment complexity, cold start latency, and requires the CloudFlare adapter
2. **Overkill** - Dashboard pages don't need SEO, so server-side rendering provides no benefit
3. **Architecture disruption** - Would require rethinking how the Hono API worker interacts with page routes
4. **Debugging difficulty** - SSR errors are harder to debug than client-side errors

### Why Static + Client-Side Routing

1. **Simplicity** - Single static HTML page per route, all dynamics handled in React
2. **Performance** - No cold starts, instant page loads from CDN cache
3. **Direct link support** - URL search params work naturally with static pages
4. **Browser history integration** - `pushState`/`replaceState` enable back/forward navigation
5. **Minimal changes** - Keeps existing architecture intact

## Implementation Pattern

### URL Structure

```
/dashboard/orders          - List view
/dashboard/orders?id=xxx   - Detail view for order xxx
```

### Component Architecture

```
orders/index.astro          - Single static Astro page
    |
    +-- OrdersApp.tsx       - Client-side routed React component
            |
            +-- OrderListView    - List view (no id param)
            +-- OrderDetails     - Detail view (with id param)
```

### Key Features

1. **Initial URL Reading** - Component reads `?id=xxx` on mount to determine initial view
2. **History API Integration** - Uses `pushState` for navigation, `popstate` for back/forward
3. **URL Sync** - Updates URL when view changes without page reload
4. **Graceful Fallback** - Shows "Not Found" state if order ID doesn't exist

### Code Pattern

```tsx
// Read URL on mount
const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    return params.get('id')
})

// Navigate to detail view
function navigateToOrder(orderId: string) {
    const url = new URL(window.location.href)
    url.searchParams.set('id', orderId)
    window.history.pushState({}, '', url.toString())
    setSelectedId(orderId)
}

// Handle browser back/forward
useEffect(() => {
    function handlePopState() {
        const params = new URLSearchParams(window.location.search)
        setSelectedId(params.get('id'))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
}, [])
```

## Implementation Guide for New Routes

### Step 1: Create Single Astro Page

Create `src/pages/dashboard/{resource}/index.astro`:

```astro
---
import { ResourceApp } from '@/components/{resource}/ResourceApp'
import DashboardLayout from '@/layouts/DashboardLayout.astro'
---

<DashboardLayout title="Resources">
    <ResourceApp client:only="react" />
</DashboardLayout>
```

### Step 2: Create Client-Side Routed Component

Create `src/components/{resource}/ResourceApp.tsx`:

```tsx
export function ResourceApp() {
    // Read URL param on mount
    const [selectedId, setSelectedId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null
        return new URLSearchParams(window.location.search).get('id')
    })

    // ... navigation functions using pushState ...

    // Render based on URL param
    if (selectedId) {
        return <ResourceDetail id={selectedId} onBack={navigateToList} />
    }
    return <ResourceList onSelect={navigateToDetail} />
}
```

### Step 3: Delete Any [id].astro Files

Remove any `[id].astro` dynamic route files - they won't work for runtime data anyway.

## CloudFlare Configuration

**No special CloudFlare configuration is needed.**

The existing CloudFlare Workers setup with `run_worker_first = true` handles:
- API routes via the Hono worker (`/api/*`)
- Static asset serving via `env.ASSETS.fetch()`

Since `/dashboard/orders` is a real static page, direct links to `/dashboard/orders?id=xxx` work automatically - the static page loads, React mounts, reads the URL param, and renders the detail view.

## Testing Direct Links

To verify the pattern works:

1. Navigate to `/dashboard/orders`
2. Click an order to open detail view
3. Copy the URL (e.g., `/dashboard/orders?id=ord_123`)
4. Open in new tab/incognito window
5. Should show order detail, not 404

## Trade-offs

### Pros

- No build-time data dependency (orders created after deploy work immediately)
- Simple deployment (static assets + API worker)
- Fast page loads (CDN cached HTML)
- Browser history works naturally

### Cons

- Slightly longer time-to-content for detail views (page loads, then fetches data)
- URL less "pretty" than `/orders/123` (but `/orders?id=123` is perfectly valid)
- SEO not optimal (acceptable for dashboard, unacceptable for public pages)

## When to Use SSR Instead

Consider Hybrid SSR if you need:
- SEO-critical dynamic pages (public product pages, blog posts)
- Server-side authentication checks before page render
- Heavy server-side data processing before render

For the Equipped dashboard, none of these apply - client-side routing is the right choice.

## Files Changed in POC

- `src/pages/dashboard/orders/index.astro` - Updated to use OrdersApp
- `src/components/orders/OrdersApp.tsx` - New client-side routed component
- `src/pages/dashboard/orders/[id].astro` - **Deleted** (was broken anyway)

## References

- [Astro Static Output Mode](https://docs.astro.build/en/basics/rendering-modes/#on-demand-rendered)
- [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
- [React client:only directive](https://docs.astro.build/en/reference/directives-reference/#clientonly)
