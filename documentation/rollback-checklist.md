# Quick Rollback Checklist

## Emergency Rollback (< 5 min)

- [ ] Rollback CloudFlare Worker: `wrangler rollback`
- [ ] Verify health: `curl https://tryequipped.preview.frst.dev/health`
- [ ] Notify team in #incidents
- [ ] Identify failing commit: `git log --oneline -10`
- [ ] Revert code: `git revert [hash]`
- [ ] Rollback DB (if needed): `wrangler d1 migrations apply`
- [ ] Mark task incomplete in tasks/index.yml
- [ ] Verify recovery: Test critical flows

## Standard Rollback

- [ ] Identify problematic commit
- [ ] Create revert commit: `git revert [hash]`
- [ ] Push to main
- [ ] Deploy: `bun run deploy`
- [ ] Update task tracking
- [ ] Document rollback reason
- [ ] Create issue to fix properly

## Post-Rollback

- [ ] Document what went wrong
- [ ] Identify why tests didn't catch it
- [ ] Add regression test
- [ ] Update PRD if requirements changed
- [ ] Schedule proper fix
