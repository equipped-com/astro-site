# Orders & Order History Flow

## Overview

The Orders flow enables users to view, track, and manage their equipment orders throughout their lifecycle. This system supports both leasing and purchase payment models, provides real-time status tracking, and facilitates returns and cancellations. The flow is integrated with Account Management and Checkout systems.

**Key Purpose:** Allow users to maintain visibility into order status, track shipments, initiate returns, and manage their complete order history from placement through delivery.

---

## Order List Display & Filtering

### Orders List Page

The main Orders page displays all team orders in a chronological list format with key filtering and search capabilities.

**Key Elements:**

- **Main Heading:** "Orders" with order count context
- **Filter Tabs:**
  - All orders (8) - Shows complete order history
  - Processing (3) - Orders in active fulfillment stages
  - Delivered (5) - Successfully completed orders
  - Cancelled (0) - Cancelled or returned orders

- **Search Functionality:** Search bar for quick order lookup by order number or item name

**Order Card Display (List View):**

Each order card shows:
- Order number and status summary (e.g., "Order #1427")
- Current status with expected delivery date
- Equipment details (product names with quantities)
- Assignment and delivery information
- Order date and payment model/amount
- Right arrow for expanding to detail view

**Example Card:**
```
Order #1427
Pending leasing approval. Delivery by June 27, 2023.

MacBook Pro M2 Pro, 14-inch | AppleCare+ for Mac | Studio Display
Assign to Leon Quigley | Deliver to Colin Bosco, Acme Corporation, 1 Infinite Loop, Cupertino, CA 95014, USA
Placed on June 22, 2024 | 24-month leasing | $117.23/mo.
```

---

## Order Detail Views

### Order Detail Page

Clicking an order card navigates to the full order detail page with comprehensive information.

**Page Layout:**

- **Breadcrumb Navigation:** "Back to orders" link for returning to list
- **Order Header:**
  - Order number (e.g., "Order #1229")
  - Meta grid: Order placed date, Order number, Payment method, Total amount

- **Item Section:**
  - Product images (left side placeholder)
  - Product details (right side):
    - Product name and monthly/unit price
    - Technical specifications (CPU, GPU, RAM, storage)
    - MPN and serial number
    - Status timeline (visual progression bar)
    - "Track shipment" link for shipped items

**Item Status Timeline:**

Shows four progressive stages:
1. Order placed (initial state)
2. Preparing to ship (processing)
3. Shipped (in transit)
4. Delivered (completed)

Each stage can be highlighted to show current position in fulfillment.

### Order Information Section

Below items, the order detail shows comprehensive metadata:

- **Ordered by:** Primary contact name
- **Assign to:** Team member recipient
- **Delivery method:** Shipping type (e.g., Standard Delivery)
- **Contact Information:**
  - Shipping update recipients with email and phone
  - Receipt email address(es)
- **Delivery Address:** Full shipping address
- **Billing Address:** Separate billing address if different from delivery

### Order Summary

**Financial Breakdown:**
- Subtotal: Equipment costs
- Shipping: Delivery costs
- Taxes: Applicable taxes
- Due today: Amount due immediately
- **Monthly total (for leasing):** Recurring monthly charge OR
- **Total (for purchase):** Full payment amount

**Actions:**
- "Cancel order" link (for cancellable orders)

---

## Order Status Tracking

### Status States & Transitions

Orders flow through distinct status states from creation to completion or cancellation.

**Standard Order Progression:**

1. **Order placed** - Order created and pending processing
2. **Pending leasing approval** - For leasing orders, awaiting approval from leasing company
3. **Pending payment** - Awaiting payment confirmation
4. **Preparing to ship** - Order being packed and prepared
5. **Shipped** - In transit to delivery address
6. **Delivered** - Successfully received by recipient
7. **Cancelled** - Order cancelled before fulfillment (terminal state)
8. **Returned** - Successfully returned by recipient (terminal state)

**Payment Model Differences:**

- **Purchase Orders:** Flow: Order placed → Pending payment → Preparing to ship → Shipped → Delivered
- **Leasing Orders:** Flow: Order placed → Pending leasing approval → Pending payment → Preparing to ship → Shipped → Delivered

**Status Indicators:**

- Visual timeline bars show current position
- Status text appears prominently (e.g., "Shipped. Delivery by June 27, 2023.")
- Color coding (implied): Active stages highlighted, completed stages muted

### Status Display in List View

Order cards show condensed status summary with delivery timeframe:
- "Pending leasing approval. Delivery by June 27, 2023."
- "Preparing to ship. Delivery by June 26, 2023."
- "Delivered."
- "Cancelled."

---

## Order Actions

### Primary Actions (Per Order)

**From Order Detail View:**

1. **Track Shipment**
   - Available when order status is "Shipped"
   - Opens shipment tracking interface
   - Provides carrier information and real-time tracking updates
   - Delivery estimate display

2. **Cancel Order**
   - "Cancel order" link visible at bottom of order detail
   - Available for orders in pre-shipment states
   - Requires confirmation before cancellation
   - Transitions order to "Cancelled" state

3. **Initiate Return** (implied from status flow)
   - Available for delivered orders
   - Accessible via return flow (separate from main order detail)

### Secondary Actions

- **Search Orders** - Quick lookup from list view
- **Filter by Status** - Narrow order list to specific stages
- **Back Navigation** - Return to orders list from detail view

---

## Return & Cancellation Flows

### Cancellation Flow

**Eligibility:**
- Available before shipment begins ("Preparing to ship" stage or earlier)
- Not available for shipped or delivered orders

**Process:**
1. User clicks "Cancel order" on order detail page
2. Confirmation dialog appears
3. Upon confirmation, order state changes to "Cancelled"
4. Order moves to "Cancelled" tab in order list
5. User notification sent (email/in-app)

**Cancellation Effects:**
- For leasing: Cancels recurring monthly charges
- For purchase: Cancels one-time payment and refunds processing
- Removes order from "Processing" tab (moves to "Cancelled" tab)

### Return Flow

**Eligibility:**
- Available after order is delivered
- Initiated by user after receiving equipment

**Process:**
1. User selects "Return" action on delivered order
2. Return reason selection (defective, wrong item, no longer needed, etc.)
3. Return shipping instructions provided
4. RMA (Return Merchandise Authorization) number generated
5. Order status transitions to "Returned" state
6. Refund processed or leasing adjustment applied

**Return Status:**
- Orders with status "Returned" appear in "Cancelled" tab
- Return tracking available alongside shipment tracking

---

## Integration with Other Flows

### Account & Team Management

**Integration Points:**

- **User Context:** Orders scoped to current team/account (company)
- **Team Settings:** Access to Orders from main sidebar (Account → Orders)
- **User Assignment:** Orders assigned to specific team members for delivery
- **Contact Preferences:** Shipping and receipt notification recipients from People/Contact settings
- **Delivery Addresses:** Drawn from team's Delivery addresses settings

### Checkout Flow

**Connection:**

- Orders originate from completed Checkout flow
- Order detail recreates checkout information:
  - Equipment selections (items, quantities, specs)
  - Delivery address selection
  - Payment method used
  - Total and line-item pricing
- Order becomes historical record of transaction
- Returns flow connects back to Checkout for refund processing

### Notifications & Updates

**Integrated Notifications:**

- Order confirmation sent to specified recipients
- Status change notifications (pending approval, shipped, delivered)
- Shipping updates sent to designated email/phone contacts
- Return confirmations upon cancellation or return completion
- Delivery notifications upon arrival

---

## Notification States for Order Updates

### Notification Types

**1. Order Confirmation**
- Triggered: When order is first placed
- Recipients: "Send receipts to" email addresses
- Content: Order summary, payment confirmation, delivery timeline

**2. Status Update Notifications**

- **Pending Leasing Approval** (Leasing only)
  - Notification: "Your order is pending leasing company approval"
  - Recipients: Order contact(s)
  - Action: Wait for approval or contact support

- **Pending Payment**
  - Notification: "Payment required to proceed with order"
  - Recipients: Billing contact(s)
  - Action: Complete payment authorization
  - CTA: Link to payment page/method

- **Preparing to Ship**
  - Notification: "Your order is being prepared for shipment"
  - Recipients: Delivery contact(s)
  - Content: Expected ship date

- **Shipped**
  - Notification: "Your order has shipped"
  - Recipients: "Send shipping updates to" email/phone
  - Content: Tracking number, carrier, estimated delivery date
  - CTA: "Track shipment" link

- **Delivered**
  - Notification: "Your order has been delivered"
  - Recipients: Recipient and order contacts
  - Content: Delivery confirmation, delivery date/time
  - Optional: Photo proof of delivery

- **Cancelled**
  - Notification: "Your order has been cancelled"
  - Recipients: All order contacts
  - Content: Cancellation reason (if user-initiated)
  - Refund timeline (if applicable)

- **Returned**
  - Notification: "Your return has been received and processed"
  - Recipients: All order contacts
  - Content: RMA number, refund amount/timeline, restocking info

**3. Delivery Issues**
- Notification: Delivery attempt failures, address corrections needed
- Recipients: Delivery contact
- Action: Provide updated delivery information or reschedule

**4. Proactive Outreach**
- Pre-delivery: "Preparing for delivery" reminders
- Post-delivery: "How was your delivery experience?" surveys
- Return window: "Need to make changes? Return within 30 days"

### Notification Preferences

**Customizable Per Order:**
- Email recipients for shipping updates
- Email recipients for receipts
- Phone number for SMS updates
- Notification frequency (all updates vs. milestones only)

**Customizable Per Team:**
- Default notification recipients
- Preferred notification channels (email/SMS/in-app)
- Shipping update distribution lists

---

## User Experience Summary

### Key Workflows

**Viewing Order History:**
1. Navigate to Orders from Account sidebar
2. Browse order list with filter tabs
3. Search for specific orders if needed
4. Click order to view full details

**Tracking a Shipment:**
1. Open order detail for shipped order
2. Click "Track shipment" link
3. View real-time carrier tracking
4. See estimated delivery date

**Cancelling an Order:**
1. Open order detail for pre-shipment order
2. Scroll to bottom and click "Cancel order"
3. Confirm cancellation in dialog
4. Receive cancellation confirmation
5. Order moves to "Cancelled" tab

**Initiating a Return:**
1. Open order detail for delivered order
2. Click "Return" or similar action
3. Provide return reason
4. Receive RMA number and shipping instructions
5. Ship item and track return
6. Receive refund/adjustment confirmation

**Managing Orders for Team:**
- Admins view all team orders
- Can assign orders to team members
- Monitor order status across team
- Manage delivery addresses and contacts
- Handle cancellations and returns

---

## Design & UX Considerations

### Visual Hierarchy

- **Primary Focus:** Order number and status
- **Secondary Info:** Items, dates, amounts
- **Tertiary Details:** Technical specs, contact info

### Responsive Design

- List view: Full order cards on desktop, simplified on mobile
- Detail view: Stacked layout on mobile, side-by-side on desktop
- Timeline: Horizontal on desktop, vertical on mobile

### Accessibility

- Clear status indicators (not color-only)
- Keyboard navigation for all actions
- Screen reader support for order numbers and statuses
- High contrast for timeline indicators

### Loading States

- Placeholder cards while order list loads
- Skeleton screens for order detail
- Animated status timeline during transitions
- Spinner for tracking shipment lookups

---

## Summary Table: Order States & Available Actions

| State | Tab | Actions Available | Next State(s) |
|-------|-----|-------------------|---------------|
| Order placed | Processing | Cancel | Pending leasing approval OR Pending payment |
| Pending leasing approval | Processing | Cancel | Pending payment |
| Pending payment | Processing | Cancel | Preparing to ship |
| Preparing to ship | Processing | Cancel | Shipped |
| Shipped | Processing | Track shipment | Delivered |
| Delivered | Delivered | Return | Returned |
| Cancelled | Cancelled | None | (Terminal) |
| Returned | Cancelled | None | (Terminal) |
