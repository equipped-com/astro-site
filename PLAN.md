# Equipped - Development Plan

## Project Overview

Transforming the static [Astro](https://astro.build/) landing page into a full-stack application with:
- [Hono](https://hono.dev/) API routing on [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Clerk](https://clerk.com/) authentication (sign up, sign in, session management)
- [Cloudflare D1](https://developers.cloudflare.com/d1/) database for user and device data
- [React](https://react.dev/) authenticated dashboard with basic device list UI

### Quick Links

| Service | Dashboard | Docs |
|---------|-----------|------|
| **Clerk** | [dashboard.clerk.com](https://dashboard.clerk.com/) | [clerk.com/docs](https://clerk.com/docs) |
| **Cloudflare** | [dash.cloudflare.com](https://dash.cloudflare.com/) | [developers.cloudflare.com](https://developers.cloudflare.com/) |
| **Hono** | - | [hono.dev/docs](https://hono.dev/docs/) |
| **shadcn/ui** | - | [ui.shadcn.com](https://ui.shadcn.com/) |
| **21st.dev** | - | [21st.dev](https://21st.dev/) |

---

## Phase 1: Worker Architecture with Hono

> **Docs:** [Hono on Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers) | [Hono + Clerk middleware](https://github.com/honojs/middleware/tree/main/packages/clerk-auth)

### 1.1 Install Dependencies
```bash
npm install hono @hono/clerk-auth
```

### 1.2 Restructure Worker (`src/worker.ts`)

Replace the simple cache-header worker with Hono routing:

```
src/worker.ts
├── Static asset handling (existing cache/security headers)
├── API routes (/api/*)
│   ├── /api/auth/* - Clerk webhook endpoints
│   ├── /api/devices - Device CRUD
│   ├── /api/user - User profile
│   └── /api/health - Health check
└── Fallback to Astro static assets
```

**Key Considerations:**
- Preserve existing cache/security headers for static assets
- Use Hono middleware for auth verification on protected routes
- Keep `run_worker_first = true` in wrangler.toml

### 1.3 Update wrangler.toml

Add D1 binding and environment variables:
```toml
[[d1_databases]]
binding = "DB"
database_name = "equipped-db"
database_id = "<to-be-created>"

[vars]
CLERK_PUBLISHABLE_KEY = ""
CLERK_SECRET_KEY = ""
```

---

## Phase 2: Clerk Authentication Setup

> **Docs:** [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react) | [Clerk + Astro](https://clerk.com/docs/references/astro/overview) | [Webhooks](https://clerk.com/docs/webhooks/overview)

### 2.1 Create Clerk Application
- Go to [dashboard.clerk.com](https://dashboard.clerk.com/) and create a new application
- Configure sign-in methods (email, Google OAuth recommended)
- Get publishable key and secret key

### 2.2 Add Clerk to Frontend

**Install Clerk React SDK:**
```bash
npm install @clerk/clerk-react
```

**Create auth components:**
```
src/components/auth/
├── ClerkProvider.tsx       # Clerk context wrapper
├── SignInButton.tsx        # Sign in trigger
├── SignUpButton.tsx        # Sign up trigger
├── UserButton.tsx          # User menu (signed in)
└── AuthGuard.tsx           # Protect routes
```

### 2.3 Create Auth Pages

```
src/pages/
├── sign-in.astro           # Clerk <SignIn /> component
├── sign-up.astro           # Clerk <SignUp /> component
└── dashboard/
    └── index.astro         # Protected dashboard entry
```

### 2.4 Update Navigation

Replace external tryequipped.com auth links with internal routes:
- "Sign in" -> `/sign-in`
- "Get Started" -> `/sign-up`

---

## Phase 3: Cloudflare D1 Database

> **Docs:** [D1 Overview](https://developers.cloudflare.com/d1/) | [Wrangler D1 Commands](https://developers.cloudflare.com/workers/wrangler/commands/#d1) | [D1 + Workers](https://developers.cloudflare.com/d1/get-started/)

### 3.1 Create Database

```bash
npx wrangler d1 create equipped-db
```

### 3.2 Database Schema

Create `migrations/0001_initial.sql`:

```sql
-- Users table (synced from Clerk via webhook)
CREATE TABLE users (
    id TEXT PRIMARY KEY,           -- Clerk user ID
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Devices table
CREATE TABLE devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,            -- 'macbook', 'ipad', 'iphone', 'monitor', 'accessory'
    model TEXT,
    serial_number TEXT,
    status TEXT DEFAULT 'active',  -- 'active', 'pending', 'retired'
    assigned_to TEXT,              -- Employee name/email
    purchase_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Device assignments/history
CREATE TABLE device_assignments (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL REFERENCES devices(id),
    assigned_to_email TEXT NOT NULL,
    assigned_to_name TEXT,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    returned_at DATETIME
);

CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_assignments_device ON device_assignments(device_id);
```

### 3.3 Run Migrations

```bash
npx wrangler d1 execute equipped-db --local --file=migrations/0001_initial.sql
npx wrangler d1 execute equipped-db --remote --file=migrations/0001_initial.sql
```

---

## Phase 4: API Routes

> **Docs:** [Hono Routing](https://hono.dev/docs/api/routing) | [Hono Middleware](https://hono.dev/docs/guides/middleware) | [Drizzle ORM](https://orm.drizzle.team/) (optional)

### 4.1 API Structure

```
src/api/
├── index.ts                # Hono app factory
├── middleware/
│   ├── auth.ts             # Clerk JWT verification
│   └── cors.ts             # CORS headers
├── routes/
│   ├── auth.ts             # Clerk webhooks
│   ├── devices.ts          # Device CRUD
│   └── user.ts             # User profile
└── db/
    ├── schema.ts           # Drizzle schema (optional)
    └── queries.ts          # SQL query helpers
```

### 4.2 Device API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/devices` | List user's devices |
| POST | `/api/devices` | Create new device |
| GET | `/api/devices/:id` | Get device details |
| PUT | `/api/devices/:id` | Update device |
| DELETE | `/api/devices/:id` | Delete device |
| POST | `/api/devices/:id/assign` | Assign to employee |

### 4.3 Clerk Webhook Handler

Handle user.created, user.updated events to sync to D1:

```typescript
// POST /api/auth/webhook
app.post('/api/auth/webhook', async (c) => {
    const payload = await c.req.json()
    // Verify webhook signature
    // Sync user to D1
})
```

---

## Phase 5: Dashboard UI

### 5.1 Dashboard Structure

```
src/pages/dashboard/
├── index.astro             # Dashboard home (redirect to devices)
├── devices.astro           # Device list page
└── [...path].astro         # Catch-all for React app

src/components/dashboard/
├── DashboardLayout.tsx     # Sidebar + header layout
├── DeviceList.tsx          # Device table/grid
├── DeviceCard.tsx          # Individual device card
├── AddDeviceModal.tsx      # Create device form
├── DeviceDetails.tsx       # Device detail view
└── Sidebar.tsx             # Navigation sidebar
```

### 5.2 Dashboard Navigation

Based on original site structure:
- **Devices** - Main device inventory
- **Orders** - Order history (placeholder)
- **Store** - Device catalog (placeholder)
- **People** - Team management (placeholder)
- **Settings** - Account settings

### 5.3 Device List UI Features

MVP feature set for "Basic device list UI":

1. **Device Table/Grid View**
   - Name, type, model, status, assigned to
   - Sort by any column
   - Filter by status (active/pending/retired)

2. **Add Device**
   - Modal form with fields: name, type, model, serial number
   - Auto-assign to current user initially

3. **Device Actions**
   - Edit device details
   - Assign/reassign to employee
   - Mark as retired

4. **Empty State**
   - Friendly illustration
   - "Add your first device" CTA

---

## Phase 6: Static Pages

### 6.1 Privacy Policy Page

Create `src/pages/privacy.astro`:
- Standard privacy policy content
- Use BaseLayout
- Match site design

### 6.2 Terms of Service Page

Create `src/pages/terms.astro`:
- Standard terms of service
- Use BaseLayout
- Match site design

### 6.3 Update Footer Links

Change footer links from external tryequipped.com to internal:
- Privacy -> `/privacy`
- Terms -> `/terms`

---

## Phase 7: Deployment Configuration

### 7.1 Environment Variables

Required secrets in Cloudflare dashboard:
```
CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
```

### 7.2 Updated wrangler.toml

```toml
name = "tryequipped"
main = "dist/worker.js"
compatibility_date = "2024-12-01"
assets = { directory = "dist", run_worker_first = true }

[[d1_databases]]
binding = "DB"
database_name = "equipped-db"
database_id = "xxx-xxx-xxx"

[vars]
ENVIRONMENT = "production"
```

### 7.3 Build Process

Update build to handle both Astro static + Worker:
```json
{
  "scripts": {
    "build": "astro build && npm run build:worker",
    "build:worker": "esbuild src/worker.ts --bundle --outfile=dist/worker.js --format=esm"
  }
}
```

---

## Implementation Order

### Sprint 1: Foundation
1. [ ] Set up Hono in worker.ts with basic routing
2. [ ] Create D1 database and run initial migration
3. [ ] Install Clerk and create auth pages (sign-in, sign-up)
4. [ ] Update navigation to use internal auth routes

### Sprint 2: API Layer
5. [ ] Implement Clerk webhook handler for user sync
6. [ ] Create device CRUD API endpoints
7. [ ] Add auth middleware to protect API routes
8. [ ] Test API with curl/Postman

### Sprint 3: Dashboard
9. [ ] Create dashboard layout with sidebar
10. [ ] Build device list component with table view
11. [ ] Add device modal and form
12. [ ] Implement device edit/delete functionality

### Sprint 4: Polish
13. [ ] Add privacy and terms pages
14. [ ] Update all external links to internal
15. [ ] Add loading states and error handling
16. [ ] Mobile responsive dashboard

---

## File Structure (Final)

```
src/
├── api/
│   ├── index.ts
│   ├── middleware/
│   │   └── auth.ts
│   └── routes/
│       ├── auth.ts
│       ├── devices.ts
│       └── user.ts
├── assets/
│   └── (existing)
├── components/
│   ├── auth/
│   │   ├── ClerkProvider.tsx
│   │   └── AuthGuard.tsx
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── DeviceList.tsx
│   │   ├── DeviceCard.tsx
│   │   └── Sidebar.tsx
│   ├── hero/
│   │   └── HeroSection.astro
│   ├── sections/
│   │   └── (existing)
│   └── ui/
│       └── (existing)
├── layouts/
│   ├── BaseLayout.astro
│   └── DashboardLayout.astro
├── lib/
│   ├── utils.ts
│   └── db.ts
├── pages/
│   ├── index.astro
│   ├── sign-in.astro
│   ├── sign-up.astro
│   ├── privacy.astro
│   ├── terms.astro
│   └── dashboard/
│       ├── index.astro
│       └── devices.astro
├── styles/
│   └── global.css
├── types/
│   └── index.ts
└── worker.ts
migrations/
└── 0001_initial.sql
```

---

## Questions to Resolve

1. **Clerk redirect URLs** - Need to configure in Clerk dashboard after domain setup
2. **Webhook endpoint** - Need public URL for Clerk webhooks (works after deploy)
3. **Device types** - Confirm the list: MacBook, iPad, iPhone, Monitor, Accessory
4. **Seed data** - Want demo devices for testing?

---

## Dependencies to Add

| Package | Version | Docs |
|---------|---------|------|
| [hono](https://www.npmjs.com/package/hono) | ^4.x | [hono.dev](https://hono.dev/) |
| [@clerk/clerk-react](https://www.npmjs.com/package/@clerk/clerk-react) | ^5.x | [clerk.com/docs](https://clerk.com/docs) |
| [motion](https://www.npmjs.com/package/motion) | ^11.x | [motion.dev](https://motion.dev/) (Framer Motion) |
| [@tanstack/react-table](https://www.npmjs.com/package/@tanstack/react-table) | ^8.x | [tanstack.com/table](https://tanstack.com/table/) |
| [@hono/clerk-auth](https://www.npmjs.com/package/@hono/clerk-auth) | ^2.x | [GitHub](https://github.com/honojs/middleware/tree/main/packages/clerk-auth) |
| [esbuild](https://www.npmjs.com/package/esbuild) | ^0.24.x | [esbuild.github.io](https://esbuild.github.io/) |

```bash
npm install hono @clerk/clerk-react motion @tanstack/react-table
npm install -D @hono/clerk-auth esbuild
```

---

## UI Components (21st.dev + shadcn)

Component source: [21st.dev](https://21st.dev) - shadcn-compatible component registry

### Installation Pattern
```bash
npx shadcn@latest add "https://21st.dev/r/{author}/{component}"
```

### Selected Components

#### Landing Page

| Component | Source | Install | Use For |
|-----------|--------|---------|---------|
| **Testimonials Columns** | [shabanhr/testimonials-columns-1](https://21st.dev/shabanhr/testimonials-columns-1/default) | `npx shadcn@latest add "https://21st.dev/r/shabanhr/testimonials-columns-1"` | Replace current testimonials section with animated columns |
| **Pricing Section** | [aymanch-03/pricing-section](https://21st.dev/aymanch-03/pricing-section/default) | `npx shadcn@latest add "https://21st.dev/r/aymanch-03/pricing-section"` | Add pricing page/section with monthly/yearly toggle |

#### Authentication

| Component | Source | Notes |
|-----------|--------|-------|
| **Sign-In Card 2** | [jatin-yadav05/sign-in-card-2](https://21st.dev/jatin-yadav05/sign-in-card-2/default) | Design inspiration for later customization |

**MVP Approach:** Use Clerk's default `<SignIn />` and `<SignUp />` components out of the box. Get auth working first, style later.

**Post-MVP Customization Options:**

1. **Clerk Theming API** (Recommended first step)
   - Use `appearance` prop on Clerk components
   - Customize colors, fonts, border radius via CSS variables
   - Docs: https://clerk.com/docs/customization/overview

2. **Clerk Elements** (More control)
   - Build custom UI with Clerk's unstyled primitives
   - Full control over markup while Clerk handles logic
   - Docs: https://clerk.com/docs/customization/elements

3. **Full Custom UI** (Maximum flexibility)
   - Use `useSignIn()` / `useSignUp()` hooks
   - Build completely custom forms
   - Wire to 21st.dev sign-in-card-2 component design

**Design Inspiration to Match Later:**
- Dark glassmorphic card with purple gradient accents
- 3D tilt effect on mouse movement
- Animated light beams on borders
- Backdrop blur + translucent borders
- Google SSO button styling

#### Dashboard

| Component | Source | Install | Use For |
|-----------|--------|---------|---------|
| **Aceternity Sidebar** | [aceternity/sidebar](https://21st.dev/aceternity/sidebar/default) | `npx shadcn@latest add "https://21st.dev/r/aceternity/sidebar"` | Main dashboard navigation - expands on hover, collapses to icons |
| **Empty State** | [serafimcloud/empty-state](https://21st.dev/serafimcloud/empty-state) | `npx shadcn@latest add "https://21st.dev/r/serafimcloud/empty-state"` | "No devices yet" screens with animated icons |
| **Data Table** | [shadcn/ui official](https://ui.shadcn.com/docs/components/data-table) | `npx shadcn@latest add table` | Device list with TanStack sorting/filtering |

#### Additional Resources

Browse for more options:
- [30 Table Components](https://21st.dev/s/table)
- [10 Sidebar Components](https://21st.dev/s/sidebar)
- [79 Card Components](https://21st.dev/s/card) - for device cards, stat cards
- [Dashboard Discovery](https://21st.dev/community/components/s/dashboard)

### Component Dependencies

These 21st.dev components require:
- `motion` (Framer Motion) - for animations
- `@tanstack/react-table` - for data tables
- `lucide-react` - for icons (already installed)

---

*Plan created by WALL-E - December 2024*
