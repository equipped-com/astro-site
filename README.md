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
```

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
