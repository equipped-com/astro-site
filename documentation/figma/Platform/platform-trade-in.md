# Trade-In and Equipment Exchange Flow

## Overview

The Trade-In flow allows users to exchange existing equipment for credit toward a new purchase. This reduces the upfront cost of acquiring new technology by valuing and crediting users for their current devices. The trade-in feature integrates seamlessly into the shopping and checkout experiences.

## Key Principles

- Users can trade in equipment from the **Trade In** section in main navigation
- Trade-in valuations are based on device condition, model, and market value
- Trade-in credit is applied directly at checkout, reducing the final purchase price
- Used equipment is shipped back to Equipped for processing and refurbishment
- The flow supports both standalone trade-in inquiries and trade-in-during-checkout scenarios

---

## 1. Trade-In Initiation

Users can initiate a trade-in in two ways:

### A. Standalone Trade-In (From Trade In Navigation)

1. User clicks **Trade In** in the main navigation menu (visible alongside Store, Equipment, People, Support)
2. Lands on the Trade In section/page
3. Can browse and get valuations for equipment they own
4. Options to:
   - Get an instant valuation for an item
   - Proceed to trade and receive credit
   - See a list of supported device types

### B. Trade-In During Checkout (Product-Initiated)

1. User adds a product to cart and proceeds to checkout
2. During the checkout flow (before final payment), user sees a trade-in option or prompt
3. Can add trade-in equipment to offset the new purchase cost
4. Trade-in credit is calculated and applied immediately to the order total

---

## 2. Equipment Valuation Process

The valuation determines the credit amount offered for the used equipment.

### Valuation Inputs

For each item being traded in, the user provides:

- **Device Type**: Category of equipment (MacBook, iPad, iPhone, Dell laptop, etc.)
- **Model/Configuration**: Specific model and generation
- **Condition Assessment**: Visual and functional condition
  - Excellent (minimal wear, fully functional)
  - Good (light wear, fully functional)
  - Fair (moderate wear, fully functional)
  - Poor (significant wear, functional but cosmetic damage)
- **Accessories Included**: Original charger, cables, original box, etc.
- **Functional Status**: Screen, battery, keyboard, trackpad, ports, etc.

### Valuation Output

- **Estimated Trade-In Value**: Dollar amount offered for the equipment
- **Value Breakdown**: Optional detail showing condition factors affecting value
- **Expiration Date**: Valuation is typically valid for 30 days
- **Conditions**: Any special notes (e.g., "Parts only," "Water damage detected")

### Real-Time Valuation

The system provides instant valuations based on:
- Device database with current market values
- Condition multipliers (excellent = 100%, good = 75-85%, fair = 50-70%, poor = 25-50%)
- Current resale/refurbishment market rates
- Supply and demand

---

## 3. Trade-In Credit Application to Purchase

When a user has trade-in value, it can be applied to offset their new equipment purchase.

### Credit Application Point

During checkout (usually after shipping details, before payment method selection):

1. **Cart Summary Shows**:
   - Subtotal for new equipment
   - Applicable trade-in credit (displayed as a negative/reduction)
   - Adjusted subtotal
   - Shipping, taxes, and final total

2. **Example Breakdown**:
   ```
   Subtotal:           $1,199.00
   Trade-In Credit:    -$450.00
   Adjusted Subtotal:  $749.00
   Shipping:           $0.00
   Taxes:              $59.92
   Total:              $809.92
   ```

3. **Multiple Trade-Ins**: Users can trade in multiple items in a single order, with each valuation summed

### Credit Limitations

- Trade-in credit **cannot exceed** the purchase amount (user cannot receive net cash back from trade-in alone)
- Credit is applied to the order total, not stored as account balance
- If user has multiple items being purchased, credit applies to the entire order

---

## 4. Trade-In Value Display and Confirmation

### Value Confirmation Screen

Before finalizing the trade-in, the user sees:

1. **Summary of Items Being Traded In**:
   - Device name (e.g., "MacBook Air M2, Space Gray")
   - Condition selected
   - Trade-in value offered
   - **Remove** option for each item

2. **Purchase Order Alongside**:
   - Items being purchased
   - Payment method options (Buy, 24-Month Leasing, 36-Month Leasing)
   - Updated pricing with trade-in credit applied
   - Assignment and shipping details

3. **Key Data Points**:
   - Original device value (MSRP or reference price)
   - Trade-in credit amount
   - Percentage of original value being offered
   - Expiration of the valuation offer

### Edit/Cancel Options

- User can **remove** a trade-in item (valuation recalculates)
- User can **add** additional trade-in items before checkout
- User can **adjust** the condition of an item to see updated valuations

---

## 5. Shipping Used Equipment (Logistics)

### Pre-Shipment

1. **Shipping Address Selection**:
   - User specifies a shipping address for the new equipment
   - May be the same or different from return address for trade-in item

2. **Return Label Provided**:
   - Pre-paid shipping label generated for the used equipment
   - Label includes Equipped's receiving address
   - Instructions on how to package the item securely

3. **Packaging Requirements**:
   - Original box preferred (if available)
   - Protective padding for sensitive equipment
   - All accessories included in trade-in to be included
   - User responsible for secure packaging

### Post-Order

1. **Tracking Provided**:
   - Return shipping tracking number provided in order confirmation
   - User can monitor return status in their order history

2. **User Shipping Timeline**:
   - User has typically **30 days** to ship back the device
   - Late returns may result in:
     - Forfeiture of trade-in credit
     - Cancellation of associated purchase credit
     - In some cases, a charge-back to the payment method

3. **Condition Verification**:
   - Device received and inspected by Equipped
   - Final condition assessed against stated condition
   - If significant discrepancies found:
     - Credit may be reduced
     - User is notified before final processing
     - User can contest the assessment

---

## 6. Integration with Shopping and Checkout Flows

### Navigation and Discovery

```
Equipped Platform Navigation
├── Store (Browse & Purchase New Equipment)
├── Trade In (Standalone Trade-In Section)
├── Equipment (View owned equipment?)
├── People (Team management)
└── Support
```

### Shopping Flow Integration

1. **Product Page**:
   - While viewing a product, user sees:
     - Purchase options (Buy, 24-Month Leasing, 36-Month Leasing)
     - "How leasing works" link
     - Customization options (color, accessories, insurance)
     - Add to cart button

2. **Cart Page**:
   - Shows selected equipment
   - Displays available payment methods
   - Can apply trade-in credit before checkout
   - **"Check out"** button initiates checkout flow

3. **Checkout Flow** (Multi-Step):
   - **Step 1 - Assignment**: Who will use this equipment?
   - **Step 2 - Shipping Details**: Where should it ship?
   - **Step 3 - Delivery Options**: When should it arrive?
   - **Step 4 - Payment/Leasing**: How to pay (with trade-in credit applied)

### Trade-In Placement in Checkout

- Trade-in credit is visible in the **cart summary panel** throughout checkout
- Users can see the cumulative reduction in cost
- For leasing payments, the trade-in reduces the equipment cost, which affects monthly payment amount

---

## 7. Trade-In Status Tracking

### Order Status Tracking

After an order is placed with trade-in, the user can track both:

#### 1. New Equipment Status
- **Pending leasing approval** (if leasing)
- **Pending payment** (if pay-in-full)
- **Preparing to ship**
- **Shipped**
- **Delivered**
- **Cancelled** (if applicable)

#### 2. Trade-In Return Status
- **Awaiting return** (user has not yet shipped)
- **In transit** (shipping in progress)
- **Received** (item arrived at Equipped)
- **Inspecting** (condition assessment underway)
- **Processing** (valuation confirmed, credit processing)
- **Completed** (credit finalized)

### Status Visibility

Users access status tracking via:

1. **Orders Section** in their account:
   - Navigate to **Orders** from main navigation
   - View all orders with status tags
   - Click into individual order for detailed timeline

2. **Order Details View**:
   - Shows both new equipment and trade-in item tracking
   - Displays shipping/return tracking numbers
   - Shows estimated and actual delivery dates
   - Contains any notes or discrepancies found during inspection

3. **Email Notifications**:
   - Confirmation when trade-in item received
   - Alert when inspection completes
   - Notification when credit is applied
   - Status updates for both new and return shipments

---

## 8. Refund/Credit Processing After Equipment Receipt

### Inspection and Valuation Verification

Once the used equipment arrives at Equipped's facility:

1. **Received & Logged**:
   - Item logged into receiving system
   - Condition physically verified
   - Testing and assessment begin

2. **Condition Reassessment**:
   - Device tested for functionality (screen, battery, ports, keyboard, etc.)
   - Physical damage documented
   - Cosmetic damage noted
   - Any undisclosed issues identified

3. **Valuation Adjustment**:
   - If condition matches stated condition: **Full credit applied** (as quoted)
   - If condition is better: **Possible credit increase** (user notified)
   - If condition is worse: **Credit may be reduced**
     - User receives notification with explanation
     - User can contest the assessment (5-7 day window)
     - If disputed, items may be returned to user (user pays return shipping)

### Credit Application

1. **Timing**:
   - Processing typically takes 5-7 business days after receipt
   - Complex assessments may take up to 14 days
   - User receives email confirmation when processing is complete

2. **Credit Processing Methods**:
   - **For Pay-in-Full Orders**: Refund processed to original payment method (credit card, bank account)
   - **For Leasing Orders**: Credit applied as reduction to lessor financing amount
   - **Partial Refund**: If trade-in credit exceeds purchase amount (rare), excess credited to account or refunded

3. **Refund Timing**:
   - Bank/payment processor processing time: 3-5 business days from credit processing
   - Customer sees credit in account within 7-10 business days of equipment receipt

### Documentation

Users receive:
- **Inspection Report**: Detailed assessment of trade-in device condition
- **Final Valuation**: Confirmed credit amount
- **Credit Confirmation**: Receipt showing credit applied to order
- **Disposition**: What happens to the traded-in device (refurbishment, parts recovery, recycling)

---

## 9. Special Cases and Edge Cases

### Scenario: User Does Not Return Trade-In Item

1. **Grace Period Expires** (30 days):
   - Return label expires
   - User receives reminder notification
   - Final notice: trade-in credit will be forfeited in 5 days

2. **Forfeiture Processing**:
   - Trade-in credit is reversed (if user has not yet received final credit)
   - If credit was already applied/refunded, charge-back processed
   - New equipment order remains valid and unaffected
   - User liable for payment method charge-back fees (if applicable)

### Scenario: Trade-In Value Significantly Mismatched

**Better Condition Than Stated**:
- Equipped offers user the option to increase credit
- Additional credit issued to original payment method

**Worse Condition Than Stated**:
- Equipped offers user two options:
  1. Accept reduced credit (credit adjusted downward)
  2. Request item return (user pays return shipping, no credit applied, original purchase unaffected)

### Scenario: Device Cannot Be Powered On or Severely Damaged

1. **Functional Assessment Fails**:
   - Device routed to parts recovery
   - Credit offered based on component value (significantly reduced)
   - Typically 5-15% of original valuation

2. **Water Damage or Severe Damage**:
   - Device assessed for salvage value
   - May be classified as "parts only"
   - User notified of significant reduction (or zero value)
   - Can request return of device (subject to return shipping costs)

### Scenario: Multiple Trade-In Items in Single Order

1. **Valuations**:
   - Each item valued independently
   - Separate tracking numbers and return labels for each item
   - Each item tracked separately for condition verification

2. **Credit Application**:
   - All credits summed and applied to single order
   - Individual items processed at different times possible
   - User sees status of all returns in order details
   - Final credit applied when all items processed

---

## Data Flows and Key Touchpoints

### User Data Collected During Trade-In

- Personal information (name, address, contact)
- Device information (model, serial number, IMEI if applicable)
- Condition assessment data
- Shipping preferences
- Return tracking information

### System Data Generated

- Trade-in valuation ID (expires after 30 days)
- Return shipping label and tracking number
- Inspection report and assessment timestamp
- Credit transaction ID and reference number
- Dispute/contest records (if applicable)

### Integration Points

- **Inventory System**: Tracks trade-in devices received and processed
- **Refurbishment**: Routes devices to refurbishment or parts recovery
- **Accounting**: Records credit issued, refunds processed, charge-backs
- **Order Management**: Links trade-in to associated purchase order
- **Customer Service**: Access to all trade-in and dispute records

---

## Success Metrics and Key Performance Indicators

For the Trade-In flow:

- **Conversion Rate**: % of users who initiate trade-in / complete trade-in
- **Average Trade-In Value**: Mean credit amount per trade-in
- **Return Rate**: % of trade-in valuations that convert to actual returns
- **Return Timeline**: Avg days from order to equipment received
- **Condition Match Rate**: % of items matching stated condition vs. reassessed condition
- **Credit Disputes**: % of processed credits disputed/contested
- **Refund Processing Time**: Avg time from receipt to credit applied
- **Customer Satisfaction**: NPS/CSAT around trade-in process

---

## User Experience Principles

### Simplicity
- Minimal steps to get a valuation
- Clear, honest condition assessment options
- Transparent credit application in cart/checkout

### Speed
- Instant or near-instant valuations
- Same-business-day order confirmation
- Fast credit processing (5-10 business days)

### Transparency
- Clear breakdown of what affects valuation
- No hidden fees or conditions
- Detailed inspection reports
- Easy dispute/contest process

### Trust
- Fair valuations relative to market
- Honest condition reassessment
- Responsive customer service for issues
- Clear timeline and expectations

---

## Technical Considerations

### Frontend Components

- **Trade-In Valuation Widget**: Device selection, condition assessment, instant value calculation
- **Cart Integration**: Display trade-in credit in cart summary
- **Checkout Integration**: Show trade-in items and status alongside new equipment
- **Order Tracking**: Separate status streams for new equipment and returns

### Backend Services

- **Valuation Engine**: Calculates device values based on device database and condition
- **Return Label Generation**: Creates pre-paid shipping labels with tracking
- **Inspection Workflow**: Manages device receiving, testing, and assessment
- **Credit Processing**: Handles refunds, charge-backs, and leasing finance adjustments
- **Notifications**: Email/SMS updates at key milestones

---

## Related Flows

- **Shopping and Cart Flow**: Primary path to add trade-in credit
- **Checkout Flow**: Where trade-in credit is applied and confirmed
- **Order Management**: View trade-in status alongside equipment purchase
- **Customer Support**: Handle disputes, late returns, damaged items
- **Refurbishment/Inventory**: Process returned devices

