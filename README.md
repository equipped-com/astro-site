# Equipped

> All things tech, one monthly fee. It's that simple.

Landing page for Equipped - an IT asset management and device provisioning platform.

## Tech Stack

- **Astro 5** - Static site generator
- **Tailwind CSS v4** - Vite plugin (not PostCSS)
- **React 19** - Interactive components
- **Framer Motion** - Animations
- **Sharp** - Image optimization
- **CloudFlare Workers** - Edge deployment

## Prerequisites

This project uses [Bun](https://bun.sh) as the package manager and runtime.

```bash
# macOS (Homebrew)
brew install oven-sh/bun/bun

# Or using curl (macOS, Linux, WSL)
curl -fsSL https://bun.sh/install | bash
```

### Developer Access Requirements

**CloudFlare Account Access** - Required for development

Developers need access to the CloudFlare account to:
- Run database migrations (`bunx wrangler d1 execute`)
- Deploy to preview/production (`bun run deploy`)
- Access D1 database (local and remote)

**To get access:**
1. Request invitation to CloudFlare team from project admin
2. Authenticate wrangler: `bunx wrangler login`
3. Verify access: `bunx wrangler d1 list`

Without CloudFlare access, you can still develop the frontend locally, but database operations will fail.

## Quick Start

```bash
bun install
bun run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server at localhost:4321 |
| `bun run build` | Production build to dist/ |
| `bun run preview` | Preview production build |
| `bun run deploy` | Deploy to CloudFlare Workers |
| `bun run check` | Lint with Biome |

## Testing

### Unit & Integration Tests (Vitest)

```bash
bun run test                 # Run all tests once
bun run test:watch           # Watch mode (recommended for dev)
bun run test:coverage        # Generate coverage report
bun run test:ui              # Visual UI dashboard
```

### E2E Tests (Playwright)

```bash
bun run test:e2e             # Run all E2E tests (headless)
bun run test:e2e:ui          # Visual test runner with debugging
bun run test:e2e:headed      # Run with visible browser
bun run test:e2e:debug       # Debug mode with Playwright Inspector
bun run test:e2e:chromium    # Run only in Chromium
```

**Before running E2E tests:**
1. Create test user in Clerk (e2e-test@equipped.test)
2. Set `E2E_TEST_PASSWORD` in `.env.local`
3. Make sure dev server is running (Playwright will auto-start it)

## Project Structure

```
src/
├── assets/           # Images, logos
│   └── logos/        # Company logos (SVG)
├── components/
│   ├── hero/         # Hero section with Ken Burns effect
│   ├── sections/     # Reusable section components
│   └── ui/           # React UI components
├── layouts/          # Page layouts
├── lib/              # Utilities (cn helper)
├── pages/            # Routes
├── styles/           # Global CSS, Tailwind config
└── types/            # TypeScript interfaces

documentation/        # UX flows and platform documentation
├── platform-*.md     # Feature documentation with Figma references
└── figma/            # Exported Figma screens

tasks/                # Development task tracking
├── index.yml         # Master task index with status
└── {epic}/           # Task files organized by epic
    └── {task}.md     # Individual task with Gherkin tests
```

## Documentation

| Document | Purpose |
|----------|---------|
| `documentation/PRD.md` | Product Requirements - authoritative feature specs |
| `documentation/EQUIPPED.md` | Product vision and capabilities overview |
| `documentation/PLAN.md` | Development phases and implementation plan |
| `documentation/platform-*.md` | UX flows with Figma references |
| `tasks/index.yml` | Development task index with status tracking |

## Task System

Development tasks are tracked in `tasks/` with BDD test criteria. See `tasks/index.yml` for full documentation.

### Task Selection

```yaml
# Each task has:
done: false           # Completion status
complexity: low|medium|high  # Agent capability matching
requires: human       # Optional - needs manual action
```

### Complexity Levels

| Level | Agent | Examples |
|-------|-------|----------|
| `low` | haiku | Static pages, loading states, simple patterns |
| `medium` | sonnet | Dashboard views, CRUD, forms, API endpoints |
| `high` | opus | Auth, payments, external APIs, architecture |

### Escalation Protocol

If a task fails, report: `ESCALATION NEEDED: {task_id} - {reason}`

Tasks marked `requires: human` need manual action (dashboard setup, API keys, partnerships).

## Key Features

- **CSS Ken Burns** - Smooth hero animation via CSS (no JS overhead)
- **Astro Image** - Automatic WebP/AVIF generation (4.5MB source to ~200KB)
- **oklch Colors** - Modern color system with shadcn/ui semantics
- **Biome** - Fast linting and formatting (replaces ESLint + Prettier)

## Environment Configuration

### Required Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client-side key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | Clerk server-side key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CLERK_WEBHOOK_SECRET` | Webhook signature verification | Clerk Dashboard → Webhooks |
| `PUBLIC_SENTRY_DSN` | Sentry error tracking DSN | [Sentry Dashboard](https://sentry.io) → Project Settings |
| `PUBLIC_APP_VERSION` | App version for Sentry releases | Set manually (e.g., `1.0.0`) |

**Note:** Variables prefixed with `PUBLIC_` are exposed to client-side code (Astro convention).

### CloudFlare Configuration

The project uses CloudFlare Workers with D1 database. Configuration is in `wrangler.toml`:

| Setting | Value | Purpose |
|---------|-------|---------|
| `name` | `tryequipped` | Worker name |
| `d1_databases.binding` | `DB` | Database binding name |
| `d1_databases.database_id` | `b1b71c2d-...` | D1 database ID (specific to CloudFlare account) |
| `routes.pattern` | `tryequipped.preview.frst.dev` | Custom domain |

**CloudFlare Account ID** (for wrangler commands):
```bash
export CLOUDFLARE_ACCOUNT_ID=e6bd4c9e08862c4b3c8ddacbbef253b1
```

### Local Development

```bash
# Install dependencies
bun install

# Run local D1 database migrations
bunx wrangler d1 execute equipped-db --local --file=drizzle/0000_init.sql

# Start dev server
bun run dev
```

## Human Tasks

Some tasks require manual setup in external dashboards. These are tracked in `tasks/index.yml` with `requires: human`.

### Completed (✅)

| Task | Status | Notes |
|------|--------|-------|
| Clerk Application Setup | ✅ Done | Keys configured in `.env.local` |
| D1 Database Creation | ✅ Done | Created via `wrangler d1 create` |
| Database Schema | ✅ Done | 16 tables deployed to local + remote |

### Remaining (⏳)

| Task | File | What's Needed |
|------|------|---------------|
| [Stripe Payments](tasks/integrations/stripe-payments.md) | `integrations/stripe-payments` | Create Stripe account, get API keys |
| [PostHog Analytics](tasks/integrations/posthog-analytics.md) | `integrations/posthog-analytics` | Create PostHog project, get API key |
| [Plaid Verification](tasks/integrations/plaid-verification.md) | `integrations/plaid-verification` | Create Plaid account for bank verification |
| [Macquarie Leasing](tasks/integrations/macquarie-leasing.md) | `integrations/macquarie-leasing` | Partnership agreement required |
| [Upgraded API](tasks/integrations/upgraded-api.md) | `integrations/upgraded-api` | Partnership agreement required |

**Note:** Mark tasks as `done: true` in `tasks/index.yml` when complete, and add `commit: {hash}` if code was committed.

## Deployment

CloudFlare Workers with static assets. Domain: tryequipped.com

```bash
# Deploy to CloudFlare
bun run deploy

# Deploy database migrations (production)
bunx wrangler d1 execute equipped-db --remote --file=drizzle/0000_init.sql
```

## License

MIT
