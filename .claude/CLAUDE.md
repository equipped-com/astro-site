# tryequipped Landing Page

Landing page for Equipped - an IT asset management and device provisioning platform.

**Tagline:** "All things tech, one monthly fee. It's that simple."

## Tech Stack

- **Astro 5** - Static site generator
- **Tailwind CSS v4** - Vite plugin (NOT PostCSS)
- **React 19** - Interactive components (infinite-slider, progressive-blur)
- **Framer Motion** - Animations
- **Sharp** - Image optimization
- **CloudFlare Workers** - Edge deployment with custom headers
- **Biome** - Linting + formatting

## Key Files

- `src/pages/index.astro` - Main landing page
- `src/components/hero/HeroSection.astro` - Hero with CSS Ken Burns
- `src/components/sections/` - FeatureCard, TestimonialCard, StatCard
- `src/components/ui/` - infinite-slider, progressive-blur
- `src/worker.ts` - CloudFlare Worker for cache/security headers
- `src/styles/global.css` - Theme variables and animations

## Commands

```bash
npm run dev      # Dev server at localhost:4321
npm run build    # Production build
npm run deploy   # Deploy to CloudFlare Workers
npm run check    # Biome linting
```

## Design Guidelines

- **Colors:** Black primary, pastel accents, clean whites (oklch color system)
- **Style:** Professional, clean, small rounded corners
- **No:** Colored shadow boxes, heavy gradients, busy backgrounds

## Code Style

- Use **tabs** for indentation
- Use **kebab-case** for file names
- Prefer **functional style** with ternary operators and `.map()`
- Use **real functions** instead of arrow functions where applicable
- Use **standard shadcn/ui color names** (primary, secondary, muted, accent)

## Code Preferences

- **NO AXIOS**: Use native `fetch()` for HTTP requests - no extra dependencies needed
- **NO BACKWARDS COMPATIBILITY HACKS**: Fix it right, don't maintain broken patterns alongside new ones
- **QUESTION EVERY LAYER**: Before adding abstraction, ask "what does this hide?"
  - Good: hides complexity, reduces coupling
  - Bad: just passes data through, exists because it "feels proper"
- **STREAMING FOR LARGE DATA**: Use streaming patterns instead of accumulating arrays in memory
- **COMMENTS ONLY FOR COMPLEXITY**: Use clear variable/function names; add comments only where logic isn't self-evident

## Pre-Implementation Checklist

For non-trivial features:
1. Research the approach (official docs, compatibility)
2. Identify potential conflicts (library compatibility, React patterns)
3. Propose solution with evidence
4. Get confirmation if ambiguous
5. THEN implement

Skip for: typo fixes, obvious fixes, clear instructions

## Git Workflow

- Use feature branches
- Commit incrementally during larger tasks
- Rebase to main branch on completion

## Tailwind CSS v4 - CRITICAL

**DO NOT create these files** (v4 doesn't use them):
- `tailwind.config.js`
- `postcss.config.js`

Config is via Vite plugin in `astro.config.ts` and `@import "tailwindcss"` in global.css.

## Import Alias

```typescript
import BaseLayout from '@/layouts/BaseLayout.astro'
import { cn } from '@/lib/utils'
```

## CloudFlare Workers

- Custom domain: tryequipped.preview.frst.dev
- Worker handles cache headers (`run_worker_first = true`)
- `/lib/*` assets: immutable, 1 year cache
- Security headers: X-Content-Type-Options, X-Frame-Options

## Task System

Tasks are organized in `tasks/{epic}/{task}.md` with `tasks/index.yml` as master index.

### Task Selection Rules

When selecting tasks to work on:

1. **EXCLUDE `requires: human`** - Skip tasks needing manual action
2. **Match `complexity` to agent** - Use appropriate agent for task difficulty
3. **Check dependencies** - Complete prerequisites first (see task file)
4. **Respect priority** - Work on `high` priority epics before `medium` or `low`
5. **Mark done when complete** - Update `done: true` in index.yml

### Complexity Levels

| Level | Agent | Use For |
|-------|-------|---------|
| `low` | haiku (fast/cheap) | Static pages, loading states, simple patterns |
| `medium` | sonnet (standard) | Dashboard views, CRUD, forms, list/detail |
| `high` | opus (advanced) | Auth, payments, external APIs, architecture |

### Human-Required Tasks

Tasks marked `requires: human` need real-world action:

- External dashboard setup (Clerk, CloudFlare, Stripe, Plaid)
- Partnership agreements (Macquarie, Upgraded)
- Account creation on third-party services
- API key generation from external providers

When encountering these, inform the user what manual steps are needed.

### Escalation Protocol

If an agent fails to complete a task:

1. Document the failure reason clearly
2. Report: `ESCALATION NEEDED: {task_id} - {reason}`
3. Suggest complexity upgrade if task was harder than rated
4. Do NOT mark the task as done
5. Do NOT retry without escalation

### Key Documents

- `PRD.md` - Product requirements (authoritative for features)
- `documentation/*.md` - UX flows and integrations
- `tasks/index.yml` - Task index with status tracking

### Test Criteria Format

All tasks use Gherkin BDD format for test criteria:

```gherkin
Feature: Feature Name
  Scenario: Specific behavior
    Given precondition
    When action
    Then expected result
```
