# Equipped Platform - Checkout Flow

## Overview

The Checkout Flow is the core transactional journey in Equipped that guides users from cart review through order placement. This flow is optimized for B2B equipment leasing and purchasing, with deep integration into the leasing system via Macquarie finance partners.

**Flow Purpose:** Convert cart items into committed orders, collect necessary company and shipping information, facilitate financing options, and deliver transparent order confirmation.

**Key Characteristic:** All pricing is dual-tracked with monthly leasing breakdowns alongside total equipment costs, reflecting the platform's core value proposition: equipment as a monthly operational expense rather than upfront capital investment.

---

## Flow Stages

### Stage 1: Assignment - "Who will use this equipment?"

**Purpose:** Assign equipment to an end-user for tracking and management in Equipped.

**User Actions:**
- **Choose assignment method:**
  - "Assign it to someone" (primary path) - Select from company roster
  - "Leave it unassigned" (alternative) - For later assignment or shared equipment
- **Search and select assignee** from dropdown list (e.g., "Leon Quigley", "Nicole Haley")
- **Support feature:** "Ask Nicole to add info" link - Prompts unassigned users to provide contact details via email

**UI Elements:**
- Two prominent CTA buttons: "Assign it to someone" (primary blue) vs "Leave it unassigned" (secondary)
- Searchable dropdown with existing team members
- Import/Add person buttons for expanding team roster

**Integration Points:**
- **→ People Flow:** Add new team members mid-checkout
- **→ Equipment Module:** Marks equipment with owner for tracking/reporting

**Data Captured:**
- Assigned person name and ID
- Assignment status (assigned/unassigned)

**Next Action:** Continue to shipping details

---

### Stage 2: Shipping Details - "Where should we send the order?"

**Purpose:** Capture delivery recipient and contact information.

**User Actions:**
- **Choose delivery method:**
  - "To Nicole's address" (primary) - Pre-populate from assignee profile
  - "To another address" (alternative) - Enter custom delivery location
- **Conditional help trigger:** If recipient has missing contact info
  - Display: "Don't have Nicole's address or phone number? We can help!"
  - Option: "Ask Nicole to add info" - Sends email request link
- **Manual form completion if needed:**
  - First name, Last name
  - Address (autocomplete enabled - real-time address lookup suggestions)
  - Apartment/Suite/Etc. (optional)
  - City, State, Zip code
  - Country
  - Email, Phone number
  - Checkbox: "This is a business address"
- **Dual email notification:** "When sending to someone else, order updates will also be sent to [primary contact]"

**UI Elements:**
- Address autocomplete powered by Google Places API (shows: "1 Infinite Loop, Cupertino, CA, USA")
- "Enter address manually" toggle for edge cases
- Phone number field with international format support
- Edit links appear after data is entered

**Validation:**
- Email format validation
- Phone number format with country code
- Address completion (all fields required except apartment)
- Minimum postal code length

**Integration Points:**
- **→ Cart Flow:** User can click "Edit" to modify cart
- **→ Logistics Module:** Passes delivery address to carrier integration
- **→ People Flow:** Links assignee to shipping address record

**Data Captured:**
- Recipient name
- Full address with geolocation
- Phone number (with country code)
- Email addresses (recipient + primary contact)
- Business address flag

**Next Action:** Continue to delivery options

---

### Stage 3: Delivery Options - "When would you like to get your order?"

**Purpose:** Select delivery speed and confirm delivery date.

**User Actions:**
- **Choose from preset options:**
  - "By Thursday, May 18" - Standard Delivery (Free)
  - "By Wednesday, May 17" - Express Delivery ($9.00)
  - "Select a date" - Custom date picker
- **Calendar picker interaction:**
  - Month navigation (← →)
  - Click specific date (e.g., May 23, May 30)
  - Date highlights show availability
  - Selected date shows in header: "Select a date: May 30"
  - Helper text: "Select a later date that suits the person you're shipping to"
- **Cost display:**
  - Standard delivery: Free
  - Express delivery: $9.00 upcharge
  - Custom dates: Free (if available)
- **Cart updates in real-time:**
  - Shipping cost line updates based on selection
  - Taxes recalculate
  - Monthly total updates

**UI Elements:**
- Three delivery option cards with radio buttons
- Interactive calendar modal with date selection
- Real-time price update in sidebar

**Validation:**
- Cannot select past dates
- Cannot select dates earlier than standard delivery
- System enforces minimum delivery windows

**Integration Points:**
- **→ Logistics Module:** Passes delivery date to carrier
- **→ Cart System:** Updates shipping costs and taxes
- **→ Orders Flow:** Delivery date becomes order commitment date

**Data Captured:**
- Delivery method (standard/express/custom)
- Delivery date
- Associated cost

**Next Action:** Continue to leasing

---

### Stage 4: Leasing - "Apply for leasing & place your order"

**Decision Point:** Critical junction where users choose financing path

#### Path A: Leasing (Primary - Default Selected)

**Purpose:** Apply for equipment financing through Macquarie.

**Context:**
- Default selection reflects core platform value (monthly payments vs. capital expenditure)
- Cart displays: "24-Month Leasing" badge
- Pricing breakdown shows: "Get your equipment with manageable monthly payments. Return or buy it out for $419 after 24 mo."
- Monthly cost displayed prominently: "$32.47/mo."

**Leasing Guarantee Messages:**
- ✓ "Your leasing agreement will be financed by Macquarie."
- ✓ "The approval process usually takes 1-2 business days."
- ✓ "We'll process your order once you've signed their agreement digitally."
- ✓ "Applying won't affect your business credit score." (Learn more link)

**User Actions:**
- **Complete company information form:**
  - Company legal name (required)
  - EIN (required)
  - Contact name (required)
  - Contact email (required)
  - Registered business address (required, with autocomplete)
  - Apartment/Suite/Etc. (optional)
  - City, State, Zip, Country (required)
- **Choose bank statement sharing method:**
  - "Connect with Plaid" (primary) - Secure OAuth integration
    - Modal shows: "Your data will be shared securely through Plaid. It'll only take a minute to connect."
    - CTA: "Connect with Plaid" button
  - "Upload bank statements" (alternative) - Manual file upload
    - Drag-and-drop zone: "Drag and drop here or browse files"
    - Accept past 3 months of statements
    - Shows uploaded files: "Acme March 2023.pdf", "Acme April 2023.pdf", etc.
    - Remove button per file
- **Final CTA:** "Apply & place order" button

**UI Elements:**
- Form with prefilled company name from profile
- Address autocomplete with address suggestions
- Two-tab interface: "Connect with Plaid" vs "Upload bank statements"
- File upload with drag-and-drop support
- File list with removal capability

**Validation:**
- Company name required
- EIN format validation (12-XXXXXXXX)
- Email format validation
- Address completion required
- At least one of: Plaid connection OR bank statements

**Integration Points:**
- **→ Macquarie Finance System:** Sends application data to financing partner
- **→ Plaid API:** Secure bank data retrieval and verification
- **→ Document Storage:** Archives uploaded bank statements
- **→ Orders Flow:** Creates order with leasing designation
- **→ Approval Workflow:** Triggers 1-2 business day approval loop

**Data Captured:**
- Company legal name, EIN
- Contact name, email
- Registered business address
- Bank verification method (Plaid or uploaded statements)
- Bank account data/document references

**Success State:** Shows confirmation page "We've sent your leasing application to Macquarie"

#### Path B: Purchase (Alternative)

**Intent:** If user declines leasing or is ineligible

**User Actions:**
- Skip leasing stage and go directly to payment
- Select alternative payment method (e.g., card, wire transfer)

**Note:** Not shown in current wireframes - indicates payment method selection may appear as separate stage if leasing declined

---

## Real-Time Cart Summary Panel

**Location:** Right sidebar, persistent throughout all stages

**Content:**
- **Header:** "Your cart" with "Edit" link (back to cart)
- **Product card:**
  - Thumbnail image
  - Product name: "MacBook Air M2"
  - Specs: "8-Core CPU, 8-Core GPU, 8GB Unified Memory, 256GB SSD Storage"
  - Value: "$1,199.00"
  - Monthly cost: "$32.47/mo."
- **Price breakdown:**
  - Subtotal
  - Shipping (updates when delivery method selected)
  - Taxes (updates when address/delivery changes)
  - Total upfront cost
  - Due today
  - Monthly total (lease-specific)

**Behavior:**
- Recalculates in real-time as user progresses through stages
- Shows shipping cost after Stage 3 selection
- Shows tax calculation after address entry (Stage 2)
- Highlights monthly total once leasing is committed (Stage 4)

**Integration:**
- **→ Cart Flow:** "Edit" link returns to cart management
- **→ Pricing Engine:** Real-time tax and shipping calculations

---

## Editable Sections & Navigation

**Edit Links:** Each completed stage shows "Edit" link for modification without restarting

**Stage Visibility:**
- Completed stages collapse into summary lines
- Current stage expands with full form
- Uncompleted stages show as grayed labels until reached

**Back Navigation:**
- Users can edit any previous stage by clicking "Edit"
- Changes trigger recalculation of dependent stages (e.g., changing address recalculates taxes)

**Progress Indicator:**
- Numbered stages (1-4) shown on left
- Visual progression as user advances

---

## Success States & Outcomes

### Successful Leasing Application

**Confirmation Page:** "We've sent your leasing application to Macquarie"

**Content:**
- Large success indicator: Green checkmark circle
- "What happens next?" section:
  - "Macquarie will review your application and get in touch with you."
  - "The approval process usually takes 1-2 business days."
  - "We'll process your order once you've signed their agreement digitally."
  - "If you're declined, you have the option to complete this order with a different payment method."
- CTA: "View your order" button (→ Orders Flow)

**Integration:**
- **→ Orders Flow:** Creates draft order in pending leasing approval state
- **→ Notifications:** Sends confirmation email to contact email
- **→ Approval Workflow:** Queues for Macquarie review

**Timeline:**
- Order status: "Pending Leasing Approval" (1-2 business days)
- If approved: Order converts to "Processing"
- If declined: User prompted to select alternative payment method

### Alternative Outcome: Order Placed (Non-Leasing)

**Confirmation Page:** "You order has been placed!"

**Content:**
- Success indicator: Green checkmark circle
- Delivery confirmation: "We're preparing your order. It'll be delivered to [recipient name] by [date]."
- CTA: "View your order" button (→ Orders Flow)

**Integration:**
- **→ Orders Flow:** Creates active order with immediate processing
- **→ Logistics:** Triggers shipment preparation
- **→ Notifications:** Sends order confirmation email

---

## Error & Edge Case States

### Leasing Ineligibility

**Trigger:** Macquarie rejects application

**Outcome:**
- Confirmation page shows: "If you're declined, you have the option to complete this order with a different payment method."
- User redirected to alternative payment stage
- Order remains in cart, not lost

### Missing Assignee Information

**Trigger:** Selected user has incomplete profile (no address/phone)

**UX:**
- Prominent alert: "Don't have Nicole's address or phone number? We can help!"
- CTA: "Ask Nicole to add info" - Sends email with completion link
- User can proceed by manually entering address

### Address Not Found

**Trigger:** Autocomplete returns no results

**UX:**
- "Enter address manually" link becomes available
- User switches to manual form input (visible in Checkout-5.png)

### Invalid Bank Statements

**Trigger:** Uploaded files don't meet Macquarie requirements

**UX:**
- Form validation error on submit
- Suggests Plaid connection as faster alternative

---

## Decision Points & Branch Logic

### Critical Junction: Assignment (Stage 1)

```
Assign to someone → Continue (specified user)
                 ↓
             Leave unassigned → Continue (equipment unowned, assigned later)
```

### Delivery Address (Stage 2)

```
To assignee's address → Use profile data (auto-populated)
                     ↓
To another address   → Manual entry required
```

### Delivery Speed (Stage 3)

```
Standard (free)  → May 18 date
              ↓
Express ($9)  → May 17 date
              ↓
Custom date   → Calendar picker (date-dependent pricing)
```

### Payment/Leasing (Stage 4)

```
Apply for leasing (default) → Macquarie application flow
                           ↓ (if approved)
                        Order confirmed
                           ↓ (if declined)
                        Alternative payment method
                           ↓
Purchase/card payment      → Direct order placement
```

---

## Integration with Other Flows

### Cart Flow
- **Entry Point:** User initiates checkout from cart view
- **Exit Point:** Checkout complete → Orders Flow
- **Edit Link:** Returns to cart for quantity/product changes
- **Data Flow:** Cart items → Checkout → Order creation

### Orders Flow
- **Entry Point:** Checkout confirmation
- **Data Transfer:** All checkout data (assignment, shipping, delivery, leasing status) → New Order record
- **Order States:**
  - "Pending Leasing Approval" (if leasing selected)
  - "Processing" (if purchase or approval granted)
  - "Preparing to Ship" (after approval/payment confirmed)
- **View Order Link:** Confirmation page CTA

### People Flow
- **Add Person:** Mid-checkout import/add team member to assignee dropdown
- **Update Profile:** "Ask Nicole to add info" triggers People Flow profile completion
- **Data Sync:** Assignee contact info auto-syncs to shipping section

### Leasing Flow (Macquarie Partner)
- **Application Submission:** Stage 4 leasing form → Macquarie API
- **Approval Workflow:** 1-2 business day review by Macquarie
- **Signature Requirement:** User must digitally sign Macquarie agreement to finalize
- **Integration Point:** Macquarie portal linked in approval email

### Logistics Module
- **Shipping Address:** Stage 2 address passed to carrier system
- **Delivery Date:** Stage 3 date commitment to fulfillment warehouse
- **Tracking:** Order number provided for shipment tracking

### Pricing Engine
- **Real-Time Calculations:**
  - Shipping cost (Stage 3 selection)
  - Taxes (Stage 2 address or Stage 3 date change)
  - Monthly lease payment (based on equipment value and term)
  - Total cost projections
- **Currency/Region:** Supports multi-region pricing (addresses affect tax)

### Equipment Module
- **Assignment:** Stage 1 ties equipment to user in Equipped system
- **Tracking:** Equipment tagged with assigned user for reporting
- **Management:** User can manage equipment from People profile post-order

---

## User Journey Variations

### B2B Multi-Location Company

1. **Assignment:** Assigns to branch manager (e.g., "Nicole Haley")
2. **Shipping:** Ships to branch office (e.g., "1 Infinite Loop, Cupertino, CA")
3. **Delivery:** Standard 5-day delivery acceptable
4. **Leasing:** Company applies for financing under corporate entity
5. **Outcome:** Equipment managed by assigned person, billed to corporate account

### Solo Contractor / Sole Proprietor

1. **Assignment:** Self-assign or leave unassigned
2. **Shipping:** Ships to home office or specified location
3. **Delivery:** May choose express for immediate need
4. **Leasing:** Personal/business leasing application (Macquarie validates)
5. **Outcome:** Equipment tracked under personal profile, personal lease agreement

### Direct Purchase (Non-Leasing)

1. **Stages 1-3:** Same as above
2. **Stage 4:** Decline leasing, proceed to card/wire payment (not shown in wireframes)
3. **Outcome:** Direct purchase, equipment immediately owned

---

## Key Features & Differentiators

### 1. Assignment-First Approach
- Equipment tracked by user from purchase inception
- Enables team-level inventory management
- Supports workflow of assigning devices to new hires at onboarding

### 2. Dual Pricing (Capital vs. Operating Expense)
- Monthly lease costs prominently displayed
- Total upfront cost also visible
- Reflects Equipped's core value: "All things tech, one monthly fee"

### 3. Streamlined Leasing Integration
- Macquarie partnership pre-integrated
- No external redirects to 3rd party portals
- Approval status and next steps communicated in-platform

### 4. Smart Address Handling
- Autocomplete reduces entry errors
- Ability to ask unassigned users to provide info (crowdsourced data)
- Manual entry fallback for edge cases

### 5. Real-Time Cost Calculation
- Cart updates as user progresses through stages
- Taxes calculated based on delivery address
- Shipping cost varies by delivery speed
- Monthly payment updates with each selection

### 6. Multi-Layer Approval
- Company information verified for leasing
- Bank data validation (Plaid or manual upload)
- Macquarie final approval gate
- Reduces fraud risk, increases financeability

---

## Mobile Responsive Notes

- **Stage Expansion:** Single stage visible at a time on mobile
- **Sidebar Cart:** May convert to collapsible drawer or footer summary
- **Date Picker:** Mobile-optimized calendar control
- **Address Autocomplete:** Tap-friendly dropdown with keyboard support
- **Form Fields:** Full-width on mobile (< 600px)

---

## Accessibility Considerations

- **Form Labels:** All inputs labeled with associated `<label>` elements
- **ARIA Labels:** Landmark regions for checkout stages
- **Error States:** Inline validation messages with focus management
- **Keyboard Navigation:** All stages and forms fully keyboard-accessible
- **Color Indicators:** Success checkmark + text confirmation (not color-only)
- **Link Text:** "Ask Nicole to add info" and "Enter address manually" are descriptive

---

## Performance Notes

- **Address Autocomplete:** Debounced API calls (Google Places)
- **Form Validation:** Client-side validation before submission
- **Stage Submission:** One-click progression (no auto-advance)
- **Asset Loading:** Cart summary image lazy-loaded if below fold

---

## Checkout Metrics & Analytics

Key events to track:

- **Checkpoint Completions:**
  - Stage 1: Assignment selected
  - Stage 2: Shipping address entered
  - Stage 3: Delivery date selected
  - Stage 4: Leasing application submitted / Payment method selected

- **Conversion Funnel:**
  - Cart → Checkout initiation
  - Checkout stage completions
  - Final order placement
  - Leasing approval (post-checkout)

- **Drop-Off Points:**
  - At which stage do users abandon?
  - Do users choose leasing or purchase?
  - Address autocomplete: use rate vs. manual entry?

- **Error Tracking:**
  - Form validation failures
  - Leasing application rejections
  - Payment failures (if applicable)

---

## Future Enhancements

- [ ] **Bulk/Multi-Item Checkout:** Support multiple products in single order
- [ ] **Payment Method Selection UI:** Explicit card/wire/ACH options (currently in Stage 4 alternative path)
- [ ] **Subscription Integration:** Recurring monthly billing for non-leased items
- [ ] **Promo Code Entry:** Discount code field (not in current wireframes)
- [ ] **Invoice/PO:** Upload PO or generate invoice for expense tracking
- [ ] **Multi-Currency Support:** Display prices in EUR, GBP, CAD, etc.
- [ ] **Saved Addresses:** Reuse previous shipping addresses for repeat customers
- [ ] **Guest Checkout:** Skip assignment for one-time purchases

---

## Related Flows & Documents

- **[Cart Flow](./platform-cart.md)** - Item selection and quantity management
- **[Orders Flow](./platform-orders.md)** - Post-purchase order management and tracking
- **[People Flow](./platform-people.md)** - Team member management and assignment
- **[Leasing Agreement](./platform-leasing.md)** - Macquarie financing terms and conditions
- **[Logistics & Fulfillment](./platform-logistics.md)** - Shipment and delivery management
