# Platform Onboarding & First-Time User Experience Flow

## Flow Overview

The Platform Onboarding flow represents the critical user journey from account creation through the first successful purchase or lease, designed to get new users productive and confident on their initial visit. This flow establishes team context, validates billing capabilities, educates users on leasing options, and guides them through a complete equipment acquisition cycle while introducing platform features progressively.

**Primary Purpose:** Transform new users into active purchasers by providing clear guidance, minimal friction, and progressive disclosure of advanced features.

---

## 1. Account Setup & Initial Authentication

### Sign-Up Entry Point

New users enter through the authentication system:

- **Email-based registration** with verification
- **Account creation** with password requirements
- **Single-user context** initially (user becomes account owner)
- **Session establishment** for persistent authentication

### Initial Account State

Upon account creation, users receive:

- **Basic profile data** (name, email, initial password)
- **Account email verification** (activation via email link)
- **Default settings** (timezone, language, date format)
- **Single-team context** ready for company onboarding

---

## 2. Company Onboarding (Team Setup)

### Company Onboarding Flow Purpose

The Company Onboarding experience is triggered immediately after account verification and guides the primary account owner through critical team establishment steps. This is the **first true onboarding experience** new users encounter.

**Context:** A team admin discovers Equipped on Google, learns more on Equipped's website, creates an account, and sets up their team.

### Key Setup Steps

#### Step 1: Team Information Entry

Users configure foundational team identity:

- **Team Name** - Company or organization name (e.g., "Acme Corp")
- **Team Subdomain** - Custom URL path (tryequipped.com/acme-corp)
- **Legal Entity Information**
  - Company legal name (for contracts and leasing)
  - Employer Identification Number (EIN) for tax purposes
  - Business address (for shipping and leasing qualification)

#### Step 2: Team Avatar/Logo

Users establish visual identity:

- **Upload team logo** or company branding
- **Avatar generation** from initials if no logo provided
- **Visual consistency** throughout all team communications

#### Step 3: Business Integration (Optional but Encouraged)

Early introduction to enterprise capabilities:

- **Apple Business Manager (ABM) connection** - Link existing Apple accounts
- **Benefits explanation** - Simplified device management via ABM
- **Deferred setup** - Can be completed later in Team Settings

#### Step 4: Initial Team Member (Self)

Users confirm their role:

- **Account holder becomes Team Owner** automatically
- **Role display** - "Owner" badge visible
- **Full permissions** - Can invite others, manage billing, delete team
- **Email confirmation** - Verification of admin email address

### Milestone: Team Created

Upon completion:

- **Team dashboard becomes accessible**
- **Navigation switches to team context** (Team dropdown shows team name)
- **Team settings available** in account menu
- **User badge updates** with team context

---

## 3. Leasing Pre-Qualification Flow

### Purpose & Timing

Early leasing qualification serves multiple goals:

1. **Determine eligibility** before users spend time configuring orders
2. **Build confidence** in leasing as viable payment option
3. **Skip qualification during checkout** if pre-approved
4. **Disqualify early** if leasing won't work (saves frustration)

### Trigger Point: "Pre-apply for Leasing" Button

Located on Shop page with "Want to lease?" information banner:

- **Prominent, non-intrusive** call-to-action
- **Available before any product is added to cart**
- **Saves qualification status** to user account
- **Expedites later leasing purchases**

### Pre-Qualification Form

Users provide information for leasing partner (e.g., Macquarie):

**Business Information:**
- Company legal name (auto-filled from team setup)
- Business address and zip code
- Type of business
- Annual revenue range
- Years in business

**Decision-Maker Information:**
- Full name
- Title/position
- Phone number
- Email address

**Desired Lease Terms:**
- Preferred lease length (24 or 36 months)
- Estimated monthly lease amount
- Number of devices

### Submission & Status

Users receive immediate feedback:

- **"Pending leasing approval" status** shown in user profile
- **Notification when decision is made** (approval or decline)
- **Leasing option enabled/disabled** for future purchases based on result
- **Second leasing purchase path** available only if pre-approved

---

## 4. Shopping & Product Selection (First Purchase)

### Shop List Entry

Users navigate to Shop to begin their first purchase:

- **Browse product catalog** with filtering (category, search)
- **View pricing in three modes:** Buy, 24-month lease, 36-month lease
- **Color variant availability** at a glance
- **Product specifications** clearly displayed

### Product Selection Journey

#### Scenario A: Simple Direct Purchase

1. **Browse Shop List**
   - Select category (Mac → MacBook Air)
   - Review product cards with pricing
   - Hover states show add-to-cart prompt

2. **Click Product**
   - Opens Product Detail page
   - Large product image (left side)
   - Configuration panel (right side)

3. **Configure Product**
   - Select color (4 options: Midnight, Starlight, Space Gray, Silver)
   - Choose AppleCare+ coverage (None, Basic, Theft & Loss)
   - Customize specs if needed (processor, memory, storage, keyboard)
   - Review pricing for all three payment options
   - Set quantity (1-N devices)

4. **Add to Cart**
   - Click primary blue button: "Add to cart"
   - Toast notification confirms: "1 MacBook Air M2 has been added to your cart"
   - Cart badge in header updates
   - "View cart" button available in notification

5. **Continue or Proceed**
   - Option to browse more products
   - Option to view cart and continue checkout

#### Scenario B: Leasing-First Purchase (First Leasing Purchase)

**Context:** User has pre-qualified for leasing and wants to purchase via lease.

1. **Shop & Configure** (same as above)
   - Product page prominently shows leasing prices
   - "How leasing works?" helper text and link
   - Leasing option clearly differentiated in pricing section

2. **Choose Leasing Term**
   - 24-month lease: Clear monthly cost
   - 36-month lease: Lower monthly rate for longer commitment
   - Understand trade-offs between terms

3. **Assign to Team Member (Unique to Leasing)**
   - **"Assign to teammate" dropdown** appears for leased devices
   - Select team member from list
   - Device will be assigned to them upon delivery
   - Streamlines equipment management post-delivery

4. **Select Delivery Address**
   - Choose from saved team addresses (or add new)
   - Custom delivery date selection
   - Delivery instructions field (optional)

5. **Add to Cart & Continue**
   - Same confirmation flow as direct purchase
   - Leasing terms preserved in cart line item
   - Ready to proceed to checkout

### Feature Walkthroughs & Tooltips

Progressive disclosure of advanced features:

**On Product Detail Page:**
- **AppleCare+ explanation** - Hover or click "Learn more" for coverage details
- **Leasing information** - Click "How leasing works?" for modal explaining terms
- **Customization guidance** - "Why customize?" explains processor/memory/storage trade-offs
- **Bulk pricing** - Tooltip for quantity discounts (if applicable)

**On Shop Page:**
- **Category explanation** - Help text for Mac categories (Air = portable, Pro = powerful)
- **Price comparison** - "Why 3 prices?" explains buy vs. leasing
- **Color notes** - Labels for color availability and restrictions

---

## 5. Cart & Checkout Experience

### Cart Summary

User reviews first purchase before payment:

**For Each Item:**
- Product name and specs
- Color and configuration summary
- Quantity
- Unit price and line total
- Payment method (Buy, 24-month lease, or 36-month lease)
- For leased items: assigned team member and delivery address

**Cart Totals:**
- Subtotal
- Tax (calculated based on delivery address)
- Estimated shipping
- **Total amount due** (prominent)

**Actions:**
- Continue shopping button
- Proceed to checkout button
- Edit item details
- Remove items

### Checkout Flow

#### Payment Method Selection

**For Direct Purchases:**
- Select payment method from saved cards
- Add new card if needed:
  - Card number (PCI-compliant tokenization)
  - Expiration date
  - CVV
  - Billing name and address
- Set as default payment method (optional checkbox)

**For Leasing:**
- Payment method required but used for potential defaults/deposits
- Leasing approval status displayed prominently
- If pre-approved: automatic leasing terms applied
- If not pre-approved: option to "Apply for leasing now" triggers qualification flow mid-checkout

#### Delivery & Shipping Information

- **Delivery address** (auto-filled from team settings or previous orders)
- **Delivery date options** - Select preferred delivery window
- **Special instructions** - Notes for delivery (room location, access info, etc.)
- **Signature requirement** - Checkbox for high-value items

#### Order Review & Confirmation

Final summary before payment:

- All products, quantities, and prices
- Leasing terms clearly stated
- Delivery address and date
- Payment method
- "Place order" button (prominent, final CTA)

#### Order Confirmation

Upon successful payment:

- **Order confirmation page** with:
  - Order number
  - Estimated delivery date
  - Product list and costs
  - Confirmation email sent immediately
  - "Track order" button or link
  - "Continue shopping" option

---

## 6. Second Leasing Purchase (Repeat Leasing Order)

### Purpose & Timing

The Second Leasing Purchase flow is specifically designed for users who've successfully completed one leasing order and now want to add more devices under existing leasing agreements.

**Context:** User orders multiple MacBooks, ships to default business address, finances via existing leasing agreement.

### Simplified Entry Point

Users with existing leasing agreements see enhanced experience:

- **Leasing agreement badge** on their profile ("Active with Macquarie")
- **Quick-reorder functionality** for additional equipment
- **Bulk order discounts** available for large quantities
- **Expedited approval** (already qualified)

### Key Differences from First Purchase

#### Streamlined Product Configuration

1. **Browse & Configure** (same as first purchase)
   - All product and customization steps identical
   - No re-qualification needed

2. **Automatic Leasing Terms**
   - Previous lease terms pre-selected (24 or 36 months)
   - "Change terms?" link if different timing desired
   - Financing method pre-set to existing agreement

3. **Team Member Assignment (Simplified)**
   - "Assign to teammates" multi-select available
   - Order multiple quantities and assign to different team members
   - Add new team members directly from dropdown
   - Batch assignment for multiple identical configs

4. **Delivery to Default Address**
   - **Default business address pre-selected** from first order
   - "Ship to different address?" option if needed
   - Can still customize delivery date
   - Single click to confirm address

5. **Express Checkout**
   - Minimal form fields
   - Pre-filled from previous orders
   - "Complete order" button instead of "Place order"
   - Same confirmation email sent

### Milestone: Leasing Agreement Established

Upon completion of second leasing order:

- **"Leasing agreement active" status** in profile
- **Macquarie logo and agreement details** displayed
- **Upcoming lease payments** shown in billing section
- **Automatic monthly invoicing** begins
- **Equipment tracking** ties devices to leasing agreement

---

## 7. Initial Profile Completion

### Automatic Data Capture

The onboarding flow captures data across multiple steps:

**From Team Setup:**
- Team name, subdomain, legal name, EIN, business address
- Logo/avatar
- Team owner (account holder)

**From Shopping:**
- Delivery address(es)
- Product preferences (colors, specs, customizations)

**From Checkout:**
- Payment method(s)
- Billing address

**From Leasing (if applicable):**
- Leasing partner information
- Lease term preferences
- Equipment assignment patterns

### Optional Profile Enhancement

Users can enrich their profile post-purchase:

**Personal Profile (Account Settings → "My settings"):**
- Upload personal avatar (initial-badge used as default)
- Set display name preferences
- Theme selection (light/dark mode)
- Language preference
- Timezone and date format

**Team Profile (Team Dropdown → Team settings):**
- Add team description
- Upload team banner/cover image
- Configure team subdomain (URL)
- Add social media links (optional)

### Completion Badges & Progress

Visual indicators encourage profile completion:

- **Profile completion percentage** (e.g., "40% complete")
- **Quick action cards** for missing information:
  - "Add a team member" (People section)
  - "Upload your logo" (Team settings)
  - "Connect Apple Business Manager" (Integrations)
- **"Profile unlocks" notifications** when hitting milestones

---

## 8. Payment Method Setup & Verification

### First Payment Method (During Checkout)

Established during first purchase:

- **Credit/debit card entry** with PCI-compliant tokenization
- **Billing address** (same as shipping or separate)
- **Security verification** (CVV)
- **"Save for future purchases" checkbox** (enabled by default)
- **Set as default** option

### Payment Method Verification

After card entry:

- **Verification charge** (small $1-2 charge to verify card is active)
- **User confirms verification code** via email or SMS
- **Card marked as verified** in payment methods
- **Automatic removal** of declined verification cards

### Adding Additional Payment Methods

Available in Team Settings → Payment methods:

- **"Add payment method" button**
- Same PCI-compliant form as checkout
- Can set as default for future orders
- Multiple cards support team flexibility

### Payment Security Features

- **Automatic expiration alerts** (90 days before expiration)
- **Failed payment recovery** - Retry on next billing cycle
- **Payment history** visible in Billing section
- **Invoice download** as PDF for accounting

---

## 9. Leasing Pre-Qualification Details

### Pre-Qualification Trigger

"Pre-apply for leasing" button on Shop page:

- **No cart required** - Available immediately on entering Shop
- **Modal dialog** opens with pre-qualification form
- **Non-intrusive** - Doesn't interrupt shopping flow
- **Savable** - Can abandon and return later

### Form Sections

#### Business Information

- **Company legal name** (auto-filled from team setup)
- **Business type** (dropdown: C-Corp, LLC, S-Corp, Non-Profit, Other)
- **Years in business** (number input or dropdown: <1, 1-3, 3-5, 5+)
- **Annual revenue range** (checkbox group: <$500k, $500k-$2M, $2M-$10M, $10M+)

#### Contact Information

- **Full name** (auto-filled from account profile)
- **Title/position** (text input: Owner, CFO, Manager, Other)
- **Phone number** (with country code selector)
- **Email address** (auto-filled, can be edited)

#### Lease Preferences

- **Preferred lease term** (radio: 24 months or 36 months)
- **Estimated monthly payment** (range: $0-$5,000)
- **Number of devices** (estimate: 1-5, 5-20, 20+)

### Submission & Immediate Feedback

Upon submission:

- **"Submitted successfully" toast** notification
- **User directed back to Shop** to continue browsing
- **Status updated** to "Pending leasing approval"
- **Notification preferences** - User marked for approval notification

### Approval/Decline Notification

Users receive email notification:

**If Approved:**
- Subject: "You're approved to lease with Equipped + Macquarie!"
- Body explains approval details and next steps
- Leasing option now enabled for all purchases
- "View shop" button directs to Shop for immediate use

**If Declined:**
- Subject: "We've reviewed your leasing application"
- Explains decision (no contact provided per vendor rules)
- Alternative payment options highlighted
- "Apply again in 6 months" information
- Link to contact support for questions

---

## 10. Progressive Feature Disclosure

### First Visit: Core Features Only

Minimal UI on first visit to avoid overwhelm:

- **Shop navigation** (browse products)
- **Add to cart** (purchase products)
- **Checkout** (payment and delivery)
- **Account menu** (profile and settings)

### Second Visit: Team Features

After first purchase, team-oriented features appear:

- **People section** - Invite team members
- **Orders history** - View past purchases
- **Delivery addresses** - Manage locations
- **Team settings** - Configure team

### Third Visit: Advanced Features

After second purchase, power-user features unlock:

- **Proposals** (create custom product bundles)
- **Equipment inventory** (track devices per person)
- **Integration connections** (Apple Business Manager, etc.)
- **Analytics & reporting** (purchase trends, usage patterns)

### Feature Walkthroughs

In-app tooltips and modals guide users:

- **On first Shop visit:** "Welcome to the product catalog - search by product name or browse by category"
- **On first checkout:** "Delivery address is required for shipping - select from saved addresses or add a new one"
- **On Account menu first open:** "Your account and team settings are here - you can manage billing, team members, and more"

### Disabled Features with Explanations

Features not yet relevant show "disabled" state:

- **Proposals** - "You'll unlock proposals after your first purchase (shows why it's useful)"
- **Reports** - "Generate purchase reports after 30 days of activity"
- **Custom integrations** - "Contact support to enable enterprise integrations"

---

## 11. Integration with Authentication & Shopping Flows

### Authentication Flow Integration

**Sign-Up Path:**
```
Landing Page → Sign Up (email) → Email Verification → Account Created
  ↓
Company Onboarding (team setup)
  ↓
Shop (first product browsing)
```

**Login Path (Returning Users):**
```
Login Page → Email/Password → Session Established
  ↓
Dashboard (if team selected) or Team Selection
  ↓
Continue to requested page or Shop
```

### Session Management

- **Auto-login after signup** - No need to login again after account creation
- **Session persistence** - "Remember me" option on login
- **Team context persistence** - Last selected team remembered
- **Logout clears session** - Available in Account menu dropdown

### Shopping Flow Integration

**From Onboarding → Shopping:**
```
Company Onboarding Complete
  ↓
"Let's get equipment" CTA or Shop navigation
  ↓
Browse Products
  ↓
Product Detail
  ↓
Add to Cart
  ↓
Checkout
  ↓
Order Confirmation
```

**Key Integrations:**
- Team data (name, address) auto-fills shipping/billing forms
- User profile (email, phone) pre-populated during checkout
- Payment methods (from previous orders) listed in checkout
- Leasing pre-qualification status checked during checkout

---

## 12. Completion Milestones & Achievement Badges

### Onboarding Milestones

Users unlock achievements as they progress:

#### Milestone 1: "Welcome to Equipped" (Account Created)
- **Condition:** Email verified
- **Badge:** Checkmark icon
- **Reward:** "You're all set!" confirmation page
- **Next step:** Suggested: "Set up your team"

#### Milestone 2: "Team Leader" (Team Created)
- **Condition:** Complete company onboarding
- **Badge:** Team icon + team name
- **Reward:** Toast: "Team created successfully!"
- **Unlocks:** Team management features

#### Milestone 3: "First Order Placed" (First Purchase)
- **Condition:** Checkout completed, payment processed
- **Badge:** Shopping bag with "1" indicator
- **Reward:** Toast: "Order confirmed! Track delivery in your Orders"
- **Unlocks:** Equipment inventory, Order history

#### Milestone 4: "Leasing Approved" (Pre-Qualification Accepted)
- **Condition:** Leasing application approved by vendor
- **Badge:** Lease agreement icon
- **Reward:** Email notification + in-app banner
- **Unlocks:** Leasing purchase option, Faster checkout for future leases

#### Milestone 5: "Team Builder" (First Team Member Invited)
- **Condition:** Invite sent and accepted by team member
- **Badge:** Two-person icon
- **Reward:** "Welcome your team member!" notification
- **Unlocks:** Equipment assignment, Permission management

#### Milestone 6: "Power User" (5 Orders or More)
- **Condition:** Fifth order placed (buy or lease)
- **Badge:** Lightning bolt icon
- **Reward:** Email: "You're a power user now!"
- **Unlocks:** Bulk ordering, Priority support, Custom proposals

### Achievement Display

Badges appear in multiple places:

- **Profile page** - "Your achievements" section shows earned badges
- **Dashboard** - Progress bar toward next milestone
- **Share option** - "Share your achievement" for social proof
- **Team page** - Shows team's collective achievements

### In-Onboarding Prompts

Nudge users toward next milestones:

- **"Invite a team member now"** - Card with benefits after first purchase
- **"Pre-apply for leasing"** - Prominent if not yet applied
- **"Upload your team logo"** - Customization prompt in Settings
- **"Complete your profile"** - Percentage-complete card in dashboard

---

## 13. Completion Criteria & Success Metrics

### Onboarding Completion

Users are considered "successfully onboarded" when they've:

1. **✓ Created account** and verified email
2. **✓ Set up team** with company information
3. **✓ Browsed products** (viewed at least 3 products)
4. **✓ Completed first purchase** (order placed and paid)
5. **✓ Confirmed delivery address** (provided or selected)

**Time to completion:** Typically 15-30 minutes from signup to confirmed order

### Success Indicators

**Behavioral metrics:**
- Users reach Shop page within 5 minutes of signup
- Users add first product to cart within 10 minutes
- Users complete checkout within 20 minutes
- No cart abandonment during checkout
- Users return within 7 days for second purchase

**Engagement metrics:**
- Users invite first team member within 30 days (50% do)
- Users pre-apply for leasing within 14 days (30% do)
- Users create second order within 60 days (60% do)
- Users explore team settings before second purchase (40% do)

**Satisfaction metrics:**
- First purchase NPS score (target: >50)
- Support ticket reduction (post-onboarding vs. during)
- Feature utilization within 90 days

### Retention Milestones

- **Day 3:** 80% of new users return (expected)
- **Day 7:** 50% of new users make second purchase or start configuration
- **Day 30:** 75% of new users have invited team members
- **Day 90:** 60% are active monthly users

---

## 14. Common Onboarding Paths & Scenarios

### Path 1: Solo Direct Buyer
**Profile:** Freelancer or small team needing immediate equipment

1. Sign up with work email
2. Create personal team
3. Browse shop (skip leasing pre-qualification)
4. Add single MacBook to cart
5. Checkout with credit card
6. Receive order confirmation

**Duration:** 15 minutes | **Completion:** Purchase only

### Path 2: Small Company with Leasing
**Profile:** 5-10 person startup needing multiple devices on lease

1. Sign up as team owner
2. Create company team (full details, EIN, etc.)
3. Pre-apply for leasing (while browsing)
4. Receive leasing approval email (next day)
5. Add 5 MacBooks to cart, assign to team members
6. Checkout with leasing terms
7. Invite team members to manage devices

**Duration:** 2-3 interactions over 2 days | **Completion:** Purchase + Team setup

### Path 3: Enterprise Bulk Buyer
**Profile:** Large org with procurement team and existing budget

1. Team admin signs up
2. Creates enterprise team
3. Connects Apple Business Manager
4. Browses catalog and creates proposal
5. Circulates proposal to stakeholders
6. Approval received (external process)
7. Places bulk order via proposal
8. Invites procurement and finance teams

**Duration:** 3-7 days with external approvals | **Completion:** Complex purchase + Team structure

### Path 4: Leasing-First Path
**Profile:** Company exploring leasing before committing budget

1. Sign up and create team
2. Immediately click "Pre-apply for leasing"
3. Wait for approval
4. Upon approval, explore product catalog
5. Place first small order to test service
6. Receive device and test leasing experience
7. Place larger second order when comfortable

**Duration:** 1-2 weeks | **Completion:** Multi-order leasing setup

### Path 5: Mobile/Quick Purchase
**Profile:** User in a hurry (via mobile or quick desktop session)

1. Sign up minimally (email only, password)
2. Create team with minimal info (name only)
3. Quickly add one product (default config)
4. Checkout with new payment method
5. Set up full profile and team later (prompted)

**Duration:** 10 minutes | **Completion:** Order, deferred profile setup

---

## 15. Error Handling & Edge Cases

### Failed Leasing Pre-Qualification

**Scenario:** User pre-applies for leasing but is declined

- **Email notification** clearly states decision
- **"Buy option remains available"** emphasized
- **"Learn more" link** to support for questions
- **"Apply again in 6 months"** encouragement for future

### Payment Method Declined During Checkout

**Scenario:** Credit card declined at payment processing

- **Clear error message** explaining decline reason (insufficient funds, etc.)
- **"Try another card" button** - Add different payment method
- **Cart preserved** - No loss of product selection
- **Support contact** - Phone/chat for assistance

### Incomplete Team Information

**Scenario:** User skips company onboarding or provides partial info

- **Warning banner** - "Complete your team info for leasing eligibility"
- **Lean mode** - Can still purchase, but limited to direct buy
- **Prompt** - Revisit team setup in settings
- **Leasing unavailable** until EIN and full address provided

### Delivery Address Issues

**Scenario:** Leasing requires delivery address; user skips team setup

- **Checkout blocks** - Cannot proceed without valid address
- **Quick address form** - Instead of full team setup
- **Save for future** - Address saved to team profile automatically

---

## 16. Accessibility & Progressive Enhancement

### Keyboard Navigation

All onboarding flows fully accessible via keyboard:

- Tab through form fields in logical order
- Enter/Space to activate buttons
- Escape to close modals
- Arrow keys for dropdown selections
- Screen reader announcements for status updates

### Form Accessibility

- **Labels clearly associated** with form fields
- **Required fields marked** with asterisk and aria-required
- **Error messages** linked to form fields
- **Placeholder text** supplements labels, not replaces
- **Color not only differentiator** - Error states use icons too

### Mobile Responsiveness

Onboarding optimized for all screen sizes:

- **Mobile-first checkout** - Touch-friendly buttons and inputs
- **Stack layout** - Forms stack vertically on small screens
- **Readable text** - Minimum 16px font on mobile
- **Modal optimization** - Full-screen modals on mobile
- **Touch targets** - Minimum 44x44px buttons/links

### Progressive Enhancement

- **Core functionality** works without JavaScript (form submission)
- **Enhanced UX** with client-side validation and instant feedback
- **Offline mode** - Critical data cached (team info, cart)
- **Fallback states** - Clear errors if API unavailable

---

## 17. Success Notifications & User Feedback

### Toast Notifications

Immediate feedback for key actions:

**Account Created:**
- "Welcome! Check your email to verify your account"
- Auto-dismiss after 5 seconds
- "Resend verification" link if needed

**Team Created:**
- "Team 'Acme Corp' created successfully!"
- Action button: "Invite team members" or "Go to shop"

**Product Added to Cart:**
- "1 MacBook Air M2 added to your cart"
- Action button: "View cart" or "Continue shopping"

**Order Placed:**
- "Order confirmed! Order #12345"
- Subtext: "Confirmation email sent to [email]"
- Action button: "Track order"

**Leasing Application Submitted:**
- "Application submitted! We'll notify you within 24 hours"
- Subtext: "Check your email for status updates"

**Payment Method Added:**
- "Payment method saved successfully"
- Subtext: "Card ending in 4242 is now available"

### Modal Confirmations

Confirmations for significant actions:

**Before Submitting Leasing Application:**
- Title: "Ready to apply for leasing?"
- Summary of provided information
- "Edit information" or "Submit application" buttons

**Before Placing Order with Leasing:**
- Title: "Confirm your leasing order"
- Summary of terms (monthly payment, duration, devices)
- "Edit order" or "Place order" buttons

**Before Completing Team Setup:**
- Title: "Finish setting up your team?"
- Summary of team info entered
- "Back" or "Complete setup" buttons

### Email Notifications

Transactional emails for confirmation:

**Account Verification Email:**
- Subject: "Verify your Equipped email"
- Clear verification link
- Expiration: 24 hours
- "Didn't request this?" link

**Order Confirmation Email:**
- Order number and date
- Product list with prices
- Delivery address and estimated date
- "Track your order" link
- Invoice PDF attached

**Leasing Decision Email:**
- Clear approval or decline statement
- If approved: Next steps, leasing terms
- If declined: Alternative options, reapply info
- Contact support link

---

## 18. Performance & Optimization

### Onboarding Load Times

Target metrics:

- **Page load:** < 2 seconds
- **Form submission:** < 1 second (with feedback)
- **Cart addition:** < 500ms
- **Checkout initialization:** < 1 second

### Optimization Strategies

- **Pre-load product catalog** during team setup
- **Lazy-load product images** on shop page scroll
- **Cache user preferences** locally (theme, language, etc.)
- **Prefetch checkout** resources when cart item added
- **Compress product images** (WebP, responsive sizes)

### Data Optimization

- **Minimal data transfer** during onboarding (~150KB initial payload)
- **Incremental loading** of product catalog
- **Session storage** for cart (persists across page reloads)
- **Local caching** of form data (auto-save during entry)

---

## 19. Post-Onboarding Engagement

### First-Week Activities

Suggested actions after onboarding completion:

- **Day 1:** "Your order is on the way - track it here"
- **Day 3:** "Invite your first team member - share access and assign devices"
- **Day 7:** "Explore advanced features - create proposals, manage equipment"

### First-Month Milestones

Progressive engagement throughout first month:

- **Week 1:** Order arrives, device assignment
- **Week 2:** Second device added or team member invited
- **Week 3:** Equipment inventory management
- **Week 4:** Reporting and usage insights

### Educational Content

Users receive contextual education:

- **Product guides** - "How to customize MacBooks for your use case"
- **Leasing explainers** - "Leasing vs. buying comparison"
- **Team management** - "Roles and permissions best practices"
- **Apple Business Manager** - "ABM integration benefits"

---

## 20. Key Integration Points Summary

### With Authentication System
- Account creation triggers onboarding initiation
- Email verification required for account activation
- Session management maintains user throughout flow
- Multi-team support available immediately post-signup

### With Shopping System
- Products auto-load on Shop entry
- Cart persists across sessions
- Customization options available from product detail
- Pricing shown in three payment modes

### With Checkout System
- Team data auto-fills shipping/billing
- Leasing terms integrated in payment selection
- Team member assignment available for leased devices
- Delivery address management linked to team settings

### With Account Settings
- Profile completion prompts throughout onboarding
- Team setup directly integrates with account
- Payment methods saved for future orders
- Preferences (language, timezone) available immediately

### With Team Management
- Team created during onboarding
- Team context immediately available
- Member invitations encouraged post-first-purchase
- Team settings accessible from account menu

---

## Design Principles

1. **Progressive Disclosure** - Show only what's needed at each step; advanced features hidden until relevant

2. **Fast to First Purchase** - Core onboarding can be completed in 15-20 minutes; deferred setup available

3. **Clear Value Prop** - Each step explains why it's needed (e.g., "We need your business address for leasing qualification")

4. **Minimal Friction** - Required fields only; optional setup deferred to settings

5. **Leasing Integration** - Leasing pre-qualification available early but not mandatory

6. **Team-Centric** - Team context fundamental from setup; single user becomes team owner

7. **Mobile-First** - All flows optimized for mobile as primary platform

8. **Feedback & Confirmation** - Every action produces clear feedback (toast, email, status update)

9. **Accessible** - Full keyboard navigation, screen reader support, mobile friendly

10. **Data Reuse** - Data entered once (team setup) reused throughout flows (checkout, shipping, billing)

---

## Related Documentation

- **Authentication Flow** - Account creation, email verification, session management
- **Shopping & Product Browsing Flow** - Product discovery, selection, customization
- **Cart & Checkout Flow** - Order summary, payment selection, confirmation
- **Team Management Flow** - Team creation, member management, roles
- **Account Settings Flow** - Profile management, preferences, billing
