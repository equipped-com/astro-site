# Task: Verify Deploy Pipeline

## Description

Verify that the build and deploy pipeline works correctly with the Hono worker setup. Ensure Astro build followed by wrangler deploy works seamlessly, and that both static assets and API routes are accessible in production.

## Acceptance Criteria

- [ ] `npm run build` completes without errors
- [ ] `npm run deploy` completes without errors
- [ ] Worker deployed to CloudFlare
- [ ] Custom domain works (tryequipped.preview.frst.dev)
- [ ] Both static assets and API routes accessible
- [ ] Environment variables properly loaded
- [ ] No TypeScript errors

## Test Criteria

```gherkin
Feature: Deploy Pipeline
  As the platform
  I want a reliable deploy pipeline
  So that I can ship updates with confidence

  @REQ-DEPLOY-001
  Scenario: Build succeeds
    When I run "npm run build"
    Then exit code should be 0
    And dist/ directory should contain HTML files
    And no TypeScript errors should occur

  @REQ-DEPLOY-002
  Scenario: Deploy succeeds
    Given build has completed
    When I run "npm run deploy"
    Then exit code should be 0
    And CloudFlare should confirm deployment
    And deployment URL should be returned

  @REQ-DEPLOY-003
  Scenario: Static site accessible
    Given deployment completed
    When I curl "https://tryequipped.preview.frst.dev/"
    Then response status should be 200
    And response should contain HTML
    And page should render correctly

  @REQ-DEPLOY-004
  Scenario: API accessible
    Given deployment completed
    When I curl "https://tryequipped.preview.frst.dev/api/health"
    Then response status should be 200
    And response should be JSON
    And status should be "ok"

  @REQ-DEPLOY-005
  Scenario: Security headers present
    Given deployment completed
    When I check response headers
    Then X-Content-Type-Options should be "nosniff"
    And X-Frame-Options should be "DENY"
    And Referrer-Policy should be present

  @REQ-DEPLOY-006
  Scenario: Asset caching works
    Given deployment completed
    When I request "/lib/client.js"
    Then Cache-Control should contain "immutable"

  @REQ-DEPLOY-007
  Scenario: Worker logs accessible
    Given deployment completed
    When I check CloudFlare dashboard
    Then worker logs should be available
    And no error logs from successful requests
```

## Dependencies

- infrastructure/setup-hono-worker
- infrastructure/configure-wrangler

## Verification Commands

```bash
# Full deploy cycle
npm run build && npm run deploy

# Verify static site
curl -I https://tryequipped.preview.frst.dev/

# Verify API
curl https://tryequipped.preview.frst.dev/api/health

# Check headers
curl -I https://tryequipped.preview.frst.dev/lib/client.js

# View logs
wrangler tail
```

## package.json Scripts

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "wrangler dev",
    "deploy": "npm run build && wrangler deploy",
    "deploy:staging": "npm run build && wrangler deploy --env staging",
    "deploy:production": "npm run build && wrangler deploy --env production",
    "logs": "wrangler tail"
  }
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails with TS errors | Run `npm run check` to identify issues |
| Deploy fails with auth error | Run `wrangler login` |
| API returns 500 | Check `wrangler tail` for error logs |
| Static assets 404 | Verify dist/ directory exists after build |
| CORS errors | Check cors middleware configuration |

## References

- PRD.md Section 13: Technical Architecture
- PRD.md Section 14: Deployment Strategy
- [Wrangler Deploy](https://developers.cloudflare.com/workers/wrangler/commands/#deploy)
- [Wrangler Tail](https://developers.cloudflare.com/workers/wrangler/commands/#tail)
