# Equipped Platform - Complete Flow Architecture

## Overview

Equipped is an IT asset management and device provisioning platform for businesses and consultants. The platform enables procurement of equipment and services through flexible payment options (upfront purchase, 24-month lease, 36-month lease), team-based management, and comprehensive order tracking.

**Core Value Prop:** "All things tech, one monthly fee. It's that simple."

---

## Platform Flows at a Glance

The platform consists of 13 interconnected flows:

1. **Landing** - Public-facing conversion funnel
2. **Authentication** - Account creation and sign-in
3. **Onboarding** - First-time user setup and guided experience
4. **Navigation** - Primary navigation and UI structure
5. **Shopping** - Product discovery and browsing
6. **Equipment/Services** - Specialized catalog for IT equipment
7. **Cart** - Shopping cart management
8. **Checkout** - Order finalization with payment selection
9. **Leasing** - Financing through Macquarie integration
10. **Proposals** - B2B proposal generation and approval
11. **Trade-in** - Equipment exchange with credit
12. **Orders** - Order history and tracking
13. **Account/Settings** - User preferences and billing
14. **Team Management** - Multi-org organization structure

---

## Flow Interaction Map

### User Acquisition → Conversion → Operations

```
Landing
  ↓
Authentication (Sign Up / Sign In)
  ↓
Onboarding (Account + Team Setup)
  ↓
Navigation (Hub for all subsequent flows)
  ├→ Shopping/Equipment/Services (Browse)
  │   ├→ Cart (Accumulate items)
  │   │   └→ Checkout (Finalize order)
  │   │       ├→ Leasing (Payment selection)
  │   │       └→ Orders (History tracking)
  │   │
  │   └→ Trade-In (Equipment exchange)
  │
  ├→ Proposals (B2B approval workflows)
  │   ├→ Cart (Convert proposal to order)
  │   └→ Checkout (Finalize from proposal)
  │
  ├→ Orders (Existing orders)
  │   ├→ Returns / Cancellations
  │   └→ Reorder flows
  │
  └→ Account/Settings (User control)
      └→ Team Management (Multi-org control)
```

---

## Detailed Flow Relationships

### 1. Landing → Authentication → Onboarding (User Acquisition)

**Landing** (`platform-landing.md`)
- Public funnel with hero, features, testimonials, FAQ
- Dual entry points: Google OAuth or email signup
- Targets self-serve and enterprise routes
- CTA: "Sign up" or "Sign in"

↓ Conversion

**Authentication** (`platform-authentication.md`)
- OAuth integration (Google/Microsoft)
- Email/password registration
- Email verification with magic links or codes
- Password recovery
- Multi-device session management

↓ First-time setup

**Onboarding** (`platform-onboarding.md`)
- Account setup and profile completion
- Team/company creation with legal info
- Leasing pre-qualification (optional)
- First purchase guidance (buy vs. lease decision)
- Progressive feature disclosure over time
- Completion milestones and badges

---

### 2. Navigation (Central Hub)

**Navigation** (`platform-navigation.md`)
- Primary navigation bar (Store, Trade In, Equipment, People, Support)
- Team switcher and account dropdown
- Cart access (persistent across flows)
- Responsive mobile menu with drawer
- Contextual breadcrumbs and active states
- **Connects to:** All other flows via central hub

---

### 3. Shopping → Cart → Checkout (Core Purchase Flow)

**Shopping** (`platform-shopping.md`)
- Shop list with filtering and search
- Product detail pages with specs
- Add to cart, compare products, save for later
- Category organization (computers, peripherals, etc.)

↓

**Cart** (`platform-cart.md`)
- Item management (quantity, removal)
- Payment method selection (buy/24-month/36-month)
- Real-time pricing calculation
- Promotion/discount application
- Share cart, share as proposal (B2B)

↓

**Checkout** (`platform-checkout.md`)
- Assignment (user or unassigned equipment)
- Shipping address capture
- Delivery speed selection (standard/express/custom date)
- **Leasing decision point:** Finance through Macquarie or pay upfront

↓

**Orders** (`platform-orders.md`)
- Order confirmation page
- Order history and filtering
- Status tracking (pending → shipped → delivered)
- Return/cancellation initiation
- Order details with line items and timeline

---

### 4. Equipment/Services Catalog

**Equipment/Services** (`platform-equipment-services.md`)
- Separate browsing for IT equipment vs. services
- Device customization (color, specs, AppleCare+)
- All three payment options visible simultaneously
- Apple Business Manager integration
- Service add-ons and protection plans
- **Integration:** Leads to Shopping → Cart → Checkout

---

### 5. Leasing Integration (Payment Method Branch)

**Leasing** (`platform-leasing.md`)
- Pre-qualification before first purchase
- Macquarie financing application
- Company info collection (legal name, EIN, bank statement)
- Approval/decline handling with fallback payments
- Recurring payment management
- Lease agreement e-signature
- Monthly payment tracking
- **Integration points:**
  - Triggered during Checkout (Stage 4)
  - May decline → fallback to card/ACH/PO
  - Success → Order status tracks "Pending leasing approval"
  - Repeat purchases use saved lease agreement

---

### 6. B2B Proposal Workflow

**Proposals** (`platform-proposals.md`)
- Create proposals from cart or templates
- Share with external stakeholders via email link
- Shared proposal: read-only access with approval buttons
- "Who is this proposal for?" decision (individual vs. team)
- Convert approved proposals to orders
- Proposal expiration and status tracking
- **Integration flow:**
  - Browse → Add to cart → "Share as proposal"
  - Recipient reviews (read-only)
  - Approver converts to order → Checkout
  - Results in same Orders as direct purchase

---

### 7. Trade-In Program

**Trade-In** (`platform-trade-in.md`)
- Standalone trade-in initiation or during product browsing
- Equipment valuation (condition-based)
- Return label generation and tracking
- Trade-in credit applied to new purchase
- Status tracking for both new equipment and return
- Credit processing after return receipt and inspection
- **Integration points:**
  - Browsing: Product detail → "Trade in existing device"
  - Standalone: Navigation → Trade In
  - In checkout: Trade-in value reduces final price
  - In orders: Dual tracking (new + return)

---

### 8. Account Management (User Control)

**Account/Settings** (`platform-account-settings.md`)
- User profile (name, email, avatar)
- Account preferences and notification settings
- Payment method management
- Billing and subscription overview
- Security settings (password, 2FA)
- Data export and privacy controls
- **Integration:**
  - Accessible from account dropdown
  - Team-scoped for billing and delivery addresses
  - Connected to Team Management

**Team Management** (`platform-team-management.md`)
- Create and switch between teams
- Team member management with roles (Admin, Member, View-Only)
- Team-scoped resources (orders, proposals, delivery addresses, payment methods, billing)
- Leasing agreement per team
- **Integration:**
  - Team switcher in main navigation
  - All resources filtered by active team
  - Orders, proposals, settings all team-scoped
  - Billing is per-team

---

## Data Flow Architecture

### User Context

Each user has:
- Personal account (email, profile, security settings)
- Multiple teams (multi-org support)
- Active team (current context for browsing/purchasing)
- Session and authentication state

### Team Context

Each team has:
- Team members with roles
- Delivery addresses
- Payment methods
- Leasing agreement (Macquarie)
- Orders and proposals (team-scoped)
- Billing and subscription
- API keys and integrations

### Resource Scoping

| Resource | Scoped By | Visibility |
|----------|-----------|-----------|
| Orders | Team | Team members only |
| Proposals | Team | Team members + external recipients |
| Cart | User + Team | User's active team session |
| Billing | Team | Team admins |
| Leasing agreement | Team | Used for all team member purchases |
| Delivery addresses | Team | Available to all team members |
| Payment methods | Team | Available to all team members |

---

## Critical Integration Points

### 1. Payment Method Selection (Cart → Checkout)
Users choose between:
- **Buy upfront** (card payment)
- **24-month lease** (via Macquarie, if pre-qualified)
- **36-month lease** (via Macquarie, if pre-qualified)

If leasing is selected and team has active lease agreement, proceed to leasing verification.
If no lease agreement, show pre-qualification form.
If declined, fall back to card/ACH/PO.

### 2. Order Status Lifecycle
```
Purchase (Card):
  Pending payment → Preparing to ship → Shipped → Delivered

Leasing:
  Pending leasing approval → Pending payment → Preparing to ship → Shipped → Delivered

Both flows:
  Can transition to → Cancelled (if eligible)
  Can transition to → Returned (if eligible)
```

### 3. Proposal Conversion Path
```
Shopping → Add to cart → "Share as proposal"
  ↓
Cart modified → "Share as proposal"
  ↓
Recipient receives email → Opens proposal link
  ↓
"Approve" button → Converted to order
  ↓
Checkout (same as direct purchase)
```

### 4. Trade-In Credit Application
```
Product detail → "Trade in existing device"
  ↓
Valuation form (device model, condition)
  ↓
Estimated credit shown
  ↓
Added to cart → Cart shows credit as discount
  ↓
Checkout → Final price reflects trade-in credit
  ↓
Orders → Dual tracking (new equipment + return item)
```

### 5. Leasing Pre-Qualification Timing
- **Onboarding:** Optional pre-qual during account setup
- **First checkout:** If no lease agreement, show form
- **Subsequent checkouts:** Use existing agreement
- **If declined:** Show alternatives (card, ACH, PO, Bill-me-later)

---

## Mobile and Responsive Considerations

All flows support:
- **Mobile-first responsive design**
- **Touch-optimized navigation** (larger tap targets)
- **Simplified cart on mobile** (swipe to manage items)
- **Full-screen mobile navigation** (drawer menu)
- **Responsive product cards** (grid changes per breakpoint)
- **Progressive form loading** (mobile doesn't show all fields at once)

---

## Performance and Security

### Performance
- Image optimization (Sharp, next-gen formats)
- Lazy loading for product images and proposals
- Cached product catalogs
- Streamed order history
- Deferred tax/shipping calculations until checkout

### Security
- OAuth for authentication (no password storage)
- PCI-DSS for payment methods
- TILA/ECOA compliance for leasing
- GDPR for data export/deletion
- Rate limiting on signup/verification
- Email verification for account security

---

## Success Metrics

### User Acquisition
- Landing → Sign-up conversion rate
- OAuth vs. email signup ratio
- Time to first sign-in after signup

### Onboarding
- Account setup completion rate (Day 1)
- Leasing pre-qualification rate
- Time to first purchase

### Engagement
- Cart creation frequency
- Cart-to-checkout conversion
- Proposal creation and approval rate
- Team member addition rate

### Retention
- Day 3, 7, 30, 90 retention
- Repeat purchase frequency
- Team growth (new members)
- Leasing success rate (approval rate, repeat leasing)

### Revenue
- Average order value
- Monthly recurring revenue (leasing)
- Cart abandonment rate
- Proposal conversion rate

---

## Future Enhancements

### Phase 2
- Multi-provider leasing (Dell Financial, HP Finance, etc.)
- Bulk leasing and team procurement workflows
- Equipment lifecycle management
- Asset tagging and tracking
- Integration marketplace (Okta, Azure, Slack)

### Phase 3
- Early lease buyout and upgrade paths
- Device trade-in marketplace (peer-to-peer)
- Automated asset refresh programs
- White-label portal for consultants
- Advanced analytics and cost reporting

---

## File Directory

All flow documentation is located in `/Users/jonas/projects/ziad/tryequipped/documentation/`:

```
documentation/
├── summary.md (this file)
├── platform-landing.md
├── platform-authentication.md
├── platform-onboarding.md
├── platform-navigation.md
├── platform-shopping.md
├── platform-equipment-services.md
├── platform-cart.md
├── platform-checkout.md
├── platform-leasing.md
├── platform-proposals.md
├── platform-trade-in.md
├── platform-orders.md
├── platform-account-settings.md
└── platform-team-management.md
```

---

## How to Use This Documentation

1. **For new team members:** Start with this `summary.md` for high-level architecture, then dive into specific flows
2. **For feature development:** Reference the relevant flow document(s) and integration points
3. **For design reviews:** Check flow diagrams and design patterns in each document
4. **For API/backend work:** Review data flow architecture and resource scoping
5. **For QA/testing:** Use user scenarios and success criteria in each flow

---

**Generated:** December 8, 2025
**Model:** Haiku 4.5
**Status:** Complete - All 14 flows documented with integration points and success metrics
