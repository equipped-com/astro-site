# Task: Setup Hono Worker

## Description

Create `src/worker.ts` with Hono framework to handle API routes. This enables the `/api/*` endpoints needed for authentication and device management.

## Acceptance Criteria

- [ ] Hono installed as dependency (`npm install hono`)
- [ ] `src/worker.ts` created with Hono app
- [ ] Health check endpoint at `/api/health` returns `{ status: "ok" }`
- [ ] Fallback to ASSETS binding for non-API routes
- [ ] TypeScript types defined for Env bindings (ASSETS, DB, etc.)

## Test Criteria

- [ ] `curl /api/health` returns 200 with JSON `{ status: "ok" }`
- [ ] Static assets still load correctly (`/`, `/lib/*`, images)
- [ ] `npm run build` succeeds without TypeScript errors
- [ ] `npm run deploy` succeeds and worker runs on CloudFlare

## Dependencies

None (foundation task)

## Files to Create/Modify

- `src/worker.ts` (create)
- `package.json` (modify - add hono dependency)

## References

- [Hono on Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)
- [Hono TypeScript](https://hono.dev/docs/guides/typescript)
- PLAN.md Phase 1.2
