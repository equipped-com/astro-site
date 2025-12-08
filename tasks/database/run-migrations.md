# Task: Run Database Migrations

## Description

Execute the database migrations on both local and remote D1 databases.

## Acceptance Criteria

- [ ] Migrations run successfully on local D1
- [ ] Migrations run successfully on remote D1
- [ ] All tables exist and are accessible
- [ ] Schema matches expected structure

## Test Criteria

- [ ] `wrangler d1 execute equipped-db --local --file=migrations/0001_initial.sql` succeeds
- [ ] `wrangler d1 execute equipped-db --remote --file=migrations/0001_initial.sql` succeeds
- [ ] Can query tables: `SELECT * FROM users LIMIT 1`
- [ ] Can insert test data

## Dependencies

- database/create-d1-database
- database/initial-schema

## Commands

```bash
# Run on local database
npx wrangler d1 execute equipped-db --local --file=migrations/0001_initial.sql

# Run on remote database
npx wrangler d1 execute equipped-db --remote --file=migrations/0001_initial.sql

# Verify tables exist
npx wrangler d1 execute equipped-db --local --command "SELECT name FROM sqlite_master WHERE type='table'"
```

## Files Required

- `migrations/0001_initial.sql`

## References

- [D1 Migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- PLAN.md Phase 3.3
