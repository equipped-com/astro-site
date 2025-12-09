# Task: Create D1 Database

## Description

Create a Cloudflare D1 database named `equipped-db` for storing users, devices, and assignments.

## Acceptance Criteria

- [ ] D1 database created via `wrangler d1 create equipped-db`
- [ ] Database ID recorded
- [ ] D1 binding added to wrangler.toml
- [ ] Database accessible in worker via `c.env.DB`

## Test Criteria

- [ ] `wrangler d1 list` shows `equipped-db`
- [ ] `wrangler d1 execute equipped-db --local --command "SELECT 1"` succeeds
- [ ] Worker can access DB binding (no runtime errors)

## Dependencies

- infrastructure/configure-wrangler

## Files to Modify

- `wrangler.toml` (add [[d1_databases]] binding)

## Commands

```bash
# Create the database
bunx wrangler d1 create equipped-db

# Add to wrangler.toml:
# [[d1_databases]]
# binding = "DB"
# database_name = "equipped-db"
# database_id = "<from-output>"
```

## References

- [D1 Overview](https://developers.cloudflare.com/d1/)
- [Wrangler D1 Commands](https://developers.cloudflare.com/workers/wrangler/commands/#d1)
- PLAN.md Phase 3.1
