# Shopping & Product Browsing Flow

## Flow Purpose

The Shopping and Product Browsing flow enables users to discover, compare, and configure IT equipment before purchasing or leasing. It serves as the primary product discovery and selection interface for the Equipped platform, supporting both individual product exploration and bulk purchasing decisions.

## Key Pages

### Shop List (Main Store Page)
The primary shopping interface displaying all available products in a filterable, searchable catalog.

**Layout:**
- Left sidebar with category navigation
- Main content area with product grid/list view
- Top search bar with real-time filtering
- Promotional banner for leasing options

**Key Elements:**
- Product image thumbnails (placeholder squares)
- Product name and key specs (CPU, GPU, Memory, Storage)
- Pricing tiers: Buy, 24-month leasing, 36-month leasing price
- Color variant indicators (black dots representing available colors)
- Quick action hover states with add-to-cart prompts

### Product Detail Page
Detailed customization and purchasing interface for individual products.

**Layout:**
- Large product image (left side, ~50% width)
- Configuration panel (right side, ~50% width)

**Key Sections:**
- Product title and specifications summary
- Pricing display with payment options (Buy vs. Lease terms)
- "How leasing works" information link
- Color selector with visual swatches
- AppleCare+ options (selection list with pricing)
- Customization questions (processor, memory, storage options)
- Apple Business Manager integration toggle
- Quantity selector (+/- controls)
- Add to cart button (primary CTA)

## Navigation Flow

```
Store List
  ↓ (Click product)
Product Detail
  ↓ (Configure options)
Add to Cart
  ↓ (Cart notification appears)
Return to Store / View Cart
```

## User Actions & Interactions

### Product Discovery
- **Category filtering**: Users select from left sidebar categories:
  - Mac (with sub-categories: All, MacBook Air, MacBook Pro, iPad)
  - Accessories
  - Bundles
- **Search**: Full-text search across product names and specs
- **Leasing pre-qualification**: Optional early leasing application via "Pre-apply for leasing" button

### Product Selection
- **Click product card** to open full detail view
- **Color variant selection**: Click color swatches (Midnight, Starlight, Space Gray, Silver)
- **Price comparison**: View all three payment options simultaneously
- **Learn more**: Access leasing information via linked text

### Customization
- **AppleCare+ selection**: Choose from coverage tiers (None, Basic, Theft and Loss)
- **Hardware customization**: Answer questions to configure:
  - Processor options
  - Memory upgrades
  - Storage capacity
  - Power adapter specifications
  - Keyboard language options
- **Expansion toggle**: "Yes, show more options" to reveal additional configurations
- **Business integration**: Opt-in to add device to Apple Business Manager

### Purchase Actions
- **Quantity adjustment**: Use +/- spinner controls to set order quantity
- **Add to cart**: Primary CTA button (blue/prominent color)
- **Success feedback**: Toast notification with cart count and "View cart" button

## Product Information Display

### List View (Shop Page)
- Product name (heading)
- Abbreviated specifications (CPU, GPU, Memory, Storage)
- Three pricing columns showing payment options
- Color availability dots
- Cursor hover indicator

### Detail View (Product Page)
- Full product name with size specifications (e.g., "14-inch", "16-inch")
- Complete specification text (CPU cores, GPU cores, Memory, Storage, accessories)
- Three payment options with clear labeling:
  - **Buy**: Outright purchase price
  - **24-month leasing**: Monthly cost
  - **36-month leasing**: Monthly cost with extended term option
- Leasing information helper text and "How leasing works" link
- Color swatches with labels
- AppleCare+ options as selectable cards with full pricing
- Customization questions with Yes/No or text inputs
- Persistent pricing section at bottom before add-to-cart

## Action Points

### Add to Cart
- **Trigger**: Blue "Add to cart" button on product detail page
- **Validation**: Quantity must be >= 1
- **Feedback**:
  - Toast notification shows product added (e.g., "1 MacBook Air M2 has been added to your cart")
  - Cart badge in header updates with item count
  - "View cart" button appears in notification for quick navigation

### Compare Products
- **Not explicitly shown in current design** but implied by:
  - Ability to view multiple products in list
  - Leasing price comparison across payment terms
  - Color and configuration variants side-by-side on detail page

### Save Products
- **Not explicitly shown in current design**
- Potential future feature for wishlist/saved items

### Leasing Pre-Application
- **Trigger**: "Pre-apply for leasing" button on shop page
- **Purpose**: Allow early qualification before adding to cart
- **Context**: Displayed prominently in "Want to lease?" information banner

## Integration Points

### Cart Integration
- **Handoff**: Add to cart button transitions to cart system
- **Data passed**:
  - Product ID and SKU
  - Selected color
  - Configuration options (AppleCare+, customizations)
  - Quantity
  - Payment method preference (Buy vs. Lease term)
- **Navigation**: "View cart" button in success toast goes to Cart flow

### Checkout Integration
- **Entry point**: Cart summary flows into checkout
- **Payment selection**: Users choose final payment option at checkout
- **Leasing workflow**: Pre-applied users can complete leasing terms
- **Business Manager**: Integration selected during product customization

### Trade-In Flow
- **Navigation**: "Trade In" menu option available in header
- **Context**: Users can potentially trade existing equipment

### Equipment Management Integration
- **Post-purchase**: Ordered equipment integrates into Equipment inventory
- **Context**: Users manage purchased/leased devices after checkout

## Search & Filtering Capabilities

### Search
- **Type**: Real-time text search
- **Scope**: Product names, specifications, SKUs
- **Location**: Top center of shop page
- **Behavior**: Filters product list as user types

### Category Filtering
- **Sidebar navigation** with selectable categories:
  - Mac (expandable)
    - All
    - MacBook Air
    - MacBook Pro
    - iPad
  - Accessories
  - Bundles
- **Single-select**: One category active at a time
- **Visual indicator**: Selected category highlighting

### Advanced Filters (Implicit)
- **Color variants**: Shown via dot indicators on list, swatches on detail
- **Price range**: All three payment options visible for comparison
- **Specs**: Filterable indirectly by reading detailed specs on product cards

## Product Information Architecture

### Minimal Details (List View)
```
Product Name
├── Specs (Key features only)
├── Pricing (3 columns)
└── Colors (Indicator dots)
```

### Extended Details (Product Detail)
```
Product Name + Size
├── Full Specifications
├── Pricing Options (3 tiers)
├── Color Selection
├── AppleCare+ Options
├── Customization Questions
├── Business Manager Option
├── Quantity Selector
└── Add to Cart CTA
```

## User Flows - Key Scenarios

### Scenario 1: Simple Purchase
1. User enters Store
2. Browses Mac category
3. Clicks MacBook Air M2
4. Selects color (Midnight)
5. Accepts default AppleCare+ (None)
6. Clicks "Add to cart"
7. Toast notification confirms
8. Views cart or continues shopping

### Scenario 2: Customized Bulk Order
1. User searches "MacBook Pro M2 16-inch"
2. Clicks matching product
3. Customizes specs (16GB -> 32GB RAM, 512GB -> 1TB storage)
4. Adds AppleCare+ with Theft and Loss
5. Opts to add to Apple Business Manager
6. Sets quantity to 5 via spinner
7. Clicks "Add to cart"
8. Toast confirms "5 MacBook Pro M2, 16-inch added to your cart"
9. Navigates to cart for further additions

### Scenario 3: Leasing Comparison
1. User on Store page
2. Sees "Want to lease?" banner
3. Reviews 24-month and 36-month options on products
4. Clicks "Pre-apply for leasing"
5. Returns after qualification
6. Selects leasing option during checkout

### Scenario 4: Configuration Exploration
1. User clicks product to detail page
2. Explores color options by clicking swatches
3. Reviews AppleCare+ tiers and pricing
4. Answers customization questions
5. Clicks "Yes, show more options" for additional configs
6. Finalizes selection
7. Adds to cart

## Design Patterns

### Empty States
- Not shown in provided screenshots
- Likely: "No products found" for empty search results

### Loading States
- Not shown in provided screenshots
- Likely: Skeleton screens during product load

### Success Feedback
- Toast notification with product name and quantity
- Persistent "View cart" CTA
- Cart badge update in header

### Error Handling
- Not shown in provided screenshots
- Likely: Inline validation for quantity and required fields

## Accessibility & Mobile Considerations

### From Current Design (Desktop-First)
- Color selection via visual swatches (requires color legend for colorblind users)
- Adequate spacing between interactive elements
- Clear button hierarchy (primary action = blue, secondary = white outline)
- Form inputs use standard select/text patterns

### Recommended Enhancements
- Color variant labels alongside visual indicators
- Keyboard navigation for product grid
- Mobile responsive sidebar (hamburger menu pattern)
- Touch-friendly quantity spinners
- Lazy loading for product images in list view

## Performance Considerations

- Product images should be optimized (WebP, responsive sizes)
- Search should debounce to reduce API calls
- Category filtering should cache results
- Infinite scroll or pagination for product lists
- Lazy load product details on modal/page transitions
