# Task: Configure Wrangler for API

## Description

Update `wrangler.toml` to enable the Hono worker for API routes while preserving static asset serving. Use `run_worker_first = ["/api/*"]` for selective worker invocation.

## Acceptance Criteria

- [ ] `main = "src/worker.ts"` added to wrangler.toml
- [ ] `compatibility_flags = ["nodejs_compat"]` added
- [ ] `binding = "ASSETS"` added to [assets] section
- [ ] `run_worker_first = ["/api/*"]` configured
- [ ] `public/_headers` still applies to static assets

## Test Criteria

- [ ] `/api/health` is handled by worker (returns JSON)
- [ ] `/` serves static HTML with correct cache headers
- [ ] `/lib/*` serves JS with immutable cache headers
- [ ] Security headers (X-Frame-Options, etc.) still present
- [ ] `wrangler deploy` succeeds

## Dependencies

- infrastructure/setup-hono-worker

## Files to Modify

- `wrangler.toml`

## References

- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [run_worker_first](https://developers.cloudflare.com/workers/static-assets/binding/#run_worker_first)
- PLAN.md Phase 1.3
