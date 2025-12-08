# Task: Health Check Endpoint

## Description

Implement /api/health endpoint for uptime monitoring with status of all critical services.

## Acceptance Criteria

- [ ] GET /api/health returns health status
- [ ] Check database connectivity
- [ ] Check auth service (Clerk)
- [ ] Response time < 100ms
- [ ] Appropriate status codes (200 healthy, 503 unhealthy)

## Test Criteria

```gherkin
Feature: Health Check API
  As a platform operator
  I want health check endpoints
  So that I can monitor system status

  @REQ-MON-001
  Scenario: Healthy system response
    Given all services are operational
    When I call GET /api/health
    Then I should receive status 200
    And response should include:
      | Field | Value |
      | status | "healthy" |
      | version | Current deploy version |
      | timestamp | Current ISO timestamp |
      | checks.database | "ok" |
      | checks.auth | "ok" |

  @REQ-MON-002
  Scenario: Database unhealthy
    Given database is unreachable
    When I call GET /api/health
    Then I should receive status 503
    And response should include:
      | Field | Value |
      | status | "unhealthy" |
      | checks.database | "error: connection failed" |

  @REQ-MON-003
  Scenario: Response time requirement
    When I call GET /api/health
    Then response should complete in < 100ms

  @REQ-MON-004
  Scenario: No authentication required
    Given I am not authenticated
    When I call GET /api/health
    Then I should still receive a response
    And the endpoint should be publicly accessible
```

## Implementation

```typescript
// src/api/health.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/api/health', async (c) => {
  const startTime = Date.now()
  const checks: Record<string, string> = {}

  // Check database
  try {
    await c.env.DB.prepare('SELECT 1').first()
    checks.database = 'ok'
  } catch (e) {
    checks.database = `error: ${e.message}`
  }

  // Check auth (Clerk)
  try {
    // Simple check that Clerk env is configured
    if (c.env.CLERK_SECRET_KEY) {
      checks.auth = 'ok'
    } else {
      checks.auth = 'error: not configured'
    }
  } catch (e) {
    checks.auth = `error: ${e.message}`
  }

  const isHealthy = Object.values(checks).every(v => v === 'ok')
  const duration = Date.now() - startTime

  return c.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    version: c.env.VERSION || 'unknown',
    timestamp: new Date().toISOString(),
    duration_ms: duration,
    checks
  }, isHealthy ? 200 : 503)
})

export default app
```

## Files to Create

- `src/api/health.ts`

## References

- PRD.md Section 14: Monitoring & Observability
