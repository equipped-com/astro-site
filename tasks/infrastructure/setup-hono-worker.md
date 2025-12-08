# Task: Setup Hono Worker

## Description

Create `src/worker.ts` with Hono framework to handle API routes. This enables the `/api/*` endpoints needed for authentication, device management, and all backend operations. The worker runs on CloudFlare Workers and serves as the API layer.

## Acceptance Criteria

- [ ] Hono installed as dependency
- [ ] `src/worker.ts` created with Hono app
- [ ] Health check endpoint at `/api/health`
- [ ] Fallback to ASSETS binding for non-API routes
- [ ] TypeScript types defined for Env bindings
- [ ] CORS configured for development
- [ ] Error handling middleware

## Test Criteria

```gherkin
Feature: Hono Worker Setup
  As the platform
  I want a Hono worker handling API routes
  So that I can serve backend functionality

  @REQ-WORKER-001
  Scenario: Health check endpoint
    When I GET "/api/health"
    Then response status should be 200
    And response body should contain:
      | Field | Value |
      | status | ok |
    And response Content-Type should be "application/json"

  @REQ-WORKER-002
  Scenario: Static assets served
    When I GET "/"
    Then response status should be 200
    And response Content-Type should contain "text/html"
    And the landing page should render

  @REQ-WORKER-003
  Scenario: Asset files served with cache headers
    When I GET "/lib/some-file.js"
    Then response status should be 200
    And Cache-Control header should contain "immutable"

  @REQ-WORKER-004
  Scenario: Unknown API route returns 404
    When I GET "/api/nonexistent"
    Then response status should be 404
    And response body should contain "Not found"

  @REQ-WORKER-005
  Scenario: CORS headers in development
    Given environment is "development"
    When I OPTIONS "/api/health"
    Then response should include CORS headers
    And Access-Control-Allow-Origin should be "*"

  @REQ-WORKER-006
  Scenario: Error handling
    Given an API route throws an error
    When I call that route
    Then response status should be 500
    And response should be JSON with error message
    And stack trace should NOT be exposed in production
```

## Dependencies

None (foundation task)

## Files to Create/Modify

- `src/worker.ts` (create)
- `src/types/env.d.ts` (create)
- `package.json` (modify - add hono dependency)

## Implementation

```typescript
// src/worker.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors({
  origin: '*', // Configure for production
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Error handling
app.onError((err, c) => {
  console.error('Error:', err)
  const isDev = c.env.ENVIRONMENT === 'development'
  return c.json({
    error: err.message,
    ...(isDev && { stack: err.stack }),
  }, 500)
})

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: c.env.VERSION || 'unknown',
  })
})

// 404 handler for API routes
app.all('/api/*', (c) => {
  return c.json({ error: 'Not found' }, 404)
})

// Export for Cloudflare Workers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url)

    // Handle API routes with Hono
    if (url.pathname.startsWith('/api/')) {
      return app.fetch(request, env, ctx)
    }

    // Serve static assets for non-API routes
    return env.ASSETS.fetch(request)
  },
}
```

```typescript
// src/types/env.d.ts
interface Env {
  // CloudFlare bindings
  ASSETS: Fetcher
  DB: D1Database

  // Environment variables
  ENVIRONMENT: 'development' | 'staging' | 'production'
  VERSION?: string

  // Clerk
  CLERK_SECRET_KEY: string
  CLERK_PUBLISHABLE_KEY: string
  CLERK_WEBHOOK_SECRET: string

  // Feature flags
  ENABLE_DEBUG?: string
}
```

## Commands

```bash
npm install hono
```

## References

- PRD.md Section 13: Technical Architecture
- [Hono on Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)
- [Hono TypeScript](https://hono.dev/docs/guides/typescript)
- [Hono Middleware](https://hono.dev/docs/guides/middleware)
