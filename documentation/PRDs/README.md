# Product Requirements Documents (PRDs)

This directory contains all Product Requirements Documents for the Equipped platform.

## PRD Types

### Product Features (`product.md`)
**Purpose:** Core product features and user-facing capabilities

**Scope:**
- User personas and journeys
- Feature specifications with Gherkin BDD acceptance criteria
- Database schema and entity relationships
- External integrations (Clerk, Stripe, Shopify, etc.)
- Success metrics and KPIs

**Epic Coverage:**
- Infrastructure, Database, Multi-tenancy
- Auth, API, Commerce, Orders
- People, Proposals, Trade-in, Fleet
- Settings, Sys Admin, Monitoring
- Dashboard, Static Pages, Testing, Integrations

### Workflow & Process (`workflow.md`)
**Purpose:** Development workflow and process improvements

**Scope:**
- PRD preparation and scoping guidelines
- Automated task generation from PRDs
- Task dependency validation and management
- Testing strategy decision trees
- Rollback and recovery procedures
- Synthetic test data isolation

**Epic Coverage:**
- Workflow automation

## Naming Convention

All PRDs follow this pattern:
```
documentation/PRDs/{scope}.md
```

Examples:
- `product.md` - Core product features
- `workflow.md` - Development processes
- `leasing.md` (future) - Leasing integration features
- `integrations.md` (future) - External integration specifications

## Discovery & Task Generation

PRDs in this directory are automatically discovered by:

```bash
# Task generation script (planned)
node scripts/generate-tasks-from-prd.js documentation/PRDs/product.md

# Or discover all PRDs
find documentation/PRDs -name "*.md" -not -name "README.md"
```

## PRD Tracking

All PRDs are tracked in `/prd.yml`:

```yaml
files:
  product.md:
    status: complete
    location: documentation/PRDs/product.md
    processed_at: 2024-12-08
    epics_created:
      - auth
      - api
      - ...
```

## Adding a New PRD

1. Create PRD file: `documentation/PRDs/{scope}.md`
2. Use Gherkin BDD format for acceptance criteria
3. Tag requirements: `@REQ-{SCOPE}-###`
4. Add to `prd.yml` tracking file
5. Run task generation (when available)

## References

- [Product PRD](./product.md) - Core features and capabilities
- [Workflow PRD](./workflow.md) - Process improvements
- [PRD Tracking](/prd.yml) - Status and epic mapping
- [Task Index](/tasks/index.yml) - Generated tasks from PRDs
