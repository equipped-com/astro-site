# Task: Configure Wrangler for API

## Description

Update `wrangler.toml` to enable the Hono worker for API routes while preserving static asset serving. Configure D1 database binding, environment variables, and route patterns for the multi-tenant architecture.

## Acceptance Criteria

- [ ] `main = "src/worker.ts"` added to wrangler.toml
- [ ] `compatibility_flags = ["nodejs_compat"]` added
- [ ] D1 database binding configured
- [ ] `run_worker_first = ["/api/*"]` for selective worker invocation
- [ ] Environment variables documented
- [ ] Custom domains configured
- [ ] `public/_headers` applies to static assets

## Test Criteria

```gherkin
Feature: Wrangler Configuration
  As the platform
  I want wrangler properly configured
  So that API routes and static assets work correctly

  @REQ-WRANGLER-001
  Scenario: API routes handled by worker
    When I GET "/api/health"
    Then the request should be handled by Hono worker
    And response should be JSON

  @REQ-WRANGLER-002
  Scenario: Static assets served directly
    When I GET "/"
    Then the request should serve static HTML
    And Cache-Control header should be set
    And security headers should be present

  @REQ-WRANGLER-003
  Scenario: Asset caching headers
    When I GET "/lib/client.js"
    Then Cache-Control should contain "immutable"
    And Cache-Control should contain "max-age=31536000"

  @REQ-WRANGLER-004
  Scenario: D1 database accessible
    Given worker is running
    When worker accesses c.env.DB
    Then D1 database should be available
    And queries should execute successfully

  @REQ-WRANGLER-005
  Scenario: Deploy succeeds
    When I run "wrangler deploy"
    Then deployment should succeed
    And worker should be accessible at custom domain

  @REQ-WRANGLER-006
  Scenario: Local development works
    When I run "wrangler dev"
    Then local server should start
    And both API and static routes should work
```

## Dependencies

- infrastructure/setup-hono-worker

## Files to Modify

- `wrangler.toml`
- `public/_headers`

## Implementation

```toml
# wrangler.toml
name = "equipped"
main = "src/worker.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = "./dist"
binding = "ASSETS"
run_worker_first = ["/api/*", "/webhooks/*"]

[[d1_databases]]
binding = "DB"
database_name = "equipped-db"
database_id = ""  # Set after creation

[vars]
ENVIRONMENT = "production"

# Development overrides
[env.dev]
name = "equipped-dev"

[env.dev.vars]
ENVIRONMENT = "development"

# Staging overrides
[env.staging]
name = "equipped-staging"

[env.staging.vars]
ENVIRONMENT = "staging"
```

```
# public/_headers
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin

/lib/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/
  Cache-Control: public, max-age=3600, s-maxage=86400

/*.html
  Cache-Control: public, max-age=3600, s-maxage=86400
```

## Custom Domain Setup

```bash
# Add custom domain via wrangler
wrangler domains add tryequipped.com
wrangler domains add "*.tryequipped.com"
```

## Environment Variables (CloudFlare Dashboard)

Set these as secrets in the CloudFlare dashboard:

| Variable | Description |
|----------|-------------|
| CLERK_SECRET_KEY | Clerk backend secret |
| CLERK_WEBHOOK_SECRET | Webhook signature key |
| DATABASE_ID | D1 database ID |

## References

- PRD.md Section 13: Technical Architecture
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [run_worker_first](https://developers.cloudflare.com/workers/static-assets/binding/#run_worker_first)
- [D1 Bindings](https://developers.cloudflare.com/d1/get-started/)
