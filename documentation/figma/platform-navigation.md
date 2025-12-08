# Platform Navigation & Layout System

## Flow Overview

The Equipped platform navigation system provides unified access to core features and team management across desktop and mobile experiences. The navigation serves as the primary entry point for users to switch between major platform sections, manage their account and team, access orders/proposals, and configure team settings.

**Primary purpose:** Enable users to navigate between feature areas while maintaining awareness of their current team context and accessing critical user/team management functions.

---

## Main Navigation Structure

### Primary Navigation Bar (Desktop)

The top navigation bar contains three distinct zones:

#### Left Zone: Brand & Core Navigation
- **Equipped Logo** - Returns to dashboard/home when clicked
- **Primary navigation items** (in order):
  - Store
  - Trade In
  - Equipment
  - People
  - Support

These six items represent the core feature areas accessible to the logged-in user. All items use standard text styling in the navigation bar, with active indicators showing current page context.

#### Right Zone: Quick Actions & User Controls
Located in the top-right corner, presented left to right:
- **Team Switcher** - Shows current team with dropdown toggle (e.g., "A Acme")
- **Account Menu** - Shows user icon with dropdown toggle
- **Cart Icon** - Quick access to shopping cart

### Navigation Consistency

All navigation items are presented in a clean, minimal style:
- No icons in the primary navigation (text-only)
- Standard typeface and sizing across all items
- Subtle hover and active states for clarity
- Consistent spacing and alignment

---

## Responsive Navigation (Mobile & Tablet)

### Mobile Collapsed State (Mobile First)

When the viewport is narrow (mobile devices), the navigation transforms into a hamburger menu:

#### Visible Header
- **Equipped Logo** (left) - Brand identifier
- **Menu Toggle** (right) - Three-line hamburger icon to reveal full navigation
- **Cart Icon** (right, before hamburger) - Always visible for quick access
- Minimal visual footprint to preserve screen space

#### Closed Navigation Behavior
- Takes up minimal space (single-line header)
- Clear visual indication of menu availability
- Cart remains accessible without opening menu

### Mobile Open State (Full Menu)

When the hamburger menu is activated:

#### Full-Screen Menu Drawer
The navigation expands to a side drawer that covers most of the viewport:

**Menu Content Structure:**
1. **Close Button** (top-right) - X icon to dismiss the menu
2. **Logo/Brand Text** (top-left) - "Equippe" (truncated due to space)
3. **Primary Navigation Items** (in vertical stack):
   - Equipment
   - Store
   - Trade In
   - Services
   (Presented as simple text items, full height clickable targets)

4. **Team & Account Section** (below navigation items):
   - **Current Team Switcher**: Shows team with avatar and dropdown
     - Example: "A Acme"
     - Expandable to show other teams
   - **Current User**: Shows user icon and name with dropdown
     - Example: "Leon Quigley"
     - Expandable to access account menu

**Visual Design:**
- Light background (white/off-white) to distinguish from page content
- Simple, readable typography
- Adequate spacing between menu items for touch targets
- Clear hierarchy between navigation and account/team options

### Tablet Responsive Behavior

Tablets typically show variations of the desktop layout with adjusted spacing:
- May use abbreviated text labels
- Increased touch target sizing
- Similar navigation structure to desktop but with responsive padding
- Hamburger menu behavior may trigger at mid-range breakpoints depending on device orientation

---

## Navigation States & Active Indicators

### Active Page Indicator

Current page navigation items display a visual active state:
- Typically implemented via underline, background highlight, or text weight change
- Consistent with the design system's active state patterns
- Indicates user's current location within the platform

### Hover States

Desktop navigation items respond to mouse interaction:
- Subtle color shift or background change on hover
- Clear indication that item is interactive
- Maintains clean aesthetic without over-emphasizing

### State Consistency

The active state persists across:
- Navigation menu expansion/collapse
- Page refreshes
- Navigation between sections
- Responsive breakpoint changes

---

## User Account Dropdown Menu

### Trigger & Display

**Trigger:** Click or tap the user icon in the top-right navigation (right side)

**Trigger Label:** Shows current user context with dropdown indicator

### Account Menu Contents

When opened, the dropdown reveals:

#### User Information Section
- **User Name** (e.g., "Leon Quigley")
- **Email Address** (e.g., "leon@acme.corp")
- Simple text display with avatar/icon

#### Quick Actions
- **My Settings** - Link to personal user settings (profile, preferences, security)
- **Log out** - Secure logout action

### Dropdown Behavior

- Positioned below the user icon trigger
- Right-aligned to stay within viewport
- Closes when:
  - User clicks menu item
  - User clicks elsewhere on page
  - User presses Escape key
- Shows subtle shadow/border for depth

### Integration with Team Context

The account menu is separate from team management. While the account dropdown shows personal settings and logout, team-specific settings are accessed via the team switcher dropdown.

---

## Team Switcher in Navigation

### Primary Position

**Location:** Top-right navigation bar, left of account menu
**Trigger:** Team name button with dropdown indicator (e.g., "A Acme")

### Team Switcher - Single Team Context

When a user belongs to only one team:

#### Menu Contents
- **Team Settings** - Configure team-level options
- **People** - Manage team members and roles
- **Orders** - View and manage team orders
- **Proposals** - View and manage proposals
- **Delivery addresses** - Configure shipping addresses for team
- **Payment methods** - Team payment options
- **Billing** - Billing history and invoicing

**Create Team Option:**
- **+ Create a new team** - Button at bottom to create additional teams

**No "My Other Teams" Section** - When user has only one team, the switcher doesn't show other team options.

### Team Switcher - Multiple Teams Context

When a user belongs to multiple teams:

#### Menu Contents (Same as above)
1. Team Settings
2. People
3. Orders
4. Proposals
5. Delivery addresses
6. Payment methods
7. Billing

#### Multiple Team Selection
After team management options, a divider line separates team-specific content from team switching options:

**MY OTHER TEAMS Section:**
- Lists additional teams user has access to
- Example items:
  - "Dunder Mifflin" (with arrow indicator)
  - "Stark Industries" (with arrow indicator)
- Each team shown with right arrow indicating it's clickable

**Create Team Option:**
- **+ Create a new team** - Button to create and manage new teams

### Team Switcher Behavior

- Clicking team name in "MY OTHER TEAMS" switches active team context
- All subsequent navigation and data operates under new team
- User icon in navigation updates to reflect new team context
- Page content refreshes to show new team's data
- Dropdown closes after selection

### Team Avatar & Label

- **Avatar Letter:** First letter of team name in colored circle (e.g., "A" for Acme)
- **Team Name:** Full team name displayed next to avatar
- **Dropdown Indicator:** Chevron down icon shows menu is expandable

---

## Quick Actions & Shortcuts

### Cart Icon

**Location:** Top-right navigation, far right of user controls
**Purpose:** Quick access to shopping cart
**Behavior:**
- Single click navigates to cart page
- Typically shows item count badge when items present
- Always visible, even in mobile navigation header
- Consistent across all screen sizes

### Team Settings Navigation

**Quick Access Path:**
Team Switcher → Team Settings

Provides rapid access to team configuration without navigating through main content areas.

### Orders & Proposals Quick Access

**Location:** Team Switcher Dropdown
- Orders - View active and historical team orders
- Proposals - Access team proposals and quotations

These critical team features live in the team menu rather than main navigation, keeping primary nav clean while prioritizing team operations.

---

## Breadcrumb Navigation

While the primary screenshots don't show explicit breadcrumb trails in the navigation header, the platform should support:

### Implied Breadcrumb Context

- **Current Team:** Always visible in team switcher (shows active team)
- **Current User:** Always visible in account menu
- **Current Section:** Shown via active state in primary navigation

### Expected Breadcrumb Implementation

For deeper page hierarchies (e.g., within Team Settings or Orders detail views):
- Show hierarchical path at top of main content area
- Example: "Team Settings > Payment Methods > Edit Card"
- Allow clickback through hierarchy
- Maintain consistency with navigation design language

---

## Mobile & Collapsed State Behaviors

### Hamburger Menu Lifecycle

#### Closed State
- Navigation hidden, only header visible
- Header shows: Logo, Cart icon, Menu toggle
- Minimal vertical footprint

#### Opening Animation
- Drawer slides in from left or expands from hamburger icon
- Semi-transparent overlay on page content (optional)
- Close button appears in menu header
- Smooth animation for natural feel

#### Open State
- Full-screen or full-height sidebar navigation
- All primary nav items visible and tappable
- Team and user controls at bottom of menu
- Page content behind overlay or partially visible

#### Closing
- Menu collapses back to hamburger
- Animation reverses smoothly
- Overlay (if present) fades out
- Closes on:
  - User taps close button (X)
  - User selects navigation item
  - User taps outside menu (on overlay)
  - User presses Escape key

### Touch Target Sizing

Mobile navigation optimizes for touch:
- Navigation items have sufficient vertical spacing (min 44px touch target)
- Team switcher and user menu items are large enough for comfortable tapping
- Hover states replaced with active/pressed states
- No hover-dependent functionality on mobile

### Mobile Menu Scrolling

If menu content exceeds viewport height:
- Menu content becomes scrollable
- Header (logo, close button) remains sticky
- Team switcher section remains accessible at bottom
- Smooth scrolling behavior

---

## Integration Points with Other Flows

### Store Integration
- **Entry:** Click "Store" in primary navigation
- **Return:** Store pages show active "Store" in navigation
- **Team Context:** Store operations operate under current team

### Equipment Management
- **Entry:** Click "Equipment" in primary navigation
- **Context:** Equipment inventory scoped to current team
- **Navigation:** Equipment detail pages may show breadcrumbs or section context

### People Management
- **Entry:** Click "People" in primary navigation OR Team Switcher > People
- **Two Paths:** Users can access people management from main nav or team settings
- **Indication:** Active state in nav and team switcher indicates current view

### Trade In Program
- **Entry:** Click "Trade In" in primary navigation
- **Features:** Access trade-in programs and evaluations
- **Team Scope:** Trade-in programs scoped to current team

### Orders & Proposals
- **Primary Entry:** Team Switcher > Orders or Team Switcher > Proposals
- **Secondary Entry:** May be linked from Store checkout flow
- **Navigation Context:** Clear indication of current team context

### Payment & Billing
- **Entry:** Team Switcher > Payment methods or Team Switcher > Billing
- **Form Integration:** Payment method selection may appear inline in checkout
- **Settings Access:** Team Switcher provides centralized billing access

### Support
- **Entry:** Click "Support" in primary navigation
- **Modal/Overlay:** May open help chat, knowledge base, or contact form
- **Context:** Can access support from any page without losing navigation state

### Team Settings
- **Entry:** Team Switcher > Team Settings
- **Sub-pages:** May include tabs or sub-navigation for:
  - General team info
  - Member management
  - Integrations
  - Notification settings

### Admin/Settings Dashboard (if applicable)
- **Entry:** Account Menu > My Settings
- **Scope:** User-level settings (profile, security, preferences)
- **Distinction:** Separate from Team Settings (which manages team-level config)

---

## Search Accessibility

### Search Feature Location

While not visible in primary navigation screenshots, a robust platform should include search:

#### Possible Implementation Areas
1. **Navigation Bar Search:** Text input in header for quick search
   - Scoped to current team data
   - Search across products, orders, equipment, people
   - Real-time suggestions/autocomplete

2. **Keyboard Shortcut:**
   - Command/Ctrl + K opens search modal
   - Works from any page
   - Search maintains team context

3. **Search Icon in Navigation:**
   - Icon in top navigation (near cart)
   - Opens search interface
   - Maintains consistency with quick actions

### Search Scope & Context

- **Team-scoped by default:** Search operates within current team's data
- **Switch team, reset search:** New team context clears previous search results
- **Cross-section search:** Searches equipment, orders, proposals, people across team
- **Result filtering:** Users can filter results by type (Equipment, Orders, People, etc.)

### Search Results Display

- Modal or sidebar presentation
- Grouped by result type
- Quick navigation to results (click to navigate)
- Maintain search state on navigation (optional)

---

## Navigation Design Principles

### Simplicity & Clarity
- Six primary navigation items keep options manageable
- Clear labels without jargon
- Consistent placement across all pages

### Context Awareness
- Current team always visible in navigation
- Current user always accessible
- Active page indicated in navigation state

### Accessibility
- Proper semantic HTML (nav, button, link elements)
- Keyboard navigation support (Tab, Enter, Escape)
- Screen reader friendly labels and landmarks
- Color contrast compliant with WCAG standards
- Touch target sizing for mobile (min 44x44px)

### Efficiency
- Quick access to cart from anywhere
- One-click access to team settings
- Account menu for rapid logout/settings
- No deep drilling required for common tasks

### Visual Consistency
- Unified design language across breakpoints
- Consistent animation timing and easing
- Matching typography and spacing
- Brand-aligned color usage

### Mobile-First Approach
- Responsive breakpoints prioritize mobile experience
- Hamburger menu for space efficiency
- Touch-optimized interactions
- Readable text at all sizes

---

## Summary

The Equipped platform navigation system provides intuitive, context-aware access to core features with special emphasis on team management. By combining a clean primary navigation bar with intelligent dropdowns for team and user controls, the system balances feature discoverability with visual simplicity.

The responsive design elegantly transitions from desktop's horizontal navigation to mobile's hamburger menu, maintaining all functionality across screen sizes. Integration points with other platform flows are thoughtfully structured, with team-scoped operations consistently accessible through the team switcher, enabling users to switch teams and contexts without friction.

This navigation foundation supports the platform's core value proposition of simplifying IT asset management for teams of any size.
