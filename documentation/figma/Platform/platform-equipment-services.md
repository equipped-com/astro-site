# Platform Equipment and Services Browsing Flow

## Overview

The Equipment and Services browsing experience is the primary discovery and selection interface where users explore, filter, compare, and configure technology products before adding them to cart. This flow emphasizes flexible payment options (Buy vs. 24-month vs. 36-month leasing), product customization, optional service add-ons, and transparent pricing across all discovery and configuration stages.

**Flow Name:** Equipment and Services Catalog Discovery and Customization

**Purpose:** Enable users to browse, search, filter, and customize equipment and services with flexible payment options, seamless price comparison, and integrated optional service selection.

---

## 1. Store Browsing Interface

### Store Header and Navigation

The Store provides the primary entry point for equipment discovery:

- **Page Title:** "Store"
- **Navigation Context:** Part of primary navigation (Store, Trade In, Equipment, People, Support)
- **Search Bar:** Prominent full-width search input at top of content area
  - Placeholder: "Search"
  - Enables keyword and product name lookup
  - Real-time filtering of product results

### Pre-Apply Leasing Banner

A persistent informational banner appears above the product list:

**Banner Content:**
- **Headline:** "Want to lease?"
- **Supporting Text:** "You can pre-apply for leasing now or apply during checkout."
- **Call-to-Action Button:** "Pre-apply for leasing" (outlined button)
- **Purpose:** Educate users about leasing eligibility and encourage early application
- **Benefit:** Speeds up checkout when lease option selected later

### Left Sidebar Category Navigation

The left sidebar presents a hierarchical category structure:

**Primary Category: Mac**
- Expands to show equipment types:
  - **All** - Display all Mac products
  - **MacBook Air** - Air line variants
  - **MacBook Pro** - Pro line variants
  - **iPad** - iPad and iPad Pro models
  - **Accessories** - Peripherals and add-ons
  - **Bundles** - Pre-configured multi-item packages

**Navigation Pattern:**
- Click category to filter product list
- Active category highlighted
- Supports nested category structure
- Can be expanded/collapsed on mobile

### Product List Display

Products appear in a consistent card layout vertically stacked:

#### Product Card Structure

Each product shows:

1. **Product Image** - Left side thumbnail (equal height for all cards)
2. **Product Name** - Bold primary heading
   - Example: "MacBook Air M2"
3. **Key Specifications** - Secondary text below name
   - CPU, GPU, RAM, storage details
   - Example: "8-Core CPU, 8-Core GPU, 8GB Unified Memory, 256GB SSD Storage"
4. **Color Variants** - Inline dots indicating available colors
   - Small circular indicators
   - Show all available color options at a glance
5. **Payment Options** - Right side pricing (three columns)
   - **Buy:** Upfront purchase price (e.g., "$1,199")
   - **24-Month Leasing:** Monthly payment (e.g., "$32.47/mo.")
   - **36-Month Leasing:** Monthly payment (e.g., "$21.64/mo.")
6. **Visual Indicator:** Subtle hover state showing the card is clickable
   - Cursor changes to pointer
   - Optional: light background shade on hover

#### Product Card Variants

**Single-Line Products:**
- Standard layout with all info on one visual line
- Efficient scanning of product lists
- Most products follow this pattern

**Multi-Spec Products:**
- Products with complex specs may wrap to two lines
- Maintains readability while showing all specs

### Product List Responsiveness

**Desktop (1200px+):**
- Full three-column pricing display
- Sidebar always visible
- Full-width product cards

**Tablet (768px-1199px):**
- May condense pricing to two columns or stack vertically
- Sidebar may collapse to hamburger
- Product cards width-responsive

**Mobile (< 768px):**
- Single-column pricing display
- Sidebar becomes hamburger menu
- Full-width product cards
- Touch-friendly spacing

---

## 2. Product Detail and Customization Flow

### Accessing Product Details

When a user clicks any product card, they navigate to the detailed product customization page.

### Product Detail Layout

#### Left Side: Product Visual

- **Large Product Image** - Full-height placeholder
- **Image Gallery** - Implied (not shown but standard pattern)
- **Visual Consistency** - Maintains brand aesthetic with light gray placeholder

#### Right Side: Customization and Purchase Configuration

### Heading Section

**Product Name:** "Customize your {Product Name}"
- Example: "Customize your MacBook Air M2"
- Clearly communicates this is a customization flow

**Specs Summary:** Small text with full specification listing
- Example: "8-Core CPU, 8-Core GPU, 8GB Unified Memory, 256GB SSD Storage, 30W USB-C Power Adapter, US English keyboard."
- Provides complete baseline specifications

### 3-Payment-Option Display

Directly below specs, the three payment options appear in a clean list:

**Buy**
- Label: "Buy"
- Price: Upfront cost (e.g., "$1,199.00")
- Status: Clearly visible without emphasis

**24-Month Leasing**
- Label: "24-month leasing"
- Price: Monthly payment (e.g., "$32.47/mo.")
- Status: Right-aligned for easy scanning

**36-Month Leasing**
- Label: "36-month leasing"
- Price: Monthly payment (e.g., "$21.64/mo.")
- Status: Right-aligned, lowest monthly option
- **"How leasing works"** - Blue hyperlink below options
  - Educates users about lease terms, residual values, buyout options
  - Opens additional context or modal

### Customization Section 1: Color Selection

**Label:** "Color"

**Visual Options:** Horizontal row of color swatches
- Each swatch is a square with color name below
- Selected option has a border indicator
- Example colors: Midnight, Starlight, Space Gray, Silver
- Hoverable/clickable to select

**Interaction:** Click color to select; adds to customization

### Customization Section 2: AppleCare+ Options

**Label:** "AppleCare+"

**Primary Option (Default Selected):**
- **Option Name:** "No AppleCare+ coverage"
- **Price Display:** "$1,199.00 or from $21.64/mo."
- **Container Style:** Bold border box (visually prominent)

**Alternative Options:**
- **AppleCare+ Standard**
  - Cost: "$1,299.00 or from $25.64/mo."
  - Value-add service coverage

- **AppleCare+ with Theft and Loss**
  - Cost: "$1,399.00 or from $29.64/mo."
  - Extended coverage with theft protection

**Interaction:** Click option to select; pricing updates dynamically

### Customization Section 3: Processor/Memory/Storage

**Question Label:** "Would you like to customize the processor, memory, storage, power adapter, or keyboard language?"

**Initial Response Options:**
- **"No"** - Button/link maintaining current specs
- **"Yes, show more options"** - Link to expanded customization interface

**Pattern:** Progressive disclosure - show basic customization, expand on demand

### Customization Section 4: Business Manager Integration

**Question Label:** "Should we add this device to Apple Business Manager?"

**Options:**
- **"Yes"** - Button
- **"No"** - Button

**Purpose:** Enable MDM enrollment and IT asset management integration

**Impact:** Affects post-purchase device enrollment and management workflows

### Price Summary and Add-to-Cart

**Pricing Display (Repeated):**
- **Buy:** "$1,199.00"
- **24-month leasing:** "$32.47/mo."
- **36-month leasing:** "$21.64/mo."
- **Note:** "Select your payment option at checkout"
- **Help Link:** "How leasing works"

**Quantity Control:**
- Spinner input (-, number field, +)
- Default: 1
- Allows selection of multiple units
- State changes reflected in price

**Primary Action Button:**
- **Label:** "Add to cart"
- **Style:** Bold blue button, full width
- **State:** Enabled once all required customizations complete
- **Behavior:** Adds configured product to cart with quantity

---

## 3. Filtering and Search Capabilities

### Search Function

**Behavior:**
- Real-time filtering as user types
- Matches product names and specifications
- Displays filtered results immediately below search bar
- Can search by:
  - Product name (e.g., "MacBook Air M2")
  - Model number
  - Specification terms (e.g., "16GB", "1TB SSD")

### Category Navigation Filtering

**Left Sidebar Categories:**
- Click any category to filter product list
- Products are narrowed to selected category
- Only products matching category appear
- Category can be changed without losing place

### Example Filtering Workflows

**Workflow 1: Browse by Product Line**
1. User in Store sees all Mac products
2. Click "MacBook Pro" category
3. Product list filters to Pro models only
4. User can further navigate to specific models

**Workflow 2: Search for Specific Configuration**
1. User types "16GB" in search
2. Products with 16GB specifications appear
3. User can click one to customize further
4. Search results remain for quick comparisons

**Workflow 3: Find Bundles**
1. User clicks "Bundles" category
2. Pre-configured packages appear
3. Each bundle shows all included items
4. Single add-to-cart adds entire bundle

---

## 4. Product Comparison Views

### Implied Comparison Capability

While not explicitly shown in screenshots, the design supports comparison:

**Comparison Pattern:**
- Users browse product list with all three payment options visible
- Side-by-side comparison of pricing across Buy/24mo/36mo options
- Multiple products visible simultaneously for comparison
- Color dots indicate variant availability (easier to spot differences)

**Comparison by Specifications:**
- Product cards show key specs inline
- Easy to scan multiple products for CPU/GPU/RAM/Storage differences
- Payment column alignment aids price comparison

**Example Comparison Scenario:**
1. User browsing MacBook Air options
2. Sees two M2 variants side-by-side with different storage
3. Compares prices: Air M2 256GB vs. Air M2 512GB
4. Notes storage costs slightly less via leasing spread
5. Clicks higher-spec model to customize

### Multi-Product Browsing

The product list design naturally supports browsing multiple items:
- Cards are visually consistent
- Specs are standardized format
- Pricing columns align for easy comparison
- Color indicator dots help spot variants quickly

---

## 5. Rental vs. Purchase Options

### Core Payment Model

Each product simultaneously displays three purchase models:

#### Buy (Upfront Purchase)

**Display:** Single price column
- Price: Full cost (e.g., "$1,199.00")
- Method: Immediate ownership
- When Selected: Full amount charged at checkout
- Best For: Users with budget availability or preference for ownership

**Characteristics:**
- Highest upfront cost
- No ongoing monthly payments
- Full equipment ownership
- Users can keep indefinitely
- No residual value concerns

#### 24-Month Leasing

**Display:** Monthly payment (e.g., "$32.47/mo.")
- Total Term: 24 months
- Method: Monthly payment spread
- Total Cost: Base lease cost + financing fees
- End-of-Lease Options: Return equipment or pay residual value

**Characteristics:**
- Higher monthly cost than 36-month option
- Shorter commitment period
- Includes equipment maintenance (typically)
- Less residual risk (lower remaining value to buy)
- Easier equipment upgrade cycles

#### 36-Month Leasing

**Display:** Monthly payment (e.g., "$21.64/mo.")
- Total Term: 36 months
- Method: Monthly payment spread
- Total Cost: Lower monthly cost due to longer amortization
- End-of-Lease Options: Return equipment or pay residual value

**Characteristics:**
- Lowest monthly payment
- Longer commitment period
- Spread cost over more months
- Higher residual value risk
- Best for users with stable equipment needs
- Flexible end-of-lease decisions

### Lease Details and Education

**Educational Text (In Cart):**

When user selects leasing, detailed explanation appears:

Example: "$9,094 will be spread over 24 payments. At the end of the lease, you can return the equipment or pay the $4,893 residual value to keep it."

**Educational Elements:**
- Shows total cost of ownership
- Explains payment spread clearly
- Describes end-of-lease options (return vs. buyout)
- Transparent about residual values
- Reduces confusion about lease mechanics

### Pre-Apply for Leasing

**Banner Feature:**
- Allows users to pre-apply for leasing approval
- Button: "Pre-apply for leasing"
- Benefit: Streamlines checkout if lease option selected
- Workflow: Can apply now or defer to checkout

### Payment Selection Timing

**Where Decided:** At checkout, not in product detail
- Product detail shows all options
- User doesn't commit to payment method during browsing
- Deferred decision allows comparison before checkout
- Provides flexibility to change mind during shopping

---

## 6. Monthly Subscription Options

### Service-Based Subscriptions

While the primary model is equipment lease vs. purchase, the platform includes service subscriptions:

#### AppleCare+ Subscription Options

**Displayed During Product Customization:**

1. **No AppleCare+ Coverage**
   - Baseline option (no added protection)
   - Price included in base equipment cost
   - Cost structure: "$1,199.00 or from $21.64/mo."
   - No ongoing service commitment

2. **AppleCare+ Standard**
   - Hardware coverage and technical support
   - Cost: "$1,299.00 or from $25.64/mo."
   - Adds to equipment payment
   - Spreads cost across lease term if leasing selected
   - Typical coverage: Accidental damage, repairs, technical support

3. **AppleCare+ with Theft and Loss**
   - Enhanced coverage including theft protection
   - Cost: "$1,399.00 or from $29.64/mo."
   - Higher protection tier
   - Adds to equipment payment
   - Coverage: All AppleCare+ plus theft/loss replacement

### Service Subscription Mechanics

**During Checkout:**
- AppleCare+ option selection carries into checkout
- Service cost respects same payment method (Buy vs. lease terms)
- Services spread across lease term if leasing selected
- No separate service billing cycle needed

**Pricing Display:**
- Dual pricing: Upfront cost or monthly equivalent
- Example: "$1,299.00 or from $25.64/mo."
- Allows users to see both payment structures
- Helps decision-making around payment method

**Selection Pattern:**
- Services presented at product level
- Can be changed before adding to cart
- Each service tier fully replaces previous (radio button pattern)
- Clear differentiation between tiers

---

## 7. Equipment Specifications and Details

### Specification Display Levels

#### Level 1: Product Card Specs (Browsing)

**Location:** Product list cards
**Information Density:** Key specs only
**Example:** "8-Core CPU, 8-Core GPU, 8GB Unified Memory, 256GB SSD Storage"

**Specs Shown:**
- CPU cores and GPU cores
- RAM amount
- Storage capacity
- Key processors (M1, M2 variants)
- Screen size if applicable

**Purpose:** Quick differentiation while browsing

#### Level 2: Customization Page Specs (Detail)

**Location:** Product detail/customization page
**Information Density:** Comprehensive specifications
**Example:** "8-Core CPU, 8-Core GPU, 8GB Unified Memory, 256GB SSD Storage, 30W USB-C Power Adapter, US English keyboard."

**Additional Specs:**
- Power adapter wattage
- Keyboard language
- USB-C ports or connector types
- Display specifications (if applicable)
- Weight/dimensions (typical for hardware)

**Purpose:** Complete specification baseline before customization

#### Level 3: Customizable Options

Available through "Show more options" link:

**Processor Options:**
- Different CPU/GPU configurations
- Each option affects price
- Tiered from base to max configuration

**Memory Options:**
- RAM capacity choices
- 8GB, 16GB, 32GB, etc.
- Each tier increases monthly lease cost

**Storage Options:**
- SSD capacity choices
- 256GB, 512GB, 1TB, 2TB options
- Storage significantly impacts price
- Each option shown with cost differential

**Power Adapter:**
- Wattage selection
- Impact on portability vs. power delivery

**Keyboard Language:**
- Regional keyboard layouts
- Multiple language options available
- No cost impact

### Specification Organization

**Format:** Consistent text-based specifications
- Clear hierarchical structure
- No marketing jargon in specs section
- Technical accuracy emphasized
- All units clearly labeled (GB, TB, cores, ports)

**Comparability:** Specs formatted consistently across products
- Same terminology used across product lines
- Enables easy comparison between models
- Users quickly understand differences

---

## 8. Integration with Shopping and Checkout Flows

### Flow: Store Browsing -> Product Detail -> Cart -> Checkout

#### Stage 1: Store Browsing

- User navigates to Store section
- Browses product categories or searches
- Sees products with all payment options
- No cart interaction yet

#### Stage 2: Product Selection

- User clicks product card
- Navigates to customization page
- Selects color, AppleCare+, accessories
- Answers advanced customization questions
- Selects quantity

#### Stage 3: Add to Cart

- User clicks "Add to cart" button
- Product with selected customizations added to cart
- Success notification appears (toast/banner)
- Example: "MacBook Air M2 has been added to your cart"
- Notification includes "View cart" action

#### Stage 4: Continue Shopping or Proceed

**Option A: Continue Shopping**
- User remains in Store or navigates to other categories
- Shopping cart persists
- Cart badge in header updates with count
- User can add more items

**Option B: Proceed to Cart**
- Click "View cart" in success notification
- Click cart icon in header
- Navigate to Cart page
- Review selected items and quantities
- Manage quantities, remove items, add optional services

#### Stage 5: Checkout

- From Cart, click "Check out" button
- Navigate to Checkout flow
- Step 1: Assignment (who will use equipment)
- Step 2: Shipping details
- Step 3: Delivery options
- Step 4: Leasing application (if applicable)
- Payment information and order confirmation

### Cart Integration

**Cart Features Related to Equipment/Services:**

- **Item Display:** Full product name with customizations visible
  - Example: "MacBook Air M2 (Space Gray, 256GB, AppleCare+)"
- **Quantity Management:** Adjust quantities per product
- **Price Display:** Shows Buy and lease options for each item
- **Optional Add-ons:** Can add services in cart
- **Remove Action:** Delete items no longer wanted

### Payment Method Selection

**Timing:** Selected at checkout, not during browsing
- Store shows all three options for comparison
- Product detail page displays options
- Cart displays selected payment method options
- Checkout finalizes selection

**Implication:** Users can compare prices across payment methods while browsing, then commit to one method when ready

### Proposal and Sharing

**From Equipment Browsing:**
- Users can create proposals from cart contents
- Enables multi-stakeholder approval workflows
- Equipment details and customizations preserved in proposal
- Proposal can be shared with decision-makers before checkout

**Integration:**
- Equipment specifications appear in proposals
- Pricing reflects selected payment method
- Proposal recipients see customization details
- Clear traceability from proposal back to original equipment

---

## 9. Service Add-ons for Equipment

### Service Category 1: Equipment Protection Plans

#### AppleCare+ (Apple Devices)

**Availability:** Shown for all Apple products (MacBook, iPad, iPhone when applicable)

**Tiers:**
1. **No Coverage** - Baseline, no service cost
2. **Standard AppleCare+** - Hardware coverage and technical support
3. **AppleCare+ with Theft and Loss** - Enhanced protection

**Presentation:**
- Displayed as expandable/collapsible section during customization
- Shows all tiers with pricing
- Selected option highlighted with border
- Pricing shown in both upfront and monthly formats

**Cost Structure:**
- Added to equipment base cost
- Respects same payment method (Buy or lease)
- Spreads across lease term if leasing selected
- No separate billing needed

#### Extended Warranties (Non-Apple Products)

**Implied Availability:** For non-Apple equipment
- Similar tier structure
- Cost-based coverage levels
- Deductible options potentially available
- Coverage period selection

### Service Category 2: Support and Management Services

#### Setup and Configuration

**Implied Service:**
- Initial device setup and configuration
- User account provisioning
- Software installation and testing
- Integration with Apple Business Manager
- Optional professional setup at delivery

**Presentation:** Likely available via "Show more options" or advanced customization
- May be optional add-on
- Could be bundled with AppleCare+
- Adds convenience but increases total cost

#### Device Management (MDM)

**Integration Point:** "Should we add this device to Apple Business Manager?"
- Question presented during customization
- Affects post-purchase management
- May include configuration as service
- Related to IT asset tracking and control

### Service Category 3: Trade-In and Upgrade Programs

**Implied Service (Based on Navigation):**
- Trade-In section separate from Store
- Users can trade existing equipment for credit
- Credit applied to new equipment purchase
- Reduces net cost of new equipment

**Integration:**
- Equipment browsing shows applicable trade-in values
- Could be displayed alongside pricing
- Encourages upgrades from older equipment
- Supports sustainability/circular economy

### Service Category 4: Accessories and Bundles

#### Accessory Bundling

**Display:** Accessories category in sidebar shows:
- Peripherals (mice, keyboards, docking stations)
- Cases and protection equipment
- Cables and adapters
- Each accessory has own price and payment options

**Bundle Strategy:**
- Bundles category shows pre-configured packages
- Example: MacBook Air + AppleCare+ + Magic Keyboard
- Bundle pricing typically offers minor discount
- Single add-to-cart adds all items

### Service Selection and Pricing Impact

**Dynamic Pricing:**
- Service selections immediately update displayed pricing
- Both upfront and monthly lease prices update
- Users see real-time cost impact
- Clear cause-and-effect for price changes

**Cumulative Pricing Example:**
- Base MacBook Air M2: $1,199 / $32.47/mo.
- + AppleCare+ Standard: +$100 / +$5.64/mo.
- + Magic Keyboard: +$299 / +$8.70/mo.
- = Total: $1,598 / $46.81/mo.

**Clear Breakdown:**
- Line items visible during customization
- Each service addition clearly labeled
- Option to remove service without losing base product config
- Final total visible before add-to-cart

### Optional vs. Required Services

**Optional Services:**
- AppleCare+ options
- Accessories
- Bundles
- Setup/configuration services

**Required Services:**
- None - all services are optional
- Base equipment always purchasable alone
- Services are pure add-ons

**User Control:**
- Full choice over service additions
- Can revisit selections before checkout
- Can modify cart quantities of services
- Can remove services in cart

---

## 10. Key Design Patterns

### Consistent Payment Option Display

All pages (Store browse, Product detail, Cart) show the same three payment options:
- Buy (upfront price)
- 24-month leasing (monthly cost)
- 36-month leasing (monthly cost)

**Benefit:** Users can compare pricing consistently throughout journey

### Progressive Disclosure

Basic customization visible by default:
- Color selection
- AppleCare+ tier
- Quantity

Advanced customization available via "Show more options":
- Processor configuration
- Memory upgrade
- Storage upgrade
- Power adapter selection
- Keyboard language

**Benefit:** Reduces cognitive load while enabling power users to customize fully

### Price Transparency

Pricing shown at every decision point:
- Product cards show all payment options
- Customization options update pricing in real-time
- Service additions show cost impact immediately
- Cart shows final pricing before checkout
- Deferred taxes and shipping to checkout (appropriate for cart)

**Benefit:** Users never surprised by pricing; clear decision-making

### Service Add-ons as Optional Enhancements

Services presented alongside equipment:
- AppleCare+ tiers for all devices
- Not forced or required
- Clearly positioned as optional
- Pricing shows cost impact

**Benefit:** Increases revenue through upselling while respecting user choice

### Accessibility of Payment Options

All payment options equally accessible:
- No "recommended" option highlighted
- All three pricing columns displayed equally
- Decision deferred to checkout
- Users can change mind easily

**Benefit:** True flexibility; no artificial steering toward higher-cost option

### Mobile-First Information Architecture

Key information hierarchy works across screen sizes:
- Product name and specs always visible
- Payment pricing (condensed if needed)
- Color/service selection flows vertically
- Add-to-cart button always accessible

---

## Notable Design Decisions

### Lease Payment Emphasis

While "Buy" option is present, leasing options receive equal prominence:
- Monthly payment displayed alongside upfront price
- Leasing education available via "How leasing works" link
- Pre-apply for leasing banner encourages early engagement
- Removes friction by front-loading leasing information

### Deferred Payment Method Selection

Users don't commit to Buy vs. Lease until checkout:
- Allows browsing comparison without decision pressure
- Prices for all options visible during shopping
- Flexible decision-making
- Can explore alternatives before checkout

### Optional Services Integration

Services attached to equipment, not separate:
- AppleCare+ shown during customization, not separately
- Services pricing updates with equipment price
- Services respect same payment method
- Coherent checkout experience (no separate service billing)

### Color/Variant Selection Inline

Product variants shown as small color dots:
- Compact visual representation
- Multiple options visible without scrolling
- Users quickly identify available variants
- Hover/click to select variant

### Customization Questions vs. Configuration Options

Split between simple (questions) and advanced (options):
- "Would you like X service?" questions are yes/no
- "Would you like to customize Y?" shows expanded menu
- Keeps casual browsing simple
- Enables detailed configuration when needed

---

## Summary

The Equipped Equipment and Services browsing flow is a comprehensive discovery and customization system that balances flexibility with simplicity. By displaying all payment options simultaneously, enabling progressive service customization, and deferring payment method selection to checkout, it reduces friction while maintaining transparency.

The design supports multiple use cases:
- **Casual Browsing:** Quick product discovery with price comparison
- **Detailed Customization:** Full configuration with real-time pricing updates
- **Service Selection:** Optional protection and support enhancements
- **Team Purchasing:** Proposal generation for multi-stakeholder approval
- **Leasing Qualification:** Pre-approval workflows for financing

The consistent information architecture, from Store listing through Product detail to Cart, ensures users always have the context needed to make informed purchasing decisions. Equipment specifications, pricing, and optional services are presented at appropriate levels of detail without overwhelming casual browsers or limiting power users.

By integrating equipment browsing, service customization, and transparent pricing into a single coherent flow, Equipped enables technology procurement to be straightforward, flexible, and financially transparent for organizations of all sizes.
