# Platform Cart Flow

## Overview

The Cart is a transactional hub where users review their selected equipment, configure payment options, and transition to checkout. It manages both upfront purchases and flexible leasing arrangements, displaying real-time price calculations and optional add-ons (like extended protection plans).

**Flow Name:** Shopping Cart Management
**Purpose:** Present selected equipment with flexible payment options, manage quantities, add optional services, and facilitate seamless checkout

---

## Cart Display and Management

### Cart Header
- **Title:** "Here's your cart"
- **Visual Indicator:** Badge on cart icon in top navigation shows item count
- **Access Point:** Cart icon in header navigation bar

### Item Display

#### Product Card Structure
Each item displays:
- **Product Image** - Left side thumbnail placeholder (equipment visual)
- **Product Name** - Primary heading (e.g., "MacBook Air M2")
- **Specifications** - Secondary text with key specs (e.g., "Midnight, 8-Core CPU, 8-Core GPU, 8GB Unified Memory, 256GB SSD Storage")
- **Value Information** - Original value and residual value for leased items
  - Example: "Value: $5,995.00 | Residual value: $2095.00"
- **Price Display** - Prominent price on right aligned to payment method
  - Buy option: Single upfront price
  - Leasing options: Monthly payment (e.g., "$162.35/mo.")
- **Quantity Control** - Dropdown selector (e.g., "5 ▼") allowing quantity adjustment
- **Remove Action** - Hyperlink "Remove" to delete item from cart

### Optional Add-ons

Each product can have bundled services:
- **Service Description** - Text describing the add-on (e.g., "Protect your Mac with AppleCare+ for $6.36/mo.")
- **Details** - Supporting text explaining benefits
- **Action Link** - "Add" hyperlink to include optional service in cart

### Cart Variants

**Single Item Cart (Cart.png):**
- One product displayed
- Clean, minimal layout
- Emphasizes payment method selection

**Multiple Item Cart (Cart-2.png, Cart-3.png):**
- Multiple products stacked vertically
- Each item fully independent with own quantity and remove controls
- Consistent spacing and layout across items

**Proposal Context (Cart-3.png):**
- "Share as proposal" button in top right
- Alternative to direct checkout
- Allows cart to be converted into a proposal document

---

## Payment Method Selection

### "How would you like to pay?" Section

Users choose between three payment options, each displayed as a card:

#### 1. Buy (Upfront Purchase)
- **Label:** "Buy"
- **Description:** "Pay in full today."
- **Price Display:** Total upfront cost (e.g., "$1,199.00")
- **State:** Default or selected with border emphasis
- **Best for:** Immediate ownership, budget-conscious purchases

#### 2. 24-Month Leasing
- **Label:** "24-Month Leasing"
- **Description:** "Pay monthly for your equipment."
- **Price Display:** Monthly payment amount (e.g., "$32.47/mo.")
- **Financing Terms:** 24-month lease period with residual buyout option
- **Calculations:** System spreads total cost across payments; customer can return equipment or pay residual value at end

#### 3. 36-Month Leasing
- **Label:** "36-Month Leasing"
- **Description:** "Pay monthly for your equipment."
- **Price Display:** Monthly payment amount (e.g., "$21.64/mo.")
- **Financing Terms:** 36-month lease period with residual buyout option
- **Advantage:** Lower monthly payments compared to 24-month option
- **Trade-off:** Longer commitment period

### Payment Selection States
- **Selected:** Bold border around chosen option, darker text emphasis
- **Unselected:** Light border, muted appearance
- **Hover/Interactive:** Subtle visual feedback (selection cursor visible)

### Additional Resource
- **"How leasing works"** - Hyperlink providing detailed information about lease terms, residual values, and buyout options

---

## Price Calculation and Totals

### Pricing Display Structure

The cart footer contains a summary section with tiered price information:

#### Line Items (in order)
1. **Subtotal** - Sum of all product prices at base quantity
   - Excludes optional add-ons initially shown
   - Example: "$1,999.00"

2. **Shipping** - Delivery costs
   - **Default State:** "Calculated at checkout"
   - Not visible until checkout stage (deferred calculation)
   - Dependent on delivery address and shipment method

3. **Taxes** - Sales tax calculation
   - **Default State:** "Calculated at checkout"
   - Deferred based on customer location (determined at checkout)
   - Location-based tax rules applied during payment processing

4. **Total Amount** (Buy option)
   - Final upfront purchase price
   - Includes subtotal; shipping and taxes added at checkout
   - Example: "$1,999.00"

5. **Monthly Total** (Leasing options)
   - Monthly payment amount for selected lease term
   - Displayed after payment method selection
   - Includes principal and financing costs
   - Example: "$32.47/mo." or "$21.64/mo."

### Dynamic Recalculation
- Pricing updates when:
  - Payment method changes (Buy vs. 24-month vs. 36-month)
  - Item quantity changes
  - Optional add-ons are added/removed
  - Additional products are added to cart

### Lease-Specific Information
When leasing is selected, additional context appears:

**Lease Details Text:**
- Explains payment spread and term length
- Example: "$9,094 will be spread over 24 payments. At the end of the lease, you can return the equipment or pay the $4,893 residual value to keep it."
- Educates users about true cost structure and end-of-lease options

---

## Promotion and Discount Application

**Current Design Status:** Not visible in Cart screenshots

**Implied Functionality:** Based on cart structure, promotions/discounts would likely:
- Appear as a separate line item between Subtotal and Shipping
- Include discount code input field (inferred but not shown)
- Display applied savings with discount name or code
- Recalculate totals automatically when codes applied/removed
- Show promotional messaging when discounts are available

**Recommendation:** Discount section would appear after Subtotal and before Shipping, maintaining clean financial hierarchy.

---

## Proceed to Checkout Actions

### Primary Action Button
- **Label:** "Check out"
- **Style:** Prominent blue button, full width or right-aligned
- **Location:** Bottom right of cart summary
- **Behavior:** Navigates to checkout flow to enter shipping/billing information and complete payment
- **State:** Always enabled if cart contains items

### Secondary Actions

#### Share Cart
- **Label:** "Share this cart"
- **Style:** Hyperlink in muted blue
- **Location:** Bottom left of cart summary
- **Function:** Generate shareable link or email option for cart contents
- **Use Case:** Team procurement, cost review, manager approval workflows

#### Share as Proposal
- **Label:** "Share as proposal"
- **Style:** Outlined button (border, no fill)
- **Location:** Top right of cart (visible in Cart-3.png)
- **Function:** Convert cart contents into formal proposal document
- **Audience:** B2B scenarios, multi-stakeholder approvals
- **Context:** Available when multiple items in cart or B2B context detected

### Navigation Preservation
- Top navigation bar remains accessible
- Users can return to Store, Trade In, Equipment, People, or Support sections
- User account dropdown available for profile/order access
- Cart icon in header updated with current item count

---

## Empty Cart States

**Not explicitly shown in provided screenshots**

**Inferred Empty Cart Experience:**
- "Your cart is empty" messaging
- Call-to-action button directing to Store or Equipment browsing
- Suggestions for popular items or recommended products
- Simplified layout without payment options or totals section
- Encouragement to continue shopping

---

## Integration with Other Flows

### Upstream: Shopping Flow
- Users add equipment to cart from:
  - **Store browsing** - Category-based equipment discovery
  - **Equipment pages** - Individual product detail views
  - **Trade-In program** - Equipment credits applied to cart
  - **Recommendations** - Suggested complementary products
- Cart persists across navigation back to shopping pages

### Downstream: Checkout Flow
- **Cart ▶ Checkout Transition**
  - "Check out" button initiates checkout process
  - Payment method selection (Buy vs. lease terms) made in Cart, honored in Checkout
  - Cart summary moves to order review step in Checkout
  - Shipping address entry
  - Final payment information and order confirmation

### Related: Proposal Flow
- **Cart ▶ Proposal Conversion**
  - "Share as proposal" converts cart to proposal document format
  - Maintains all item details, quantities, and pricing
  - Enables async approval workflows
  - Can be shared with stakeholders for review before checkout

### Account Integration
- **User Credentials** - "Acme" organization context shown in header
- **Order History** - User account linked to orders via header dropdown
- **Multi-user Support** - Company accounts allow multiple team members to share carts and proposals

---

## Cart Persistence and Synchronization

### State Management

#### Session Persistence
- Cart contents retained during browsing session
- Users can navigate between Store, Equipment, and Trade In without losing cart
- Navigation bar cart badge updates to reflect current item count

#### Cross-Device Persistence
- **Inferred:** Cart likely synced to user account (based on "Acme" org context)
- Users can view/modify cart from different devices
- Account-based persistence allows multi-user workflows (team members accessing shared carts)

#### Timing of Synchronization
- **Real-time Updates:** Quantity changes, item removal, add-ons reflect immediately
- **Checkout Commitment:** Cart finalized when user clicks "Check out"
- **Payment Processing:** Lease vs. Buy selection determines fulfillment path

### Data Integrity
- **Inventory Check:** Before checkout, system likely validates item availability
- **Price Validity:** Displayed prices remain valid through checkout process
- **Residual Values:** Locked for leasing options to ensure accuracy

### Clearing Cart
- **Post-Checkout:** Cart clears after successful order completion
- **User Action:** "Remove" links delete individual items
- **Abandonment:** Likely cart persists if user navigates away (enables recovery)

### Team/Proposal Workflows
- **Cart Sharing:** "Share this cart" creates unique URL or email link
- **Proposal Sharing:** "Share as proposal" generates static proposal version
- **Multiple Versions:** Team members can create/modify separate carts before consolidating

---

## Key Design Decisions

### Payment Flexibility
- Three payment options (Buy, 24-month, 36-month) available simultaneously
- Users can switch between options to compare monthly vs. upfront costs
- Lease terms clearly display true cost of ownership and residual values

### Deferred Calculations
- Shipping and taxes calculated at checkout (not in cart)
- Reduces cart complexity and speeds up browsing
- Tax jurisdiction determined by delivery address during checkout

### Optional Services
- Add-ons (protection plans, extended support) presented alongside items
- Low-friction "Add" links encourage upsells
- Services respect same payment method as base equipment

### Multi-item Organization
- Independent quantity controls per item
- Each product fully independent in cart
- No minimum/maximum constraints visible in current design

### B2B Context
- "Share as proposal" and "Share this cart" support enterprise workflows
- Organization context ("Acme") visible in all cart views
- Implies approval workflows and budget tracking capabilities

### Information Hierarchy
- Payment method selection dominates top section
- Item list is scannable with key specs and pricing
- Summary totals at bottom for quick reference
- All actions (Remove, Add, Check out) clearly visible

---

## Notable Design Patterns

### Consistency Across Variants
- Single-item and multi-item carts follow identical structure
- Payment options presentation is standardized
- Summary section layout remains constant regardless of cart size

### User Guidance
- "How leasing works" link provides education without bloating cart
- Lease description text explains payment math transparently
- Optional add-ons positioned logically alongside products

### Accessibility Considerations
- Quantity controls use dropdown (accessible alternative to increment/decrement)
- All actions are text-based links or buttons (no icon-only controls)
- Clear hierarchical organization aids screen reader navigation
- Color contrast on primary "Check out" button ensures visibility

### Mobile Responsiveness (Inferred)
- Vertical stacking of items supports smaller screens
- Price positioning right-aligned for easy scanning
- Payment options may reorganize on mobile (likely cards stack vertically)
- "Check out" button remains prominent and tap-friendly

---

## Summary

The Equipped Cart is a streamlined hub balancing **shopping flexibility** with **transactional clarity**. By enabling simultaneous comparison of purchase and leasing options, integrating optional services, and deferring complex calculations to checkout, it reduces friction while maintaining information transparency. The design supports both direct purchases and B2B proposal workflows, accommodating individual buyers and enterprise teams within the same interface.

The clear progression from cart to checkout, combined with persistent state management and team-sharing capabilities, positions the cart as a central coordination point in the Equipped platform's procurement ecosystem.
