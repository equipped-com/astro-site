# Equipped Platform Documentation

Complete flow architecture and user journey documentation for the Equipped IT asset management and device provisioning platform.

**Platform Tagline:** "All things tech, one monthly fee. It's that simple."

---

## Quick Start

**New to Equipped?** Start here:
1. Read [Platform Overview](#platform-overview) below
2. Jump to [Summary.md](./summary.md) for the big picture
3. Find your specific flow in the [Flow Index](#flow-index)
4. Explore integration points and user scenarios

**Implementing a feature?**
1. Check [Summary.md](./summary.md) for architecture context
2. Find your flow in the [Flow Index](#flow-index)
3. Review integration points section
4. Check related flows for dependencies

**Onboarding new team members?**
1. Have them read this README
2. Point them to [Summary.md](./summary.md) for architecture overview
3. Share the specific flow docs relevant to their role
4. Review integration points together

---

## Platform Overview

Equipped enables businesses and consultants to procure IT equipment and services with flexible payment options:

### Core Features
- **Product Browsing** - Search, filter, and compare equipment
- **Flexible Payments** - Buy upfront, 24-month lease, or 36-month lease
- **Leasing Integration** - Macquarie financing with pre-qualification
- **B2B Proposals** - Create and share proposals with approval workflows
- **Trade-In Program** - Exchange existing equipment for credit
- **Team Management** - Multi-org support with role-based access
- **Order Tracking** - Complete order history with status and returns
- **Account Control** - Billing, payment methods, notifications, security

### Key Statistics
- **14 interconnected flows** with cross-references
- **13 flow documentation files** covering user journeys
- **3 primary payment paths** (card, 24-month lease, 36-month lease)
- **4 user types** (individual, small team, enterprise, consultant)
- **1 central navigation hub** connecting all features

---

## Flow Index

### User Acquisition & Setup (3 flows)

| Flow | Purpose | Key Pages/Sections |
|------|---------|-------------------|
| [**Landing**](./platform-landing.md) | Public-facing conversion funnel | Hero, features, FAQ, sign-up/sign-in CTAs |
| [**Authentication**](./platform-authentication.md) | Account creation and sign-in | OAuth, email signup, verification, password recovery |
| [**Onboarding**](./platform-onboarding.md) | First-time user setup | Account setup, team creation, leasing pre-qual, first purchase |

### Navigation & Control (2 flows)

| Flow | Purpose | Key Pages/Sections |
|------|---------|-------------------|
| [**Navigation**](./platform-navigation.md) | Primary UI structure and hub | Nav bar, team switcher, account dropdown, mobile menu |
| [**Account/Settings**](./platform-account-settings.md) | User preferences and billing | Profile, security, notifications, payment methods, billing |

### Shopping & Discovery (2 flows)

| Flow | Purpose | Key Pages/Sections |
|------|---------|-------------------|
| [**Shopping**](./platform-shopping.md) | Product discovery and browsing | Shop list, product detail, filtering, search |
| [**Equipment/Services**](./platform-equipment-services.md) | IT equipment catalog | Store browsing, customization, specs, payment options |

### Purchase Flows (4 flows)

| Flow | Purpose | Key Pages/Sections |
|------|---------|-------------------|
| [**Cart**](./platform-cart.md) | Shopping cart management | Item management, payment selection, promotions |
| [**Checkout**](./platform-checkout.md) | Order finalization | Assignment, shipping, delivery, payment method selection |
| [**Leasing**](./platform-leasing.md) | Macquarie financing integration | Pre-qual, application, approval/decline, recurring payments |
| [**Proposals**](./platform-proposals.md) | B2B proposal workflows | Create, share, approve, convert to order |

### Post-Purchase (3 flows)

| Flow | Purpose | Key Pages/Sections |
|------|---------|-------------------|
| [**Orders**](./platform-orders.md) | Order history and tracking | Order list, detail, status tracking, returns, cancellations |
| [**Trade-In**](./platform-trade-in.md) | Equipment exchange program | Valuation, return shipping, credit application, status tracking |
| [**Team Management**](./platform-team-management.md) | Multi-org administration | Team creation, member roles, team-scoped resources |

---

## Architecture Overview

### User Journey Map

```
Landing
  ↓ (Sign up / Sign in)
Authentication
  ↓ (Account + Team setup)
Onboarding
  ↓ (Browse products)
Navigation (Central Hub)
  ├→ Shopping / Equipment → Cart → Checkout → Leasing (payment) → Orders
  ├→ Proposals (B2B) → Checkout → Orders
  ├→ Trade-In → Shopping → Cart → Checkout → Orders
  └→ Account/Settings → Team Management
```

### Integration Matrix

Each flow connects to other flows at specific points:

- **Landing** → Authentication
- **Authentication** → Onboarding
- **Onboarding** → Navigation
- **Navigation** → All subsequent flows (hub)
- **Shopping** → Cart → Checkout → Orders
- **Equipment/Services** → Shopping (same path)
- **Cart** → Checkout OR Proposals
- **Checkout** → Leasing (payment selection) → Orders
- **Leasing** → Orders (status tracking)
- **Proposals** → Checkout (convert to order) → Orders
- **Trade-In** → Shopping → Cart → Checkout → Orders
- **Orders** → Trade-In (reorder), Account/Settings (billing)
- **Account/Settings** → Team Management
- **Team Management** → All team-scoped resources (Orders, Proposals, Billing)

---

## How to Navigate This Documentation

### By Role

**Product Managers**
1. Start with [Summary.md](./summary.md) (architecture overview)
2. Read relevant flow docs for feature planning
3. Review "User Scenarios" and "Success Metrics" sections

**Engineers**
1. Read [Summary.md](./summary.md) (data flow and scoping)
2. Focus on your flow's "Integration Points" section
3. Check "Data Model" or API references in specific flows
4. Review error handling and edge cases

**Designers**
1. Skim [Summary.md](./summary.md) for big picture
2. Read flow docs with focus on "Design Patterns" and "UX Principles"
3. Review mobile/responsive sections
4. Check "Success Criteria" for validation states

**QA/Testing**
1. Read relevant flow documentation
2. Focus on "User Scenarios" and "User Workflows" sections
3. Review error states and edge cases
4. Check integration points with other flows

**New Team Members**
1. Read this README
2. Read [Summary.md](./summary.md)
3. Read flow docs for your area
4. Review "Integration Points" to understand dependencies

### By Task

**Implementing a new feature**
- Read flow doc covering your feature
- Check "Integration Points" section
- Review related flow docs
- Identify data flow and resource scoping

**Debugging an issue**
- Read relevant flow doc
- Check "Error States" and "Edge Cases"
- Review "Integration Points" (might be a cross-flow issue)
- Look at data model and validation rules

**Planning API endpoints**
- Read [Summary.md](./summary.md) "Data Flow Architecture"
- Check relevant flow's "Data Model" section
- Review resource scoping and team context
- Identify CRUD operations needed

**Writing test cases**
- Read flow doc's "User Scenarios" section
- Review "Success Criteria" and validation rules
- Check error handling sections
- Review edge cases and state transitions

---

## Key Concepts

### Resource Scoping
All resources are scoped by **active team**, except:
- User account (personal, across all teams)
- Authentication and session (personal)
- Navigation state (personal)

| Resource | Scoped By | Accessible To |
|----------|-----------|----------------|
| Orders | Team | Team members |
| Proposals | Team | Team + external recipients |
| Cart | User + Team | User's active team |
| Billing | Team | Team admins |
| Leasing agreement | Team | Used by all team members |
| Delivery addresses | Team | All team members |
| Payment methods | Team | All team members |

### Payment Methods
Users can pay via:
1. **Card** (upfront, immediate processing)
2. **24-month lease** (Macquarie, ~$X/month)
3. **36-month lease** (Macquarie, ~$X/month)

Decision happens at **Checkout Stage 4: Payment Selection**

### Order Status Lifecycle

**Card purchase:**
```
Pending payment → Preparing to ship → Shipped → Delivered
```

**Leasing purchase:**
```
Pending leasing approval → Pending payment → Preparing to ship → Shipped → Delivered
```

**Both can transition to:**
```
Cancelled (if eligible) or Returned (if eligible)
```

### Leasing Pre-Qualification
- Triggered during **Onboarding** (optional)
- Triggered at **Checkout** (if no lease agreement exists)
- Required for team to use leasing payment option
- Includes company info, bank statement verification
- Can be declined → falls back to card/ACH/PO

---

## Success Metrics by Flow

### User Acquisition (Landing → Authentication → Onboarding)
- Landing → Signup conversion rate
- OAuth vs. email signup ratio
- Verification email completion rate
- Onboarding completion rate (Day 1)
- Time to first purchase

### Core Purchase (Shopping → Cart → Checkout → Orders)
- Cart creation frequency
- Cart-to-checkout conversion rate
- Checkout abandonment rate
- Average order value
- Payment method distribution (card vs. lease)

### B2B (Proposals)
- Proposal creation rate
- Proposal sharing rate
- Proposal approval rate
- Proposal → order conversion rate
- Average proposal value

### Leasing (Leasing)
- Pre-qualification completion rate
- Pre-qualification approval rate
- Leasing vs. card payment ratio
- Lease agreement success rate
- Repeat leasing rate

### Operations (Orders, Trade-In, Team Management)
- Order tracking page views
- Return/cancellation rate
- Trade-in adoption rate
- Team member addition rate
- Team growth rate

### Retention
- Day 3, 7, 30, 90 retention
- Repeat purchase frequency
- Monthly recurring revenue (leasing)
- Churn rate (team inactivity)

---

## Common Questions

**How do teams work?**
See [Team Management](./platform-team-management.md). Users can create multiple teams and switch between them. All resources (orders, billing, payment methods) are team-scoped.

**What happens if leasing is declined?**
See [Leasing](./platform-leasing.md) "Decline Handling" section. User can fall back to card, ACH, PO, or bill-me-later options.

**How do proposals work?**
See [Proposals](./platform-proposals.md). Create from cart, share via email link, recipient approves, converts to order, goes through normal checkout.

**Can users trade in equipment?**
Yes. See [Trade-In](./platform-trade-in.md). Device valuation, return shipping, and credit applied to new purchase.

**What payment options are available?**
See [Cart](./platform-cart.md) and [Checkout](./platform-checkout.md). Card (upfront), 24-month lease, or 36-month lease. Leasing requires pre-qualification.

**How is billing handled for teams?**
See [Account/Settings](./platform-account-settings.md) "Billing & Subscription Management" and [Team Management](./platform-team-management.md). Billing is per-team with team admin access.

---

## Documentation Stats

| Metric | Count |
|--------|-------|
| Total flows | 14 |
| Documentation files | 15 (14 flows + 1 summary) |
| User journey steps | 45+ |
| Integration points | 35+ |
| User scenarios | 30+ |
| Error states | 50+ |
| Design patterns | 25+ |

---

## File Structure

```
documentation/
├── README.md (this file - START HERE)
├── summary.md (architecture overview - READ SECOND)
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

## Feedback & Updates

This documentation is a living resource. As features change:
1. Update the relevant flow document
2. Update integration points in related flows
3. Update Summary.md if architecture changes
4. Update this README if new flows are added

**Last Updated:** December 8, 2025
**Status:** Complete - All 14 flows documented
**Next Review:** When major features ship or architecture changes

---

**Ready to dive in?** Start with [Summary.md](./summary.md) → [Platform Overview](#platform-overview) → Find your flow in the [Flow Index](#flow-index)
