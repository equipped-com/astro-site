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
