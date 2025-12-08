# Equipped Platform: Proposals and Sharing Flow

## Overview

The Proposals feature enables team-based purchasing workflows by allowing users to create, review, and share equipment purchase proposals with stakeholders before committing to orders. Proposals can be generated from shopping carts or templates, shared with external parties for approval, and converted into actual orders once validated.

**Primary Use Case:** Teams need approval workflows for equipment purchases, especially when leasing or high-value items require decision-maker sign-off before procurement.

---

## 1. Proposal Generation and Creation

### Sources for Creating Proposals

Proposals can be initiated from two primary sources:

1. **From Cart** - Users can convert their current shopping cart into a proposal
   - Accessible from the main Cart view via "Share this cart" action
   - Preserves all selected items and quantities
   - Allows adding proposal metadata before sharing

2. **From Templates** - Pre-configured proposal templates can be used as a starting point
   - Faster for recurring equipment needs
   - Contains standardized item selections
   - Can be customized before sharing

### Proposal Metadata

When creating a proposal, users define:

- **Proposal Name/Title** - Descriptive label for the proposal
- **Items** - Equipment selections with quantities and specifications
  - Inherited from cart or template
  - Can be modified before sharing
- **Recipients** - Who the proposal is being shared with
- **For Whom** - Decision point determining proposal scope (see Section 6)

---

## 2. Proposal Management and Editing

### Editing Proposals

Before sharing, proposals can be modified:

- Add or remove items from the proposal
- Adjust quantities
- Change recipients or sharing parameters
- Update proposal metadata

### Proposal Status

Proposals have different statuses reflecting their lifecycle:

- **Draft** - Created but not yet shared
- **Shared** - Sent to recipients for review
- **Approved** - Recipient has validated the proposal
- **Rejected** - Recipient has declined the proposal
- **Converted** - Proposal has been converted to an order

### Storage and Access

- Proposals are stored within the team workspace
- Listed in the "Proposals" section of the navigation sidebar
- Accessible from the Orders management area
- Can be searched and filtered by status, date, or recipient

---

## 3. Proposal Sharing with External Parties

### Share Proposal Modal

The sharing flow is initiated from the cart and includes:

1. **Recipients Definition**
   - Enter email addresses of external stakeholders
   - Can specify multiple recipients
   - Recipients receive a unique, shareable link

2. **Sharing Mechanism**
   - Proposals are shared via email with a unique public link
   - Link includes proposal ID and read-only access token
   - Recipients don't need an Equipped account to view

3. **Sharing Metadata**
   - Proposal expiration date (optional)
   - Custom message to include in the email
   - Notification preferences

### "Who is This Proposal For?" Decision Point

Before sharing, users answer: **Who will use this equipment?**

This decision determines:

- **Assignment Scope**
  - Assign to a person - Equipment will be tracked to a specific team member
  - Leave unassigned - Equipment tracked at the team level

- **Impact on Proposal**
  - Affects how equipment is managed post-purchase
  - Influences assignment workflows in checkout
  - Determines tracking and responsibility in inventory

**Note:** This decision can be deferred to the checkout process if preferred.

---

## 4. Shared Proposal Viewing (Read-Only)

### External Recipient View

Recipients accessing the shared proposal link see:

- **Proposal Summary**
  - List of equipment items
  - Quantities and specifications
  - Total cost breakdown
  - Payment options (Buy, 24-Month Leasing, 36-Month Leasing)

- **Read-Only Access**
  - Cannot modify items or prices
  - Cannot change payment terms
  - Cannot convert directly to order

- **Action Options**
  - **Approve** - Validates the proposal, sends confirmation back to proposer
  - **Reject** - Declines the proposal with optional feedback
  - **Request Changes** - Asks for modifications before final approval (if enabled)

### Approval Workflow

1. External recipient reviews proposal
2. Recipient clicks "Approve"
3. Confirmation email sent to proposal creator
4. Proposal status changes to "Approved"
5. Proposer can now proceed to convert proposal to order

---

## 5. Conversion from Proposal to Order

### Two-Path Conversion Process

Once approved (or directly from draft), proposals convert to orders:

1. **From Approved Proposal**
   - Creator receives approval notification
   - Can click "Convert to Order" from proposal details
   - Proceeds directly to checkout with pre-filled items

2. **From Draft Proposal (without external approval)**
   - Creator can skip external sharing
   - Convert directly to order when ready
   - Useful for internal-only proposals

### Checkout Integration

When converting proposal to order:

1. **Pre-filled Cart**
   - All proposal items automatically added to cart
   - Quantities and specifications preserved
   - Payment method selection begins

2. **Assignment Step** (Step 1 of Checkout)
   - "Who will use this equipment?" question appears again
   - If decided during proposal creation, can be confirmed or changed
   - Options: Assign to person or leave unassigned

3. **Subsequent Checkout Steps**
   - Continue through standard checkout flow
   - Shipping details (Step 2)
   - Delivery options (Step 3)
   - Leasing approval (Step 4)

4. **Order Placement**
   - Final order created with status "Processing" or "Pending leasing approval"
   - Proposal marked as "Converted"
   - Order confirmation sent to all relevant parties

---

## 6. Who Proposals Are For (Decision Point)

### Two-Option Decision

Before or during checkout, users specify equipment assignment:

#### Option A: Assign It to Someone

- **Purpose:** Individual accountability and tracking
- **User Selection:** Choose from team members via dropdown
- **In Equipped:** Equipment is assigned to that person's profile
- **Benefits:**
  - Clear responsibility for equipment
  - Personal equipment management
  - Audit trail showing who owns what

#### Option B: Leave It Unassigned

- **Purpose:** Team-level equipment management
- **Use Case:** Shared or rotating equipment
- **In Equipped:** Equipment tracked at team level
- **Benefits:**
  - Flexible deployment across team
  - Suitable for shared resources
  - Can be assigned later

### Where This Decision Appears

1. **During Proposal Creation** (Optional)
   - "Who is this proposal for?" modal
   - Can be decided upfront or deferred

2. **During Checkout** (Required)
   - Step 1: Assignment
   - "Who will use this equipment?" question
   - Must select before proceeding to shipping

---

## 7. Expiration and Validity

### Proposal Lifecycle Timing

- **Validity Period** - Proposals can have optional expiration dates
  - Set during creation
  - Prevents indefinite approval windows
  - Typical ranges: 7, 14, 30 days

- **Expired Proposals**
  - Cannot be approved after expiration
  - Must be recreated if still needed
  - Status shows as "Expired"

- **Status Management**
  - Users can manually expire proposals
  - Archival without deletion
  - Audit trail preserved

### Notification Timing

- Shared proposal emails include expiration date
- Optional reminder notifications to recipients
- Creator notified when proposals expire

---

## 8. Integration with Shopping and Checkout Flows

### Cart to Proposal Connection

**Shopping Flow → Cart → Proposal**

1. User adds items to cart in Shop section
2. Cart displays "Share this cart" option
3. Clicking initiates proposal creation modal
4. User answers "Who is this proposal for?"
5. Cart converted to proposal with unique ID
6. Proposal shared with recipients via email

### Checkout Flow with Proposals

**Proposal Approval → Checkout → Order**

1. Proposal creator converts approved proposal to order
2. Checkout begins with cart pre-filled from proposal
3. Step 1: Assignment confirmation/change
4. Step 2: Shipping details collection
5. Step 3: Delivery options selection
6. Step 4: Leasing application (if applicable)
7. Order finalized with status tracking

### Proposal vs. Direct Checkout

- **With Proposal:** Multi-stakeholder approval before order
- **Without Proposal:** Single user direct to checkout
- **Hybrid:** Draft proposal, immediate conversion without external sharing

---

## 9. Proposal History and Status Tracking

### Proposal List View

Users access proposals from the team dashboard sidebar:

**Navigation Path:** Team Settings → Proposals

The proposals list shows:

- **Proposal ID/Number** - Unique identifier
- **Proposal Name** - User-defined title
- **Items Summary** - Count and summary of equipment
- **Status Badge**
  - Draft (in progress, not shared)
  - Shared (awaiting recipient action)
  - Approved (approved, ready to convert)
  - Rejected (declined by recipient)
  - Converted (order has been created)
  - Expired (no longer valid)

- **Recipient Info** - Who it was shared with
- **Date Created** - Proposal creation timestamp
- **Due Date** - Expiration date if applicable

### Proposal Detail View

Clicking a proposal shows:

- **Full Item List**
  - Equipment names and specifications
  - Quantities
  - Individual item costs
  - Total cost breakdown

- **Payment Options**
  - Buy option with total cost
  - 24-Month Leasing with monthly cost
  - 36-Month Leasing with monthly cost

- **Status Timeline**
  - Created date/time
  - Shared date/time
  - Approval/rejection date/time
  - Conversion date/time

- **Recipient Activity**
  - Email addresses of recipients
  - Delivery status (delivered, opened, clicked)
  - Approval status per recipient
  - Response timestamps

- **Actions Available**
  - Edit (if draft)
  - Share/resend
  - Convert to order
  - Archive/delete
  - Duplicate for similar future proposals

### Audit Trail

Every proposal maintains a complete audit trail:

- Who created it and when
- Who it was shared with
- When recipients opened/clicked
- Approval/rejection decisions and timestamps
- Any modifications made
- Conversion to order details

---

## Key Design Patterns

### Asynchronous Approval

Proposals enable asynchronous workflows:

- Proposer doesn't need to be present during approval
- Recipients can review in their own time
- Notifications keep both parties informed

### Role Flexibility

- **Proposer Role** - Team member initiating purchase
- **Approver Role** - External stakeholder (boss, budget owner, etc.)
- **Administrator Role** - Team manager viewing all proposals

### Cost Transparency

- All payment options visible upfront
- No hidden costs in proposals
- Recipients see exact financial commitment

### Audit and Compliance

- Complete history of all proposal actions
- Approval documentation for compliance
- Traceability from proposal to final order

---

## Related Flows

- **Shopping Flow** - Where items are initially selected
- **Cart Management** - Item organization before proposal creation
- **Checkout Flow** - Final order confirmation after proposal approval
- **Orders Management** - Post-purchase tracking and fulfillment
- **Team Settings** - Proposal access control and configuration

