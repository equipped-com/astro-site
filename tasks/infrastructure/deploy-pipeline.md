# Task: Verify Deploy Pipeline

## Description

Verify that the build and deploy pipeline works correctly with the new worker setup. Ensure Astro build + wrangler deploy works seamlessly.

## Acceptance Criteria

- [ ] `npm run build` completes without errors
- [ ] `npm run deploy` completes without errors
- [ ] Worker is deployed to CloudFlare
- [ ] Custom domain still works (tryequipped.preview.frst.dev)
- [ ] Both static assets and API routes accessible

## Test Criteria

- [ ] Full deploy cycle: build -> deploy -> verify
- [ ] `curl https://tryequipped.preview.frst.dev/` returns HTML
- [ ] `curl https://tryequipped.preview.frst.dev/api/health` returns JSON
- [ ] CloudFlare dashboard shows worker deployment
- [ ] No errors in CloudFlare worker logs

## Dependencies

- infrastructure/setup-hono-worker
- infrastructure/configure-wrangler

## Files to Verify

- `package.json` scripts
- `wrangler.toml` configuration
- CloudFlare dashboard

## References

- [Wrangler Deploy](https://developers.cloudflare.com/workers/wrangler/commands/#deploy)
- PLAN.md Phase 7.3
