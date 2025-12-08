# Platform Leasing and Financing Flow

## Overview

Equipped provides IT asset management with flexible financing options. The leasing and financing flow enables teams to acquire devices through structured payment plans rather than upfront card payments. This document describes the end-to-end leasing process, including pre-qualification, application, approval/decline handling, and recurring payment management.

**Key Partner:** Macquarie (leasing provider)

---

## 1. Leasing Pre-Qualification Flow

### Purpose
Enable team admins to pre-apply for leasing capabilities before making actual purchases, establishing financing eligibility early in the onboarding process.

### User Journey
- **Entry Point:** Team setup or settings
- **Action:** Admin clicks "Pre-apply for leasing"
- **Description:** "A medium-fidelity prototype where a team admin pre-applies for leasing"
- **Outcome:** Initiates preliminary qualification with Macquarie

### Key Features
- Lightweight pre-qualification step
- No purchase required at this stage
- Establishes baseline eligibility
- Reduces friction at checkout for future purchases

---

## 2. First Leasing Purchase Flow

### Purpose
Guide users through their initial leasing purchase with detailed onboarding and configuration steps.

### User Journey
- **Trigger:** User selects leasing as payment method during checkout
- **Steps Include:**
  1. Configure device specifications (e.g., MacBook, display settings)
  2. Assign device to teammate
  3. Select custom delivery date
  4. Apply for financing via Macquarie
  5. Confirm lease terms

### Key Features
- Interactive device configuration with clickable elements
- Hand cursor navigation support
- Arrow key navigation between pages
- Real-time lease terms and monthly payment calculation
- Device assignment to specific team members

### Order Summary Example
- **Product:** MacBook Air M2
- **Monthly Payment:** $32.47/mo.
- **Lease Term:** 24 months
- **Delivery:** Custom date selection
- **Status:** Pending leasing approval

---

## 3. Second and Subsequent Leasing Purchases

### Purpose
Streamline repeat purchases for users with established leasing relationships.

### Improvements Over First Purchase
- Skip pre-qualification if already approved
- Pre-filled information from previous leases
- Faster checkout process
- Known approval timeline
- Existing agreement reference

### User Experience
- Reduced form fields
- Quick device configuration
- Instant lease terms display
- Familiar payment process

---

## 4. Leasing Provider Integration - Macquarie

### Integration Points

#### Pre-Application Data Collection
- Company information
- Team size and structure
- Annual revenue
- Credit profile overview

#### Application Submission
- Device specifications
- Requested lease term
- Monthly payment acceptance
- User identity verification

#### Status Polling
- Real-time application status updates
- Approval decisions with timeline
- Decline notifications with reasons
- Agreement document generation

### Connection Type
- API-based integration for real-time updates
- Webhook support for status notifications
- Document signing via secure portal

### Lease Terms Offered
- Standard terms: 24-36 months
- Customizable based on business profile
- Fixed monthly payments
- End-of-lease buyout options

---

## 5. Application Approval Handling

### Successful Approval

#### User Experience
- Confirmation screen: "You've set up a leasing agreement with Macquarie in Equipped"
- Agreement details displayed
- Next steps clearly outlined
- Device shipping initiated

#### Backend Process
1. Macquarie approves application
2. Equipped receives approval notification
3. Lease agreement stored in system
4. Order status moves to "Pending payment"
5. Shipping preparation begins

#### Order Status
- Previous: "Order placed" - "Pending leasing approval" - "Preparing to ship" - "Shipped" - "Delivered"
- Monthly payment schedule activated
- Recurring payment arrangement established

### Information Displayed Post-Approval
- Leasing agreement reference number
- Monthly payment amount
- Lease start date
- Lease end date
- Buyout option details
- Lease agreement document (PDF download)

---

## 6. Application Decline Handling

### Decline Notification

#### User Experience
- Modal/Alert: "Macquarie declined your leasing application"
- Reason for decline (if available)
  - Insufficient credit history
  - Company financials not eligible
  - Incomplete information
  - Business risk assessment
  - Other regulatory factors

#### Immediate Options
1. **Request Manual Review:** Contact Equipped support for appeal process
2. **Apply with Additional Documentation:** Provide tax returns, financial statements
3. **Try Different Payment Method:** Proceed with credit card payment
4. **Wait and Reapply:** Resubmit after 30 days with updated information

### Integration with Alternative Payments
- Seamless fallback to card payment without losing cart
- Order can proceed immediately with alternative method
- No re-entry of device configuration
- Preserved delivery preferences

### Decline Recovery
- Email notification with decline reason
- Support team outreach within 24 hours
- Option to upgrade application (provide more docs)
- Schedule reapplication (30-day waiting period)

---

## 7. Lease Agreement Setup and Confirmation

### Agreement Generation

#### Automatic Process
1. Application approved by Macquarie
2. Lease terms finalized
3. Agreement document generated
4. Document sent to authorized signer

#### Agreement Contents
- Lessor and lessee details
- Equipment description and serial numbers
- Lease term (start and end dates)
- Monthly payment amount
- Payment schedule
- Maintenance and insurance responsibilities
- Early termination clauses
- Buyout options and end-of-lease procedures
- Tax and regulatory compliance notes

### Signing and Activation

#### E-Signature Process
- Digital signature via secure portal (DocuSign/Macquarie platform)
- Multi-signatory support (authorized person + finance)
- Timestamp and audit trail
- Automatic activation upon signature

#### Confirmation Steps
1. Email confirmation to all signers
2. PDF copy sent to team admin
3. Agreement reference saved in Equipped
4. Payment schedule activated
5. First payment date communicated

### Confirmation Screen
- Agreement acknowledged
- Lease reference number displayed
- Payment schedule overview
- Device shipping status
- Next steps and support contact

---

## 8. Integration with Checkout and Orders Flows

### Checkout Payment Method Selection

#### Payment Options
1. **Credit Card** (immediate payment)
   - Full upfront payment
   - Single transaction

2. **Leasing** (financing with Macquarie)
   - Monthly payments
   - Application required
   - 24-36 month terms

3. **Alternative Methods**
   - Bank transfer
   - Purchase order (enterprise)
   - Bill-me-later options

### Checkout Order Summary - Leasing Example

#### Order #1228
- **Order Date:** June 22, 2024
- **Payment Method:** 24-Month Leasing
- **Total Monthly:** $76.94/mo.

#### Items
1. MacBook Air M2
   - Monthly: $32.47
   - Specs: 8-Core CPU, 8-Core GPU, 8GB Unified Memory, 256GB SSD
   - MPN: XYZ12345
   - Value: $1,199.00

2. Studio Display
   - Monthly: $39.97
   - Specs: Standard glass, tilt-adjustable stand
   - MPN: XYZ12345
   - Value: $1,599.00

#### Order Summary
- Subtotal: $2,798.00
- Shipping: $0.00
- Taxes: $279.80
- **Total:** $3,077.80
- **Due Today:** $0.00
- **Monthly Payment:** $76.94/mo.

### Order Details Screen

#### Key Information
- Order number and date
- Payment method specification
- Individual item details with monthly breakdown
- Status timeline with current stage highlighted
- Ordered by and assigned to
- Delivery address and instructions
- Contact information for shipping updates
- Finance charges and total contract value

#### Status Tracking
For leasing orders, the typical status progression:
1. **Order placed** - Initial order created, awaiting financing application
2. **Pending leasing approval** - Application submitted to Macquarie, awaiting decision
3. **Pending payment** - Leasing approved, payment processing
4. **Preparing to ship** - Device being prepared for shipment
5. **Shipped** - Device in transit
6. **Delivered** - Device received by recipient
7. **Cancelled** (if declined and not resolved)
8. **Returned** (end-of-lease device return)

---

## 9. Recurring Payment Management

### Payment Schedule Activation

#### First Payment
- Activation: Upon lease agreement signing
- Amount: First monthly payment (may include prorated charges)
- Date: Determined by lease start date
- Method: Auto-debit from company bank account or primary payment method

#### Subsequent Payments
- Frequency: Monthly on same date
- Amount: Fixed throughout lease term
- Duration: 24-36 months depending on agreement
- Auto-debit: Automated recurring billing with Macquarie

### Payment Reconciliation
- Monthly invoice generated and sent to billing contact
- Payment receipt and confirmation email
- Applied to lease account within 24-48 hours
- Tax documentation for accounting (if applicable)

### Payment Issues and Resolution

#### Missed Payment
- Grace period: 10 days
- Late fee: Applied after grace period
- Notification: Email to finance contact
- Resolution: Contact Equipped support or Macquarie directly

#### Payment Modification
- Mid-lease adjustment: Limited flexibility
- Early payoff: Calculate remaining balance
- Term extension: Apply for additional lease period
- Device upgrade: Trade-in and new lease terms

### Account Statements

#### Monthly Statement Contents
- Lease reference number
- Monthly payment amount
- Outstanding balance
- Remaining payments
- Interest charges (if applicable)
- Tax documents
- Device valuation for buyout

#### Annual Reconciliation
- Year-end tax statements
- Cumulative payments and remaining contract value
- Estimated end-of-lease value
- Buyout pricing

---

## 10. Leasing History and Management

### Leasing Dashboard

#### At-a-Glance Information
- Active leases count
- Total monthly payment obligation
- Upcoming payment dates
- Devices under lease
- Near-end-of-lease devices

#### Lease List View
For each active lease:
- Device name and model
- Monthly payment amount
- Lease start and end dates
- Days remaining
- Remaining balance
- Payment status (on-time, late, pending)
- Quick actions (view details, manage, contact support)

### Lease Details Screen

#### Per-Device Information
- Full device specification
- Assigned team member
- Lease agreement reference
- Original purchase price and lease value
- Monthly payment breakdown
- Remaining term and final payment date
- Maintenance/insurance status
- Warranty coverage
- Buyout options and pricing

#### Available Actions
- Download lease agreement (PDF)
- View payment history
- Request early termination
- Upgrade or trade-in device
- Extend lease term
- Contact support

### Payment History

#### Historical View
- All payment transactions with dates
- Paid amounts and confirmation numbers
- Failed payment attempts with reasons
- Applied credits or adjustments
- Invoice references
- Tax documents by year

#### Export and Reporting
- Download payment history (CSV/PDF)
- Generate accounting reports
- Tax form generation (1098-related if applicable)
- Compliance documentation

### Notifications and Alerts

#### Proactive Notifications
- Payment due reminders (3 days before)
- Upcoming lease expiration (60 days before)
- Payment failed alerts
- Lease agreement updates

#### Admin Alerts
- Team member devices approaching end-of-lease
- Bulk payment reconciliation issues
- New financing options available
- Promotional lease terms

---

## 11. Alternative Payment Options When Lease Declined

### Fallback Payment Methods

#### Immediate Card Payment
- Complete order with credit card
- Full upfront payment
- Immediate fulfillment
- No financing approval needed
- One-time transaction

#### Bank Transfer / ACH
- B2B payment option
- 2-5 business day settlement
- Larger transaction support
- Reconciliation with PO systems

#### Bill-Me-Later / Net Terms
- 30/60/90 day payment terms
- Credit application (lighter than leasing)
- Invoicing support
- Accounting integration

#### Purchase Order Financing
- For enterprise customers
- Integrate with existing PO systems
- Custom payment terms negotiation
- Volume discounts available

### Switching Payment Methods

#### Checkout Recovery
- "Select a different payment method to place your order" screen
- Cart items preserved
- Device configuration maintained
- Delivery preferences saved
- No re-entering information

#### Process
1. User sees decline notification
2. Click "Use different payment method"
3. Payment method selection screen appears
4. Select alternative option
5. Complete payment
6. Order confirmation and shipping

#### User Experience Continuity
- Zero friction handoff
- Estimated cost/timeline for each method
- Comparison view (monthly vs. upfront)
- FAQ for alternative options

---

## 12. Data Model and Integration Points

### Key Entities

#### LeaseApplication
```
- application_id (UUID)
- company_id (UUID)
- status (PENDING, APPROVED, DECLINED, EXPIRED)
- submitted_at (timestamp)
- decision_at (timestamp)
- decision_reason (string)
- macquarie_reference (string)
- metadata (JSON - credit profile, risk factors)
```

#### LeaseAgreement
```
- agreement_id (UUID)
- application_id (UUID)
- lease_term_months (24, 36)
- monthly_payment (decimal)
- start_date (date)
- end_date (date)
- equipment_list (JSON array)
- signed_at (timestamp)
- signer_name (string)
- agreement_pdf_url (string)
- status (ACTIVE, COMPLETED, TERMINATED_EARLY)
```

#### LeasePayment
```
- payment_id (UUID)
- agreement_id (UUID)
- scheduled_date (date)
- amount (decimal)
- status (SCHEDULED, PROCESSED, FAILED, REFUNDED)
- processed_at (timestamp)
- reference_number (string)
- failure_reason (string)
```

#### Order (with leasing context)
```
- order_id (UUID)
- payment_method (CARD, LEASING, BANK_TRANSFER)
- agreement_id (UUID, null if card payment)
- application_id (UUID, null if card payment)
- status (ORDER_PLACED, PENDING_LEASING_APPROVAL, PENDING_PAYMENT, PREPARING_TO_SHIP, SHIPPED, DELIVERED, CANCELLED, RETURNED)
- monthly_cost (decimal, null if card)
- total_cost (decimal)
- tax_amount (decimal)
- created_at (timestamp)
```

### Integration APIs

#### Macquarie Endpoints
- `POST /api/applications` - Submit lease application
- `GET /api/applications/{id}` - Check application status
- `POST /api/agreements` - Create lease agreement after approval
- `GET /api/agreements/{id}` - Retrieve agreement details
- `POST /api/payments/schedule` - Set up recurring payment schedule
- `WEBHOOK /leasing/status-update` - Receive application decisions

#### Equipped Internal Endpoints
- `POST /api/leasing/pre-qualify` - Pre-application flow
- `POST /api/leasing/apply` - Submit lease application
- `GET /api/leasing/status/{app_id}` - Check status
- `POST /api/leasing/decline-fallback` - Handle decline and switch payment method
- `GET /api/leasing/history` - Retrieve lease history
- `GET /api/leasing/payments` - Payment history and reconciliation

---

## 13. User Flows Diagram

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ LEASING & FINANCING FLOW                                        │
└─────────────────────────────────────────────────────────────────┘

1. PRE-QUALIFICATION
   ├─ Admin initiates pre-apply
   ├─ Company info collected
   └─ Macquarie preliminary check

2. PRODUCT SELECTION & CHECKOUT
   ├─ User selects devices
   ├─ Chooses leasing as payment method
   └─ Configures delivery preferences

3. APPLICATION PROCESS
   ├─ Device specs + delivery details submitted
   ├─ Application sent to Macquarie
   └─ Real-time status tracking

4. APPROVAL OR DECLINE
   ├─ APPROVED PATH:
   │  ├─ Lease terms confirmed
   │  ├─ Agreement generated & signed
   │  ├─ Payment schedule activated
   │  └─ Order progresses to shipping
   │
   └─ DECLINED PATH:
      ├─ Decline reason provided
      ├─ User switches to alt. payment method
      ├─ Card/ACH/PO payment processed
      └─ Order progresses to shipping

5. FULFILLMENT & DELIVERY
   ├─ Order status: Pending payment
   ├─ Device prepared and shipped
   ├─ Delivery confirmation
   └─ Monthly payment schedule begins

6. ONGOING MANAGEMENT
   ├─ Monthly payments processed
   ├─ Lease dashboard monitoring
   ├─ Payment history access
   └─ End-of-lease planning
      ├─ Device return
      ├─ Buyout option
      └─ Lease extension/renewal
```

---

## 14. Error Handling and Edge Cases

### Application Declined Scenarios

| Reason | Recovery Path | Timeline |
|--------|---------------|----------|
| Insufficient credit history | Appeal with bank statements | 5-7 business days |
| Company financials not eligible | Upgrade application with tax returns | 3-5 business days |
| Incomplete information | Resubmit with full details | Same day |
| Business risk assessment | Manual review by Macquarie | 5-10 business days |
| Regulatory/compliance issues | Direct outreach from Macquarie | Custom per case |

### Payment Failure Recovery

#### Automatic Retry
- First failure: Retry after 24 hours
- Second failure: Retry after 48 hours
- Third failure: Admin notification + manual review

#### Intervention Steps
1. Alert sent to finance contact
2. Provide payment method update option
3. Extend deadline by 5 business days
4. Contact support for assistance
5. Escalate if critical (auto-remediation)

### Network and Sync Issues

#### Macquarie API Outage
- Queue application submissions locally
- Display "Application submitted - processing" message
- Retry silently in background
- Notify user once processed

#### Webhook Failures
- Implement exponential backoff retry (up to 72 hours)
- Store unprocessed webhooks for manual audit
- Admin dashboard for webhook health monitoring
- Manual sync trigger for edge cases

---

## 15. Security and Compliance

### Data Protection
- Lease agreements encrypted at rest and in transit
- PII data handled per PCI-DSS requirements
- Audit logging for all leasing transactions
- Automatic data expiration after lease ends + 7 years

### Regulatory Compliance
- Truth in Lending Act (TILA) disclosures
- Equal Credit Opportunity Act (ECOA) compliance
- State-specific financing regulations
- Tax document generation per jurisdiction

### User Privacy
- Explicit consent for credit check
- Data sharing agreement with Macquarie
- Opt-out options for certain notifications
- GDPR/CCPA compliance for international users

---

## 16. Future Enhancements

### Planned Features
- **Multi-provider support** - Add additional leasing partners beyond Macquarie
- **Lease marketplace** - Secondary market for trading lease positions
- **Early buyout calculator** - Real-time calculations for payoff options
- **Device upgrade program** - Swap devices mid-lease with credit
- **Sustainability tracking** - Monitor environmental impact of leased devices
- **Mobile app integration** - Approve applications and manage leases on mobile
- **Bulk leasing** - Streamlined flow for large team device orders
- **API webhooks** - Allow admins to integrate with accounting software

### Partner Expansion
- Evaluate additional financing providers
- International leasing partnerships (EU, APAC)
- Alternative lending options (peer-to-peer, innovative financing)
- Integration with existing corporate lending relationships

---

## 17. Support and Documentation

### Help Resources
- **Leasing FAQ:** Common questions about terms, payments, and end-of-lease
- **Macquarie Contact:** Direct support line for agreement questions
- **Decline Appeals:** Documentation and timeline for reapplication
- **Payment Troubleshooting:** Self-service guides for payment issues

### Admin Training
- Leasing dashboard overview and reporting
- Team device assignment and tracking
- Payment reconciliation with accounting systems
- Compliance documentation and audit trail

### User Support
- Email support for application questions
- Chat support for decline assistance
- Phone support for critical payment issues
- Knowledge base articles for common scenarios
