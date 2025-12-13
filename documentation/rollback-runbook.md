# Rollback & Recovery Runbook

**Purpose**: Guide for safely reverting failed deployments or task implementations.

**When to use**: Production issues, failed deployments, critical bugs discovered post-merge.

---

## Quick Decision Tree

```
Issue detected in production
│
├─ Affects users immediately? (auth, payments, data loss)
│  └─ EMERGENCY ROLLBACK (see Emergency Procedures)
│
└─ Non-critical issue (UI bug, typo, non-blocking)
   └─ STANDARD ROLLBACK (see Standard Procedures)
```

---

## Emergency Procedures (< 5 minutes)

**Use when**: User-facing critical failure (auth broken, payment errors, data corruption)

### Step 1: Immediate Mitigation

```bash
# Roll back CloudFlare Worker to previous version
cd ~/code/astro-site
wrangler rollback --message "Emergency rollback: [brief reason]"
```

**Verify**:
- Check https://tryequipped.preview.frst.dev/health
- Verify auth flow works
- Check monitoring dashboard (if available)

### Step 2: Notify Team

**Slack/Discord**: Post in #incidents channel
```
🚨 EMERGENCY ROLLBACK EXECUTED
Issue: [Brief description]
Rollback: [Deployment version reverted to]
Status: [Investigating | Mitigated | Resolved]
Owner: [Your name]
```

### Step 3: Identify Root Cause

```bash
# Check recent commits
git log --oneline -10

# Check which task caused the issue
grep -r "commit: [hash]" tasks/index.yml

# View specific commit details
git show [commit-hash]
```

### Step 4: Revert Code (if needed)

```bash
# Create revert commit
git revert [failing-commit-hash]

# Or revert multiple commits
git revert [hash1]^..[hash2]

# Push revert
git push origin main
```

### Step 5: Rollback Database (if migrations involved)

```bash
# Check if migrations were deployed
wrangler d1 migrations list equipped-db

# Rollback specific migration
wrangler d1 execute equipped-db --command="
  -- Rollback migration [migration-name]
  -- (Include rollback SQL from migration file)
"

# Verify rollback
wrangler d1 execute equipped-db --command="SELECT * FROM migrations;"
```

### Step 6: Update Task Tracking

Edit `tasks/index.yml`:

```yaml
# Find the task that caused the issue
- id: failing-task
  name: Task Name
  done: false  # Change from true to false
  # commit: abc123  # Comment out or remove commit hash
  rollback_reason: "Brief description of why rolled back"
  rollback_date: "2025-12-12"
```

### Step 7: Verify Recovery

```bash
# Run health checks
curl https://tryequipped.preview.frst.dev/health

# Test critical flows manually
# - Sign in
# - Dashboard load
# - API endpoints responding

# Check error logs
wrangler tail
```

---

## Standard Rollback Procedures

**Use when**: Non-critical issue, time to properly investigate and revert.

### Scenario 1: Revert Single Commit

```bash
# Identify the problematic commit
git log --oneline

# Create revert commit
git revert [commit-hash]

# Push to main
git push origin main

# Deploy
bun run deploy
```

### Scenario 2: Revert Entire Feature Branch

```bash
# Find merge commit
git log --online --merges -10

# Revert merge commit
git revert -m 1 [merge-commit-hash]

# Push and deploy
git push origin main
bun run deploy
```

### Scenario 3: Rollback Database Migration

**Migrations with down() function:**

```bash
# Check current migrations
wrangler d1 migrations list equipped-db

# Rollback one migration
wrangler d1 migrations apply equipped-db --version=[previous-version]
```

**Manual rollback SQL:**

```bash
# Execute rollback script
wrangler d1 execute equipped-db --file=migrations/rollback/[migration]-down.sql

# Verify
wrangler d1 execute equipped-db --command="PRAGMA table_info([table_name]);"
```

### Scenario 4: Rollback CloudFlare Worker Only

```bash
# List recent deployments
wrangler deployments list

# Rollback to specific version
wrangler rollback --message "Reverting to stable version"

# Or rollback to specific deployment ID
wrangler rollback [deployment-id]
```

---

## Task Tracking Updates

After any rollback, update `tasks/index.yml`:

```yaml
epics:
  example:
    tasks:
      - id: rolled-back-task
        name: Task That Failed
        file: example/task.md
        done: false  # Mark as incomplete
        complexity: high  # May need to increase if underestimated
        depends_on:
          - dependency/task
        rollback_reason: "Production error: [brief description]"
        rollback_date: "2025-12-12"
        rollback_commit: "abc123"  # Revert commit hash
        # Original commit commented out for reference:
        # commit: xyz789
```

---

## Common Failure Scenarios

### Auth Broken (Clerk)

**Symptoms**: Users can't sign in, 401 errors, redirect loops

**Rollback**:
1. Check CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in Wrangler secrets
2. Revert auth-related commits
3. Verify Clerk webhook configuration unchanged
4. Test sign-in flow manually

**Prevention**:
- Always test auth in staging first
- Never commit Clerk keys to git
- Test with test user before merging

### API Endpoint Errors

**Symptoms**: 500 errors, database connection failures, timeout errors

**Rollback**:
1. Check recent API route changes
2. Revert API commits
3. Verify database schema matches code expectations
4. Check Wrangler bindings (D1, KV) are configured

**Prevention**:
- Run integration tests before merge
- Test with real database in staging
- Use migration rollback scripts

### Database Migration Failure

**Symptoms**: Schema errors, missing columns, constraint violations

**Rollback**:
1. Identify failed migration
2. Run rollback SQL script
3. Verify schema with PRAGMA table_info
4. Revert code that depends on new schema

**Prevention**:
- Test migrations locally first
- Always write down() migration functions
- Never modify existing migrations

### Checkout Flow Broken

**Symptoms**: Cart errors, payment failures, order not created

**Rollback**:
1. Revert checkout-related commits
2. Verify cart state in localStorage
3. Check payment integration (Stripe/Macquarie)
4. Test full checkout flow manually

**Prevention**:
- Run E2E tests before merge
- Test with test payment credentials
- Verify cart persistence works

---

## Verification Steps

After rollback, verify:

### 1. Health Check

```bash
curl https://tryequipped.preview.frst.dev/health
# Expected: { "status": "ok", "timestamp": "..." }
```

### 2. Critical Flows

- [ ] Sign in works
- [ ] Dashboard loads
- [ ] API endpoints respond (GET /api/devices)
- [ ] Checkout flow completes
- [ ] Database queries succeed

### 3. Monitoring

- [ ] Error rate returned to normal
- [ ] Response times acceptable
- [ ] No console errors in browser
- [ ] Worker logs clean (wrangler tail)

### 4. User Verification

- [ ] Test with real user account (if possible)
- [ ] Verify data integrity (no data loss)
- [ ] Check recent orders/records unaffected

---

## Prevention Best Practices

### Before Merging

- [ ] All tests pass (unit, integration, E2E)
- [ ] Code reviewed by at least one other person
- [ ] Tested in local environment
- [ ] Database migrations tested with rollback
- [ ] Breaking changes documented

### Before Deploying

- [ ] Deploy to staging first (if available)
- [ ] Run smoke tests in staging
- [ ] Verify environment variables/secrets configured
- [ ] Check Wrangler bindings match production

### After Deploying

- [ ] Monitor for errors (first 10 minutes)
- [ ] Test critical flows manually
- [ ] Check health endpoint
- [ ] Review worker logs (wrangler tail)

---

## Escalation

If rollback doesn't resolve the issue:

1. **Create incident document**:
   ```markdown
   # Incident: [Brief title]
   **Date**: [Date/time]
   **Severity**: [Critical | High | Medium]
   **Status**: [Investigating | Mitigating | Resolved]

   ## Timeline
   - [Time] Issue detected
   - [Time] Rollback executed
   - [Time] Issue persists

   ## Impact
   - [Number] users affected
   - [Features] unavailable

   ## Root Cause
   [What caused the issue]

   ## Resolution
   [What fixed it]
   ```

2. **Escalate to senior engineer** (if available)

3. **Contact third-party support** (if integration issue):
   - Clerk: support@clerk.com
   - CloudFlare: Support dashboard
   - Stripe: dashboard.stripe.com/support

---

## References

- Git Revert Docs: https://git-scm.com/docs/git-revert
- Wrangler Rollback: https://developers.cloudflare.com/workers/wrangler/commands/#rollback
- D1 Migrations: https://developers.cloudflare.com/d1/reference/migrations/
