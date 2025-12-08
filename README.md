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

## Quick Start

```bash
npm install
npm run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at localhost:4321 |
| `npm run build` | Production build to dist/ |
| `npm run preview` | Preview production build |
| `npm run deploy` | Deploy to CloudFlare Workers |
| `npm run check` | Lint with Biome |

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
| `PRD.md` | Product Requirements - authoritative feature specs |
| `EQUIPPED.md` | Product vision and capabilities overview |
| `documentation/` | UX flows, Figma exports, integration details |
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

## Deployment

CloudFlare Workers with static assets. Domain: tryequipped.com

```bash
npm run deploy
```

## License

MIT
